import { NitroSQLite } from 'react-native-nitro-sqlite';

/**
 * SQLite database service for persistent tile caching
 * Uses react-native-nitro-sqlite for high performance
 */
class TileCacheDatabase {
  constructor() {
    this.db = null;
    this.dbName = 'tile_cache';
    this.isInitialized = false;
  }

  /**
   * Initialize the database and create tables if needed
   */
  initialize() {
    if (this.isInitialized) return;

    try {
      // Open or create the database
      this.db = NitroSQLite.open({ name: this.dbName });
      
      // Create the tile cache table if it doesn't exist
      this.db.execute(`
        CREATE TABLE IF NOT EXISTS tile_cache (
          key TEXT PRIMARY KEY,
          data TEXT NOT NULL,
          zoom INTEGER NOT NULL,
          last_accessed INTEGER NOT NULL,
          size INTEGER NOT NULL,
          created_at INTEGER NOT NULL
        );
      `);

      // Create indexes for performance
      this.db.execute('CREATE INDEX IF NOT EXISTS idx_last_accessed ON tile_cache(last_accessed);');
      this.db.execute('CREATE INDEX IF NOT EXISTS idx_zoom ON tile_cache(zoom);');
      this.db.execute('CREATE INDEX IF NOT EXISTS idx_created_at ON tile_cache(created_at);');

      // Create metadata table for cache statistics
      this.db.execute(`
        CREATE TABLE IF NOT EXISTS cache_metadata (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );
      `);

      // Initialize metadata if not exists
      const result = this.db.execute('SELECT value FROM cache_metadata WHERE key = ?', ['initialized']);
      if (!result.rows || !result.rows._array || result.rows._array.length === 0) {
        this.db.execute(
          'INSERT INTO cache_metadata (key, value) VALUES (?, ?)',
          ['initialized', new Date().toISOString()]
        );
      }

      this.isInitialized = true;
      console.log('📦 Tile cache database initialized');
    } catch (error) {
      console.error('Failed to initialize tile cache database:', error);
      throw error;
    }
  }

  /**
   * Get a tile from the database
   * @param {string} key - Tile key (e.g., "18-71343-105149")
   * @returns {Promise<Object|null>} - Tile data or null if not found
   */
  getTile(key) {
    try {
      this.ensureInitialized();
      
      const result = this.db.execute(
        'SELECT data, zoom FROM tile_cache WHERE key = ?',
        [key]
      );

      if (result.rows && result.rows._array && result.rows._array.length > 0) {
        // Update last accessed timestamp
        this.db.execute(
          'UPDATE tile_cache SET last_accessed = ? WHERE key = ?',
          [Date.now(), key]
        );
        
        return {
          data: result.rows._array[0].data,
          zoom: result.rows._array[0].zoom
        };
      }

      return null;
    } catch (error) {
      console.error(`Failed to get tile ${key}:`, error);
      return null;
    }
  }

  /**
   * Store a tile in the database
   * @param {string} key - Tile key
   * @param {string} data - Base64 encoded tile data
   * @param {number} zoom - Zoom level
   * @returns {Promise<boolean>} - Success status
   */
  storeTile(key, data, zoom) {
    try {
      this.ensureInitialized();
      
      console.log(`🔍 storeTile called: key=${key}, zoom=${zoom}, dataLength=${data ? data.length : 0}`);
      
      if (!this.db) {
        console.error('❌ Database not initialized!');
        return false;
      }
      
      const now = Date.now();
      const size = Math.ceil((data.length * 3) / 4); // Approximate base64 to bytes
      
      console.log(`📝 Executing INSERT for tile ${key}, size=${size} bytes`);
      
      try {
        const result = this.db.execute(
          `INSERT OR REPLACE INTO tile_cache 
           (key, data, zoom, last_accessed, size, created_at) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [key, data, zoom, now, size, now]
        );
        
        console.log(`✅ SQL execute result:`, JSON.stringify(result));
        console.log(`💾 Stored tile ${key} in persistent cache (${(size / 1024).toFixed(1)}KB)`);
        
        // Verify the tile was stored
        const verifyResult = this.db.execute('SELECT COUNT(*) as count FROM tile_cache WHERE key = ?', [key]);
        console.log(`🔍 Verification - tile exists:`, verifyResult.rows?._array?.[0]?.count || 0);
        
        return true;
      } catch (insertError) {
        console.error(`❌ SQL INSERT failed for tile ${key}:`, insertError);
        console.error('Insert error details:', insertError.message);
        throw insertError;
      }
    } catch (error) {
      console.error(`❌ Failed to store tile ${key}:`, error);
      console.error('Error stack:', error.stack);
      return false;
    }
  }

  /**
   * Get cache statistics
   * @returns {Promise<Object>} - Cache statistics
   */
  getStats() {
    try {
      this.ensureInitialized();
      
      const result = this.db.execute(`
        SELECT 
          COUNT(*) as count,
          SUM(size) as totalSize,
          MIN(created_at) as oldestTile,
          MAX(created_at) as newestTile
        FROM tile_cache
      `);

      const stats = (result.rows && result.rows._array && result.rows._array[0]) || {};
      
      return {
        tileCount: stats.count || 0,
        totalSize: stats.totalSize || 0,
        oldestTile: stats.oldestTile ? new Date(stats.oldestTile) : null,
        newestTile: stats.newestTile ? new Date(stats.newestTile) : null
      };
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return {
        tileCount: 0,
        totalSize: 0,
        oldestTile: null,
        newestTile: null
      };
    }
  }

  /**
   * Clear all tiles from the cache
   * @returns {Promise<boolean>} - Success status
   */
  clearCache() {
    try {
      this.ensureInitialized();
      
      this.db.execute('DELETE FROM tile_cache');
      console.log('🧹 Tile cache cleared');
      
      return true;
    } catch (error) {
      console.error('Failed to clear cache:', error);
      return false;
    }
  }

  /**
   * Remove tiles that exceed the storage limit
   * @param {number} maxSizeBytes - Maximum cache size in bytes
   * @returns {Promise<number>} - Number of tiles removed
   */
  enforceStorageLimit(maxSizeBytes) {
    try {
      this.ensureInitialized();
      
      // Get current total size
      const stats = this.getStats();
      if (stats.totalSize <= maxSizeBytes) {
        return 0; // No cleanup needed
      }

      // Calculate how much to remove
      const bytesToRemove = stats.totalSize - maxSizeBytes;
      
      // Get tiles to remove (oldest accessed first)
      const result = this.db.execute(`
        SELECT key, size 
        FROM tile_cache 
        ORDER BY last_accessed ASC
      `);

      let removedBytes = 0;
      let removedCount = 0;
      const keysToRemove = [];

      if (result.rows && result.rows._array) {
        for (const row of result.rows._array) {
          keysToRemove.push(row.key);
          removedBytes += row.size;
          removedCount++;
          
          if (removedBytes >= bytesToRemove) {
            break;
          }
        }
      }

      // Remove tiles in batch
      if (keysToRemove.length > 0) {
        const placeholders = keysToRemove.map(() => '?').join(',');
        this.db.execute(
          `DELETE FROM tile_cache WHERE key IN (${placeholders})`,
          keysToRemove
        );
      }

      return removedCount;
    } catch (error) {
      console.error('Failed to enforce storage limit:', error);
      return 0;
    }
  }

  /**
   * Remove tiles older than specified days
   * @param {number} days - Number of days
   * @returns {Promise<number>} - Number of tiles removed
   */
  removeOldTiles(days) {
    try {
      this.ensureInitialized();
      
      const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
      
      const result = this.db.execute(
        'DELETE FROM tile_cache WHERE last_accessed < ?',
        [cutoffTime]
      );
      
      return result.rowsAffected || 0;
    } catch (error) {
      console.error('Failed to remove old tiles:', error);
      return 0;
    }
  }

  /**
   * Get tiles for preloading into memory cache
   * @param {Object} center - Current center coordinates
   * @param {number} zoom - Current zoom level
   * @param {number} limit - Maximum tiles to return
   * @returns {Promise<Array>} - Array of tile keys and data
   */
  getTilesForMemoryCache(center, zoom, limit = 50) {
    try {
      this.ensureInitialized();
      
      // Get tiles near current zoom level, ordered by most recently used
      const result = this.db.execute(`
        SELECT key, data, zoom
        FROM tile_cache
        WHERE zoom BETWEEN ? AND ?
        ORDER BY last_accessed DESC
        LIMIT ?
      `, [zoom - 1, zoom + 1, limit]);

      // Check if there are any rows
      if (result && result.rows && result.rows._array && result.rows._array.length > 0) {
        return result.rows._array.map(row => ({
          key: row.key,
          data: row.data,
          zoom: row.zoom
        }));
      }
      return [];
    } catch (error) {
      console.error('Failed to get tiles for memory cache:', error);
      return [];
    }
  }

  /**
   * Batch store multiple tiles (more efficient than individual stores)
   * @param {Array} tiles - Array of {key, data, zoom} objects
   * @returns {Promise<number>} - Number of tiles stored
   */
  storeTilesBatch(tiles) {
    try {
      this.ensureInitialized();
      
      let storedCount = 0;
      const now = Date.now();
      
      // Use a transaction for better performance
      // Transaction API requires the async pattern with NitroSQLite
      const tx = this.db;
      tx.execute('BEGIN TRANSACTION');
      
      try {
        for (const tile of tiles) {
          const size = Math.ceil((tile.data.length * 3) / 4);
          
          tx.execute(
            `INSERT OR REPLACE INTO tile_cache 
             (key, data, zoom, last_accessed, size, created_at) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [tile.key, tile.data, tile.zoom, now, size, now]
          );
          
          storedCount++;
        }
        
        tx.execute('COMMIT');
      } catch (error) {
        tx.execute('ROLLBACK');
        throw error;
      }
      
      return storedCount;
    } catch (error) {
      console.error('Failed to store tiles batch:', error);
      return 0;
    }
  }

  /**
   * Ensure database is initialized before operations
   */
  ensureInitialized() {
    if (!this.isInitialized) {
      this.initialize();
    }
  }

  /**
   * Close the database connection
   */
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.isInitialized = false;
    }
  }
}

// Create singleton instance
const tileCacheDB = new TileCacheDatabase();

export default tileCacheDB;