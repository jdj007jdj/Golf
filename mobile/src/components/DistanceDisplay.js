/**
 * DistanceDisplay Component
 * 
 * Shows real-time distance to pin and other course features
 * Uses learned course data with confidence indicators
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { formatDistance } from '../utils/gpsCalculations';
import shotTrackingService from '../services/shotTrackingService';

const { width } = Dimensions.get('window');

const DistanceDisplay = ({
  currentHole,
  isVisible = true,
  settings,
  onDistancePress,
  refreshInterval = 5000 // 5 seconds
}) => {
  const [distances, setDistances] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [error, setError] = useState(null);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const updateInterval = useRef(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    
    if (isVisible && currentHole) {
      startDistanceTracking();
    } else {
      stopDistanceTracking();
    }

    return () => {
      isMounted.current = false;
      stopDistanceTracking();
    };
  }, [isVisible, currentHole, refreshInterval]);

  const startDistanceTracking = () => {
    console.log('📏 Starting distance tracking for hole', currentHole);
    
    // Initial load
    updateDistances();
    
    // Set up interval for updates
    updateInterval.current = setInterval(updateDistances, refreshInterval);
    
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const stopDistanceTracking = () => {
    console.log('📏 Stopping distance tracking');
    
    if (updateInterval.current) {
      clearInterval(updateInterval.current);
      updateInterval.current = null;
    }
    
    // Fade out animation
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const updateDistances = async () => {
    if (!isMounted.current || isLoading) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const currentDistances = await shotTrackingService.getCurrentDistances(currentHole);
      
      if (isMounted.current && currentDistances) {
        setDistances(currentDistances);
        setLastUpdate(new Date());
        console.log('📏 Distance updated:', currentDistances.pin?.distance || 'No pin data');
      }
    } catch (err) {
      console.error('📏 Error updating distances:', err);
      if (isMounted.current) {
        setError(err.message);
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  };

  const getDistanceText = () => {
    if (!distances) return 'Getting location...';
    
    const unit = settings?.measurementSystem === 'metric' ? 'meters' : 'yards';
    
    // Pin distance with confidence
    if (distances.pin) {
      const distance = Math.round(distances.pin.distance);
      const confidenceText = getConfidenceText(distances.pin.confidence);
      
      return {
        main: `${distance}${unit === 'meters' ? 'm' : 'y'}`,
        sub: `to pin ${confidenceText}`,
        confidence: distances.pin.confidence,
        type: distances.pin.type
      };
    }
    
    // Green center fallback
    if (distances.green && distances.green.confidence > 0.1) {
      return {
        main: 'No pin data',
        sub: 'Learning course layout',
        confidence: distances.green.confidence,
        type: 'learning'
      };
    }
    
    // No data available
    return {
      main: 'No course data',
      sub: 'Play more rounds to learn',
      confidence: 0,
      type: 'no_data'
    };
  };

  const getConfidenceText = (confidence) => {
    if (confidence >= 0.8) return '(high confidence)';
    if (confidence >= 0.5) return '(medium confidence)';
    if (confidence >= 0.3) return '(low confidence)';
    return '(learning)';
  };

  const getDistanceColor = () => {
    if (!distances || !distances.pin) return '#666';
    
    const distance = distances.pin.distance;
    
    // Color coding based on distance
    if (distance <= 50) return '#4CAF50'; // Green - short
    if (distance <= 100) return '#FF9800'; // Orange - medium
    if (distance <= 150) return '#F44336'; // Red - long
    return '#9C27B0'; // Purple - very long
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return '#4CAF50';
    if (confidence >= 0.5) return '#FF9800';
    if (confidence >= 0.3) return '#F44336';
    return '#9E9E9E';
  };

  const handlePress = () => {
    if (onDistancePress) {
      onDistancePress(distances);
    }
  };

  const distanceInfo = getDistanceText();

  if (!isVisible) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [
            {
              scale: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1],
              }),
            },
          ],
        },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.distanceCard,
          {
            borderLeftColor: getDistanceColor(),
            backgroundColor: error ? '#FFEBEE' : '#FFFFFF',
          },
        ]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>GPS Error</Text>
            <Text style={styles.errorSubText}>Tap to retry</Text>
          </View>
        ) : (
          <View style={styles.distanceContainer}>
            <Text style={[styles.distanceText, { color: getDistanceColor() }]}>
              {distanceInfo.main}
            </Text>
            <Text style={[styles.distanceSubText, { color: getConfidenceColor(distanceInfo.confidence) }]}>
              {distanceInfo.sub}
            </Text>
            
            {/* Confidence indicator */}
            <View style={styles.confidenceContainer}>
              <View style={styles.confidenceBar}>
                <View
                  style={[
                    styles.confidenceFill,
                    {
                      width: `${(distanceInfo.confidence * 100).toFixed(0)}%`,
                      backgroundColor: getConfidenceColor(distanceInfo.confidence),
                    },
                  ]}
                />
              </View>
              <Text style={styles.confidenceText}>
                {(distanceInfo.confidence * 100).toFixed(0)}%
              </Text>
            </View>
          </View>
        )}
        
        {/* Loading indicator */}
        {isLoading && (
          <View style={styles.loadingIndicator}>
            <View style={styles.loadingDot} />
          </View>
        )}
      </TouchableOpacity>
      
      {/* GPS accuracy indicator */}
      {distances && distances.accuracy && (
        <View style={styles.accuracyContainer}>
          <Text style={styles.accuracyText}>
            GPS: ±{Math.round(distances.accuracy)}m
          </Text>
        </View>
      )}
      
      {/* Last update time */}
      {lastUpdate && (
        <Text style={styles.updateText}>
          Updated: {lastUpdate.toLocaleTimeString()}
        </Text>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  distanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderLeftWidth: 4,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    minHeight: 80,
    justifyContent: 'center',
  },
  distanceContainer: {
    alignItems: 'center',
  },
  distanceText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  distanceSubText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginTop: 4,
  },
  confidenceBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginRight: 8,
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 2,
  },
  confidenceText: {
    fontSize: 12,
    color: '#666',
    minWidth: 30,
  },
  errorContainer: {
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F44336',
    marginBottom: 4,
  },
  errorSubText: {
    fontSize: 12,
    color: '#666',
  },
  loadingIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    opacity: 0.6,
  },
  accuracyContainer: {
    marginTop: 4,
    alignItems: 'center',
  },
  accuracyText: {
    fontSize: 10,
    color: '#999',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  updateText: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
    marginTop: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'center',
  },
});

export default DistanceDisplay;