/**
 * @file services/data/dataService.ts
 * @description Unified data service that combines SQLite local storage with API sync
 * This is the main interface for all data operations in the app
 */

import SQLiteDatabase from '@/services/database/sqliteDatabase';
import { apiService } from '@/services/api/apiService';
import { offlineQueue } from '@/services/sync/offlineQueue';
import NetInfo from '@react-native-community/netinfo';
import { logger } from '@/utils/logger';\nimport { errorHandler, withRetry } from '@/services/error/errorHandler';
import { Course, Round, Score, Hole } from '@/types';
import { io, Socket } from 'socket.io-client';

interface SyncStatus {
  lastSync: string | null;
  pendingChanges: number;
  isSyncing: boolean;
  isOnline: boolean;
}

interface ConflictResolution {
  strategy: 'client-wins' | 'server-wins' | 'merge';
  resolver?: (local: any, remote: any) => any;
}

class DataService {
  private db: SQLiteDatabase;
  private socket: Socket | null = null;
  private isOnline: boolean = false;
  private syncInProgress: boolean = false;
  private conflictResolution: ConflictResolution = { strategy: 'server-wins' };
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  constructor() {
    this.db = SQLiteDatabase.getInstance();
    this.initializeNetworkListener();
    this.initializeSocket();
  }

  /**
   * Initialize the data service
   */
  async initialize(): Promise<void> {
    try {
      // Initialize SQLite database
      await this.db.initialize();
      
      // Check network status
      const netInfo = await NetInfo.fetch();
      this.isOnline = netInfo.isConnected ?? false;
      
      // Attempt initial sync if online
      if (this.isOnline) {
        await this.performInitialSync();
      }
      
      logger.info('Data service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize data service:', error);
      throw error;
    }
  }

  /**
   * Initialize network state listener
   */
  private initializeNetworkListener(): void {
    NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected ?? false;
      
      if (wasOffline && this.isOnline) {
        logger.info('Network reconnected, syncing data');
        this.syncPendingChanges();
      }
      
      // Update offline queue
      offlineQueue.handleNetworkChange(this.isOnline);
    });
  }

  /**
   * Initialize WebSocket connection for real-time sync
   */
  private initializeSocket(): void {
    const baseUrl = __DEV__ ? 'http://localhost:3000' : 'https://your-production-api.com';
    
    this.socket = io(baseUrl, {
      transports: ['websocket'],
      autoConnect: false,
    });

    this.socket.on('connect', () => {
      logger.info('WebSocket connected');
      this.subscribeToRealtimeUpdates();
    });

    this.socket.on('disconnect', () => {
      logger.info('WebSocket disconnected');
    });

    // Real-time update handlers
    this.socket.on('course:update', (data) => this.handleRealtimeUpdate('course', data));
    this.socket.on('round:update', (data) => this.handleRealtimeUpdate('round', data));
    this.socket.on('score:update', (data) => this.handleRealtimeUpdate('score', data));

    if (this.isOnline) {
      this.socket.connect();
    }
  }

  /**
   * Subscribe to real-time updates for active rounds
   */
  private subscribeToRealtimeUpdates(): void {
    // Subscribe to updates for active rounds
    // This will be implemented when we have user/round context
  }

  /**
   * Handle real-time updates from server
   */
  private async handleRealtimeUpdate(type: string, data: any): Promise<void> {
    logger.debug(`Received real-time update for ${type}:`, data);
    
    // Update local database
    switch (type) {
      case 'course':
        await this.db.saveCourse(data, false);
        break;
      case 'round':
        await this.db.saveRound(data, false);
        break;
      case 'score':
        await this.db.saveScore(data, false);
        break;
    }
    
    // Notify listeners
    this.notifyListeners(type, data);
  }

  /**
   * Perform initial sync when app starts
   */
  private async performInitialSync(): Promise<void> {
    if (this.syncInProgress) return;
    
    this.syncInProgress = true;
    try {
      // Sync any pending changes first
      await this.syncPendingChanges();
      
      // Then pull latest data from server
      await this.pullLatestData();
      
      logger.info('Initial sync completed');
    } catch (error) {
      logger.error('Initial sync failed:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Sync pending changes to server
   */
  private async syncPendingChanges(): Promise<void> {
    try {
      const pendingOps = await this.db.getOfflineOperations();
      
      for (const op of pendingOps) {
        try {
          await this.syncOperation(op);
          await this.db.removeOfflineOperation(op.id);
        } catch (error) {
          logger.error('Failed to sync operation:', op.id, error);
          await this.db.incrementRetryCount(op.id);
        }
      }
    } catch (error) {
      logger.error('Failed to sync pending changes:', error);
    }
  }

  /**
   * Pull latest data from server
   */
  private async pullLatestData(): Promise<void> {
    try {
      // Get last sync timestamp
      const lastSync = await this.getLastSyncTimestamp();
      
      // Pull updated data since last sync
      const updates = await apiService.get('/sync/updates', {
        params: { since: lastSync }
      });
      
      if (updates.data.success && updates.data.data) {
        // Apply updates to local database
        await this.applyServerUpdates(updates.data.data);
        
        // Update last sync timestamp
        await this.updateLastSyncTimestamp();
      }
    } catch (error) {
      logger.error('Failed to pull latest data:', error);
    }
  }

  /**
   * Sync a single operation
   */
  private async syncOperation(operation: any): Promise<void> {
    const { type, table, data } = operation;
    
    switch (type) {
      case 'insert':
        await apiService.post(`/${table}`, data);
        break;
      case 'update':
        await apiService.put(`/${table}/${data.id}`, data);
        break;
      case 'delete':
        await apiService.delete(`/${table}/${data.id}`);
        break;
    }
  }

  /**
   * Apply updates from server
   */
  private async applyServerUpdates(updates: any): Promise<void> {
    // Apply updates based on conflict resolution strategy
    for (const update of updates.courses || []) {
      await this.resolveAndApply('course', update);
    }
    
    for (const update of updates.rounds || []) {
      await this.resolveAndApply('round', update);
    }
    
    for (const update of updates.scores || []) {
      await this.resolveAndApply('score', update);
    }
  }

  /**
   * Resolve conflicts and apply updates
   */
  private async resolveAndApply(type: string, remoteData: any): Promise<void> {
    let localData: any = null;
    
    // Get local data
    switch (type) {
      case 'course':
        localData = await this.db.getCourse(remoteData.id);
        break;
      case 'round':
        // Add getRound method to SQLiteDatabase if needed
        break;
      case 'score':
        // Add getScore method to SQLiteDatabase if needed
        break;
    }
    
    // Apply conflict resolution
    let dataToSave = remoteData;
    
    if (localData && this.conflictResolution.strategy === 'merge') {
      if (this.conflictResolution.resolver) {
        dataToSave = this.conflictResolution.resolver(localData, remoteData);
      }
    } else if (localData && this.conflictResolution.strategy === 'client-wins') {
      // Keep local data
      return;
    }
    
    // Save resolved data
    switch (type) {
      case 'course':
        await this.db.saveCourse(dataToSave, false);
        break;
      case 'round':
        await this.db.saveRound(dataToSave, false);
        break;
      case 'score':
        await this.db.saveScore(dataToSave, false);
        break;
    }
  }

  // Public API Methods

  /**
   * Get all courses
   */
  async getCourses(): Promise<Course[]> {
    return withRetry(
      async () => {
        // Always return from local database
        const courses = await this.db.getCourses();
        
        // Trigger background sync if online
        if (this.isOnline && !this.syncInProgress) {
          this.syncInBackground();
        }
        
        return courses;
      },
      {
        action: 'getCourses',
        component: 'DataService',
      }
    );
  }

  /**
   * Get a specific course
   */
  async getCourse(id: string): Promise<Course | null> {
    try {
      return await this.db.getCourse(id);
    } catch (error) {
      logger.error('Failed to get course:', error);
      throw error;
    }
  }

  /**
   * Create or update a course
   */
  async saveCourse(course: Course): Promise<Course> {
    try {
      // Save to local database
      const savedCourse = await this.db.saveCourse(course, !this.isOnline);
      
      // Notify listeners
      this.notifyListeners('course', savedCourse);
      
      // Sync if online
      if (this.isOnline) {
        this.syncInBackground();
      }
      
      return savedCourse;
    } catch (error) {
      logger.error('Failed to save course:', error);
      throw error;
    }
  }

  /**
   * Get rounds
   */
  async getRounds(playerId?: string): Promise<Round[]> {
    try {
      const rounds = await this.db.getRounds(playerId);
      
      if (this.isOnline && !this.syncInProgress) {
        this.syncInBackground();
      }
      
      return rounds;
    } catch (error) {
      logger.error('Failed to get rounds:', error);
      throw error;
    }
  }

  /**
   * Save a round
   */
  async saveRound(round: Round): Promise<Round> {
    try {
      const savedRound = await this.db.saveRound(round, !this.isOnline);
      
      // If this is an active round, subscribe to real-time updates
      if (this.socket && this.socket.connected && round.status === 'active') {
        this.socket.emit('round:subscribe', round.id);
      }
      
      this.notifyListeners('round', savedRound);
      
      if (this.isOnline) {
        this.syncInBackground();
      }
      
      return savedRound;
    } catch (error) {
      logger.error('Failed to save round:', error);
      throw error;
    }
  }

  /**
   * Save a score
   */
  async saveScore(score: Score): Promise<Score> {
    try {
      const savedScore = await this.db.saveScore(score, !this.isOnline);
      
      // Emit real-time update if connected
      if (this.socket && this.socket.connected) {
        this.socket.emit('score:update', savedScore);
      }
      
      this.notifyListeners('score', savedScore);
      
      if (this.isOnline) {
        this.syncInBackground();
      }
      
      return savedScore;
    } catch (error) {
      logger.error('Failed to save score:', error);
      throw error;
    }
  }

  /**
   * Get sync status
   */
  async getSyncStatus(): Promise<SyncStatus> {
    const offlineOps = await this.db.getOfflineOperations();
    const lastSync = await this.getLastSyncTimestamp();
    
    return {
      lastSync,
      pendingChanges: offlineOps.length,
      isSyncing: this.syncInProgress,
      isOnline: this.isOnline,
    };
  }

  /**
   * Force sync
   */
  async forceSync(): Promise<void> {
    if (!this.isOnline) {
      throw new Error('Cannot sync while offline');
    }
    
    await this.performInitialSync();
  }

  /**
   * Subscribe to data changes
   */
  subscribe(type: string, callback: (data: any) => void): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    
    this.listeners.get(type)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners.get(type)?.delete(callback);
    };
  }

  /**
   * Set conflict resolution strategy
   */
  setConflictResolution(resolution: ConflictResolution): void {
    this.conflictResolution = resolution;
  }

  // Private helper methods

  private async syncInBackground(): Promise<void> {
    // Debounce sync calls
    setTimeout(() => {
      this.performInitialSync();
    }, 1000);
  }

  private notifyListeners(type: string, data: any): void {
    this.listeners.get(type)?.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        logger.error('Error in data listener:', error);
      }
    });
  }

  private async getLastSyncTimestamp(): Promise<string | null> {
    // TODO: Implement persistent storage of last sync timestamp
    return null;
  }

  private async updateLastSyncTimestamp(): Promise<void> {
    // TODO: Implement persistent storage of last sync timestamp
  }

  /**
   * Clear all local data
   */
  async clearAllData(): Promise<void> {
    await this.db.clearAllData();
    await offlineQueue.clearQueue();
  }

  /**
   * Close connections
   */
  async close(): Promise<void> {
    if (this.socket) {
      this.socket.disconnect();
    }
    await this.db.close();
  }
}

export const dataService = new DataService();