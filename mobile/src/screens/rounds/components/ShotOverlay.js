import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Svg, { Line, Circle, Text as SvgText, G, Path } from 'react-native-svg';
import { calculateDistance, formatDistance } from '../../../utils/gpsCalculations';

const { width, height } = Dimensions.get('window');

const ShotOverlay = ({ 
  shots, 
  mapBounds, 
  currentHole,
  settings,
  onShotPress,
  calibrationOffset = { lat: 0, lng: 0 }
}) => {
  // Filter shots for current hole
  const holeShots = useMemo(() => {
    if (!shots || !currentHole) return [];
    const filtered = shots.filter(shot => shot.holeNumber === currentHole);
    console.log(`ShotOverlay: ${filtered.length} shots for hole ${currentHole}`);
    return filtered;
  }, [shots, currentHole]);

  // Convert GPS coordinates to screen coordinates
  const coordsToScreen = (latitude, longitude) => {
    if (!mapBounds) return { x: 0, y: 0 };
    
    const { north, south, east, west } = mapBounds;
    
    // Apply calibration offset
    const calibratedLat = latitude + calibrationOffset.lat;
    const calibratedLng = longitude + calibrationOffset.lng;
    
    // Calculate relative position (0-1)
    const relX = (calibratedLng - west) / (east - west);
    const relY = 1 - (calibratedLat - south) / (north - south); // Invert Y axis
    
    // Convert to screen coordinates
    const screenX = relX * width;
    const screenY = relY * height;
    
    return {
      x: screenX,
      y: screenY
    };
  };

  // Generate shot path
  const shotPath = useMemo(() => {
    if (holeShots.length < 2) return null;
    
    const pathData = holeShots.reduce((path, shot, index) => {
      const { x, y } = coordsToScreen(
        shot.coordinates.latitude,
        shot.coordinates.longitude
      );
      
      if (index === 0) {
        return `M ${x} ${y}`;
      }
      return `${path} L ${x} ${y}`;
    }, '');
    
    return pathData;
  }, [holeShots, mapBounds]);

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
    return null;
  }

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <Svg width={width} height={height} style={StyleSheet.absoluteFillObject}>
        {/* Draw shot path */}
        {shotPath && (
          <Path
            d={shotPath}
            stroke="#333"
            strokeWidth="2"
            strokeDasharray="5,5"
            fill="none"
          />
        )}
        
        {/* Draw shot lines with distances */}
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
            <G key={shot.id}>
              {/* Shot line */}
              <Line
                x1={start.x}
                y1={start.y}
                x2={end.x}
                y2={end.y}
                stroke={getClubColor(shot.clubId)}
                strokeWidth="3"
              />
              
              {/* Distance label */}
              {distance > 5 && (
                <>
                  <Circle
                    cx={midX}
                    cy={midY}
                    r="20"
                    fill="white"
                    stroke="#333"
                    strokeWidth="1"
                  />
                  <SvgText
                    x={midX}
                    y={midY + 5}
                    fontSize="12"
                    fontWeight="bold"
                    textAnchor="middle"
                    fill="#333"
                  >
                    {formatDistance(distance, settings?.measurementSystem === 'metric' ? 'meters' : 'yards')}
                  </SvgText>
                </>
              )}
            </G>
          );
        })}
        
        {/* Draw shot markers */}
        {holeShots.map((shot, index) => {
          const { x, y } = coordsToScreen(
            shot.coordinates.latitude,
            shot.coordinates.longitude
          );
          
          const isFirstShot = index === 0;
          const isLastShot = index === holeShots.length - 1;
          
          return (
            <G key={`marker-${shot.id}`}>
              {/* Shot marker circle */}
              <Circle
                cx={x}
                cy={y}
                r={isFirstShot || isLastShot ? "12" : "10"}
                fill={isFirstShot ? '#4CAF50' : isLastShot ? '#F44336' : getClubColor(shot.clubId)}
                stroke="white"
                strokeWidth="2"
              />
              
              {/* Shot number */}
              <SvgText
                x={x}
                y={y + 4}
                fontSize="12"
                fontWeight="bold"
                textAnchor="middle"
                fill="white"
              >
                {shot.shotNumber}
              </SvgText>
              
              {/* Special labels */}
              {isFirstShot && (
                <SvgText
                  x={x}
                  y={y - 20}
                  fontSize="10"
                  fontWeight="bold"
                  textAnchor="middle"
                  fill="#4CAF50"
                >
                  TEE
                </SvgText>
              )}
              
              {isLastShot && (
                <SvgText
                  x={x}
                  y={y + 25}
                  fontSize="10"
                  fontWeight="bold"
                  textAnchor="middle"
                  fill="#F44336"
                >
                  FINAL
                </SvgText>
              )}
            </G>
          );
        })}
      </Svg>
      
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

export default React.memo(ShotOverlay, (prevProps, nextProps) => {
  // Only re-render if these props actually change
  return (
    prevProps.shots === nextProps.shots &&
    prevProps.mapBounds === nextProps.mapBounds &&
    prevProps.currentHole === nextProps.currentHole &&
    prevProps.settings === nextProps.settings
  );
});