import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  Platform,
  ActivityIndicator,
  PanResponder,
  Animated,
  Alert,
} from 'react-native';
import MapLibreGL from '@maplibre/maplibre-react-native';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import Geolocation from 'react-native-geolocation-service';
import { MAP_CONFIG } from '../../../config/mapConfig';
import TileImage from '../../../components/TileImage';
import persistentTileCache from '../../../utils/persistentTileCache';
import shotTrackingService from '../../../services/shotTrackingService';
import ShotOverlay from './ShotOverlay';
import { calculateDistance, formatDistance } from '../../../utils/gpsCalculations';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  console.log('🗺️ MapViewWithGestures: Component mounting');
  
  // Track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);
  
  useEffect(() => {
    console.log('🗺️ MapViewWithGestures: Setting up component lifecycle');
    return () => {
      console.log('🗺️ MapViewWithGestures: Component unmounting - cleaning up');
      isMountedRef.current = false;
    };
  }, []);

  // State management
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [tiles, setTiles] = useState([]);
  const [basePosition, setBasePosition] = useState({ 
    center: centerCoordinate || [0, 0], // Temporary until we get user location
    zoom: 18 
  });
  const [cacheStats, setCacheStats] = useState(null);
  const [shots, setShots] = useState([]);
  const [showShots, setShowShots] = useState(true);
  const [calibrationMode, setCalibrationMode] = useState(false);
  const [calibrationOffset, setCalibrationOffset] = useState({ lat: 0, lng: 0 });
  const [mapBounds, setMapBounds] = useState(null);
  const [currentDistances, setCurrentDistances] = useState(null);
  
  // Debug state changes and update ref
  useEffect(() => {
    console.log(`📍 basePosition updated:`, basePosition);
    basePositionRef.current = basePosition;
  }, [basePosition]);
  
  // Update basePosition when centerCoordinate changes (only if we don't have user location)
  useEffect(() => {
    if (centerCoordinate && basePosition.center[0] === 0 && basePosition.center[1] === 0) {
      console.log(`📍 Setting basePosition.center to centerCoordinate:`, centerCoordinate);
      setBasePosition({ center: centerCoordinate, zoom: 18 });
    }
  }, [centerCoordinate]);
  
  // Refs
  const mapRef = useRef(null);
  const cameraRef = useRef(null);
  const gestureStartRef = useRef(null);
  const lastGestureRef = useRef({ x: 0, y: 0 });
  const basePositionRef = useRef(basePosition);
  const isPanningRef = useRef(false);
  const panDistanceRef = useRef({ dx: 0, dy: 0 });
  
  // Animated values
  const pan = useRef(new Animated.ValueXY()).current;
  const scale = useRef(new Animated.Value(1)).current;
  
  const apiKey = MAP_CONFIG.MAPTILER.API_KEY || '9VwMyrJdecjrEB6fwLGJ';

  const currentHoleData = holes.find(hole => hole.holeNumber === currentHole) || holes[0];

  // Default center coordinates - will be updated with user location
  const centerCoordinate = course && course.latitude && course.longitude
    ? [parseFloat(course.longitude), parseFloat(course.latitude)]
    : null; // Don't default to Augusta

  // Create a transparent overlay to capture gestures
  const panResponder = useMemo(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => false, // Don't capture on touch start to allow taps/long press
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only capture if there's actual movement (pan gesture)
        return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
      },
      onPanResponderEnd: (evt) => {
        console.log('🎯 PanResponder onEnd triggered', {
          calibrationMode,
          hasMapBounds: !!mapBounds,
          hasUserLocation: !!userLocation
        });
        
        // Handle calibration tap
        if (calibrationMode && mapBounds && userLocation) {
          // Get touch coordinates
          const touchX = evt.nativeEvent.locationX;
          const touchY = evt.nativeEvent.locationY;
          
          console.log('📍 Touch coordinates:', { touchX, touchY });
          console.log('🗺️ Map bounds:', mapBounds);
          console.log('📍 User location:', userLocation);
          
          // Convert screen coordinates to GPS
          const touchLng = mapBounds.west + (touchX / width) * (mapBounds.east - mapBounds.west);
          const touchLat = mapBounds.south + (1 - touchY / height) * (mapBounds.north - mapBounds.south);
          
          console.log('🌍 Calculated GPS coordinates:', { touchLat, touchLng });
          
          // Calculate offset
          const latOffset = touchLat - userLocation.latitude;
          const lngOffset = touchLng - userLocation.longitude;
          
          console.log('📏 Calculated offset:', { latOffset, lngOffset });
          
          setCalibrationOffset({ lat: latOffset, lng: lngOffset });
          setCalibrationMode(false); // Exit calibration mode after setting
          
          Alert.alert(
            'Calibration Updated',
            `GPS Offset:\nLatitude: ${latOffset > 0 ? '+' : ''}${(latOffset * 111111).toFixed(1)}m\nLongitude: ${lngOffset > 0 ? '+' : ''}${(lngOffset * 111111 * Math.cos(userLocation.latitude * Math.PI / 180)).toFixed(1)}m`,
            [
              { text: 'Reset', onPress: () => {
                setCalibrationOffset({ lat: 0, lng: 0 });
                setCalibrationMode(false);
              }, style: 'destructive' },
              { text: 'OK', style: 'default' }
            ]
          );
        }
      },
      onStartShouldSetPanResponderCapture: () => calibrationMode, // Only capture in calibration mode
      onMoveShouldSetPanResponderCapture: () => false,
      
      onPanResponderGrant: (evt) => {
        console.log('👆 Pan gesture started');
        console.log('📍 basePosition.center at gesture start:', basePositionRef.current.center);
        
        // Safety check: ensure basePosition.center is available
        if (!basePositionRef.current.center) {
          console.log('❌ Pan gesture blocked - basePosition.center is null');
          return;
        }
        
        // Set panning flag to prevent onMapZoomChange interference
        isPanningRef.current = true;
        
        // Reset pan distance tracker
        panDistanceRef.current = { dx: 0, dy: 0 };
        
        // Store initial touch position
        gestureStartRef.current = {
          x: evt.nativeEvent.locationX,
          y: evt.nativeEvent.locationY,
          touches: evt.nativeEvent.touches,
          timestamp: Date.now()
        };
        lastGestureRef.current = { x: 0, y: 0 };
        
        // Reset pan to ensure clean start (no offset flattening)
        pan.setValue({ x: 0, y: 0 });
      },
      
      onPanResponderMove: (evt, gestureState) => {
        // Safety check: ensure basePosition.center is available
        if (!basePositionRef.current.center) {
          return;
        }
        
        // Calculate pan delta
        const dx = gestureState.dx;
        const dy = gestureState.dy;
        
        console.log(`👆 Pan move: dx=${dx.toFixed(1)}, dy=${dy.toFixed(1)}`);
        
        // Update pan distance tracker
        panDistanceRef.current = { dx, dy };
        
        // Update pan animation immediately for smooth feedback
        pan.setValue({ x: dx, y: dy });
        
        // Pass gesture to map (if needed)
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
          lastGestureRef.current = { x: dx, y: dy };
        }
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
    }),
    [calibrationMode, mapBounds, userLocation, setCalibrationOffset, setCalibrationMode]
  );

  // Initialize persistent cache and update stats periodically
  useEffect(() => {
    let interval;
    
    const initCache = async () => {
      await persistentTileCache.initialize();
      
      // Initial stats update
      const stats = persistentTileCache.getStats();
      setCacheStats(stats);
      
      if (__DEV__) {
        console.log(`📊 Persistent cache initialized:`, {
          memory: `${stats.memoryCache.size}/${stats.memoryCache.maxSize} tiles`,
          persistent: `${stats.persistentCache.tileCount} tiles (${(stats.persistentCache.totalSize / 1024 / 1024).toFixed(1)}MB)`,
          limit: `${(stats.settings.storageLimit / 1024 / 1024).toFixed(0)}MB`
        });
      }
      
      // Update stats every 10 seconds
      interval = setInterval(() => {
        const newStats = persistentTileCache.getStats();
        setCacheStats(newStats);
      }, 10000);
    };
    
    initCache();
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  // Load shots for current round
  useEffect(() => {
    const loadShots = () => {
      if (round?.id) {
        const allShots = shotTrackingService.getAllShots();
        console.log('MapView loading shots:', allShots.length);
        if (allShots.length > 0) {
          console.log('First shot coordinates:', allShots[0].coordinates);
        }
        setShots(allShots);
      }
    };

    loadShots();
    
    // Set up interval to refresh shots
    const shotInterval = setInterval(loadShots, 2000); // Refresh every 2 seconds
    
    return () => clearInterval(shotInterval);
  }, [round?.id, currentHole]);

  // Update distances periodically
  useEffect(() => {
    const updateDistances = async () => {
      // Only try to get distances if we have location permission
      if (!hasLocationPermission) {
        return;
      }
      
      try {
        const distances = await shotTrackingService.getCurrentDistances(currentHole);
        setCurrentDistances(distances);
      } catch (error) {
        console.error('Error updating distances:', error);
      }
    };

    // Update immediately and then every 5 seconds
    updateDistances();
    const interval = setInterval(updateDistances, 5000);
    
    return () => clearInterval(interval);
  }, [currentHole, hasLocationPermission]);

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
            
            // Get current location
            Geolocation.getCurrentPosition(
              (position) => {
                const { latitude, longitude } = position.coords;
                console.log('📍 Got user location:', latitude, longitude);
                
                // Update base position with user location if we don't have course coordinates
                if (!centerCoordinate) {
                  setBasePosition({
                    center: [longitude, latitude],
                    zoom: 18
                  });
                }
                
                setUserLocation({
                  latitude,
                  longitude,
                  accuracy: position.coords.accuracy
                });
              },
              (error) => {
                console.error('❌ Error getting location:', error);
                // Fall back to course location or a default
                if (centerCoordinate) {
                  setBasePosition({
                    center: centerCoordinate,
                    zoom: 18
                  });
                }
              },
              {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 10000
              }
            );
          } else {
            setHasLocationPermission(false);
            console.log('❌ Location permission denied');
            // Use course location if available
            if (centerCoordinate) {
              setBasePosition({
                center: centerCoordinate,
                zoom: 18
              });
            }
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

  // Set up continuous location tracking for better accuracy
  useEffect(() => {
    if (!hasLocationPermission) return;

    console.log('📍 Setting up continuous GPS tracking');
    const watchId = Geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        if (isMountedRef.current) {
          setUserLocation({
            latitude,
            longitude,
            accuracy
          });
        }
      },
      (error) => {
        console.error('GPS tracking error:', error);
      },
      {
        enableHighAccuracy: true,
        distanceFilter: 5, // Update every 5 meters
        interval: 1000, // Update every second
        fastestInterval: 1000,
        forceRequestLocation: true,
        showLocationDialog: true,
        accuracy: {
          android: 'high',
          ios: 'best'
        }
      }
    );

    return () => {
      if (watchId !== null) {
        Geolocation.clearWatch(watchId);
      }
    };
  }, [hasLocationPermission]);

  // Calculate map bounds for shot overlay
  const calculateMapBounds = useCallback((center, zoom) => {
    if (!center || center.length !== 2) return null;
    
    const [lng, lat] = center;
    const z = Math.floor(zoom);
    
    // Calculate the geographic bounds visible on screen
    // Using Web Mercator projection formulas
    const tileSize = 256;
    const scale = Math.pow(2, zoom);
    const worldSize = tileSize * scale;
    
    // Screen dimensions in world coordinates
    const screenWidthInWorld = width / worldSize * 360;
    const screenHeightInWorld = height / worldSize * 180;
    
    // Calculate bounds
    const west = lng - screenWidthInWorld / 2;
    const east = lng + screenWidthInWorld / 2;
    
    // Latitude calculation is more complex due to Mercator projection
    const latRad = lat * Math.PI / 180;
    const mercatorY = Math.log(Math.tan(latRad) + 1 / Math.cos(latRad));
    const topMercatorY = mercatorY + (screenHeightInWorld / 180 * Math.PI);
    const bottomMercatorY = mercatorY - (screenHeightInWorld / 180 * Math.PI);
    
    const north = Math.atan(Math.sinh(topMercatorY)) * 180 / Math.PI;
    const south = Math.atan(Math.sinh(bottomMercatorY)) * 180 / Math.PI;
    
    return { north, south, east, west };
  }, [width, height]);

  // Calculate tiles for current view
  const calculateTiles = useCallback((center, zoom) => {
    if (!center || center.length !== 2) return [];
    
    const [lng, lat] = center;
    const z = Math.floor(zoom);
    
    console.log(`📍 Calculating tiles for center: [${lng.toFixed(4)}, ${lat.toFixed(4)}], zoom: ${z}`);
    
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
    const tilesPerCol = Math.ceil((height || 600) / 256) + 4;
    
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
    
    console.log(`🗺️ Generated ${tiles.length} tiles`);
    return tiles;
  }, [apiKey]);

  // Update tiles
  const updateTiles = useCallback((center, zoom) => {
    const newTiles = calculateTiles(center, zoom);
    setTiles(newTiles);
    
    // Update map bounds for shot overlay
    const bounds = calculateMapBounds(center, zoom);
    setMapBounds(bounds);
  }, [calculateTiles, calculateMapBounds]);

  // Map ready handler
  const onMapReady = useCallback(async () => {
    console.log('🗺️ Map ready');
    setMapReady(true);
    
    // Initialize tiles with current basePosition
    if (basePosition.center) {
      console.log('🗺️ Initializing tiles with basePosition:', basePosition.center);
      updateTiles(basePosition.center, basePosition.zoom);
    } else {
      console.log('🗺️ Fallback: Initializing with centerCoordinate:', centerCoordinate);
      setBasePosition({ center: centerCoordinate, zoom: 18 });
      updateTiles(centerCoordinate, 18);
    }
  }, [centerCoordinate, updateTiles, basePosition.center, basePosition.zoom]);
  
  // Load saved calibration on mount
  useEffect(() => {
    const loadCalibration = async () => {
      try {
        const saved = await AsyncStorage.getItem('gps_calibration_offset');
        if (saved) {
          const offset = JSON.parse(saved);
          setCalibrationOffset(offset);
          console.log('🎯 Loaded GPS calibration:', offset);
        }
      } catch (error) {
        console.error('Error loading calibration:', error);
      }
    };
    loadCalibration();
  }, []);
  
  // Save calibration when it changes
  useEffect(() => {
    if (calibrationOffset.lat !== 0 || calibrationOffset.lng !== 0) {
      AsyncStorage.setItem('gps_calibration_offset', JSON.stringify(calibrationOffset))
        .catch(error => console.error('Error saving calibration:', error));
    }
  }, [calibrationOffset]);

  const onUserLocationUpdate = (location) => {
    console.log('📍 User location updated:', location);
    // Validate location data
    if (location && location.coords) {
      const { latitude, longitude, accuracy } = location.coords;
      if (!isNaN(latitude) && !isNaN(longitude)) {
        setUserLocation({
          latitude,
          longitude,
          accuracy
        });
      } else {
        console.error('Invalid location coordinates:', location);
      }
    }
  };

  const flyToLocation = (longitude, latitude, zoom = 18) => {
    if (cameraRef.current) {
      console.log(`✈️ Flying to location: [${longitude}, ${latitude}], zoom: ${zoom}`);
      
      // Temporarily disable onMapZoomChange to prevent interference
      isPanningRef.current = true;
      
      // Update position immediately
      setBasePosition({ center: [longitude, latitude], zoom });
      updateTiles([longitude, latitude], zoom);
      pan.setValue({ x: 0, y: 0 });
      
      // Then animate camera
      cameraRef.current.setCamera({
        centerCoordinate: [longitude, latitude],
        zoomLevel: zoom,
        animationDuration: 1000,
      });
      
      // Re-enable onMapZoomChange after animation
      setTimeout(() => {
        isPanningRef.current = false;
      }, 1500);
    }
  };

  // Helper function to format distance display
  const formatDistanceDisplay = (distance, confidence, type) => {
    if (!distance) return 'No data';
    
    const unit = settings?.measurementSystem === 'metric' ? 'm' : 'y';
    const roundedDistance = Math.round(distance);
    
    let confidenceText = '';
    if (confidence >= 0.8) {
      confidenceText = ''; // High confidence - no indicator needed
    } else if (confidence >= 0.5) {
      confidenceText = ' ~'; // Medium confidence - approximate
    } else {
      confidenceText = ' ?'; // Low confidence - uncertain
    }
    
    return `${roundedDistance}${unit}${confidenceText}`;
  };
  
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
        } else {
          console.log(`🔍 Zoom change ignored - zoom diff: ${zoomDiff.toFixed(3)}, center diff: ${centerDiff.toFixed(3)}`);
        }
      } catch (error) {
        console.error('Error handling zoom change:', error);
      }
    } else {
      console.log(`🔍 onMapZoomChange skipped - mapRef: ${!!mapRef.current}, basePosition.center: ${!!basePosition.center}`);
    }
  }, [basePosition, updateTiles]);

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
      {/* Animated tile container */}
      <Animated.View
        style={[
          styles.tileContainer,
          {
            transform: [
              { translateX: pan.x },
              { translateY: pan.y },
              { scale: scale }
            ]
          }
        ]}
        pointerEvents="none"
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
                width: 256,
                height: 256,
              }
            ]}
            onLoad={() => {}}
            onError={(error) => console.error(`❌ Tile error: ${tile.key}`, error.nativeEvent.error)}
          />
        ))}
      </Animated.View>

      {/* Shot Overlay - animated with pan */}
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          {
            transform: [
              { translateX: pan.x },
              { translateY: pan.y }
            ],
            zIndex: 5,
            opacity: showShots && shots.length > 0 && mapBounds ? 1 : 0
          }
        ]}
        pointerEvents="none"
      >
        {showShots && shots.length > 0 && mapBounds && (
          <ShotOverlay
            shots={shots}
            mapBounds={mapBounds}
            currentHole={currentHole}
            settings={settings}
            onShotPress={(shot) => console.log('Shot pressed:', shot)}
            calibrationOffset={calibrationOffset}
          />
        )}
        
        {/* Moved calibration overlay outside for better visibility */}
      </Animated.View>

      {/* MapLibre GL Map View */}
      <MapLibreGL.MapView
        ref={mapRef}
        style={styles.map}
        styleJSON={JSON.stringify(baseStyle)}
        onDidFinishLoadingMap={onMapReady}
        logoEnabled={false}
        attributionEnabled={false}
        compassEnabled={false}  // Disable compass
        scaleBarEnabled={false} // Disable scale bar
        scrollEnabled={false}   // Disable native scrolling
        zoomEnabled={false}     // Disable zoom gestures
        pitchEnabled={false}    // Disable pitch for now
        rotateEnabled={false}   // Disable rotation for now
        onRegionDidChange={onMapZoomChange}
      >
        <MapLibreGL.Camera
          ref={cameraRef}
          centerCoordinate={centerCoordinate}
          zoomLevel={18}
          minZoomLevel={MAP_CONFIG.minZoom || 5}
          maxZoomLevel={MAP_CONFIG.maxZoom || 20}
        />

        {/* User Location - Hidden in calibration mode to avoid confusion */}
        {hasLocationPermission && !calibrationMode && (
          <MapLibreGL.UserLocation
            visible={true}
            onUpdate={onUserLocationUpdate}
            showsUserHeadingIndicator={true}
          />
        )}
        
        {/* Custom calibrated user location marker - always show if calibrated */}
        {hasLocationPermission && userLocation && (calibrationOffset.lat !== 0 || calibrationOffset.lng !== 0) && !calibrationMode && (
          <MapLibreGL.PointAnnotation
            id="calibrated-user-location"
            coordinate={[
              userLocation.longitude + calibrationOffset.lng,
              userLocation.latitude + calibrationOffset.lat
            ]}
          >
            <View style={styles.calibratedLocationMarker}>
              <View style={styles.calibratedLocationDot} />
              <View style={styles.calibratedLocationRing} />
            </View>
          </MapLibreGL.PointAnnotation>
        )}

        {/* Test Marker at Augusta National - Disabled for now
        <MapLibreGL.PointAnnotation
          id="augusta-center"
          coordinate={[-82.0206, 33.5031]}
          title="Augusta Center"
        >
          <View style={styles.markerContainer}>
            <Text style={styles.markerText}>🏌️</Text>
          </View>
          <MapLibreGL.Callout title="Augusta National Golf Club" />
        </MapLibreGL.PointAnnotation>
        */}

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

      {/* Gesture capture overlay - Always active for panning and calibration */}
      <View
        style={styles.gestureOverlay}
        {...panResponder.panHandlers}
      />
      
      {/* Calibration Mode Overlay - Positioned after gesture overlay */}
      {calibrationMode && userLocation && mapBounds && (
        <>
          {console.log('Rendering calibration crosshairs:', { 
            calibrationMode, 
            hasUserLocation: !!userLocation,
            hasMapBounds: !!mapBounds,
            userLocation,
            mapBounds 
          })}
          {/* Current GPS Position Crosshair (Red) */}
          <View style={[
            styles.calibrationCrosshair,
            {
              left: ((userLocation.longitude - mapBounds.west) / (mapBounds.east - mapBounds.west)) * width - 15,
              top: (1 - (userLocation.latitude - mapBounds.south) / (mapBounds.north - mapBounds.south)) * height - 15,
            }
          ]}>
            <View style={[styles.crosshairLine, styles.crosshairHorizontal, { backgroundColor: '#FF0000' }]} />
            <View style={[styles.crosshairLine, styles.crosshairVertical, { backgroundColor: '#FF0000' }]} />
            <Text style={[styles.crosshairLabel, { color: '#FF0000' }]}>GPS</Text>
          </View>
          
          {/* Calibrated Position Crosshair (Green) - if offset exists */}
          {(calibrationOffset.lat !== 0 || calibrationOffset.lng !== 0) && (
            <View style={[
              styles.calibrationCrosshair,
              {
                left: ((userLocation.longitude + calibrationOffset.lng - mapBounds.west) / (mapBounds.east - mapBounds.west)) * width - 15,
                top: (1 - (userLocation.latitude + calibrationOffset.lat - mapBounds.south) / (mapBounds.north - mapBounds.south)) * height - 15,
              }
            ]}>
              <View style={[styles.crosshairLine, styles.crosshairHorizontal, { backgroundColor: '#00FF00' }]} />
              <View style={[styles.crosshairLine, styles.crosshairVertical, { backgroundColor: '#00FF00' }]} />
              <Text style={[styles.crosshairLabel, { color: '#00FF00' }]}>Actual</Text>
            </View>
          )}
        </>
      )}

      {/* Hole Navigation Bar */}
      <View style={styles.holeNavigation} pointerEvents="box-none">
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
      <View style={styles.distanceBar} pointerEvents="box-none">
        <View style={styles.distanceItem}>
          <Text style={styles.distanceLabel}>Pin</Text>
          <Text style={[
            styles.distanceValue,
            currentDistances?.pin ? styles.distanceValueActive : null
          ]}>
            {currentDistances?.pin 
              ? formatDistanceDisplay(currentDistances.pin.distance, currentDistances.pin.confidence, currentDistances.pin.type)
              : 'Learning...'
            }
          </Text>
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

      {/* GPS Info */}
      <TouchableOpacity 
        style={[styles.gpsInfo, calibrationMode && styles.gpsInfoCalibrationMode]}
        activeOpacity={0.8}
        onLongPress={() => {
          console.log('GPS card long pressed!');
          // Toggle calibration mode on long press
          setCalibrationMode(!calibrationMode);
          if (!calibrationMode) {
            Alert.alert(
              'GPS Calibration Mode',
              'Tap on your actual location on the map to calibrate GPS offset.\n\nThe red crosshair shows your GPS position.\nTap where you actually are to set the offset.',
              [{ text: 'OK' }]
            );
          }
        }}
      >
        <View style={styles.gpsHeader}>
          <Text style={styles.gpsTitle}>📍 GPS</Text>
          <View style={[styles.gpsStatusDot, { backgroundColor: userLocation ? '#4CAF50' : '#f44336' }]} />
        </View>
        {userLocation ? (
          <>
            <Text style={styles.gpsText}>Accuracy: {userLocation.accuracy ? `±${Math.round(userLocation.accuracy)}m` : 'Unknown'}</Text>
            <Text style={styles.gpsCoords}>
              {userLocation.latitude ? userLocation.latitude.toFixed(6) : '--'}, {userLocation.longitude ? userLocation.longitude.toFixed(6) : '--'}
            </Text>
            {calibrationMode && (
              <Text style={styles.calibrationText}>Calibration: {calibrationOffset.lat.toFixed(6)}, {calibrationOffset.lng.toFixed(6)}</Text>
            )}
          </>
        ) : (
          <Text style={styles.gpsText}>Acquiring...</Text>
        )}
      </TouchableOpacity>
      
      {/* User location button */}
      {hasLocationPermission && userLocation && userLocation.latitude && userLocation.longitude ? (
        <TouchableOpacity
          style={styles.locationButton}
          onPress={() => {
            console.log('Location button pressed!');
            if (userLocation) {
              // Fly to calibrated location if offset exists, otherwise raw GPS
              const lng = userLocation.longitude + calibrationOffset.lng;
              const lat = userLocation.latitude + calibrationOffset.lat;
              flyToLocation(lng, lat, 18);
            }
          }}
        >
          <Text style={styles.locationButtonText}>{calibrationMode ? '🎯' : '📍'}</Text>
        </TouchableOpacity>
      ) : (
        <View style={[styles.locationButton, { backgroundColor: 'red' }]}>
          <Text style={styles.locationButtonText}>?</Text>
        </View>
      )}

      {/* Shot visibility toggle */}
      {shots.length > 0 && (
        <TouchableOpacity
          style={styles.shotToggleButton}
          onPress={() => {
            console.log(`Shot toggle pressed, changing from ${showShots} to ${!showShots}`);
            setShowShots(!showShots);
          }}
        >
          <Text style={styles.shotToggleButtonText}>{showShots ? '🎯' : '⚪'}</Text>
        </TouchableOpacity>
      )}


      {/* Zoom Controls - disabled for now */}
      <View style={styles.zoomControls}>
        <TouchableOpacity
          style={[styles.zoomButton, styles.zoomButtonDisabled]}
          disabled={true}
          onPress={() => {
            const newZoom = Math.min(20, basePosition.zoom + 1);
            setBasePosition({ ...basePosition, zoom: newZoom });
            updateTiles(basePosition.center, newZoom);
            if (cameraRef.current) {
              cameraRef.current.setCamera({
                centerCoordinate: basePosition.center,
                zoomLevel: newZoom,
                animationDuration: 300,
              });
            }
          }}
        >
          <Text style={[styles.zoomButtonText, styles.zoomButtonTextDisabled]}>+</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.zoomButton, styles.zoomButtonDisabled]}
          disabled={true}
          onPress={() => {
            const newZoom = Math.max(10, basePosition.zoom - 1);
            setBasePosition({ ...basePosition, zoom: newZoom });
            updateTiles(basePosition.center, newZoom);
            if (cameraRef.current) {
              cameraRef.current.setCamera({
                centerCoordinate: basePosition.center,
                zoomLevel: newZoom,
                animationDuration: 300,
              });
            }
          }}
        >
          <Text style={[styles.zoomButtonText, styles.zoomButtonTextDisabled]}>-</Text>
        </TouchableOpacity>
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
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 3,
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
    position: 'absolute',
    bottom: 50,
    left: 10,
    right: 10,
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 3,
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
  distanceValueActive: {
    color: '#4CAF50',
  },
  attribution: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 3,
  },
  attributionText: {
    fontSize: 10,
    color: '#666',
  },
  gpsInfo: {
    position: 'absolute',
    top: 90,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 10,
    borderRadius: 8,
    zIndex: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    minWidth: 120,
  },
  gpsInfoCalibrationMode: {
    backgroundColor: 'rgba(255, 87, 34, 0.95)',
    borderWidth: 2,
    borderColor: '#D84315',
  },
  gpsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  gpsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  gpsStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  gpsText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  gpsCoords: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
    fontFamily: 'monospace',
  },
  calibrationText: {
    fontSize: 9,
    color: '#FF6B6B',
    marginTop: 2,
    fontWeight: 'bold',
  },
  calibrationCrosshair: {
    position: 'absolute',
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    elevation: 100,
  },
  crosshairLine: {
    position: 'absolute',
  },
  crosshairHorizontal: {
    width: 30,
    height: 3,  // Thicker line
    top: 13.5,
  },
  crosshairVertical: {
    width: 3,   // Thicker line
    height: 30,
    left: 13.5,
  },
  crosshairLabel: {
    position: 'absolute',
    top: -20,
    fontSize: 12,
    fontWeight: 'bold',
    backgroundColor: 'white',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  calibratedLocationMarker: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calibratedLocationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    position: 'absolute',
  },
  calibratedLocationRing: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#4CAF50',
    position: 'absolute',
  },
  locationButton: {
    position: 'absolute',
    bottom: 110,
    right: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2196F3',  // Changed to blue for better visibility
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 10,  // Increased elevation
    zIndex: 999,    // Increased z-index
  },
  locationButtonText: {
    fontSize: 24,
    color: 'white',  // Make sure text is visible on blue background
  },
  shotToggleButton: {
    position: 'absolute',
    bottom: 110,
    right: 60,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FF5722',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 10,
    zIndex: 999,
  },
  shotToggleButtonText: {
    fontSize: 20,
  },
  zoomControls: {
    position: 'absolute',
    bottom: 170,
    right: 10,
    backgroundColor: 'transparent',
    zIndex: 3,
  },
  zoomButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    marginBottom: 10,
  },
  zoomButtonDisabled: {
    backgroundColor: '#f0f0f0',
    opacity: 0.5,
  },
  zoomButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  zoomButtonTextDisabled: {
    color: '#ccc',
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