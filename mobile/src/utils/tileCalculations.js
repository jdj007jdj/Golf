/**
 * Tile calculation utilities for map tile downloads
 * Uses Web Mercator projection (EPSG:3857)
 */

/**
 * Convert latitude/longitude to tile coordinates at given zoom level
 * @param {number} lat - Latitude in degrees
 * @param {number} lon - Longitude in degrees
 * @param {number} zoom - Zoom level (0-22)
 * @returns {object} - { x, y, z } tile coordinates
 */
export const latLonToTile = (lat, lon, zoom) => {
  const n = Math.pow(2, zoom);
  const x = Math.floor((lon + 180) / 360 * n);
  const y = Math.floor(
    (1 - Math.log(
      Math.tan(lat * Math.PI / 180) + 
      1 / Math.cos(lat * Math.PI / 180)
    ) / Math.PI) / 2 * n
  );
  return { x, y, z: zoom };
};

/**
 * Convert tile coordinates to lat/lon bounding box
 * @param {number} x - Tile X coordinate
 * @param {number} y - Tile Y coordinate
 * @param {number} z - Zoom level
 * @returns {object} - { north, south, east, west } bounds in degrees
 */
export const tileToBounds = (x, y, z) => {
  const n = Math.pow(2, z);
  const lon1 = x / n * 360 - 180;
  const lat1 = Math.atan(Math.sinh(Math.PI * (1 - 2 * y / n))) * 180 / Math.PI;
  const lon2 = (x + 1) / n * 360 - 180;
  const lat2 = Math.atan(Math.sinh(Math.PI * (1 - 2 * (y + 1) / n))) * 180 / Math.PI;
  
  return {
    north: lat1,
    south: lat2,
    east: lon2,
    west: lon1,
  };
};

/**
 * Convert tile coordinates to center lat/lon
 * @param {number} x - Tile X coordinate
 * @param {number} y - Tile Y coordinate
 * @param {number} z - Zoom level
 * @returns {object} - { lat, lon } center point
 */
export const tileToLatLon = (x, y, z) => {
  const bounds = tileToBounds(x, y, z);
  return {
    lat: (bounds.north + bounds.south) / 2,
    lon: (bounds.east + bounds.west) / 2,
  };
};

/**
 * Generate a unique key for a tile
 * @param {number} x - Tile X coordinate
 * @param {number} y - Tile Y coordinate
 * @param {number} z - Zoom level
 * @returns {string} - Tile key in format "z/x/y"
 */
export const getTileKey = (x, y, z) => {
  return `${z}/${x}/${y}`;
};

/**
 * Parse tile key back to coordinates
 * @param {string} key - Tile key in format "z/x/y"
 * @returns {object} - { x, y, z } coordinates
 */
export const parseTileKey = (key) => {
  const [z, x, y] = key.split('/').map(Number);
  return { x, y, z };
};

/**
 * Calculate all tiles needed for a bounding box at given zoom levels
 * @param {object} bounds - { north, south, east, west } in degrees
 * @param {number} minZoom - Minimum zoom level
 * @param {number} maxZoom - Maximum zoom level
 * @returns {array} - Array of { x, y, z } tile coordinates
 */
export const getTilesForBounds = (bounds, minZoom, maxZoom) => {
  const tiles = [];
  
  for (let z = minZoom; z <= maxZoom; z++) {
    const minTile = latLonToTile(bounds.south, bounds.west, z);
    const maxTile = latLonToTile(bounds.north, bounds.east, z);
    
    for (let x = minTile.x; x <= maxTile.x; x++) {
      for (let y = maxTile.y; y <= minTile.y; y++) {
        tiles.push({ x, y, z });
      }
    }
  }
  
  return tiles;
};

/**
 * Calculate tiles in a radius around a center point
 * @param {number} centerLat - Center latitude
 * @param {number} centerLon - Center longitude
 * @param {number} radiusMeters - Radius in meters
 * @param {number} zoom - Zoom level
 * @returns {array} - Array of { x, y, z } tile coordinates
 */
export const getTilesInRadius = (centerLat, centerLon, radiusMeters, zoom) => {
  // Approximate degrees per meter at this latitude
  const metersPerDegreeLat = 111320;
  const metersPerDegreeLon = metersPerDegreeLat * Math.cos(centerLat * Math.PI / 180);
  
  const deltaLat = radiusMeters / metersPerDegreeLat;
  const deltaLon = radiusMeters / metersPerDegreeLon;
  
  const bounds = {
    north: centerLat + deltaLat,
    south: centerLat - deltaLat,
    east: centerLon + deltaLon,
    west: centerLon - deltaLon,
  };
  
  return getTilesForBounds(bounds, zoom, zoom);
};

/**
 * Convert screen coordinates to lat/lon for MapViewWithGestures
 * @param {number} screenX - Screen X coordinate
 * @param {number} screenY - Screen Y coordinate
 * @param {object} mapBounds - Current map bounds
 * @param {object} screenDimensions - { width, height } of map view
 * @returns {object} - { lat, lon }
 */
export const screenToLatLon = (screenX, screenY, mapBounds, screenDimensions) => {
  const { north, south, east, west } = mapBounds;
  const { width, height } = screenDimensions;
  
  const lat = north - (screenY / height) * (north - south);
  const lon = west + (screenX / width) * (east - west);
  
  return { lat, lon };
};

/**
 * Generate MapTiler URL for a tile
 * @param {number} x - Tile X coordinate
 * @param {number} y - Tile Y coordinate
 * @param {number} z - Zoom level
 * @param {string} apiKey - MapTiler API key
 * @returns {string} - Tile URL
 */
export const getMapTilerUrl = (x, y, z, apiKey) => {
  return `https://api.maptiler.com/tiles/satellite-v2/${z}/${x}/${y}.jpg?key=${apiKey}`;
};

/**
 * Estimate storage size for tiles
 * @param {number} tileCount - Number of tiles
 * @param {number} avgSizeKB - Average size per tile in KB (default 50)
 * @returns {string} - Formatted size string (e.g., "12.5 MB")
 */
export const estimateStorageSize = (tileCount, avgSizeKB = 50) => {
  const totalKB = tileCount * avgSizeKB;
  if (totalKB < 1024) {
    return `${totalKB} KB`;
  } else if (totalKB < 1024 * 1024) {
    return `${(totalKB / 1024).toFixed(1)} MB`;
  } else {
    return `${(totalKB / (1024 * 1024)).toFixed(2)} GB`;
  }
};