import React, { useState, useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';
import MapLibreGL from '@maplibre/maplibre-react-native';

const { width, height } = Dimensions.get('window');

// Component that overlays satellite tiles as Images on top of MapLibre
const SatelliteMapOverlay = ({ centerCoordinate = [-82.0206, 33.5031], initialZoom = 16 }) => {
  const [currentZoom, setCurrentZoom] = useState(initialZoom);
  const [currentCenter, setCurrentCenter] = useState(centerCoordinate);
  const [mapDimensions, setMapDimensions] = useState({ width, height: 300 });
  const [tiles, setTiles] = useState([]);
  const mapRef = useRef(null);
  const apiKey = '9VwMyrJdecjrEB6fwLGJ';

  // Calculate which tiles we need for current view
  const calculateVisibleTiles = (center, zoom, dimensions) => {
    if (!center || center.length !== 2) {
      console.error('Invalid center:', center);
      return [];
    }
    
    const [lng, lat] = center;
    
    // Validate coordinates
    if (isNaN(lng) || isNaN(lat) || isNaN(zoom)) {
      console.error('Invalid coordinates for tile calculation:', { lng, lat, zoom });
      return [];
    }
    
    const z = Math.floor(zoom);
    
    // Calculate tile at center
    const centerTileX = Math.floor((lng + 180) / 360 * Math.pow(2, z));
    const centerTileY = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, z));
    
    // Validate tile coordinates
    if (isNaN(centerTileX) || isNaN(centerTileY)) {
      console.error('Invalid tile coordinates:', { centerTileX, centerTileY });
      return [];
    }
    
    // Calculate how many tiles we need to cover the viewport
    const tilesPerViewportWidth = Math.ceil(dimensions.width / 256) + 1;
    const tilesPerViewportHeight = Math.ceil(dimensions.height / 256) + 1;
    
    const tiles = [];
    const halfWidth = Math.floor(tilesPerViewportWidth / 2);
    const halfHeight = Math.floor(tilesPerViewportHeight / 2);
    
    for (let dx = -halfWidth; dx <= halfWidth; dx++) {
      for (let dy = -halfHeight; dy <= halfHeight; dy++) {
        const x = centerTileX + dx;
        const y = centerTileY + dy;
        
        // Skip invalid tiles
        if (x < 0 || y < 0) continue;
        
        // Calculate pixel position for this tile
        const tilePixelX = (dx + halfWidth) * 256;
        const tilePixelY = (dy + halfHeight) * 256;
        
        tiles.push({
          x, y, z,
          pixelX: tilePixelX,
          pixelY: tilePixelY,
          url: `https://api.maptiler.com/tiles/satellite-v2/${z}/${x}/${y}.jpg?key=${apiKey}`
        });
      }
    }
    
    return tiles;
  };

  // Update tiles when map changes
  const onRegionDidChange = async () => {
    if (mapRef.current) {
      try {
        const zoom = await mapRef.current.getZoom();
        const center = await mapRef.current.getCenter();
        
        // Handle different center formats from MapLibre
        let lng, lat;
        if (Array.isArray(center)) {
          [lng, lat] = center;
        } else if (center && typeof center === 'object') {
          lng = center.longitude || center.lng || center[0];
          lat = center.latitude || center.lat || center[1];
        } else {
          console.error('Unexpected center format:', center);
          return;
        }
        
        // Validate coordinates
        if (isNaN(lng) || isNaN(lat)) {
          console.error('Invalid coordinates:', { lng, lat });
          return;
        }
        
        setCurrentZoom(zoom);
        setCurrentCenter([lng, lat]);
        
        const newTiles = calculateVisibleTiles([lng, lat], zoom, mapDimensions);
        setTiles(newTiles);
        
        console.log(`🗺️ Map moved - Zoom: ${Math.floor(zoom)}, Center: [${lng.toFixed(4)}, ${lat.toFixed(4)}], Tiles: ${newTiles.length}`);
      } catch (error) {
        console.error('Error updating map state:', error);
      }
    }
  };

  const onMapReady = () => {
    console.log('🗺️ SatelliteMapOverlay: Map ready');
    onRegionDidChange();
  };

  // Simple base style
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

  return (
    <View style={styles.container}>
      {/* Satellite tile images rendered as overlay */}
      <View style={styles.tileContainer} pointerEvents="none">
        {tiles.map((tile) => (
          <Image
            key={`${tile.z}-${tile.x}-${tile.y}`}
            source={{ uri: tile.url }}
            style={[
              styles.tile,
              {
                left: tile.pixelX,
                top: tile.pixelY,
              }
            ]}
            resizeMode="cover"
          />
        ))}
      </View>

      {/* MapLibre for controls and interaction */}
      <MapLibreGL.MapView
        ref={mapRef}
        style={styles.map}
        styleJSON={JSON.stringify(baseStyle)}
        onDidFinishLoadingMap={onMapReady}
        onRegionDidChange={onRegionDidChange}
        logoEnabled={false}
        attributionEnabled={false}
      >
        <MapLibreGL.Camera
          centerCoordinate={centerCoordinate}
          zoomLevel={initialZoom}
        />
      </MapLibreGL.MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
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
});

export default SatelliteMapOverlay;