import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const SmoothTileOverlay = ({ 
  mapRef, 
  mapReady, 
  apiKey,
  onRegionIsChanging,
  onRegionDidChange 
}) => {
  const [tiles, setTiles] = useState([]);
  const [baseCenter, setBaseCenter] = useState(null);
  const [baseZoom, setBaseZoom] = useState(16);
  
  // Animated values for smooth movement
  const panX = useRef(new Animated.Value(0)).current;
  const panY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  
  // Tracking refs
  const isAnimating = useRef(false);
  const lastUpdateTime = useRef(0);
  
  // Convert lng/lat to Web Mercator pixel coordinates at zoom level
  const lngLatToPixel = useCallback((lng, lat, zoom) => {
    const tileSize = 256;
    const scale = Math.pow(2, zoom);
    
    const x = ((lng + 180) / 360) * scale * tileSize;
    const latRad = lat * Math.PI / 180;
    const y = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * scale * tileSize;
    
    return { x, y };
  }, []);

  // Calculate tiles needed for viewport
  const calculateTiles = useCallback((center, zoom, viewWidth, viewHeight) => {
    if (!center || center.length !== 2) return [];
    
    const [lng, lat] = center;
    const z = Math.floor(zoom);
    const scale = Math.pow(2, z);
    
    // Get center tile
    const centerTileX = Math.floor((lng + 180) / 360 * scale);
    const centerTileY = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * scale);
    
    // Calculate viewport in tiles (with buffer for smooth panning)
    const tilesX = Math.ceil(viewWidth / 256) + 4;
    const tilesY = Math.ceil(viewHeight / 256) + 4;
    
    const tiles = [];
    const halfX = Math.ceil(tilesX / 2);
    const halfY = Math.ceil(tilesY / 2);
    
    // Get pixel position of center
    const centerPixel = lngLatToPixel(lng, lat, z);
    
    for (let dx = -halfX; dx <= halfX; dx++) {
      for (let dy = -halfY; dy <= halfY; dy++) {
        const tileX = centerTileX + dx;
        const tileY = centerTileY + dy;
        
        // Skip invalid tiles
        if (tileX < 0 || tileY < 0 || tileX >= scale || tileY >= scale) continue;
        
        // Calculate tile position relative to center
        const tilePixelX = tileX * 256;
        const tilePixelY = tileY * 256;
        
        // Position relative to viewport center
        const relativeX = tilePixelX - centerPixel.x + viewWidth / 2;
        const relativeY = tilePixelY - centerPixel.y + viewHeight / 2;
        
        tiles.push({
          key: `${z}-${tileX}-${tileY}`,
          url: `https://api.maptiler.com/tiles/satellite-v2/${z}/${tileX}/${tileY}.jpg?key=${apiKey}`,
          x: relativeX,
          y: relativeY,
          z,
          tileX,
          tileY
        });
      }
    }
    
    return tiles;
  }, [lngLatToPixel, apiKey]);

  // Initialize tiles when map is ready
  useEffect(() => {
    if (!mapRef || !mapReady) return;
    
    const initializeTiles = async () => {
      try {
        const center = await mapRef.getCenter();
        const zoom = await mapRef.getZoom();
        
        let lng, lat;
        if (Array.isArray(center)) {
          [lng, lat] = center;
        } else {
          lng = center?.longitude || center?.lng;
          lat = center?.latitude || center?.lat;
        }
        
        if (!lng || !lat) return;
        
        setBaseCenter([lng, lat]);
        setBaseZoom(zoom);
        
        const initialTiles = calculateTiles([lng, lat], zoom, screenWidth, 400);
        setTiles(initialTiles);
      } catch (error) {
        console.error('Error initializing tiles:', error);
      }
    };
    
    initializeTiles();
  }, [mapRef, mapReady, calculateTiles]);

  // Handle real-time map movement
  const handleRegionIsChanging = useCallback(async () => {
    if (!mapRef || !baseCenter || isAnimating.current) return;
    
    // Throttle updates to 60fps
    const now = Date.now();
    if (now - lastUpdateTime.current < 16) return;
    lastUpdateTime.current = now;
    
    try {
      const [center, zoom] = await Promise.all([
        mapRef.getCenter(),
        mapRef.getZoom()
      ]);
      
      let lng, lat;
      if (Array.isArray(center)) {
        [lng, lat] = center;
      } else {
        lng = center?.longitude || center?.lng;
        lat = center?.latitude || center?.lat;
      }
      
      if (!lng || !lat) return;
      
      // Calculate pixel offset from base position
      const basePixel = lngLatToPixel(baseCenter[0], baseCenter[1], baseZoom);
      const currentPixel = lngLatToPixel(lng, lat, zoom);
      
      // Calculate zoom scale difference
      const zoomScale = Math.pow(2, zoom - baseZoom);
      
      // Apply transforms (immediate, no animation during gesture)
      panX.setValue((basePixel.x - currentPixel.x) * zoomScale);
      panY.setValue((basePixel.y - currentPixel.y) * zoomScale);
      scale.setValue(zoomScale);
      
    } catch (error) {
      console.error('Error in handleRegionIsChanging:', error);
    }
  }, [mapRef, baseCenter, baseZoom, lngLatToPixel, panX, panY, scale]);

  // Handle gesture end - update tiles
  const handleRegionDidChange = useCallback(async () => {
    if (!mapRef) return;
    
    isAnimating.current = true;
    
    try {
      const [center, zoom] = await Promise.all([
        mapRef.getCenter(),
        mapRef.getZoom()
      ]);
      
      let lng, lat;
      if (Array.isArray(center)) {
        [lng, lat] = center;
      } else {
        lng = center?.longitude || center?.lng;
        lat = center?.latitude || center?.lat;
      }
      
      if (!lng || !lat) return;
      
      // Update base position
      setBaseCenter([lng, lat]);
      setBaseZoom(zoom);
      
      // Calculate new tiles
      const newTiles = calculateTiles([lng, lat], zoom, screenWidth, 400);
      
      // Animate to new position
      Animated.parallel([
        Animated.timing(panX, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(panY, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start(() => {
        setTiles(newTiles);
        isAnimating.current = false;
      });
      
    } catch (error) {
      console.error('Error in handleRegionDidChange:', error);
      isAnimating.current = false;
    }
  }, [mapRef, calculateTiles, panX, panY, scale]);

  // Connect to parent callbacks
  useEffect(() => {
    if (onRegionIsChanging) {
      onRegionIsChanging(handleRegionIsChanging);
    }
    if (onRegionDidChange) {
      onRegionDidChange(handleRegionDidChange);
    }
  }, [handleRegionIsChanging, handleRegionDidChange, onRegionIsChanging, onRegionDidChange]);

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          transform: [
            { translateX: panX },
            { translateY: panY },
            { scale: scale }
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
              left: tile.x,
              top: tile.y,
            }
          ]}
          resizeMode="cover"
          fadeDuration={0}
        />
      ))}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  tile: {
    position: 'absolute',
    width: 256,
    height: 256,
  },
});

export default SmoothTileOverlay;