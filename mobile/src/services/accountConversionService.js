/**
 * Account Conversion Service
 * 
 * Handles converting local accounts to online accounts
 * Reuses existing sync services for data upload
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../config/api';
import offlineQueueService from './offlineQueueService';
import shotSyncService from './shotSyncService';
import gamePersistenceService from './gamePersistenceService';
import syncResultTracker from './syncResultTracker';
import localAuthService from './localAuthService';

class AccountConversionService {
  constructor() {
    this.initialized = false;
    this.conversionInProgress = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      console.log('🔄 Initializing AccountConversionService...');
      
      // Initialize dependent services
      await offlineQueueService.initialize();
      await shotSyncService.initialize();
      
      this.initialized = true;
      console.log('✅ AccountConversionService initialized');
    } catch (error) {
      console.error('❌ Error initializing AccountConversionService:', error);
    }
  }

  /**
   * Convert local data to online account
   * @param {string} token - Auth token from newly created online account
   * @param {string} conversionId - Conversion tracking ID
   * @param {Object} localData - Local data to convert
   * @param {Function} progressCallback - Progress update callback
   */
  async convertLocalData(token, conversionId, localData, progressCallback) {
    if (this.conversionInProgress) {
      return { success: false, error: 'Conversion already in progress' };
    }

    this.conversionInProgress = true;
    
    try {
      console.log('🔄 Starting local data conversion...');
      
      let totalItems = localData.rounds.length + localData.shots.length + localData.games.length;
      let processedItems = 0;
      
      // Progress helper
      const updateProgress = (status, message) => {
        processedItems++;
        const percentage = Math.round((processedItems / totalItems) * 100);
        if (progressCallback) {
          progressCallback({
            status,
            message,
            percentage,
            current: processedItems,
            total: totalItems
          });
        }
      };

      // 1. Convert rounds
      if (localData.rounds.length > 0) {
        progressCallback({ status: 'uploading', message: 'Uploading rounds...' });
        
        for (const round of localData.rounds) {
          try {
            await this.uploadRound(token, round);
            updateProgress('uploading', `Uploaded round ${round.id}`);
          } catch (error) {
            console.error('Failed to upload round:', round.id, error);
            // Continue with other rounds
          }
        }
      }

      // 2. Convert shots
      if (localData.shots.length > 0) {
        progressCallback({ status: 'uploading', message: 'Uploading shots...' });
        
        // Group shots by round for batch upload
        const shotsByRound = this.groupShotsByRound(localData.shots);
        
        for (const [roundId, shots] of Object.entries(shotsByRound)) {
          try {
            // Use the existing shot sync service pattern
            await this.uploadShots(token, roundId, shots);
            updateProgress('uploading', `Uploaded ${shots.length} shots for round ${roundId}`);
          } catch (error) {
            console.error('Failed to upload shots for round:', roundId, error);
            // Continue with other rounds
          }
        }
      }

      // 3. Convert games
      if (localData.games.length > 0) {
        progressCallback({ status: 'uploading', message: 'Uploading games...' });
        
        for (const game of localData.games) {
          try {
            await this.uploadGame(token, game);
            updateProgress('uploading', `Uploaded game ${game.id}`);
          } catch (error) {
            console.error('Failed to upload game:', game.id, error);
            // Continue with other games
          }
        }
      }

      // 4. Update conversion status
      progressCallback({ status: 'finalizing', message: 'Finalizing conversion...' });
      await this.updateConversionStatus(token, conversionId, 'completed');

      // 5. Clear local data
      progressCallback({ status: 'cleaning', message: 'Cleaning up local data...' });
      await localAuthService.clearLocalDataAfterConversion(localData.user.username);

      console.log('✅ Local data conversion completed');
      return { success: true };

    } catch (error) {
      console.error('❌ Error during conversion:', error);
      
      // Update conversion status to failed
      try {
        await this.updateConversionStatus(token, conversionId, 'failed', error.message);
      } catch (updateError) {
        console.error('Failed to update conversion status:', updateError);
      }
      
      return { 
        success: false, 
        error: error.message || 'Conversion failed' 
      };
    } finally {
      this.conversionInProgress = false;
    }
  }

  // Group shots by round ID
  groupShotsByRound(shots) {
    return shots.reduce((groups, shot) => {
      const roundId = shot.roundId;
      if (!groups[roundId]) {
        groups[roundId] = [];
      }
      groups[roundId].push(shot);
      return groups;
    }, {});
  }

  // Upload a single round
  async uploadRound(token, round) {
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ROUNDS}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        courseId: round.courseId,
        teeBoxId: round.teeBoxId,
        startedAt: round.startedAt,
        completedAt: round.completedAt,
        scores: round.scores,
        putts: round.putts,
        weather: round.weather,
        notes: round.notes
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to upload round');
    }

    return await response.json();
  }

  // Upload shots for a round
  async uploadShots(token, roundId, shots) {
    // Use the existing shot sync pattern
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SHOTS.SYNC}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        shots: shots.map(shot => ({
          ...shot,
          roundId: roundId // Ensure roundId is set
        }))
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to upload shots');
    }

    const result = await response.json();
    
    // Track the sync result
    syncResultTracker.trackShotSync(result);
    
    return result;
  }

  // Upload a game
  async uploadGame(token, game) {
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.GAMES}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        roundId: game.roundId,
        gameConfig: game.gameConfig,
        players: game.players,
        playerScores: game.playerScores,
        gameResults: game.gameResults,
        startedAt: game.startedAt,
        completedAt: game.completedAt
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to upload game');
    }

    return await response.json();
  }

  // Update conversion status on backend
  async updateConversionStatus(token, conversionId, status, error = null) {
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/conversion/${conversionId}/status`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        status,
        error,
        completedAt: status === 'completed' ? new Date().toISOString() : null
      })
    });

    if (!response.ok) {
      console.error('Failed to update conversion status');
    }
  }

  // Get conversion status
  async getConversionStatus(token, conversionId) {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/conversion/${conversionId}/status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Error getting conversion status:', error);
    }
    
    return null;
  }
}

// Create singleton instance
const accountConversionService = new AccountConversionService();

export default accountConversionService;