import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  PanResponder,
  Animated,
  Text,
} from 'react-native';
import MapLibreGL from '@maplibre/maplibre-react-native';
import { MAP_CONFIG } from '../config/mapConfig';
import TileImage from './TileImage';

// Set access token to null (MapLibre doesn't require it)
MapLibreGL.setAccessToken(null);

const { width, height } = Dimensions.get('window');

const CleanMapView = React.memo(({ 
  initialCenter,
  initialZoom = 15,
  onPositionChange,
  isPanEnabled = true
}) => {
  console.log('🗺️ CleanMapView: Component mounting');

  // State management
  const [loading, setLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [tiles, setTiles] = useState([]);
  const [basePosition, setBasePosition] = useState({ 
    center: initialCenter || [-82.0206, 33.5031], 
    zoom: initialZoom 
  });
  
  // Refs
  const mapRef = useRef(null);
  const cameraRef = useRef(null);
  const basePositionRef = useRef(basePosition);
  const isPanningRef = useRef(false);
  const panDistanceRef = useRef({ dx: 0, dy: 0 });
  
  // Animated values
  const pan = useRef(new Animated.ValueXY()).current;
  
  const apiKey = MAP_CONFIG.MAPTILER.API_KEY || '9VwMyrJdecjrEB6fwLGJ';

  // Debug state changes and update ref
  useEffect(() => {
    console.log(`📍 basePosition updated:`, basePosition);
    basePositionRef.current = basePosition;
  }, [basePosition]);

  // Calculate tiles for current view
  const calculateTiles = useCallback((center, zoom) => {
    if (!center || center.length !== 2) return [];
    
    const [lng, lat] = center;
    const z = Math.floor(zoom);
    
    // Web Mercator projection helpers
    const lngToTileX = (lng, z) => (lng + 180) / 360 * Math.pow(2, z);
    const latToTileY = (lat, z) => {
      const latRad = lat * Math.PI / 180;
      return (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * Math.pow(2, z);
    };
    
    // Calculate center position in tile coordinates
    const centerTileX = lngToTileX(lng, z);
    const centerTileY = latToTileY(lat, z);
    
    // Get the integer tile indices
    const centerTileXInt = Math.floor(centerTileX);
    const centerTileYInt = Math.floor(centerTileY);
    
    // Calculate the pixel offset within the center tile
    const offsetX = (centerTileX - centerTileXInt) * 256;
    const offsetY = (centerTileY - centerTileYInt) * 256;
    
    // Calculate viewport coverage (with extra buffer)
    const tilesPerRow = Math.ceil(width / 256) + 4;
    const tilesPerCol = Math.ceil(height / 256) + 4;
    
    const tiles = [];
    const halfWidth = Math.ceil(tilesPerRow / 2);
    const halfHeight = Math.ceil(tilesPerCol / 2);
    
    const scale = Math.pow(2, z);
    
    for (let dx = -halfWidth; dx <= halfWidth; dx++) {
      for (let dy = -halfHeight; dy <= halfHeight; dy++) {
        const tileX = centerTileXInt + dx;
        const tileY = centerTileYInt + dy;
        
        // Skip invalid tiles
        if (tileX < 0 || tileY < 0 || tileX >= scale || tileY >= scale) continue;
        
        // Calculate pixel position relative to viewport center
        const pixelX = (dx * 256) - offsetX + (width / 2);
        const pixelY = (dy * 256) - offsetY + (height / 2);
        
        tiles.push({
          key: `${z}-${tileX}-${tileY}`,
          url: `https://api.maptiler.com/tiles/satellite-v2/${z}/${tileX}/${tileY}.jpg?key=${apiKey}`,
          x: pixelX,
          y: pixelY,
          tileX,
          tileY,
          z
        });
      }
    }
    
    return tiles;
  }, [apiKey]);

  // Update tiles
  const updateTiles = useCallback((center, zoom) => {
    const newTiles = calculateTiles(center, zoom);
    setTiles(newTiles);
  }, [calculateTiles]);

  // Initialize and set loading to false immediately
  useEffect(() => {
    let mounted = true;
    
    const init = async () => {
      try {
        if (mounted) setLoading(true);
        
        // No permissions needed for this component
        // Just set loading to false like MapViewWithGestures does
      } catch (error) {
        console.error('Initialization error:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();
    
    return () => {
      mounted = false;
    };
  }, []);

  // Update tiles when position changes (but only after map is ready)
  useEffect(() => {
    if (mapReady) {
      updateTiles(basePosition.center, basePosition.zoom);
    }
  }, [basePosition, updateTiles, mapReady]);

  // Create a pan responder to capture gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => isPanEnabled,
      onMoveShouldSetPanResponder: () => isPanEnabled,
      
      onPanResponderGrant: (evt) => {
        isPanningRef.current = true;
        pan.setOffset({
          x: pan.x._value,
          y: pan.y._value
        });
        pan.setValue({ x: 0, y: 0 });
        panDistanceRef.current = { dx: 0, dy: 0 };
      },
      
      onPanResponderMove: (evt, gestureState) => {
        if (!isPanEnabled) return;
        
        panDistanceRef.current = { dx: gestureState.dx, dy: gestureState.dy };
        pan.setValue({ x: gestureState.dx, y: gestureState.dy });
      },
      
      onPanResponderRelease: async (evt, gestureState) => {
        const panDistance = panDistanceRef.current;
        console.log(`👆 Pan release: gestureState.dx=${gestureState.dx}, gestureState.dy=${gestureState.dy}`);
        console.log(`👆 Pan release: tracked dx=${panDistance.dx}, dy=${panDistance.dy}`);
        console.log(`📍 Current basePosition.center:`, basePositionRef.current.center);
        console.log(`📍 mapRef.current exists:`, !!mapRef.current);
        
        try {
          // Update map camera based on pan distance
          if (mapRef.current && basePositionRef.current.center && (Math.abs(panDistance.dx) > 1 || Math.abs(panDistance.dy) > 1)) {
            const zoom = await mapRef.current.getZoom();
            console.log(`📍 Current zoom from map:`, zoom);
            
            // Convert pixel offset to coordinate offset using tracked distance with higher precision
            const latRad = basePositionRef.current.center[1] * Math.PI / 180;
            const metersPerPixel = 156543.03392 * Math.cos(latRad) / Math.pow(2, zoom);
            const lngOffset = (panDistance.dx * metersPerPixel) / (111320 * Math.cos(latRad));
            const latOffset = -(panDistance.dy * metersPerPixel) / 110540;
            
            const newCenter = [
              basePositionRef.current.center[0] - lngOffset,
              basePositionRef.current.center[1] - latOffset
            ];
            
            console.log(`📍 Pan release: old center [${basePositionRef.current.center[0].toFixed(4)}, ${basePositionRef.current.center[1].toFixed(4)}] -> new center [${newCenter[0].toFixed(4)}, ${newCenter[1].toFixed(4)}]`);
            console.log(`📍 Pan distance: dx=${panDistance.dx}, dy=${panDistance.dy}`);
            console.log(`📍 Calculated offsets: lngOffset=${lngOffset.toFixed(6)}, latOffset=${latOffset.toFixed(6)}`);
            
            // Update base position immediately
            console.log(`📍 Updating basePosition to:`, newCenter);
            setBasePosition({ center: newCenter, zoom });
            
            // Update tiles to final position first
            updateTiles(newCenter, zoom);
            
            // Update camera to match instantly
            if (cameraRef.current) {
              console.log(`📍 Setting camera to:`, newCenter);
              cameraRef.current.setCamera({
                centerCoordinate: newCenter,
                zoomLevel: zoom,
                animationDuration: 0,
              });
            }
            
            // Notify parent
            if (onPositionChange) {
              onPositionChange(newCenter, zoom);
            }
            
            // Reset pan transform after a tiny delay to ensure tiles have updated
            setTimeout(() => {
              pan.setValue({ x: 0, y: 0 });
            }, 10);
          } else {
            // If no significant movement, just reset the pan
            pan.setValue({ x: 0, y: 0 });
            console.log(`👆 Pan release: No significant movement, resetting`);
          }
        } catch (error) {
          console.error('Error updating map position:', error);
          pan.setValue({ x: 0, y: 0 });
        } finally {
          // Clear panning flag after gesture completes
          isPanningRef.current = false;
        }
      }
    })
  ).current;

  // Map ready handler
  const onMapReady = useCallback(async () => {
    console.log('🗺️ Map ready');
    setMapReady(true);
    
    // Initialize tiles with current basePosition
    if (basePosition.center) {
      console.log('🗺️ Initializing tiles with basePosition:', basePosition.center);
      updateTiles(basePosition.center, basePosition.zoom);
    } else if (initialCenter) {
      console.log('🗺️ Fallback: Initializing with initialCenter:', initialCenter);
      setBasePosition({ center: initialCenter, zoom: initialZoom });
      updateTiles(initialCenter, initialZoom);
    }
  }, [initialCenter, initialZoom, updateTiles, basePosition.center, basePosition.zoom]);

  // Handle zoom changes from map
  const onMapZoomChange = useCallback(async () => {
    console.log(`🔍 onMapZoomChange called`);
    
    // Skip if we're currently panning to prevent interference
    if (isPanningRef.current) {
      console.log(`🔍 onMapZoomChange skipped - panning in progress`);
      return;
    }
    
    if (mapRef.current && basePosition.center) {
      try {
        const zoom = await mapRef.current.getZoom();
        const center = await mapRef.current.getCenter();
        
        console.log(`🔍 Map reported zoom: ${zoom}, center:`, center);
        
        let lng, lat;
        if (Array.isArray(center)) {
          [lng, lat] = center;
        } else {
          lng = center?.longitude || center?.lng;
          lat = center?.latitude || center?.lat;
        }
        
        // Only update if there's a significant zoom change AND the center coordinates are reasonable
        const zoomDiff = Math.abs(zoom - basePosition.zoom);
        const centerDiff = Math.abs(lng - basePosition.center[0]) + Math.abs(lat - basePosition.center[1]);
        
        if (lng && lat && zoomDiff > 0.1 && centerDiff < 10) { // Don't update if coordinates jump too far
          console.log(`🔍 Zoom changed: ${basePosition.zoom} -> ${zoom}`);
          console.log(`🔍 Center changed: [${basePosition.center[0].toFixed(4)}, ${basePosition.center[1].toFixed(4)}] -> [${lng.toFixed(4)}, ${lat.toFixed(4)}]`);
          setBasePosition({ center: [lng, lat], zoom });
          updateTiles([lng, lat], zoom);
          if (onPositionChange) {
            onPositionChange([lng, lat], zoom);
          }
        } else {
          console.log(`🔍 Zoom change ignored - zoom diff: ${zoomDiff.toFixed(3)}, center diff: ${centerDiff.toFixed(3)}`);
        }
      } catch (error) {
        console.error('Error handling zoom change:', error);
      }
    } else {
      console.log(`🔍 onMapZoomChange skipped - mapRef: ${!!mapRef.current}, basePosition.center: ${!!basePosition.center}`);
    }
  }, [basePosition, updateTiles, onPositionChange]);

  // Base map style
  const baseStyle = {
    version: 8,
    sources: {},
    layers: [
      {
        id: 'background',
        type: 'background',
        paint: {
          'background-color': '#1a1a1a'
        }
      }
    ]
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tile container with animation */}
      <Animated.View
        style={[
          styles.tileContainer,
          {
            transform: [
              { translateX: pan.x },
              { translateY: pan.y }
            ]
          }
        ]}
      >
        {tiles.map((tile) => (
          <TileImage
            key={tile.key}
            tile={tile}
            style={[
              styles.tile,
              {
                position: 'absolute',
                left: tile.x - 128,
                top: tile.y - 128,
              }
            ]}
            onLoad={() => {}}
            onError={(error) => console.error(`❌ Tile error: ${tile.key}`, error.nativeEvent?.error)}
          />
        ))}
      </Animated.View>

      {/* MapLibre GL Map View */}
      <MapLibreGL.MapView
        ref={mapRef}
        style={styles.map}
        styleJSON={JSON.stringify(baseStyle)}
        logoEnabled={false}
        attributionEnabled={false}
        scrollEnabled={false}
        zoomEnabled={true}
        pitchEnabled={false}
        rotateEnabled={false}
        onDidFinishLoadingMap={onMapReady}
        onRegionDidChange={onMapZoomChange}
      >
        <MapLibreGL.Camera
          ref={cameraRef}
          centerCoordinate={basePosition.center}
          zoomLevel={basePosition.zoom}
          minZoomLevel={10}
          maxZoomLevel={20}
        />
      </MapLibreGL.MapView>

      {/* Gesture capture overlay */}
      <View
        style={styles.gestureOverlay}
        {...(isPanEnabled ? panResponder.panHandlers : {})}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    position: 'relative',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  map: {
    flex: 1,
  },
  tileContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  tile: {
    position: 'absolute',
    width: 256,
    height: 256,
  },
  gestureOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
    backgroundColor: 'transparent',
  },
});

export default CleanMapView;