import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  Platform,
  ActivityIndicator,
  Animated,
} from 'react-native';
import MapLibreGL from '@maplibre/maplibre-react-native';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { MAP_CONFIG } from '../../../config/mapConfig';

// Set access token to null (MapLibre doesn't require it)
MapLibreGL.setAccessToken(null);

const { width, height } = Dimensions.get('window');

const CourseMapView = React.memo(({ 
  round, 
  course, 
  holes, 
  currentHole, 
  setCurrentHole, 
  scores,
  settings 
}) => {
  console.log('🗺️ MapViewSmooth: Component mounting');

  // State management
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  
  // Camera tracking state
  const [cameraState, setCameraState] = useState({
    center: null,
    zoom: 16,
    heading: 0,
    pitch: 0,
    bounds: null
  });
  
  // Gesture state
  const [isMoving, setIsMoving] = useState(false);
  const [lastCenter, setLastCenter] = useState(null);
  
  // Tile state
  const [tiles, setTiles] = useState([]);
  const [tileCache] = useState(new Map());
  
  // Animated values for smooth movement
  const panOffset = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const tileOpacity = useRef(new Animated.Value(1)).current;
  
  const mapRef = useRef(null);
  const cameraRef = useRef(null);
  const apiKey = MAP_CONFIG.MAPTILER.API_KEY || '9VwMyrJdecjrEB6fwLGJ';

  const currentHoleData = holes.find(hole => hole.holeNumber === currentHole) || holes[0];

  // Default center coordinates
  const centerCoordinate = course && course.latitude && course.longitude
    ? [parseFloat(course.longitude), parseFloat(course.latitude)]
    : [-82.0206, 33.5031]; // Augusta National

  // Initialize and request permissions
  useEffect(() => {
    let mounted = true;
    
    const init = async () => {
      try {
        if (mounted) setLoading(true);
        
        // Request location permission
        const permission = Platform.OS === 'ios' 
          ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE 
          : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;

        const result = await request(permission);
        
        if (mounted) {
          if (result === RESULTS.GRANTED) {
            setHasLocationPermission(true);
            console.log('✅ Location permission granted');
          } else {
            setHasLocationPermission(false);
            console.log('❌ Location permission denied');
          }
        }
      } catch (error) {
        console.error('Initialization error:', error);
        if (mounted) setHasLocationPermission(false);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();
    
    return () => {
      mounted = false;
    };
  }, []);

  // Convert geographic coordinates to screen pixels
  const coordinateToPixel = useCallback((lng, lat, centerLng, centerLat, zoom) => {
    const scale = Math.pow(2, zoom) * 256;
    
    // Convert to Web Mercator
    const centerX = (centerLng + 180) / 360;
    const centerY = (1 - Math.log(Math.tan(centerLat * Math.PI / 180) + 1 / Math.cos(centerLat * Math.PI / 180)) / Math.PI) / 2;
    
    const x = (lng + 180) / 360;
    const y = (1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2;
    
    // Calculate pixel offset from center
    const pixelX = (x - centerX) * scale;
    const pixelY = (y - centerY) * scale;
    
    return { x: pixelX, y: pixelY };
  }, []);

  // Calculate which tiles we need for current view
  const calculateVisibleTiles = useCallback((center, zoom, viewportWidth, viewportHeight) => {
    if (!center || center.length !== 2) return [];
    
    const [lng, lat] = center;
    const z = Math.floor(zoom);
    
    // Calculate tile at center
    const centerTileX = Math.floor((lng + 180) / 360 * Math.pow(2, z));
    const centerTileY = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, z));
    
    // Calculate how many tiles we need (with buffer for smooth panning)
    const tilesPerViewportWidth = Math.ceil(viewportWidth / 256) + 2;
    const tilesPerViewportHeight = Math.ceil(viewportHeight / 256) + 2;
    
    const tiles = [];
    const halfWidth = Math.ceil(tilesPerViewportWidth / 2);
    const halfHeight = Math.ceil(tilesPerViewportHeight / 2);
    
    for (let dx = -halfWidth; dx <= halfWidth; dx++) {
      for (let dy = -halfHeight; dy <= halfHeight; dy++) {
        const x = centerTileX + dx;
        const y = centerTileY + dy;
        
        // Skip invalid tiles
        if (x < 0 || y < 0 || x >= Math.pow(2, z) || y >= Math.pow(2, z)) continue;
        
        // Calculate geographic bounds for this tile
        const n = Math.PI - 2 * Math.PI * y / Math.pow(2, z);
        const tileLat = 180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
        const tileLng = x / Math.pow(2, z) * 360 - 180;
        
        // Calculate pixel position relative to center
        const tilePixelOffset = coordinateToPixel(tileLng, tileLat, lng, lat, zoom);
        
        tiles.push({
          x, y, z,
          key: `${z}-${x}-${y}`,
          url: `https://api.maptiler.com/tiles/satellite-v2/${z}/${x}/${y}.jpg?key=${apiKey}`,
          pixelX: tilePixelOffset.x + width / 2,
          pixelY: tilePixelOffset.y + height / 2,
          lng: tileLng,
          lat: tileLat
        });
      }
    }
    
    return tiles;
  }, [coordinateToPixel, apiKey]);

  // Handle map ready
  const onMapReady = () => {
    console.log('🗺️ MapViewSmooth: Map ready');
    setMapReady(true);
    
    // Set initial tiles
    const initialTiles = calculateVisibleTiles(centerCoordinate, 16, width, 400);
    setTiles(initialTiles);
    setCameraState(prev => ({ ...prev, center: centerCoordinate }));
    setLastCenter(centerCoordinate);
  };

  // Handle region will change (gesture started)
  const onRegionWillChange = useCallback(() => {
    console.log('🗺️ Gesture started');
    setIsMoving(true);
    
    // Fade tiles slightly during movement for performance
    Animated.timing(tileOpacity, {
      toValue: 0.8,
      duration: 100,
      useNativeDriver: true,
    }).start();
  }, []);

  // Handle region is changing (continuous updates during gesture)
  const onRegionIsChanging = useCallback(async (feature) => {
    if (!mapRef.current || !lastCenter) return;
    
    try {
      // Get current camera position
      const center = await mapRef.current.getCenter();
      const zoom = await mapRef.current.getZoom();
      
      let lng, lat;
      if (Array.isArray(center)) {
        [lng, lat] = center;
      } else if (center && typeof center === 'object') {
        lng = center.longitude || center.lng;
        lat = center.latitude || center.lat;
      }
      
      if (!lng || !lat || isNaN(lng) || isNaN(lat)) return;
      
      // Calculate pixel offset from last center
      const offset = coordinateToPixel(lng, lat, lastCenter[0], lastCenter[1], zoom);
      
      // Apply smooth transform to tile container
      panOffset.setValue({ x: -offset.x, y: -offset.y });
      
      // Update camera state
      setCameraState({
        center: [lng, lat],
        zoom: zoom,
        heading: feature.properties.heading || 0,
        pitch: feature.properties.pitch || 0,
        bounds: feature.properties.visibleBounds
      });
    } catch (error) {
      console.error('Error in onRegionIsChanging:', error);
    }
  }, [lastCenter, coordinateToPixel]);

  // Handle region did change (gesture ended)
  const onRegionDidChange = useCallback(async () => {
    console.log('🗺️ Gesture ended');
    setIsMoving(false);
    
    if (!mapRef.current) return;
    
    try {
      // Get final camera position
      const center = await mapRef.current.getCenter();
      const zoom = await mapRef.current.getZoom();
      
      let lng, lat;
      if (Array.isArray(center)) {
        [lng, lat] = center;
      } else if (center && typeof center === 'object') {
        lng = center.longitude || center.lng;
        lat = center.latitude || center.lat;
      }
      
      if (!lng || !lat || isNaN(lng) || isNaN(lat)) return;
      
      // Update tiles for new position
      const newTiles = calculateVisibleTiles([lng, lat], zoom, width, 400);
      setTiles(newTiles);
      setLastCenter([lng, lat]);
      
      // Reset transform
      panOffset.setValue({ x: 0, y: 0 });
      
      // Restore opacity
      Animated.timing(tileOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      console.error('Error in onRegionDidChange:', error);
    }
  }, [calculateVisibleTiles]);

  const onUserLocationUpdate = (location) => {
    console.log('📍 User location updated:', location);
    setUserLocation(location);
  };

  const flyToLocation = (longitude, latitude, zoom = 17) => {
    if (cameraRef.current) {
      cameraRef.current.setCamera({
        centerCoordinate: [longitude, latitude],
        zoomLevel: zoom,
        animationDuration: 1000,
      });
    }
  };

  // Simple style with no sources (we'll use overlay)
  const mapStyle = {
    version: 8,
    sources: {},
    layers: [
      {
        id: 'background',
        type: 'background',
        paint: {
          'background-color': '#000'
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
      {/* Animated tile container */}
      <Animated.View 
        style={[
          styles.tileContainer,
          {
            opacity: tileOpacity,
            transform: [
              { translateX: panOffset.x },
              { translateY: panOffset.y }
            ]
          }
        ]} 
        pointerEvents="none"
      >
        {tiles.map((tile) => (
          <Image
            key={tile.key}
            source={{ uri: tile.url }}
            style={[
              styles.tile,
              {
                left: tile.pixelX - 128,
                top: tile.pixelY - 128,
              }
            ]}
            resizeMode="cover"
            fadeDuration={0}
          />
        ))}
      </Animated.View>

      {/* MapLibre GL Map View */}
      <MapLibreGL.MapView
        ref={mapRef}
        style={styles.map}
        styleJSON={JSON.stringify(mapStyle)}
        onDidFinishLoadingMap={onMapReady}
        onRegionWillChange={onRegionWillChange}
        onRegionIsChanging={onRegionIsChanging}
        onRegionDidChange={onRegionDidChange}
        logoEnabled={false}
        attributionEnabled={false}
        regionWillChangeDebounceTime={0}
        regionDidChangeDebounceTime={0}
      >
        <MapLibreGL.Camera
          ref={cameraRef}
          centerCoordinate={centerCoordinate}
          zoomLevel={16}
          minZoomLevel={MAP_CONFIG.minZoom || 5}
          maxZoomLevel={MAP_CONFIG.maxZoom || 20}
        />

        {/* User Location */}
        {hasLocationPermission && (
          <MapLibreGL.UserLocation
            visible={true}
            onUpdate={onUserLocationUpdate}
            showsUserHeadingIndicator={true}
          />
        )}

        {/* Test Marker at Augusta National */}
        <MapLibreGL.PointAnnotation
          id="augusta"
          coordinate={[-82.0206, 33.5031]}
          title="Augusta National"
        >
          <View style={styles.markerContainer}>
            <Text style={styles.markerText}>🏌️</Text>
          </View>
          <MapLibreGL.Callout title="Augusta National Golf Club" />
        </MapLibreGL.PointAnnotation>

        {/* Current hole marker */}
        {currentHoleData && currentHoleData.greenLatitude && currentHoleData.greenLongitude && (
          <MapLibreGL.PointAnnotation
            id={`hole-${currentHole}`}
            coordinate={[
              parseFloat(currentHoleData.greenLongitude),
              parseFloat(currentHoleData.greenLatitude)
            ]}
            title={`Hole ${currentHole}`}
          >
            <View style={styles.holeMarkerContainer}>
              <Text style={styles.holeMarkerText}>{currentHole}</Text>
            </View>
            <MapLibreGL.Callout title={`Hole ${currentHole} - Par ${currentHoleData.par}`} />
          </MapLibreGL.PointAnnotation>
        )}
      </MapLibreGL.MapView>

      {/* Hole Navigation Bar */}
      <View style={styles.holeNavigation}>
        <TouchableOpacity
          style={[styles.navButton, currentHole === 1 && styles.navButtonDisabled]}
          onPress={() => currentHole > 1 && setCurrentHole(currentHole - 1)}
          disabled={currentHole === 1}
        >
          <Text style={[styles.navButtonText, currentHole === 1 && styles.navButtonTextDisabled]}>
            ◀
          </Text>
        </TouchableOpacity>
        
        <View style={styles.holeInfo}>
          <Text style={styles.holeNumber}>Hole {currentHole}</Text>
          <Text style={styles.holeDetails}>
            Par {currentHoleData.par} • {currentHoleData.yardage || 'N/A'}y
          </Text>
        </View>
        
        <TouchableOpacity
          style={[styles.navButton, currentHole === 18 && styles.navButtonDisabled]}
          onPress={() => currentHole < 18 && setCurrentHole(currentHole + 1)}
          disabled={currentHole === 18}
        >
          <Text style={[styles.navButtonText, currentHole === 18 && styles.navButtonTextDisabled]}>
            ▶
          </Text>
        </TouchableOpacity>
      </View>

      {/* Distance Information Bar */}
      <View style={styles.distanceBar}>
        <View style={styles.distanceItem}>
          <Text style={styles.distanceLabel}>Pin</Text>
          <Text style={styles.distanceValue}>Coming Soon</Text>
        </View>
        <View style={styles.distanceItem}>
          <Text style={styles.distanceLabel}>Front</Text>
          <Text style={styles.distanceValue}>Coming Soon</Text>
        </View>
        <View style={styles.distanceItem}>
          <Text style={styles.distanceLabel}>Back</Text>
          <Text style={styles.distanceValue}>Coming Soon</Text>
        </View>
        <View style={styles.distanceItem}>
          <Text style={styles.distanceLabel}>Center</Text>
          <Text style={styles.distanceValue}>Coming Soon</Text>
        </View>
      </View>

      {/* Debug info */}
      {isMoving && (
        <View style={styles.debugInfo}>
          <Text style={styles.debugText}>Moving: {isMoving ? 'Yes' : 'No'}</Text>
          <Text style={styles.debugText}>Zoom: {cameraState.zoom.toFixed(2)}</Text>
        </View>
      )}

      {/* MapTiler Attribution */}
      <View style={styles.attribution}>
        <Text style={styles.attributionText}>© MapTiler © OpenStreetMap</Text>
      </View>
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
  markerContainer: {
    width: 30,
    height: 30,
    backgroundColor: 'white',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2e7d32',
  },
  markerText: {
    fontSize: 16,
  },
  holeMarkerContainer: {
    width: 30,
    height: 30,
    backgroundColor: '#ff4444',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  holeMarkerText: {
    fontSize: 14,
    color: 'white',
    fontWeight: 'bold',
  },
  holeNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    margin: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 2,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2e7d32',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonDisabled: {
    backgroundColor: '#ccc',
  },
  navButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  navButtonTextDisabled: {
    color: '#999',
  },
  holeInfo: {
    alignItems: 'center',
  },
  holeNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  holeDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  distanceBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    margin: 10,
    marginTop: 0,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 2,
  },
  distanceItem: {
    flex: 1,
    alignItems: 'center',
  },
  distanceLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  distanceValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#999',
  },
  debugInfo: {
    position: 'absolute',
    top: 50,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 5,
    zIndex: 3,
  },
  debugText: {
    color: 'white',
    fontSize: 12,
  },
  attribution: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 2,
  },
  attributionText: {
    fontSize: 10,
    color: '#666',
  },
});

// Custom comparison function to prevent unnecessary re-renders
const arePropsEqual = (prevProps, nextProps) => {
  return (
    prevProps.round?.id === nextProps.round?.id &&
    prevProps.course?.id === nextProps.course?.id &&
    prevProps.currentHole === nextProps.currentHole &&
    prevProps.holes?.length === nextProps.holes?.length &&
    prevProps.scores === nextProps.scores &&
    prevProps.settings === nextProps.settings
  );
};

export default React.memo(CourseMapView, arePropsEqual);