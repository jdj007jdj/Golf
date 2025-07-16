import React, { useState, useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';
import MapLibreGL from '@maplibre/maplibre-react-native';

const { width, height } = Dimensions.get('window');

// Simple satellite tile overlay component
const SatelliteTileOverlay = ({ zoom, bounds }) => {
  const [tiles, setTiles] = useState([]);
  const apiKey = '9VwMyrJdecjrEB6fwLGJ';

  useEffect(() => {
    // Calculate which tiles we need based on the current bounds and zoom
    const tilesToLoad = calculateTilesInBounds(bounds, zoom);
    setTiles(tilesToLoad);
  }, [zoom, bounds]);

  const calculateTilesInBounds = (bounds, z) => {
    if (!bounds || !z) return [];
    
    const [west, south, east, north] = bounds;
    
    // Convert bounds to tile coordinates
    const minTileX = Math.floor((west + 180) / 360 * Math.pow(2, z));
    const maxTileX = Math.floor((east + 180) / 360 * Math.pow(2, z));
    const minTileY = Math.floor((1 - Math.log(Math.tan(north * Math.PI / 180) + 1 / Math.cos(north * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, z));
    const maxTileY = Math.floor((1 - Math.log(Math.tan(south * Math.PI / 180) + 1 / Math.cos(south * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, z));
    
    const tilesToLoad = [];
    for (let x = minTileX; x <= maxTileX; x++) {
      for (let y = minTileY; y <= maxTileY; y++) {
        tilesToLoad.push({ x, y, z });
      }
    }
    
    return tilesToLoad;
  };

  const getTileBounds = (x, y, z) => {
    const n = Math.pow(2, z);
    const west = x / n * 360 - 180;
    const east = (x + 1) / n * 360 - 180;
    const north = Math.atan(Math.sinh(Math.PI * (1 - 2 * y / n))) * 180 / Math.PI;
    const south = Math.atan(Math.sinh(Math.PI * (1 - 2 * (y + 1) / n))) * 180 / Math.PI;
    return [[west, south], [east, north]];
  };

  return (
    <>
      {tiles.map(tile => {
        const tileUrl = `https://api.maptiler.com/tiles/satellite-v2/${tile.z}/${tile.x}/${tile.y}.jpg?key=${apiKey}`;
        const tileBounds = getTileBounds(tile.x, tile.y, tile.z);
        
        return (
          <MapLibreGL.ImageSource
            key={`${tile.z}-${tile.x}-${tile.y}`}
            id={`tile-${tile.z}-${tile.x}-${tile.y}`}
            url={tileUrl}
            coordinates={[
              [tileBounds[0][0], tileBounds[1][1]], // top-left
              [tileBounds[1][0], tileBounds[1][1]], // top-right
              [tileBounds[1][0], tileBounds[0][1]], // bottom-right
              [tileBounds[0][0], tileBounds[0][1]], // bottom-left
            ]}
          >
            <MapLibreGL.RasterLayer
              id={`tile-layer-${tile.z}-${tile.x}-${tile.y}`}
              style={{ rasterOpacity: 1 }}
            />
          </MapLibreGL.ImageSource>
        );
      })}
    </>
  );
};

const SatelliteMapView = ({ centerCoordinate = [-82.0206, 33.5031], initialZoom = 16 }) => {
  const [currentZoom, setCurrentZoom] = useState(initialZoom);
  const [currentBounds, setCurrentBounds] = useState(null);
  const mapRef = useRef(null);
  const cameraRef = useRef(null);

  const onRegionDidChange = async () => {
    if (mapRef.current) {
      try {
        const zoom = await mapRef.current.getZoom();
        const bounds = await mapRef.current.getVisibleBounds();
        setCurrentZoom(Math.floor(zoom));
        setCurrentBounds(bounds);
        console.log('🗺️ Region changed - Zoom:', Math.floor(zoom));
      } catch (error) {
        console.error('Error getting map state:', error);
      }
    }
  };

  // Basic style with just a background
  const baseStyle = {
    version: 8,
    sources: {},
    layers: [
      {
        id: 'background',
        type: 'background',
        paint: {
          'background-color': '#000000'
        }
      }
    ]
  };

  return (
    <View style={styles.container}>
      <MapLibreGL.MapView
        ref={mapRef}
        style={styles.map}
        styleJSON={JSON.stringify(baseStyle)}
        onRegionDidChange={onRegionDidChange}
        logoEnabled={false}
        attributionEnabled={false}
      >
        <MapLibreGL.Camera
          ref={cameraRef}
          centerCoordinate={centerCoordinate}
          zoomLevel={initialZoom}
        />
        
        {/* Render satellite tiles as image overlays */}
        {currentBounds && (
          <SatelliteTileOverlay 
            zoom={currentZoom} 
            bounds={currentBounds}
          />
        )}
      </MapLibreGL.MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});

export default SatelliteMapView;