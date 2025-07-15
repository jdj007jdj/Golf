import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  Platform,
} from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';

import MapView from 'react-native-maps';

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
  const [location, setLocation] = useState(null);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);

  useEffect(() => {
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
        getCurrentLocation();
      } else {
        setHasLocationPermission(false);
        setIsLoadingLocation(false);
        Alert.alert(
          'Location Permission Required',
          'This app needs location access to show your position on the course map.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => {/* Open settings */} }
          ]
        );
      }
    } catch (error) {
      console.error('Location permission error:', error);
      setIsLoadingLocation(false);
    }
  };

  const getCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          latitudeDelta: 0.001,
          longitudeDelta: 0.001,
        });
        setIsLoadingLocation(false);
      },
      (error) => {
        console.error('Location error:', error);
        setIsLoadingLocation(false);
        Alert.alert('Location Error', 'Unable to get your current location.');
      },
      { 
        enableHighAccuracy: true, 
        timeout: 15000, 
        maximumAge: 10000 
      }
    );
  };

  const currentHoleData = holes.find(hole => hole.holeNumber === currentHole) || holes[0];

  // Default map region (will be updated when location is available)
  const defaultRegion = {
    latitude: 37.7749,
    longitude: -122.4194,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  };


  if (isLoadingLocation) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  if (!hasLocationPermission) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionTitle}>Location Access Required</Text>
        <Text style={styles.permissionText}>
          To show your position on the course map, please grant location permission.
        </Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={requestLocationPermission}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Map */}
      <MapView
        style={styles.map}
        region={location || defaultRegion}
        showsUserLocation={true}
        showsMyLocationButton={true}
        mapType="satellite"
        onRegionChangeComplete={() => {
          // Handle region changes if needed
        }}
        onMapReady={() => {
          // Map is ready
        }}
        onError={(error) => {
          console.error('MapView: Error occurred:', error);
        }}
      >
        {/* Course markers will be added here in future iterations */}
      </MapView>

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
          <Text style={styles.distanceValue}>156y</Text>
        </View>
        <View style={styles.distanceItem}>
          <Text style={styles.distanceLabel}>Front</Text>
          <Text style={styles.distanceValue}>148y</Text>
        </View>
        <View style={styles.distanceItem}>
          <Text style={styles.distanceLabel}>Back</Text>
          <Text style={styles.distanceValue}>164y</Text>
        </View>
        <View style={styles.distanceItem}>
          <Text style={styles.distanceLabel}>Center</Text>
          <Text style={styles.distanceValue}>156y</Text>
        </View>
      </View>

      {/* Placeholder for future features */}
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>
          🗺️ Course Map View
        </Text>
        <Text style={styles.placeholderSubtext}>
          GPS rangefinder and course overlay coming soon!
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 40,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: '#2e7d32',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  placeholder: {
    position: 'absolute',
    top: '40%',
    left: '50%',
    transform: [{ translateX: -100 }, { translateY: -50 }],
    width: 200,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  placeholderSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
});

export default CourseMapView;