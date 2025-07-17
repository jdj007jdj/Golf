import tileCache from './tileCache';
import tileCacheDB from '../services/tileCacheDatabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Persistent tile cache that combines memory cache with SQLite storage
 * Provides a three-tier caching system: Memory → SQLite → Network
 */
class PersistentTileCache {
  constructor() {
    this.memoryCache = tileCache; // Existing in-memory LRU cache
    this.dbCache = tileCacheDB;    // SQLite persistent storage
    this.settings = {
      storageLimit: 100 * 1024 * 1024, // Default 100MB
      expirationDays: 30,              // Default 30 days
      enabled: true                    // Default enabled
    };
    this.statsCache = null;
    this.statsCacheTime = 0;
    this.STATS_CACHE_DURATION = 5000; // Cache stats for 5 seconds
  }

  /**
   * Initialize the persistent cache system
   */
  async initialize() {
    console.log('🚀 PersistentTileCache.initialize() called');
    try {
      // Initialize SQLite database
      this.dbCache.initialize();
      console.log('✅ SQLite database initialized');
      
      // Load settings from AsyncStorage
      await this.loadSettings();
      console.log(`⚙️ Settings loaded: enabled=${this.settings.enabled}, limit=${this.settings.storageLimit}`);
      
      // Perform initial cleanup based on settings
      if (this.settings.enabled) {
        this.performMaintenance();
      }
      
      // Preload recent tiles into memory cache
      this.warmMemoryCache();
      
      console.log('📦 Persistent tile cache initialized');
    } catch (error) {
      console.error('Failed to initialize persistent cache:', error);
    }
  }

  /**
   * Load cache settings from AsyncStorage
   */
  async loadSettings() {
    try {
      const settingsJson = await AsyncStorage.getItem('@mapCacheSettings');
      if (settingsJson) {
        this.settings = { ...this.settings, ...JSON.parse(settingsJson) };
      }
    } catch (error) {
      console.error('Failed to load cache settings:', error);
    }
  }

  /**
   * Save cache settings to AsyncStorage
   */
  async saveSettings(newSettings) {
    try {
      this.settings = { ...this.settings, ...newSettings };
      await AsyncStorage.setItem('@mapCacheSettings', JSON.stringify(this.settings));
      
      // Perform maintenance if settings changed
      if (this.settings.enabled) {
        await this.performMaintenance();
      }
    } catch (error) {
      console.error('Failed to save cache settings:', error);
    }
  }

  /**
   * Get a tile from cache (memory → SQLite → null)
   * @param {string} key - Tile key
   * @returns {Promise<string|null>} - Base64 data or null
   */
  get(key) {
    // Check memory cache first
    const memoryData = this.memoryCache.get(key);
    if (memoryData) {
      return memoryData;
    }

    // If persistent cache is disabled, return null
    if (!this.settings.enabled) {
      return null;
    }

    // Check SQLite cache
    try {
      const dbTile = this.dbCache.getTile(key);
      if (dbTile) {
        console.log(`💿 Found tile ${key} in SQLite cache`);
        // Load into memory cache for faster access
        this.memoryCache.set(key, dbTile.data);
        return dbTile.data;
      }
    } catch (error) {
      console.error(`Failed to get tile from DB ${key}:`, error);
    }

    return null;
  }

  /**
   * Store a tile in both memory and persistent cache
   * @param {string} key - Tile key
   * @param {string} data - Base64 data
   * @param {number} zoom - Zoom level
   */
  set(key, data, zoom) {
    console.log(`🔧 PersistentTileCache.set called for ${key}, zoom: ${zoom}, enabled: ${this.settings.enabled}`);
    
    // Always store in memory cache
    this.memoryCache.set(key, data);

    // Store in SQLite if enabled
    if (this.settings.enabled) {
      console.log(`💾 Attempting to store tile ${key} in SQLite...`);
      try {
        // Check storage limit before storing
        const stats = this.getStats();
        const tileSize = Math.ceil((data.length * 3) / 4);
        
        console.log(`📊 Current cache size: ${stats.totalSize}, tile size: ${tileSize}, limit: ${this.settings.storageLimit}`);
        
        if (stats.totalSize + tileSize > this.settings.storageLimit) {
          // Enforce storage limit before adding new tile
          console.log(`⚠️ Approaching storage limit, enforcing cleanup...`);
          this.dbCache.enforceStorageLimit(this.settings.storageLimit - tileSize);
        }
        
        const result = this.dbCache.storeTile(key, data, zoom);
        console.log(`✅ storeTile result: ${result}`);
        
        // Invalidate stats cache after storing a tile
        this.statsCache = null;
      } catch (error) {
        console.error(`Failed to store tile in DB ${key}:`, error);
      }
    } else {
      console.log(`⏭️ Persistent cache disabled, only storing in memory`);
    }
  }

  /**
   * Get cache statistics (combined memory + SQLite)
   */
  getStats() {
    // Use cached stats if recent
    if (this.statsCache && Date.now() - this.statsCacheTime < this.STATS_CACHE_DURATION) {
      return this.statsCache;
    }

    try {
      const memStats = this.memoryCache.getStats();
      const dbStats = this.dbCache.getStats();
      
      this.statsCache = {
        memoryCache: {
          size: memStats.size,
          maxSize: memStats.maxSize,
          hitRate: memStats.hitRate
        },
        persistentCache: {
          tileCount: dbStats.tileCount,
          totalSize: dbStats.totalSize,
          oldestTile: dbStats.oldestTile,
          newestTile: dbStats.newestTile
        },
        settings: this.settings,
        totalSize: dbStats.totalSize // For storage limit calculations
      };
      
      this.statsCacheTime = Date.now();
      return this.statsCache;
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return {
        memoryCache: { size: 0, maxSize: 0, hitRate: 0 },
        persistentCache: { tileCount: 0, totalSize: 0 },
        settings: this.settings,
        totalSize: 0
      };
    }
  }

  /**
   * Clear all caches
   */
  clearAll() {
    this.memoryCache.clear();
    if (this.settings.enabled) {
      this.dbCache.clearCache();
    }
    this.statsCache = null;
  }

  /**
   * Perform cache maintenance (cleanup old tiles, enforce limits)
   */
  performMaintenance() {
    if (!this.settings.enabled) return;

    try {
      // Remove expired tiles if expiration is set
      if (this.settings.expirationDays > 0) {
        const removed = this.dbCache.removeOldTiles(this.settings.expirationDays);
        if (removed > 0) {
          console.log(`🧹 Removed ${removed} expired tiles`);
        }
      }

      // Enforce storage limit
      const removed = this.dbCache.enforceStorageLimit(this.settings.storageLimit);
      if (removed > 0) {
        console.log(`🧹 Removed ${removed} tiles to enforce storage limit`);
      }
    } catch (error) {
      console.error('Cache maintenance failed:', error);
    }
  }

  /**
   * Warm the memory cache with recently used tiles from SQLite
   */
  warmMemoryCache() {
    if (!this.settings.enabled) return;

    try {
      // Get current map position (default to zoom 18)
      const tiles = this.dbCache.getTilesForMemoryCache(null, 18, 50) || [];
      
      for (const tile of tiles) {
        this.memoryCache.set(tile.key, tile.data);
      }
      
      if (tiles.length > 0) {
        console.log(`♨️ Warmed memory cache with ${tiles.length} tiles`);
      }
    } catch (error) {
      console.error('Failed to warm memory cache:', error);
    }
  }

  /**
   * Preload tiles for a specific area
   * @param {Array} tileKeys - Array of tile keys to preload
   * @param {Function} fetchTile - Function to fetch a tile from network
   * @returns {Promise<Object>} - Preload results
   */
  async preloadArea(tileKeys, fetchTile) {
    const results = {
      cached: 0,
      fetched: 0,
      failed: 0,
      total: tileKeys.length
    };

    if (!this.settings.enabled) {
      return results;
    }

    const tilesToFetch = [];

    // Check which tiles need to be fetched
    for (const key of tileKeys) {
      const exists = await this.get(key);
      if (exists) {
        results.cached++;
      } else {
        tilesToFetch.push(key);
      }
    }

    // Fetch missing tiles in batches
    const BATCH_SIZE = 10;
    for (let i = 0; i < tilesToFetch.length; i += BATCH_SIZE) {
      const batch = tilesToFetch.slice(i, i + BATCH_SIZE);
      const promises = batch.map(async (key) => {
        try {
          // Parse zoom from key (format: "zoom-x-y")
          const [zoom] = key.split('-').map(Number);
          const url = this.getTileUrl(key); // Would need to implement
          const data = await fetchTile(url);
          
          if (data) {
            await this.set(key, data, zoom);
            results.fetched++;
          } else {
            results.failed++;
          }
        } catch (error) {
          console.error(`Failed to preload tile ${key}:`, error);
          results.failed++;
        }
      });

      await Promise.all(promises);
    }

    return results;
  }

  /**
   * Get storage usage percentage
   */
  async getUsagePercentage() {
    const stats = await this.getStats();
    return (stats.totalSize / this.settings.storageLimit) * 100;
  }

  /**
   * Check if approaching storage limit (>90%)
   */
  async isApproachingLimit() {
    const usage = await this.getUsagePercentage();
    return usage > 90;
  }
}

// Create singleton instance
const persistentTileCache = new PersistentTileCache();

export default persistentTileCache;