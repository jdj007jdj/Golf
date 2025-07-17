/**
 * LRU (Least Recently Used) Cache for map tiles
 * Stores tile images as base64 data URIs to prevent re-fetching
 */
class TileCache {
  constructor(maxSize = 200) {
    this.maxSize = maxSize;
    this.cache = new Map();
    this.accessOrder = [];
    this.hitCount = 0;
    this.missCount = 0;
  }

  /**
   * Get a tile from cache
   * @param {string} key - Tile key (e.g., "18-71343-105149")
   * @returns {string|null} - Base64 data URI or null if not cached
   */
  get(key) {
    if (this.cache.has(key)) {
      // Move to end of access order (most recently used)
      this.updateAccessOrder(key);
      this.hitCount++;
      return this.cache.get(key);
    }
    this.missCount++;
    return null;
  }

  /**
   * Store a tile in cache
   * @param {string} key - Tile key
   * @param {string} dataUri - Base64 data URI of the tile image
   */
  set(key, dataUri) {
    // If already in cache, just update access order
    if (this.cache.has(key)) {
      this.updateAccessOrder(key);
      return;
    }

    // If cache is full, remove least recently used
    if (this.cache.size >= this.maxSize) {
      const lruKey = this.accessOrder.shift();
      this.cache.delete(lruKey);
    }

    // Add new tile
    this.cache.set(key, dataUri);
    this.accessOrder.push(key);
  }

  /**
   * Check if a tile is in cache
   * @param {string} key - Tile key
   * @returns {boolean}
   */
  has(key) {
    return this.cache.has(key);
  }

  /**
   * Update access order for LRU tracking
   * @param {string} key - Tile key
   */
  updateAccessOrder(key) {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.push(key);
  }

  /**
   * Clear the entire cache
   */
  clear() {
    this.cache.clear();
    this.accessOrder = [];
    this.hitCount = 0;
    this.missCount = 0;
  }

  /**
   * Get cache statistics
   * @returns {object} - Cache stats
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: this.hitCount / (this.hitCount + this.missCount) || 0,
      hits: this.hitCount || 0,
      misses: this.missCount || 0
    };
  }

  /**
   * Preload tiles for a given area
   * @param {Array} tiles - Array of tile objects with url and key
   * @param {Function} fetchTile - Function to fetch a tile
   * @returns {Promise} - Resolves when all tiles are loaded
   */
  async preloadTiles(tiles, fetchTile) {
    const tilesToLoad = tiles.filter(tile => !this.has(tile.key));

    const promises = tilesToLoad.map(async (tile) => {
      try {
        const dataUri = await fetchTile(tile.url);
        if (dataUri) {
          this.set(tile.key, dataUri);
        }
      } catch (error) {
        console.error(`Failed to preload tile ${tile.key}:`, error);
      }
    });

    await Promise.all(promises);
  }
}

// Determine optimal cache size based on device memory (if available)
const getOptimalCacheSize = () => {
  // Default cache size
  let cacheSize = 200;
  
  // You can add platform-specific memory detection here
  // For now, we'll use a reasonable default that works well
  // Each tile is ~100KB as base64, so 200 tiles ≈ 20MB
  
  return cacheSize;
};

// Create singleton instance
const tileCache = new TileCache(getOptimalCacheSize());

export default tileCache;