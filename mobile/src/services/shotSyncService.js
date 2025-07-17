/**
 * ShotSyncService
 * 
 * Handles synchronization of shot data between local storage and backend
 * Integrates with offline queue for reliable data transfer
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../config/api';
import offlineQueueService from './offlineQueueService';
import { useAuth } from '../contexts/AuthContext';

class ShotSyncService {
  constructor() {
    this.initialized = false;
    this.lastSyncKey = 'last_shot_sync';
    this.syncIntervalMinutes = 15; // Sync every 15 minutes
    this.syncTimer = null;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      console.log('🔄 Initializing ShotSyncService...');
      
      // Initialize offline queue
      await offlineQueueService.initialize();
      
      // Start periodic sync
      this.startPeriodicSync();
      
      this.initialized = true;
      console.log('✅ ShotSyncService initialized');
    } catch (error) {
      console.error('❌ Error initializing ShotSyncService:', error);
    }
  }

  startPeriodicSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    this.syncTimer = setInterval(() => {
      this.syncPendingShots();
    }, this.syncIntervalMinutes * 60 * 1000);

    console.log(`⏰ Periodic sync started (every ${this.syncIntervalMinutes} minutes)`);
  }

  stopPeriodicSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
      console.log('⏹️ Periodic sync stopped');
    }
  }

  async syncPendingShots() {
    try {
      console.log('🔄 Starting pending shots sync...');
      
      // Get auth token (would need to be passed in or accessed from context)
      const token = await this.getAuthToken();
      if (!token) {
        console.log('❌ No auth token available, skipping sync');
        return;
      }

      // Get all pending shots that need sync
      const pendingShots = await this.getPendingShots();
      
      if (pendingShots.length === 0) {
        console.log('✅ No pending shots to sync');
        return;
      }

      // Group shots by round for batch sync
      const roundGroups = this.groupShotsByRound(pendingShots);
      
      for (const [roundId, shots] of Object.entries(roundGroups)) {
        await this.syncRoundShots(token, roundId, shots);
      }

      console.log(`✅ Synced ${pendingShots.length} shots across ${Object.keys(roundGroups).length} rounds`);
      
    } catch (error) {
      console.error('❌ Error syncing pending shots:', error);
    }
  }

  async syncRoundShots(token, roundId, shots) {
    try {
      // Prepare shots for sync - each shot needs roundId
      const shotsWithRoundId = shots.map(shot => ({
        id: shot.id,
        roundId: roundId,  // Add roundId to each shot
        holeNumber: shot.holeNumber,
        shotNumber: shot.shotNumber,
        coordinates: shot.coordinates,
        clubId: shot.clubId,
        scoreAfterShot: shot.scoreAfterShot,
        distanceToNext: shot.distanceToNext,
        timestamp: shot.timestamp
      }));

      // Add to offline queue for reliable sync
      await offlineQueueService.queueShotSync(token, shotsWithRoundId);
      
      // Mark shots as sync-pending
      await this.markShotsAsSyncPending(shots);
      
      console.log(`📤 Queued ${shots.length} shots for round ${roundId}`);
      
    } catch (error) {
      console.error(`❌ Error syncing round ${roundId}:`, error);
      throw error;
    }
  }

  async getPendingShots() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const shotKeys = keys.filter(key => key.startsWith('golf_shots_'));
      
      const allShots = [];
      
      for (const key of shotKeys) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          const parsed = JSON.parse(data);
          const shots = parsed.shots || [];
          
          // Filter shots that haven't been synced
          const pendingShots = shots.filter(shot => !shot.synced);
          allShots.push(...pendingShots);
        }
      }
      
      return allShots;
    } catch (error) {
      console.error('❌ Error getting pending shots:', error);
      return [];
    }
  }

  groupShotsByRound(shots) {
    const groups = {};
    
    shots.forEach(shot => {
      const roundId = shot.roundId;
      if (!groups[roundId]) {
        groups[roundId] = [];
      }
      groups[roundId].push(shot);
    });
    
    return groups;
  }

  async markShotsAsSyncPending(shots) {
    try {
      const shotsByRound = this.groupShotsByRound(shots);
      
      for (const [roundId, roundShots] of Object.entries(shotsByRound)) {
        const storageKey = `golf_shots_${roundId}`;
        const data = await AsyncStorage.getItem(storageKey);
        
        if (data) {
          const parsed = JSON.parse(data);
          
          // Mark shots as sync pending
          parsed.shots = parsed.shots.map(shot => {
            const isPending = roundShots.some(rs => rs.id === shot.id);
            return isPending ? { ...shot, syncPending: true } : shot;
          });
          
          await AsyncStorage.setItem(storageKey, JSON.stringify(parsed));
        }
      }
    } catch (error) {
      console.error('❌ Error marking shots as sync pending:', error);
    }
  }

  async markShotsAsSynced(shots) {
    try {
      const shotsByRound = this.groupShotsByRound(shots);
      
      for (const [roundId, roundShots] of Object.entries(shotsByRound)) {
        const storageKey = `golf_shots_${roundId}`;
        const data = await AsyncStorage.getItem(storageKey);
        
        if (data) {
          const parsed = JSON.parse(data);
          
          // Mark shots as synced
          parsed.shots = parsed.shots.map(shot => {
            const isSynced = roundShots.some(rs => rs.id === shot.id);
            return isSynced ? { ...shot, synced: true, syncPending: false } : shot;
          });
          
          await AsyncStorage.setItem(storageKey, JSON.stringify(parsed));
        }
      }
      
      // Update last sync timestamp
      await AsyncStorage.setItem(this.lastSyncKey, new Date().toISOString());
      
    } catch (error) {
      console.error('❌ Error marking shots as synced:', error);
    }
  }

  async getLastSyncTime() {
    try {
      const timestamp = await AsyncStorage.getItem(this.lastSyncKey);
      return timestamp ? new Date(timestamp) : null;
    } catch (error) {
      console.error('❌ Error getting last sync time:', error);
      return null;
    }
  }

  async getDeviceId() {
    try {
      let deviceId = await AsyncStorage.getItem('device_id');
      if (!deviceId) {
        deviceId = `mobile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await AsyncStorage.setItem('device_id', deviceId);
      }
      return deviceId;
    } catch (error) {
      console.error('❌ Error getting device ID:', error);
      return 'unknown_device';
    }
  }

  async getAuthToken() {
    try {
      // Check both AsyncStorage and the standard auth_token key
      let token = await AsyncStorage.getItem('auth_token');
      console.log('🔍 Checking auth_token:', token ? 'found' : 'not found');
      
      // If not found, try the token key that might be used by auth context
      if (!token) {
        token = await AsyncStorage.getItem('token');
        console.log('🔍 Checking token:', token ? 'found' : 'not found');
      }
      
      // If still not found, try userToken key
      if (!token) {
        token = await AsyncStorage.getItem('userToken');
        console.log('🔍 Checking userToken:', token ? 'found' : 'not found');
      }
      
      // If still not found, try authToken key (camelCase)
      if (!token) {
        token = await AsyncStorage.getItem('authToken');
        console.log('🔍 Checking authToken:', token ? 'found' : 'not found');
      }
      
      // If still not found, debug what keys are available
      if (!token) {
        const allKeys = await AsyncStorage.getAllKeys();
        const authKeys = allKeys.filter(key => key.toLowerCase().includes('token') || key.toLowerCase().includes('auth'));
        console.log('🔍 Available auth-related keys:', authKeys);
      }
      
      return token;
    } catch (error) {
      console.error('❌ Error getting auth token:', error);
      return null;
    }
  }

  // Manual sync trigger
  async forceSyncShots() {
    console.log('🔄 Force syncing all pending shots...');
    await this.syncPendingShots();
  }

  // Sync specific round
  async syncRoundById(roundId) {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('No auth token available');
      }

      const storageKey = `golf_shots_${roundId}`;
      const data = await AsyncStorage.getItem(storageKey);
      
      if (!data) {
        throw new Error(`No shots found for round ${roundId}`);
      }

      const parsed = JSON.parse(data);
      const pendingShots = parsed.shots.filter(shot => !shot.synced);
      
      if (pendingShots.length === 0) {
        console.log(`✅ Round ${roundId} already synced`);
        return;
      }

      await this.syncRoundShots(token, roundId, pendingShots);
      
    } catch (error) {
      console.error(`❌ Error syncing round ${roundId}:`, error);
      throw error;
    }
  }

  // Download shots from server (for data recovery)
  async downloadShotsFromServer(roundId) {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('No auth token available');
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SHOTS.ROUND}/${roundId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: API_CONFIG.TIMEOUT
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log(`📥 Downloaded ${result.shots.length} shots for round ${roundId}`);
      
      return result.shots;
      
    } catch (error) {
      console.error(`❌ Error downloading shots for round ${roundId}:`, error);
      throw error;
    }
  }

  // Get sync status
  async getSyncStatus() {
    const queueStatus = offlineQueueService.getQueueStatus();
    const pendingShots = await this.getPendingShots();
    
    return {
      ...queueStatus,
      pendingShots: pendingShots.length,
      lastSyncTime: await this.getLastSyncTime(),
      periodicSyncEnabled: this.syncTimer !== null,
      syncIntervalMinutes: this.syncIntervalMinutes
    };
  }

  // Update sync interval
  updateSyncInterval(minutes) {
    this.syncIntervalMinutes = minutes;
    this.startPeriodicSync(); // Restart with new interval
    console.log(`⏰ Sync interval updated to ${minutes} minutes`);
  }

  // Cleanup old synced shots (keep last 30 days)
  async cleanupOldShots() {
    try {
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      const keys = await AsyncStorage.getAllKeys();
      const shotKeys = keys.filter(key => key.startsWith('golf_shots_'));
      
      for (const key of shotKeys) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          const parsed = JSON.parse(data);
          const lastUpdated = new Date(parsed.lastUpdated).getTime();
          
          // Remove if older than 30 days and all shots are synced
          if (lastUpdated < thirtyDaysAgo && parsed.shots.every(shot => shot.synced)) {
            await AsyncStorage.removeItem(key);
            console.log(`🗑️ Cleaned up old shots for key: ${key}`);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error cleaning up old shots:', error);
    }
  }
}

// Create singleton instance
const shotSyncService = new ShotSyncService();

export default shotSyncService;