import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  Modal,
  Dimensions,
} from 'react-native';
import CleanMapView from '../../components/CleanMapView';
import persistentTileCache from '../../utils/persistentTileCache';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { latLonToTile, getTileKey, tileToBounds, getMapTilerUrl } from '../../utils/tileCalculations';
import { MAP_CONFIG } from '../../config/mapConfig';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const CourseDownloadScreen = ({ route, navigation }) => {
  const { course, courseCenter } = route.params;
  const [selectedTiles, setSelectedTiles] = useState(new Set());
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [basePosition, setBasePosition] = useState({
    center: [courseCenter.longitude, courseCenter.latitude],
    zoom: 15, // Display at zoom 15 for overview
  });
  const [mapBounds, setMapBounds] = useState(null);
  const [tileOverlays, setTileOverlays] = useState([]);
  const [mode, setMode] = useState('pan'); // 'pan' or 'select'
  
  console.log('🎯 CourseDownloadScreen - Current mode:', mode);
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

  // Calculate visible bounds based on zoom level and center
  const calculateMapBounds = (center, zoom) => {
    const metersPerPixel = 156543.03392 * Math.cos(center[1] * Math.PI / 180) / Math.pow(2, zoom);
    const halfWidthInDegrees = (screenWidth * metersPerPixel / 2) / 111320;
    const halfHeightInDegrees = (screenHeight * metersPerPixel / 2) / 111320;
    
    return {
      north: center[1] + halfHeightInDegrees,
      south: center[1] - halfHeightInDegrees,
      east: center[0] + halfWidthInDegrees,
      west: center[0] - halfWidthInDegrees,
    };
  };

  // Update map bounds when component mounts
  useEffect(() => {
    const bounds = calculateMapBounds(basePosition.center, basePosition.zoom);
    setMapBounds(bounds);
  }, [basePosition]);

  // Update tile overlays when selection changes
  useEffect(() => {
    if (!mapBounds) return;
    
    const overlays = Array.from(selectedTiles).map(tileKey => {
      const [z, x, y] = tileKey.split('/').map(Number);
      const bounds = tileToBounds(x, y, z);
      
      // Convert bounds to screen coordinates
      const mapHeight = screenHeight * 0.6;
      const mapWidth = screenWidth;
      
      const left = ((bounds.west - mapBounds.west) / (mapBounds.east - mapBounds.west)) * mapWidth;
      const right = ((bounds.east - mapBounds.west) / (mapBounds.east - mapBounds.west)) * mapWidth;
      const top = ((mapBounds.north - bounds.north) / (mapBounds.north - mapBounds.south)) * mapHeight;
      const bottom = ((mapBounds.north - bounds.south) / (mapBounds.north - mapBounds.south)) * mapHeight;
      
      // Only include tiles that are visible on screen
      if (left < mapWidth && right > 0 && top < mapHeight && bottom > 0) {
        return {
          key: tileKey,
          left: Math.max(0, left),
          top: Math.max(0, top),
          width: Math.min(mapWidth - left, right - left),
          height: Math.min(mapHeight - top, bottom - top),
        };
      }
      return null;
    }).filter(Boolean);
    
    setTileOverlays(overlays);
  }, [selectedTiles, mapBounds]);

  // Convert screen coordinates to lat/lon
  const screenToLatLon = (x, y) => {
    if (!mapBounds || !mapContainerRef.current) return null;
    
    // Direct calculation without measure (measure is async)
    const mapHeight = screenHeight * 0.6; // Approximate map height
    const mapWidth = screenWidth;
    
    const lat = mapBounds.north - (y / mapHeight) * (mapBounds.north - mapBounds.south);
    const lon = mapBounds.west + (x / mapWidth) * (mapBounds.east - mapBounds.west);
    
    return { lat, lon };
  };

  // Track if we're in selection mode (adding or removing tiles)
  const [selectionMode, setSelectionMode] = useState(null); // 'add' or 'remove'
  const [lastProcessedTile, setLastProcessedTile] = useState(null);

  // Process tile at given coordinates
  const processTileAtCoordinates = (locationX, locationY) => {
    if (!mapBounds) return;
    
    const mapHeight = screenHeight * 0.6;
    const mapWidth = screenWidth;
    
    const lat = mapBounds.north - (locationY / mapHeight) * (mapBounds.north - mapBounds.south);
    const lon = mapBounds.west + (locationX / mapWidth) * (mapBounds.east - mapBounds.west);
    
    // Convert to zoom 18 tile
    const tile = latLonToTile(lat, lon, 18);
    const tileKey = getTileKey(tile.x, tile.y, tile.z);
    
    // Skip if we already processed this tile in the current gesture
    if (tileKey === lastProcessedTile) return;
    
    setLastProcessedTile(tileKey);
    
    // Apply selection based on mode
    setSelectedTiles(prev => {
      const newSet = new Set(prev);
      
      if (selectionMode === 'add') {
        newSet.add(tileKey);
      } else if (selectionMode === 'remove') {
        newSet.delete(tileKey);
      } else {
        // First touch - determine mode based on whether tile is selected
        if (newSet.has(tileKey)) {
          setSelectionMode('remove');
          newSet.delete(tileKey);
        } else {
          setSelectionMode('add');
          newSet.add(tileKey);
        }
      }
      
      return newSet;
    });
  };

  // Handle touch start
  const handleTouchStart = (event) => {
    if (mode !== 'select') return;
    
    const { locationX, locationY } = event.nativeEvent;
    processTileAtCoordinates(locationX, locationY);
  };

  // Handle touch move
  const handleTouchMove = (event) => {
    if (mode !== 'select' || selectionMode === null) return;
    
    const { locationX, locationY } = event.nativeEvent;
    processTileAtCoordinates(locationX, locationY);
  };

  // Handle touch end
  const handleTouchEnd = () => {
    setSelectionMode(null);
    setLastProcessedTile(null);
  };

  // Select all visible tiles on screen
  const selectVisibleArea = () => {
    if (!mapBounds) return;
    
    const newTiles = new Set(selectedTiles);
    
    // Calculate visible tile range at zoom 18
    const zoom = 18;
    
    // Convert bounds to tile coordinates
    const minTileX = Math.floor((mapBounds.west + 180) / 360 * Math.pow(2, zoom));
    const maxTileX = Math.floor((mapBounds.east + 180) / 360 * Math.pow(2, zoom));
    
    const minTileY = Math.floor((1 - Math.log(Math.tan(mapBounds.north * Math.PI / 180) + 1 / Math.cos(mapBounds.north * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
    const maxTileY = Math.floor((1 - Math.log(Math.tan(mapBounds.south * Math.PI / 180) + 1 / Math.cos(mapBounds.south * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
    
    // Add all tiles in the visible range
    for (let x = minTileX; x <= maxTileX; x++) {
      for (let y = minTileY; y <= maxTileY; y++) {
        const tileKey = getTileKey(x, y, zoom);
        newTiles.add(tileKey);
      }
    }
    
    setSelectedTiles(newTiles);
  };

  // Calculate download size
  const getDownloadSize = () => {
    const tileCount = selectedTiles.size;
    const avgTileSizeKB = 50; // ~50KB per satellite tile at zoom 18
    return (tileCount * avgTileSizeKB / 1024).toFixed(1); // MB
  };

  // Download selected tiles
  const downloadSelectedTiles = async () => {
    if (selectedTiles.size === 0) {
      Alert.alert('No tiles selected', 'Please touch areas on the map to select tiles for download.');
      return;
    }

    setIsDownloading(true);
    setShowProgressModal(true);
    setDownloadProgress(0);

    try {
      const tiles = Array.from(selectedTiles).map(key => {
        const [z, x, y] = key.split('/').map(Number);
        return { z, x, y };
      });

      let completed = 0;
      const apiKey = MAP_CONFIG.MAPTILER.API_KEY || '9VwMyrJdecjrEB6fwLGJ';
      
      // Initialize cache once
      await persistentTileCache.initialize();
      
      for (const tile of tiles) {
        try {
          // Generate tile URL
          const tileUrl = getMapTilerUrl(tile.x, tile.y, tile.z, apiKey);
          
          // Download and cache the tile
          const response = await fetch(tileUrl);
          if (response.ok) {
            // Convert response to base64 for storage
            const arrayBuffer = await response.arrayBuffer();
            const base64 = btoa(
              new Uint8Array(arrayBuffer)
                .reduce((data, byte) => data + String.fromCharCode(byte), '')
            );
            
            // Store in persistent cache
            persistentTileCache.set(
              getTileKey(tile.x, tile.y, tile.z),
              base64,
              tile.z
            );
          }
          
          completed++;
          setDownloadProgress((completed / tiles.length) * 100);
        } catch (error) {
          console.error('Error downloading tile:', error);
          // Continue with next tile
        }
      }

      // Save download metadata
      await AsyncStorage.setItem(
        `course_download_${course.id}`,
        JSON.stringify({
          courseId: course.id,
          courseName: course.name,
          tiles: Array.from(selectedTiles),
          downloadDate: new Date().toISOString(),
          tileCount: selectedTiles.size,
        })
      );

      Alert.alert(
        'Download Complete',
        `Successfully downloaded ${selectedTiles.size} map tiles for offline use.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Download Failed', 'Failed to download map tiles. Please try again.');
    } finally {
      setIsDownloading(false);
      setShowProgressModal(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Download Course Maps</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.controlBar}>
        <TouchableOpacity
          style={[styles.controlButton, mode === 'select' && styles.controlButtonActive]}
          onPress={() => {
            console.log('🔄 Toggling mode:', mode === 'pan' ? 'select' : 'pan');
            setMode(mode === 'pan' ? 'select' : 'pan');
          }}
        >
          <Text style={[styles.controlButtonText, mode === 'select' && styles.controlButtonTextActive]}>
            {mode === 'pan' ? 'Enable Selection' : 'Selection Mode'}
          </Text>
        </TouchableOpacity>
        
        {mode === 'select' && (
          <TouchableOpacity
            style={styles.selectVisibleButton}
            onPress={selectVisibleArea}
          >
            <Text style={styles.selectVisibleText}>Select Visible</Text>
          </TouchableOpacity>
        )}
        
        <Text style={styles.controlInfo}>
          {mode === 'pan' ? 'Drag to pan' : `${selectedTiles.size} tiles selected`}
        </Text>
      </View>

      <View style={styles.mapContainer} ref={mapContainerRef}>
        <CleanMapView
          initialCenter={basePosition.center}
          initialZoom={basePosition.zoom}
          isPanEnabled={mode === 'pan'}
          onPositionChange={(newCenter, newZoom) => {
            setBasePosition({ center: newCenter, zoom: newZoom });
          }}
        />
        
        {/* Touch overlay to capture tile selections - only active in select mode */}
        {mode === 'select' && (
          <View 
            style={styles.touchOverlay}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          />
        )}
        
        {/* Visual overlay showing selected tiles */}
        {selectedTiles.size > 0 && (
          <View style={styles.selectionOverlay} pointerEvents="none">
            {Array.from(selectedTiles).map(tileKey => {
              const [z, x, y] = tileKey.split('/').map(Number);
              const bounds = tileToBounds(x, y, z);
              
              // Convert bounds to screen coordinates
              if (!mapBounds) return null;
              
              const mapHeight = screenHeight * 0.6;
              const mapWidth = screenWidth;
              
              const left = ((bounds.west - mapBounds.west) / (mapBounds.east - mapBounds.west)) * mapWidth;
              const right = ((bounds.east - mapBounds.west) / (mapBounds.east - mapBounds.west)) * mapWidth;
              const top = ((mapBounds.north - bounds.north) / (mapBounds.north - mapBounds.south)) * mapHeight;
              const bottom = ((mapBounds.north - bounds.south) / (mapBounds.north - mapBounds.south)) * mapHeight;
              
              return (
                <View
                  key={tileKey}
                  style={[
                    styles.tileOverlay,
                    {
                      left,
                      top,
                      width: right - left,
                      height: bottom - top,
                    }
                  ]}
                />
              );
            })}
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.selectionInfo}>
          {selectedTiles.size > 0 
            ? `Selected: ${selectedTiles.size} tiles (~${getDownloadSize()} MB)`
            : mode === 'select' ? 'Touch and drag to select tiles' : 'Switch to selection mode'
          }
        </Text>
        
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => setSelectedTiles(new Set())}
            disabled={selectedTiles.size === 0}
          >
            <Text style={styles.clearText}>Clear All</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.downloadButton, selectedTiles.size === 0 && styles.disabledButton]}
            onPress={downloadSelectedTiles}
            disabled={selectedTiles.size === 0 || isDownloading}
          >
            {isDownloading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.downloadText}>
                Download {selectedTiles.size > 0 ? `${selectedTiles.size} Tiles` : 'Tiles'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Progress Modal */}
      <Modal
        visible={showProgressModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Downloading Map Tiles</Text>
            <View style={styles.progressBar}>
              <View 
                style={[styles.progressFill, { width: `${downloadProgress}%` }]} 
              />
            </View>
            <Text style={styles.progressText}>{Math.round(downloadProgress)}%</Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  backText: {
    fontSize: 16,
    color: '#2e7d32',
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  placeholder: {
    width: 60,
  },
  controlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2e7d32',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#1b5e20',
    zIndex: 20,
    elevation: 20, // For Android
  },
  controlButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  controlButtonActive: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  controlButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  controlButtonTextActive: {
    color: '#2e7d32',
  },
  controlInfo: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  selectVisibleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#fff',
  },
  selectVisibleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2e7d32',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  touchOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    backgroundColor: 'transparent',
  },
  selectionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
    pointerEvents: 'none',
  },
  tileOverlay: {
    position: 'absolute',
    backgroundColor: 'rgba(46, 125, 50, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(46, 125, 50, 0.8)',
  },
  footer: {
    backgroundColor: 'white',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  selectionInfo: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  clearButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  downloadButton: {
    flex: 2,
    backgroundColor: '#2e7d32',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  downloadText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 20,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2e7d32',
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
});

export default CourseDownloadScreen;