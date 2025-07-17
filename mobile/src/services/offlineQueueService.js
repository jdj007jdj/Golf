/**
 * OfflineQueueService
 * 
 * Manages offline queue for shots and course learning data
 * Handles background sync when network is available
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { API_CONFIG } from '../config/api';
import syncResultTracker from './syncResultTracker';

class OfflineQueueService {
  constructor() {
    this.initialized = false;
    this.isOnline = false;
    this.syncInProgress = false;
    this.queue = [];
    this.storageKey = 'offline_queue_v1';
    this.retryAttempts = 3;
    this.retryDelay = 1000; // 1 second
  }

  async initialize() {
    if (this.initialized) return;

    try {
      console.log('🔄 Initializing OfflineQueueService...');
      
      // Load queue from storage
      await this.loadQueue();
      
      // Setup network listener
      this.setupNetworkListener();
      
      this.initialized = true;
      console.log('✅ OfflineQueueService initialized');
    } catch (error) {
      console.error('❌ Error initializing OfflineQueueService:', error);
    }
  }

  setupNetworkListener() {
    NetInfo.addEventListener(state => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected;
      
      console.log(`📡 Network status changed: ${wasOnline ? 'online' : 'offline'} -> ${this.isOnline ? 'online' : 'offline'}`);
      
      // If we just came online, try to sync
      if (!wasOnline && this.isOnline && this.queue.length > 0) {
        this.syncQueue();
      }
    });
  }

  async loadQueue() {
    try {
      const storedData = await AsyncStorage.getItem(this.storageKey);
      if (storedData) {
        this.queue = JSON.parse(storedData);
        console.log(`📦 Loaded ${this.queue.length} items from offline queue`);
      }
    } catch (error) {
      console.error('❌ Error loading offline queue:', error);
    }
  }

  async saveQueue() {
    try {
      await AsyncStorage.setItem(this.storageKey, JSON.stringify(this.queue));
    } catch (error) {
      console.error('❌ Error saving offline queue:', error);
    }
  }

  async addToQueue(type, data, priority = 'normal') {
    const item = {
      id: Date.now().toString(),
      type,
      data,
      priority,
      timestamp: new Date().toISOString(),
      attempts: 0,
      maxAttempts: this.retryAttempts
    };

    this.queue.push(item);
    await this.saveQueue();
    
    console.log(`📝 Added ${type} to offline queue (${this.queue.length} items)`);
    
    // Try to sync immediately if online
    if (this.isOnline) {
      this.syncQueue();
    }
  }

  async syncQueue() {
    if (this.syncInProgress || !this.isOnline || this.queue.length === 0) {
      return;
    }

    this.syncInProgress = true;
    console.log(`🔄 Starting sync of ${this.queue.length} items`);

    // Sort by priority (high first) and timestamp
    this.queue.sort((a, b) => {
      if (a.priority === 'high' && b.priority !== 'high') return -1;
      if (a.priority !== 'high' && b.priority === 'high') return 1;
      return new Date(a.timestamp) - new Date(b.timestamp);
    });

    const itemsToSync = [...this.queue];
    const syncResults = [];

    for (const item of itemsToSync) {
      try {
        await this.syncItem(item);
        syncResults.push({ item, success: true });
        
        // Remove from queue on success
        this.queue = this.queue.filter(q => q.id !== item.id);
        
      } catch (error) {
        console.error(`❌ Failed to sync item ${item.id}:`, error);
        
        item.attempts++;
        item.lastError = error.message;
        
        if (item.attempts >= item.maxAttempts) {
          console.log(`🗑️ Removing item ${item.id} after ${item.attempts} attempts`);
          this.queue = this.queue.filter(q => q.id !== item.id);
          syncResults.push({ item, success: false, error: error.message });
        } else {
          // Exponential backoff
          const delay = this.retryDelay * Math.pow(2, item.attempts - 1);
          console.log(`⏳ Will retry item ${item.id} in ${delay}ms`);
          setTimeout(() => this.syncQueue(), delay);
        }
      }
    }

    await this.saveQueue();
    this.syncInProgress = false;
    
    const successCount = syncResults.filter(r => r.success).length;
    const failCount = syncResults.filter(r => !r.success).length;
    
    console.log(`✅ Sync completed: ${successCount} success, ${failCount} failed, ${this.queue.length} remaining`);
    
    return syncResults;
  }

  async syncItem(item) {
    const { type, data } = item;
    
    switch (type) {
      case 'shot_sync':
        return await this.syncShots(data);
      case 'course_learning_sync':
        return await this.syncCourseKnowledge(data);
      case 'round_completion':
        return await this.syncRoundCompletion(data);
      default:
        throw new Error(`Unknown sync type: ${type}`);
    }
  }

  async syncShots(data) {
    const { token, shots } = data;
    
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SHOTS.SYNC}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ shots }),
      timeout: API_CONFIG.TIMEOUT
    });

    const result = await response.json();
    
    // Handle partial success
    if (response.ok && result.data) {
      const { synced, total, skipped, errors } = result.data;
      
      if (skipped > 0) {
        console.warn(`⚠️ Partial sync: ${synced}/${total} shots synced, ${skipped} failed`);
        if (errors && errors.length > 0) {
          console.warn('Failed shots:', errors);
        }
      } else {
        console.log(`📤 Successfully synced all ${synced} shots to server`);
      }
      
      // Track the result
      syncResultTracker.trackShotSync(result);
      
      // Return the detailed result
      return result;
    }
    
    // Complete failure
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return result;
  }

  async syncCourseKnowledge(data) {
    const { token, courseId, knowledge } = data;
    
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.COURSE_LEARNING.SYNC}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ courseId, knowledge }),
      timeout: API_CONFIG.TIMEOUT
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`📤 Synced course knowledge for ${courseId}`);
    
    // Track the result
    syncResultTracker.trackCourseKnowledgeSync(result);
    
    return result;
  }

  async syncRoundCompletion(data) {
    const { token, roundId, summary } = data;
    
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ROUNDS}/${roundId}/complete`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ summary }),
      timeout: API_CONFIG.TIMEOUT
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`📤 Synced round completion for ${roundId}`);
    return result;
  }

  // Public methods for adding specific types to queue
  async queueShotSync(token, shots) {
    await this.addToQueue('shot_sync', { token, shots }, 'high');
  }

  async queueCourseKnowledgeSync(token, courseId, knowledge) {
    await this.addToQueue('course_learning_sync', { token, courseId, knowledge }, 'normal');
  }

  async queueRoundCompletion(token, roundId, summary) {
    await this.addToQueue('round_completion', { token, roundId, summary }, 'high');
  }

  // Get queue status
  getQueueStatus() {
    const high = this.queue.filter(item => item.priority === 'high').length;
    const normal = this.queue.filter(item => item.priority === 'normal').length;
    const failed = this.queue.filter(item => item.attempts >= item.maxAttempts).length;
    
    return {
      total: this.queue.length,
      high,
      normal,
      failed,
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress
    };
  }

  // Clear failed items
  async clearFailedItems() {
    this.queue = this.queue.filter(item => item.attempts < item.maxAttempts);
    await this.saveQueue();
    console.log('🗑️ Cleared failed items from queue');
  }

  // Force sync (useful for testing)
  async forceSyncQueue() {
    this.syncInProgress = false;
    await this.syncQueue();
  }
}

// Create singleton instance
const offlineQueueService = new OfflineQueueService();

export default offlineQueueService;