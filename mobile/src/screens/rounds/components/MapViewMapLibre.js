import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import MapLibreGL from '@maplibre/maplibre-react-native';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import mapTilerService from '../../../services/mapTilerService';
import { MAP_CONFIG } from '../../../config/mapConfig';
import MapTilerKeyInput from '../../../components/MapTilerKeyInput';

// Set access token to null (MapLibre doesn't require it)
MapLibreGL.setAccessToken(null);

const { width, height } = Dimensions.get('window');

const CourseMapView = ({ 
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

  const [mapReady, setMapReady] = useState(false);
  const [mapTilerReady, setMapTilerReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const mapRef = useRef(null);
  const cameraRef = useRef(null);

  const currentHoleData = holes.find(hole => hole.holeNumber === currentHole) || holes[0];

  // MapTiler satellite style URL
  const MAPTILER_KEY = MAP_CONFIG.MAPTILER.API_KEY || '9VwMyrJdecjrEB6fwLGJ';
  const mapStyle = `https://api.maptiler.com/maps/satellite/style.json?key=${MAPTILER_KEY}`;

  // Default center coordinates
  const centerCoordinate = course && course.latitude && course.longitude
    ? [parseFloat(course.longitude), parseFloat(course.latitude)]
    : [-82.0206, 33.5031]; // Augusta National

  // Initialize MapTiler service and request permissions
  useEffect(() => {
    initializeMapTiler();
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const permission = Platform.OS === 'ios' 
        ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE 
        : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;

      const result = await request(permission);
      
      if (result === RESULTS.GRANTED) {
        setHasLocationPermission(true);
        console.log('✅ Location permission granted');
      } else {
        setHasLocationPermission(false);
        console.log('❌ Location permission denied');
      }
    } catch (error) {
      console.error('Location permission error:', error);
      setHasLocationPermission(false);
    }
  };

  const initializeMapTiler = async () => {
    try {
      setLoading(true);
      
      // Try to load existing API key from storage first
      let apiKey = await mapTilerService.loadApiKey();
      
      // If no stored key, use the one from config
      if (!apiKey && MAP_CONFIG.MAPTILER.API_KEY) {
        await mapTilerService.initialize(MAP_CONFIG.MAPTILER.API_KEY);
        apiKey = MAP_CONFIG.MAPTILER.API_KEY;
      }
      
      if (apiKey) {
        setMapTilerReady(true);
        console.log('✅ MapTiler API key found, enabling satellite imagery');
        
        // Test API key in background
        mapTilerService.testApiKey().then(testResult => {
          if (!testResult.valid) {
            console.warn('MapTiler API key is invalid:', testResult.error);
            setMapTilerReady(false);
          }
        }).catch(error => {
          console.error('Error testing MapTiler API key:', error);
        });
      } else {
        console.log('No MapTiler API key found. Satellite imagery will not be available.');
        setShowKeyInput(true);
      }
    } catch (error) {
      console.error('Error initializing MapTiler:', error);
    } finally {
      setLoading(false);
    }
  };

  const onMapReady = () => {
    console.log('🗺️ MapViewMapLibre: Map is ready!');
    setMapReady(true);
  };

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

  if (loading) {
    console.log('🗺️ MapViewMapLibre: Still loading...');
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  console.log('🗺️ MapViewMapLibre: Rendering map with center:', centerCoordinate);
  console.log('🗺️ MapViewMapLibre: MapTiler ready:', mapTilerReady);
  console.log('🗺️ MapViewMapLibre: Style URL:', mapStyle);

  return (
    <View style={styles.container}>
      {/* MapLibre GL Map View */}
      <MapLibreGL.MapView
        ref={mapRef}
        style={styles.map}
        styleURL={mapStyle}
        onDidFinishLoadingMap={onMapReady}
        logoEnabled={false}
        attributionEnabled={true}
        attributionPosition={{ bottom: 8, right: 8 }}
      >
        <MapLibreGL.Camera
          ref={cameraRef}
          centerCoordinate={centerCoordinate}
          zoomLevel={16}
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

      {/* MapTiler Key Input Modal */}
      <MapTilerKeyInput
        visible={showKeyInput}
        onClose={() => setShowKeyInput(false)}
        onSuccess={() => {
          setShowKeyInput(false);
          initializeMapTiler(); // Reload MapTiler after key is added
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
});

export default CourseMapView;