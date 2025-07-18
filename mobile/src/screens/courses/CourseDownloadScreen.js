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
} from 'react-native';
import MapViewWithGestures from '../rounds/components/MapViewWithGestures';
import persistentTileCache from '../../utils/persistentTileCache';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CourseDownloadScreen = ({ route, navigation }) => {
  const { course, courseCenter } = route.params;
  const [selectedTiles, setSelectedTiles] = useState(new Set());
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [basePosition] = useState({
    center: [courseCenter.longitude, courseCenter.latitude],
    zoom: 15, // Display at zoom 15 for overview
  });

  // Calculate zoom 18 tile from lat/lon
  const getTileFromLatLon = (lat, lon) => {
    const zoom = 18; // Download zoom level
    const n = Math.pow(2, zoom);
    const x = Math.floor((lon + 180) / 360 * n);
    const y = Math.floor(
      (1 - Math.log(
        Math.tan(lat * Math.PI / 180) + 
        1 / Math.cos(lat * Math.PI / 180)
      ) / Math.PI) / 2 * n
    );
    return { x, y, z: zoom };
  };

  // Convert tile back to lat/lon bounds for display
  const getTileBounds = (x, y, z) => {
    const n = Math.pow(2, z);
    const lon1 = x / n * 360 - 180;
    const lat1 = Math.atan(Math.sinh(Math.PI * (1 - 2 * y / n))) * 180 / Math.PI;
    const lon2 = (x + 1) / n * 360 - 180;
    const lat2 = Math.atan(Math.sinh(Math.PI * (1 - 2 * (y + 1) / n))) * 180 / Math.PI;
    
    return {
      north: lat1,
      south: lat2,
      east: lon2,
      west: lon1,
    };
  };

  // Handle map touch to select tiles
  const handleMapPress = (event) => {
    // MapViewWithGestures uses gesture handler, so we need to handle touch differently
    // For now, we'll add a tap handler overlay
    console.log('Map pressed - tile selection will be implemented');
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
      for (const tile of tiles) {
        // Use the existing preloadArea method or direct cache
        const bounds = getTileBounds(tile.x, tile.y, tile.z);
        
        // For now, we'll use a simple approach
        // In reality, we'd use persistentTileCache.preloadArea or similar
        await persistentTileCache.initialize(); // Ensure initialized
        
        // Simulate download progress
        completed++;
        setDownloadProgress((completed / tiles.length) * 100);
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

      <View style={styles.instructions}>
        <Text style={styles.instructionText}>
          Touch areas on the map to select tiles for download
        </Text>
        <Text style={styles.subText}>
          Zoom level 18 tiles will be downloaded for offline use
        </Text>
      </View>

      <View style={styles.mapContainer}>
        <MapViewWithGestures
          basePosition={basePosition}
          onMapPress={handleMapPress}
        />
        
        {/* Overlay for selected tiles will be rendered here */}
        {selectedTiles.size > 0 && (
          <View style={styles.selectionOverlay} pointerEvents="none">
            {/* Render selected tile overlays */}
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.selectionInfo}>
          {selectedTiles.size > 0 
            ? `Selected: ${selectedTiles.size} tiles (~${getDownloadSize()} MB)`
            : 'No tiles selected'
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
  instructions: {
    backgroundColor: '#e8f5e9',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#c8e6c9',
  },
  instructionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1b5e20',
    textAlign: 'center',
  },
  subText: {
    fontSize: 14,
    color: '#2e7d32',
    textAlign: 'center',
    marginTop: 4,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  selectionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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