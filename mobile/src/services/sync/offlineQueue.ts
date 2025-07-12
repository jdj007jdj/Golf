/**
 * @file services/sync/offlineQueue.ts
 * @description Offline queue management for data synchronization
 */

import { v4 as uuidv4 } from 'uuid';
import { storageService } from '@/services/storage/storageService';
import { apiService } from '@/services/api/apiService';
import { logger } from '@/utils/logger';
import { SyncQueueItem, OfflineQueue } from '@/types';

const OFFLINE_QUEUE_KEY = 'offline_queue';
const MAX_RETRY_COUNT = 3;
const RETRY_DELAY_BASE = 1000; // Base delay in milliseconds

/**
 * Offline queue service for handling data synchronization
 */
export class OfflineQueueService {
  private queue: OfflineQueue = {
    pending: [],
    failed: [],
    syncing: false,
  };

  constructor() {
    this.loadQueue();
  }

  /**
   * Load queue from storage
   */
  private async loadQueue(): Promise<void> {
    try {
      const savedQueue = await storageService.get<OfflineQueue>(OFFLINE_QUEUE_KEY);
      if (savedQueue) {
        this.queue = {
          ...savedQueue,
          syncing: false, // Reset syncing state on app start
        };
      }
    } catch (error) {
      logger.error('Failed to load offline queue:', error);
    }
  }

  /**
   * Save queue to storage
   */
  private async saveQueue(): Promise<void> {
    try {
      await storageService.store(OFFLINE_QUEUE_KEY, this.queue);
    } catch (error) {
      logger.error('Failed to save offline queue:', error);
    }
  }

  /**
   * Add item to queue
   */
  async addToQueue(
    tableName: string,
    operation: 'insert' | 'update' | 'delete',
    recordId: string,
    data: any
  ): Promise<void> {
    const item: SyncQueueItem = {
      id: uuidv4(),
      tableName,
      operation,
      recordId,
      data,
      createdAt: new Date().toISOString(),
      retryCount: 0,
    };

    this.queue.pending.push(item);
    await this.saveQueue();
    
    logger.debug('Added item to offline queue:', {
      id: item.id,
      tableName,
      operation,
      recordId,
    });

    // Try to sync if online
    this.attemptSync();
  }

  /**
   * Remove item from queue
   */
  async removeFromQueue(itemId: string): Promise<void> {
    this.queue.pending = this.queue.pending.filter(item => item.id !== itemId);
    this.queue.failed = this.queue.failed.filter(item => item.id !== itemId);
    await this.saveQueue();
  }

  /**
   * Move item to failed queue
   */
  private async moveToFailed(item: SyncQueueItem, error: string): Promise<void> {
    const failedItem = {
      ...item,
      lastError: error,
    };

    this.queue.failed.push(failedItem);
    this.queue.pending = this.queue.pending.filter(queueItem => queueItem.id !== item.id);
    await this.saveQueue();
  }

  /**
   * Retry failed items
   */
  async retryFailed(): Promise<void> {
    const failedItems = [...this.queue.failed];
    this.queue.failed = [];
    this.queue.pending.push(...failedItems);
    await this.saveQueue();
    this.attemptSync();
  }

  /**
   * Clear all queues
   */
  async clearQueue(): Promise<void> {
    this.queue.pending = [];
    this.queue.failed = [];
    this.queue.syncing = false;
    await this.saveQueue();
  }

  /**
   * Get queue status
   */
  getQueueStatus(): OfflineQueue {
    return { ...this.queue };
  }

  /**
   * Attempt to sync pending items
   */
  async attemptSync(): Promise<void> {
    if (this.queue.syncing || this.queue.pending.length === 0) {
      return;
    }

    this.queue.syncing = true;
    await this.saveQueue();

    logger.info(`Starting sync of ${this.queue.pending.length} items`);

    const itemsToSync = [...this.queue.pending];
    
    for (const item of itemsToSync) {
      try {
        await this.syncItem(item);
        await this.removeFromQueue(item.id);
        logger.debug(`Successfully synced item: ${item.id}`);
      } catch (error: any) {
        logger.error(`Failed to sync item: ${item.id}`, error);
        
        item.retryCount++;
        if (item.retryCount >= MAX_RETRY_COUNT) {
          await this.moveToFailed(item, error.message || 'Unknown error');
        } else {
          // Exponential backoff for retry
          const delay = RETRY_DELAY_BASE * Math.pow(2, item.retryCount - 1);
          setTimeout(() => {
            // Item will be retried in next sync attempt
          }, delay);
        }
      }
    }

    this.queue.syncing = false;
    this.queue.lastSync = new Date().toISOString();
    await this.saveQueue();

    logger.info('Sync completed');
  }

  /**
   * Sync individual item
   */
  private async syncItem(item: SyncQueueItem): Promise<void> {
    const { tableName, operation, recordId, data } = item;

    switch (operation) {
      case 'insert':
        await apiService.post(`/sync/${tableName}`, data);
        break;
      
      case 'update':
        await apiService.put(`/sync/${tableName}/${recordId}`, data);
        break;
      
      case 'delete':
        await apiService.delete(`/sync/${tableName}/${recordId}`);
        break;
      
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  }

  /**
   * Handle network status change
   */
  async handleNetworkChange(isOnline: boolean): Promise<void> {
    if (isOnline && this.queue.pending.length > 0) {
      logger.info('Network reconnected, attempting sync');
      await this.attemptSync();
    }
  }

  /**
   * Force sync (useful for manual sync triggers)
   */
  async forceSync(): Promise<void> {
    this.queue.syncing = false; // Reset syncing state
    await this.attemptSync();
  }

  /**
   * Get pending count
   */
  getPendingCount(): number {
    return this.queue.pending.length;
  }

  /**
   * Get failed count
   */
  getFailedCount(): number {
    return this.queue.failed.length;
  }

  /**
   * Check if queue is empty
   */
  isEmpty(): boolean {
    return this.queue.pending.length === 0 && this.queue.failed.length === 0;
  }

  /**
   * Check if currently syncing
   */
  isSyncing(): boolean {
    return this.queue.syncing;
  }
}

export const offlineQueue = new OfflineQueueService();