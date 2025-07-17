import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { calculateDistance, formatDistance } from '../../../utils/gpsCalculations';

const { width, height } = Dimensions.get('window');

const SimpleShotOverlay = ({ 
  shots, 
  mapBounds, 
  currentHole,
  settings,
  onShotPress 
}) => {
  // Filter shots for current hole
  const holeShots = useMemo(() => {
    if (!shots || !currentHole) return [];
    const filtered = shots.filter(shot => shot.holeNumber === currentHole);
    console.log(`SimpleShotOverlay: ${filtered.length} shots for hole ${currentHole}`);
    return filtered;
  }, [shots, currentHole]);

  // Convert GPS coordinates to screen coordinates
  const coordsToScreen = (latitude, longitude) => {
    if (!mapBounds) return { x: 0, y: 0 };
    
    const { north, south, east, west } = mapBounds;
    
    // Calculate relative position (0-1)
    const relX = (longitude - west) / (east - west);
    const relY = 1 - (latitude - south) / (north - south); // Invert Y axis
    
    // Convert to screen coordinates
    return {
      x: relX * width,
      y: relY * height
    };
  };

  // Calculate club colors
  const getClubColor = (clubId) => {
    const clubColors = {
      driver: '#FF6B6B',
      '3wood': '#FF8787',
      '5wood': '#FFA0A0',
      hybrid: '#4ECDC4',
      '3iron': '#45B7D1',
      '4iron': '#5DADE2',
      '5iron': '#7FB3D5',
      '6iron': '#96CDF2',
      '7iron': '#A3D5FF',
      '8iron': '#B8E0FF',
      '9iron': '#CEE9FF',
      pwedge: '#95E1D3',
      awedge: '#81C784',
      swedge: '#66BB6A',
      lwedge: '#4CAF50',
      putter: '#9575CD'
    };
    
    return clubColors[clubId] || '#757575';
  };

  if (!mapBounds || holeShots.length === 0) {
    console.log(`SimpleShotOverlay not rendering: mapBounds=${!!mapBounds}, shots=${holeShots.length}`);
    return null;
  }
  
  console.log(`SimpleShotOverlay rendering with ${holeShots.length} shots, mapBounds:`, mapBounds);

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {/* Draw shot markers */}
      {holeShots.map((shot, index) => {
        const { x, y } = coordsToScreen(
          shot.coordinates.latitude,
          shot.coordinates.longitude
        );
        
        const isFirstShot = index === 0;
        const isLastShot = index === holeShots.length - 1;
        
        return (
          <View
            key={`marker-${shot.id}`}
            style={[
              styles.shotMarker,
              {
                left: x - 15,
                top: y - 15,
                backgroundColor: isFirstShot ? '#4CAF50' : isLastShot ? '#F44336' : getClubColor(shot.clubId),
              }
            ]}
          >
            <Text style={styles.shotNumber}>{shot.shotNumber}</Text>
            {isFirstShot && (
              <Text style={[styles.shotLabel, { top: -20 }]}>TEE</Text>
            )}
            {isLastShot && (
              <Text style={[styles.shotLabel, { bottom: -20 }]}>FINAL</Text>
            )}
          </View>
        );
      })}
      
      {/* Draw distance labels */}
      {holeShots.map((shot, index) => {
        if (index === 0) return null;
        
        const prevShot = holeShots[index - 1];
        const start = coordsToScreen(
          prevShot.coordinates.latitude,
          prevShot.coordinates.longitude
        );
        const end = coordsToScreen(
          shot.coordinates.latitude,
          shot.coordinates.longitude
        );
        
        const distance = calculateDistance(
          prevShot.coordinates.latitude,
          prevShot.coordinates.longitude,
          shot.coordinates.latitude,
          shot.coordinates.longitude,
          settings?.measurementSystem === 'metric' ? 'meters' : 'yards'
        );
        
        // Calculate midpoint for distance label
        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2;
        
        return (
          <View
            key={`distance-${shot.id}`}
            style={[
              styles.distanceLabel,
              {
                left: midX - 30,
                top: midY - 15,
              }
            ]}
          >
            <Text style={styles.distanceText}>
              {formatDistance(distance, settings?.measurementSystem === 'metric' ? 'meters' : 'yards')}
            </Text>
          </View>
        );
      })}
      
      {/* Shot summary */}
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryText}>
          Hole {currentHole}: {holeShots.length} shots
        </Text>
        {holeShots.length > 1 && (
          <Text style={styles.summaryText}>
            Total: {formatDistance(
              holeShots.reduce((total, shot, index) => {
                if (index === 0) return 0;
                const prevShot = holeShots[index - 1];
                return total + calculateDistance(
                  prevShot.coordinates.latitude,
                  prevShot.coordinates.longitude,
                  shot.coordinates.latitude,
                  shot.coordinates.longitude,
                  settings?.measurementSystem === 'metric' ? 'meters' : 'yards'
                );
              }, 0),
              settings?.measurementSystem === 'metric' ? 'meters' : 'yards'
            )}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  shotMarker: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  shotNumber: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  shotLabel: {
    position: 'absolute',
    fontSize: 10,
    fontWeight: 'bold',
    color: '#333',
  },
  distanceLabel: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  summaryContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  summaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
});

export default SimpleShotOverlay;