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
} from 'react-native';
import MapLibreGL from '@maplibre/maplibre-react-native';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { MAP_CONFIG } from '../../../config/mapConfig';
import SmoothTileOverlay from './SmoothTileOverlay';

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
  console.log('🗺️ MapViewMapLibre: Component mounting with props:', { 
    hasCourse: !!course, 
    hasHoles: !!holes, 
    currentHole 
  });

  // State management
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  
  // Callbacks for tile overlay
  const onRegionIsChangingCallback = useRef(null);
  const onRegionDidChangeCallback = useRef(null);
  
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


  const onMapReady = () => {
    console.log('🗺️ MapViewMapLibre: Map ready');
    setMapReady(true);
  };

  const onUserLocationUpdate = (location) => {
    console.log('📍 User location updated:', location);
    setUserLocation(location);
  };
  
  // Map event handlers
  const onRegionWillChange = useCallback(() => {
    console.log('🗺️ Region will change');
  }, []);
  
  const onRegionIsChanging = useCallback(() => {
    if (onRegionIsChangingCallback.current) {
      onRegionIsChangingCallback.current();
    }
  }, []);
  
  const onRegionDidChange = useCallback(() => {
    if (onRegionDidChangeCallback.current) {
      onRegionDidChangeCallback.current();
    }
  }, []);

  const flyToLocation = (longitude, latitude, zoom = 17) => {
    if (cameraRef.current) {
      cameraRef.current.setCamera({
        centerCoordinate: [longitude, latitude],
        zoomLevel: zoom,
        animationDuration: 1000,
      });
    }
  };

  // Simple base style with dark background
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
      {/* Smooth tile overlay */}
      <SmoothTileOverlay
        mapRef={mapRef.current}
        mapReady={mapReady}
        apiKey={apiKey}
        onRegionIsChanging={(callback) => {
          onRegionIsChangingCallback.current = callback;
        }}
        onRegionDidChange={(callback) => {
          onRegionDidChangeCallback.current = callback;
        }}
      />
      
      {/* MapLibre GL Map View */}
      <MapLibreGL.MapView
        ref={mapRef}
        style={styles.map}
        styleJSON={JSON.stringify(baseStyle)}
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

        {/* User Location - only show if permission granted */}
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

        {/* Current hole marker if available */}
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