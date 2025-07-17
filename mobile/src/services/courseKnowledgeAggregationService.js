/**
 * CourseKnowledgeAggregationService
 * 
 * Handles aggregation and synchronization of course learning data
 * Manages contributions from multiple users and conflict resolution
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../config/api';
import offlineQueueService from './offlineQueueService';
import { CourseKnowledge } from '../models/CourseKnowledge';

class CourseKnowledgeAggregationService {
  constructor() {
    this.initialized = false;
    this.lastSyncKey = 'last_course_knowledge_sync';
    this.syncIntervalMinutes = 30; // Sync every 30 minutes
    this.syncTimer = null;
    this.contributorId = null;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      console.log('🎓 Initializing CourseKnowledgeAggregationService...');
      
      // Initialize offline queue
      await offlineQueueService.initialize();
      
      // Get or create contributor ID
      this.contributorId = await this.getContributorId();
      
      // Start periodic sync
      this.startPeriodicSync();
      
      this.initialized = true;
      console.log('✅ CourseKnowledgeAggregationService initialized');
    } catch (error) {
      console.error('❌ Error initializing CourseKnowledgeAggregationService:', error);
    }
  }

  async getContributorId() {
    try {
      let contributorId = await AsyncStorage.getItem('contributor_id');
      if (!contributorId) {
        contributorId = `contributor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await AsyncStorage.setItem('contributor_id', contributorId);
      }
      return contributorId;
    } catch (error) {
      console.error('❌ Error getting contributor ID:', error);
      return 'unknown_contributor';
    }
  }

  startPeriodicSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    this.syncTimer = setInterval(() => {
      this.syncCourseKnowledge();
    }, this.syncIntervalMinutes * 60 * 1000);

    console.log(`⏰ Course knowledge sync started (every ${this.syncIntervalMinutes} minutes)`);
  }

  stopPeriodicSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
      console.log('⏹️ Course knowledge sync stopped');
    }
  }

  async syncCourseKnowledge() {
    try {
      console.log('🎓 Starting course knowledge sync...');
      
      const token = await this.getAuthToken();
      if (!token) {
        console.log('❌ No auth token available, skipping sync');
        return;
      }

      // Get all course knowledge that needs sync
      const pendingKnowledge = await this.getPendingKnowledge();
      
      if (pendingKnowledge.length === 0) {
        console.log('✅ No pending course knowledge to sync');
        return;
      }

      // Sync each course
      for (const knowledge of pendingKnowledge) {
        await this.syncCourseData(token, knowledge);
      }

      console.log(`✅ Synced knowledge for ${pendingKnowledge.length} courses`);
      
    } catch (error) {
      console.error('❌ Error syncing course knowledge:', error);
    }
  }

  async syncCourseData(token, knowledge) {
    try {
      // Prepare knowledge for sync
      const syncData = {
        courseId: knowledge.courseId,
        contributorId: this.contributorId,
        knowledge: {
          lastUpdated: knowledge.lastUpdated,
          holes: knowledge.holes.map(hole => ({
            holeNumber: hole.holeNumber,
            par: hole.par,
            teeBoxes: hole.teeBoxes.map(teeBox => ({
              color: teeBox.color,
              coordinates: teeBox.coordinates,
              confidence: teeBox.confidence,
              samples: teeBox.samples,
              lastSeen: teeBox.lastSeen,
              avgAccuracy: teeBox.avgAccuracy
            })),
            pin: {
              current: hole.pin.current,
              history: hole.pin.history,
              center: hole.pin.center
            },
            green: {
              boundary: hole.green.boundary,
              confidence: hole.green.confidence,
              samples: hole.green.samples,
              area: hole.green.area
            }
          }))
        },
        metadata: {
          deviceId: await this.getDeviceId(),
          appVersion: '1.0.0',
          syncTimestamp: new Date().toISOString()
        }
      };

      // Add to offline queue for reliable sync
      await offlineQueueService.queueCourseKnowledgeSync(token, knowledge.courseId, syncData);
      
      // Mark knowledge as sync-pending
      await this.markKnowledgeAsSyncPending(knowledge.courseId);
      
      console.log(`📤 Queued course knowledge for ${knowledge.courseId}`);
      
    } catch (error) {
      console.error(`❌ Error syncing course ${knowledge.courseId}:`, error);
      throw error;
    }
  }

  async getPendingKnowledge() {
    try {
      const storageKey = 'course_knowledge_v1';
      const data = await AsyncStorage.getItem(storageKey);
      
      if (!data) {
        return [];
      }

      const parsed = JSON.parse(data);
      const pendingKnowledge = [];
      
      Object.keys(parsed).forEach(courseId => {
        const knowledge = parsed[courseId];
        
        // Check if needs sync (has new data or hasn't been synced)
        if (!knowledge.lastSynced || knowledge.lastUpdated > knowledge.lastSynced) {
          pendingKnowledge.push(new CourseKnowledge(knowledge));
        }
      });
      
      return pendingKnowledge;
    } catch (error) {
      console.error('❌ Error getting pending knowledge:', error);
      return [];
    }
  }

  async markKnowledgeAsSyncPending(courseId) {
    try {
      const storageKey = 'course_knowledge_v1';
      const data = await AsyncStorage.getItem(storageKey);
      
      if (data) {
        const parsed = JSON.parse(data);
        
        if (parsed[courseId]) {
          parsed[courseId].syncPending = true;
          await AsyncStorage.setItem(storageKey, JSON.stringify(parsed));
        }
      }
    } catch (error) {
      console.error('❌ Error marking knowledge as sync pending:', error);
    }
  }

  async markKnowledgeAsSynced(courseId) {
    try {
      const storageKey = 'course_knowledge_v1';
      const data = await AsyncStorage.getItem(storageKey);
      
      if (data) {
        const parsed = JSON.parse(data);
        
        if (parsed[courseId]) {
          parsed[courseId].synced = true;
          parsed[courseId].syncPending = false;
          parsed[courseId].lastSynced = new Date().toISOString();
          await AsyncStorage.setItem(storageKey, JSON.stringify(parsed));
        }
      }
      
      // Update last sync timestamp
      await AsyncStorage.setItem(this.lastSyncKey, new Date().toISOString());
      
    } catch (error) {
      console.error('❌ Error marking knowledge as synced:', error);
    }
  }

  async downloadCourseKnowledge(courseId) {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('No auth token available');
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.COURSE_LEARNING.DATA}/${courseId}`, {
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
      console.log(`📥 Downloaded course knowledge for ${courseId}`);
      
      return result;
      
    } catch (error) {
      console.error(`❌ Error downloading course knowledge for ${courseId}:`, error);
      throw error;
    }
  }

  async mergeCourseKnowledge(localKnowledge, serverKnowledge) {
    try {
      console.log(`🔄 Merging course knowledge for ${localKnowledge.courseId}`);
      
      const merged = new CourseKnowledge(localKnowledge);
      
      // Merge each hole
      serverKnowledge.holes.forEach(serverHole => {
        let localHole = merged.holes.find(h => h.holeNumber === serverHole.holeNumber);
        
        if (!localHole) {
          // Add new hole from server
          merged.holes.push(serverHole);
          return;
        }

        // Merge tee boxes
        this.mergeTeeBoxes(localHole, serverHole);
        
        // Merge pin positions
        this.mergePinPositions(localHole, serverHole);
        
        // Merge green boundaries
        this.mergeGreenBoundaries(localHole, serverHole);
      });

      // Update contributor count
      merged.contributorCount = Math.max(
        localKnowledge.contributorCount || 0,
        serverKnowledge.contributorCount || 0
      );

      // Update last updated
      merged.lastUpdated = new Date().toISOString();
      
      console.log(`✅ Merged course knowledge for ${localKnowledge.courseId}`);
      return merged;
      
    } catch (error) {
      console.error('❌ Error merging course knowledge:', error);
      throw error;
    }
  }

  mergeTeeBoxes(localHole, serverHole) {
    // Merge tee boxes by color and proximity
    serverHole.teeBoxes.forEach(serverTeeBox => {
      const localTeeBox = localHole.teeBoxes.find(tb => 
        tb.color === serverTeeBox.color &&
        this.calculateDistance(
          tb.coordinates.latitude,
          tb.coordinates.longitude,
          serverTeeBox.coordinates.latitude,
          serverTeeBox.coordinates.longitude
        ) < 20 // Within 20 meters
      );

      if (localTeeBox) {
        // Merge existing tee box (use higher confidence)
        if (serverTeeBox.confidence > localTeeBox.confidence) {
          localTeeBox.coordinates = serverTeeBox.coordinates;
          localTeeBox.confidence = serverTeeBox.confidence;
        }
        localTeeBox.samples = Math.max(localTeeBox.samples, serverTeeBox.samples);
      } else {
        // Add new tee box from server
        localHole.teeBoxes.push(serverTeeBox);
      }
    });
  }

  mergePinPositions(localHole, serverHole) {
    // Merge pin history
    serverHole.pin.history.forEach(serverPin => {
      const existingPin = localHole.pin.history.find(p => 
        new Date(p.date).toDateString() === new Date(serverPin.date).toDateString()
      );

      if (!existingPin) {
        localHole.pin.history.push(serverPin);
      } else if (serverPin.samples > existingPin.samples) {
        // Use server data if it has more samples
        existingPin.latitude = serverPin.latitude;
        existingPin.longitude = serverPin.longitude;
        existingPin.samples = serverPin.samples;
      }
    });

    // Update current pin if server has higher confidence
    if (serverHole.pin.current.confidence > localHole.pin.current.confidence) {
      localHole.pin.current = serverHole.pin.current;
    }

    // Update center if server has more data
    if (serverHole.pin.center.latitude && 
        (!localHole.pin.center.latitude || serverHole.pin.history.length > localHole.pin.history.length)) {
      localHole.pin.center = serverHole.pin.center;
    }
  }

  mergeGreenBoundaries(localHole, serverHole) {
    // Use server green boundary if it has higher confidence
    if (serverHole.green.confidence > localHole.green.confidence) {
      localHole.green.boundary = serverHole.green.boundary;
      localHole.green.confidence = serverHole.green.confidence;
      localHole.green.area = serverHole.green.area;
    }
    
    // Combine samples
    localHole.green.samples = Math.max(localHole.green.samples, serverHole.green.samples);
  }

  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  }

  async getAuthToken() {
    try {
      // Check both AsyncStorage and the standard auth_token key
      let token = await AsyncStorage.getItem('auth_token');
      
      // If not found, try the token key that might be used by auth context
      if (!token) {
        token = await AsyncStorage.getItem('token');
      }
      
      // If still not found, try userToken key
      if (!token) {
        token = await AsyncStorage.getItem('userToken');
      }
      
      // If still not found, try authToken key (camelCase)
      if (!token) {
        token = await AsyncStorage.getItem('authToken');
      }
      
      return token;
    } catch (error) {
      console.error('❌ Error getting auth token:', error);
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

  async getLastSyncTime() {
    try {
      const timestamp = await AsyncStorage.getItem(this.lastSyncKey);
      return timestamp ? new Date(timestamp) : null;
    } catch (error) {
      console.error('❌ Error getting last sync time:', error);
      return null;
    }
  }

  // Manual sync trigger
  async forceSyncCourseKnowledge() {
    console.log('🔄 Force syncing all course knowledge...');
    await this.syncCourseKnowledge();
  }

  // Sync specific course
  async syncCourseById(courseId) {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('No auth token available');
      }

      const storageKey = 'course_knowledge_v1';
      const data = await AsyncStorage.getItem(storageKey);
      
      if (!data || !JSON.parse(data)[courseId]) {
        throw new Error(`No knowledge found for course ${courseId}`);
      }

      const knowledge = new CourseKnowledge(JSON.parse(data)[courseId]);
      await this.syncCourseData(token, knowledge);
      
    } catch (error) {
      console.error(`❌ Error syncing course ${courseId}:`, error);
      throw error;
    }
  }

  // Get contribution stats
  async getContributionStats() {
    try {
      const storageKey = 'course_knowledge_v1';
      const data = await AsyncStorage.getItem(storageKey);
      
      if (!data) {
        return { courses: 0, holes: 0, shots: 0 };
      }

      const parsed = JSON.parse(data);
      let totalCourses = 0;
      let totalHoles = 0;
      let totalShots = 0;

      Object.values(parsed).forEach(knowledge => {
        totalCourses++;
        totalHoles += knowledge.holes.length;
        
        knowledge.holes.forEach(hole => {
          totalShots += hole.teeBoxes.reduce((sum, tb) => sum + tb.samples, 0);
          totalShots += hole.pin.history.reduce((sum, p) => sum + p.samples, 0);
          totalShots += hole.green.samples;
        });
      });

      return {
        courses: totalCourses,
        holes: totalHoles,
        shots: totalShots,
        contributorId: this.contributorId
      };
      
    } catch (error) {
      console.error('❌ Error getting contribution stats:', error);
      return { courses: 0, holes: 0, shots: 0 };
    }
  }

  // Get sync status
  getSyncStatus() {
    const queueStatus = offlineQueueService.getQueueStatus();
    
    return {
      ...queueStatus,
      lastSyncTime: this.getLastSyncTime(),
      periodicSyncEnabled: this.syncTimer !== null,
      syncIntervalMinutes: this.syncIntervalMinutes,
      contributorId: this.contributorId
    };
  }

  // Update sync interval
  updateSyncInterval(minutes) {
    this.syncIntervalMinutes = minutes;
    this.startPeriodicSync(); // Restart with new interval
    console.log(`⏰ Course knowledge sync interval updated to ${minutes} minutes`);
  }
}

// Create singleton instance
const courseKnowledgeAggregationService = new CourseKnowledgeAggregationService();

export default courseKnowledgeAggregationService;