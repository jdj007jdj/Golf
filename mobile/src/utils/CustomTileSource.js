import { NativeModules, Platform } from 'react-native';

// Custom Tile Source that uses fetch() to load tiles
export class CustomTileSource {
  constructor(apiKey = '9VwMyrJdecjrEB6fwLGJ') {
    this.apiKey = apiKey;
    this.tileCache = new Map();
    this.pendingRequests = new Map();
    this.maxCacheSize = 100; // Cache up to 100 tiles
  }

  // Generate the MapTiler tile URL
  getTileUrl(z, x, y) {
    return `https://api.maptiler.com/tiles/satellite-v2/${z}/${x}/${y}.jpg?key=${this.apiKey}`;
  }

  // Convert image blob to base64 data URI
  async blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // Fetch a tile and return as base64 data URI
  async fetchTile(z, x, y) {
    const cacheKey = `${z}/${x}/${y}`;
    
    // Check cache first
    if (this.tileCache.has(cacheKey)) {
      console.log(`📦 Tile ${cacheKey} from cache`);
      return this.tileCache.get(cacheKey);
    }

    // Check if request is already pending
    if (this.pendingRequests.has(cacheKey)) {
      console.log(`⏳ Tile ${cacheKey} already fetching...`);
      return this.pendingRequests.get(cacheKey);
    }

    // Create new fetch request
    const fetchPromise = this._performFetch(z, x, y, cacheKey);
    this.pendingRequests.set(cacheKey, fetchPromise);

    try {
      const result = await fetchPromise;
      this.pendingRequests.delete(cacheKey);
      return result;
    } catch (error) {
      this.pendingRequests.delete(cacheKey);
      throw error;
    }
  }

  async _performFetch(z, x, y, cacheKey) {
    const url = this.getTileUrl(z, x, y);
    
    try {
      console.log(`🌐 Fetching tile ${cacheKey}...`);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      // Get the image as blob
      const blob = await response.blob();
      
      // Convert to base64 data URI
      const base64 = await this.blobToBase64(blob);
      
      // Cache the result
      this.addToCache(cacheKey, base64);
      
      console.log(`✅ Tile ${cacheKey} fetched successfully`);
      return base64;
    } catch (error) {
      console.error(`❌ Failed to fetch tile ${cacheKey}:`, error);
      // Return a transparent 1x1 pixel as fallback
      return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    }
  }

  // Add tile to cache with LRU eviction
  addToCache(key, value) {
    // Remove oldest entry if cache is full
    if (this.tileCache.size >= this.maxCacheSize) {
      const firstKey = this.tileCache.keys().next().value;
      this.tileCache.delete(firstKey);
      console.log(`🗑️ Evicted tile ${firstKey} from cache`);
    }
    
    this.tileCache.set(key, value);
  }

  // Clear the cache
  clearCache() {
    this.tileCache.clear();
    console.log('🧹 Tile cache cleared');
  }

  // Create a custom style that uses inline base64 tiles
  async createInlineStyle(centerLon, centerLat, zoom = 16) {
    console.log('🎨 Creating inline tile style...');
    
    // Calculate which tiles we need for the initial view
    const tilesNeeded = this.calculateTilesNeeded(centerLon, centerLat, zoom);
    
    // Prefetch tiles for smoother initial load
    const tilePromises = tilesNeeded.map(({ z, x, y }) => this.fetchTile(z, x, y));
    await Promise.all(tilePromises);
    
    // Create a GeoJSON source with image overlays for each tile
    const features = await Promise.all(
      tilesNeeded.map(async ({ z, x, y }) => {
        const dataUri = await this.fetchTile(z, x, y);
        const bbox = this.tileToBoundingBox(x, y, z);
        
        return {
          type: 'Feature',
          properties: {
            tile: `${z}/${x}/${y}`,
            image: dataUri
          },
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [bbox.west, bbox.south],
              [bbox.east, bbox.south],
              [bbox.east, bbox.north],
              [bbox.west, bbox.north],
              [bbox.west, bbox.south]
            ]]
          }
        };
      })
    );

    // Return a style with inline tiles
    return {
      version: 8,
      sources: {
        'satellite-tiles': {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features
          }
        }
      },
      layers: [
        {
          id: 'background',
          type: 'background',
          paint: {
            'background-color': '#000000'
          }
        },
        // This is a placeholder - we need to render images differently
        {
          id: 'satellite-layer',
          type: 'fill',
          source: 'satellite-tiles',
          paint: {
            'fill-color': '#333333',
            'fill-opacity': 0.8
          }
        }
      ]
    };
  }

  // Calculate which tiles are needed for a given view
  calculateTilesNeeded(centerLon, centerLat, zoom, buffer = 1) {
    const centerTile = this.lngLatToTile(centerLon, centerLat, zoom);
    const tiles = [];
    
    // Get tiles in a grid around the center
    for (let dx = -buffer; dx <= buffer; dx++) {
      for (let dy = -buffer; dy <= buffer; dy++) {
        tiles.push({
          z: zoom,
          x: centerTile.x + dx,
          y: centerTile.y + dy
        });
      }
    }
    
    return tiles;
  }

  // Convert lng/lat to tile coordinates
  lngLatToTile(lng, lat, zoom) {
    const x = Math.floor((lng + 180) / 360 * Math.pow(2, zoom));
    const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
    return { x, y };
  }

  // Convert tile coordinates to bounding box
  tileToBoundingBox(x, y, z) {
    const n = Math.pow(2, z);
    const west = x / n * 360 - 180;
    const east = (x + 1) / n * 360 - 180;
    const north = Math.atan(Math.sinh(Math.PI * (1 - 2 * y / n))) * 180 / Math.PI;
    const south = Math.atan(Math.sinh(Math.PI * (1 - 2 * (y + 1) / n))) * 180 / Math.PI;
    return { north, south, east, west };
  }
}

// Singleton instance
export const customTileSource = new CustomTileSource();