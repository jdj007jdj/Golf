/**
 * Game Persistence Service
 * Handles saving and syncing game data (friends games) with backend
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../config/api';

class GamePersistenceService {
  constructor() {
    this.STORAGE_KEY_PREFIX = 'golf_game_';
    this.ACTIVE_GAMES_KEY = 'active_golf_games';
    this.GAME_HISTORY_KEY = 'golf_game_history';
    this.SYNC_QUEUE_KEY = 'golf_game_sync_queue';
    this.LAST_SYNC_KEY = 'golf_game_last_sync';
  }

  /**
   * Save game data to AsyncStorage
   * @param {string} roundId - The round ID this game belongs to
   * @param {Object} gameData - Complete game data including config, players, scores
   */
  async saveGameData(roundId, gameData) {
    try {
      const storageKey = `${this.STORAGE_KEY_PREFIX}${roundId}`;
      const dataToSave = {
        ...gameData,
        lastUpdated: new Date().toISOString(),
        roundId,
      };

      await AsyncStorage.setItem(storageKey, JSON.stringify(dataToSave));

      // Update active games list
      await this.updateActiveGamesList(roundId);

      console.log(`✅ Game data saved for round ${roundId}`);
      return true;
    } catch (error) {
      console.error('❌ Error saving game data:', error);
      return false;
    }
  }

  /**
   * Load game data from AsyncStorage
   * @param {string} roundId - The round ID to load game data for
   */
  async loadGameData(roundId) {
    try {
      const storageKey = `${this.STORAGE_KEY_PREFIX}${roundId}`;
      const data = await AsyncStorage.getItem(storageKey);
      
      if (!data) {
        console.log(`No game data found for round ${roundId}`);
        return null;
      }

      return JSON.parse(data);
    } catch (error) {
      console.error('❌ Error loading game data:', error);
      return null;
    }
  }

  /**
   * Update the list of active games
   */
  async updateActiveGamesList(roundId) {
    try {
      const activeGamesData = await AsyncStorage.getItem(this.ACTIVE_GAMES_KEY);
      let activeGames = activeGamesData ? JSON.parse(activeGamesData) : [];

      if (!activeGames.includes(roundId)) {
        activeGames.push(roundId);
        await AsyncStorage.setItem(this.ACTIVE_GAMES_KEY, JSON.stringify(activeGames));
      }
    } catch (error) {
      console.error('❌ Error updating active games list:', error);
    }
  }

  /**
   * Get all active games
   */
  async getActiveGames() {
    try {
      const activeGamesData = await AsyncStorage.getItem(this.ACTIVE_GAMES_KEY);
      return activeGamesData ? JSON.parse(activeGamesData) : [];
    } catch (error) {
      console.error('❌ Error getting active games:', error);
      return [];
    }
  }

  /**
   * Mark a game as completed and move to history
   */
  async completeGame(roundId, finalResults) {
    try {
      // Remove from active games
      const activeGamesData = await AsyncStorage.getItem(this.ACTIVE_GAMES_KEY);
      let activeGames = activeGamesData ? JSON.parse(activeGamesData) : [];
      activeGames = activeGames.filter(id => id !== roundId);
      await AsyncStorage.setItem(this.ACTIVE_GAMES_KEY, JSON.stringify(activeGames));

      // Add to game history
      const historyData = await AsyncStorage.getItem(this.GAME_HISTORY_KEY);
      let history = historyData ? JSON.parse(historyData) : [];
      
      const gameData = await this.loadGameData(roundId);
      if (gameData) {
        history.push({
          ...gameData,
          finalResults,
          completedAt: new Date().toISOString(),
        });

        // Keep only last 50 games in history
        if (history.length > 50) {
          history = history.slice(-50);
        }

        await AsyncStorage.setItem(this.GAME_HISTORY_KEY, JSON.stringify(history));
      }

      // Remove the active game data
      const storageKey = `${this.STORAGE_KEY_PREFIX}${roundId}`;
      await AsyncStorage.removeItem(storageKey);

      console.log(`✅ Game completed and moved to history for round ${roundId}`);
      return true;
    } catch (error) {
      console.error('❌ Error completing game:', error);
      return false;
    }
  }

  /**
   * Get game history
   */
  async getGameHistory() {
    try {
      const historyData = await AsyncStorage.getItem(this.GAME_HISTORY_KEY);
      return historyData ? JSON.parse(historyData) : [];
    } catch (error) {
      console.error('❌ Error getting game history:', error);
      return [];
    }
  }

  /**
   * Create game on backend
   */
  async createGameOnBackend(token, roundId, gameConfig, participants) {
    try {
      const requestBody = {
        roundId,
        gameType: gameConfig.format,
        settings: gameConfig.settings,
        participants: participants.map(p => ({
          userId: p.isUser ? p.userId : null,
          guestName: p.isGuest ? p.name : null,
          guestHandicap: p.handicap,
        })),
      };

      console.log('Creating game on backend:', requestBody);

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.GAMES.CREATE}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to create game on backend:', errorData);
        return null;
      }

      const gameData = await response.json();
      console.log('✅ Game created on backend:', gameData.id);
      return gameData.id;
    } catch (error) {
      console.error('❌ Error creating game on backend:', error);
      return null;
    }
  }

  /**
   * Sync game scores to backend
   */
  async syncGameScores(token, gameId, roundParticipantId, holeNumber, scoreData) {
    try {
      const requestBody = {
        gameId,
        roundParticipantId,
        holeNumber,
        scoreData, // This is flexible JSON for different game types
      };

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.GAMES.UPDATE_SCORE}/${gameId}/scores`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to sync game score:', errorData);
        return false;
      }

      console.log(`✅ Game score synced for hole ${holeNumber}`);
      return true;
    } catch (error) {
      console.error('❌ Error syncing game score:', error);
      return false;
    }
  }

  /**
   * Sync complete game state to backend
   * This is called periodically or when online status changes
   */
  async syncGameToBackend(token, roundId) {
    try {
      const gameData = await this.loadGameData(roundId);
      if (!gameData) {
        console.log('No game data to sync');
        return false;
      }

      // Create game if not already created
      if (!gameData.backendGameId) {
        const gameId = await this.createGameOnBackend(
          token,
          roundId,
          gameData.gameConfig,
          gameData.players
        );

        if (gameId) {
          gameData.backendGameId = gameId;
          await this.saveGameData(roundId, gameData);
        } else {
          return false;
        }
      }

      // Sync all scores
      const { playerScores, players, backendGameId } = gameData;
      
      for (const player of players) {
        if (!player.roundParticipantId) continue;

        for (const [holeNumber, score] of Object.entries(playerScores[player.id] || {})) {
          if (score && score > 0) {
            await this.syncGameScores(
              token,
              backendGameId,
              player.roundParticipantId,
              parseInt(holeNumber),
              { score, gameResults: gameData.gameResults }
            );
          }
        }
      }

      console.log(`✅ Game fully synced for round ${roundId}`);
      return true;
    } catch (error) {
      console.error('❌ Error syncing game to backend:', error);
      return false;
    }
  }

  /**
   * Clear all game data (for debugging)
   */
  async clearAllGameData() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const gameKeys = keys.filter(key => 
        key.startsWith(this.STORAGE_KEY_PREFIX) || 
        key === this.ACTIVE_GAMES_KEY || 
        key === this.GAME_HISTORY_KEY ||
        key === this.SYNC_QUEUE_KEY ||
        key === this.LAST_SYNC_KEY
      );
      
      await AsyncStorage.multiRemove(gameKeys);
      console.log('✅ All game data cleared');
      return true;
    } catch (error) {
      console.error('❌ Error clearing game data:', error);
      return false;
    }
  }

  /**
   * Add an item to the sync queue
   */
  async addToSyncQueue(roundId) {
    try {
      const queueData = await AsyncStorage.getItem(this.SYNC_QUEUE_KEY);
      const queue = queueData ? JSON.parse(queueData) : [];
      
      // Check if this round is already in the queue
      if (!queue.includes(roundId)) {
        queue.push(roundId);
        await AsyncStorage.setItem(this.SYNC_QUEUE_KEY, JSON.stringify(queue));
        console.log('➕ Added round to sync queue:', roundId);
      }
    } catch (error) {
      console.error('❌ Error adding to sync queue:', error);
    }
  }

  /**
   * Process the sync queue
   */
  async processSyncQueue(token) {
    try {
      const queueData = await AsyncStorage.getItem(this.SYNC_QUEUE_KEY);
      if (!queueData) return;
      
      const queue = JSON.parse(queueData);
      if (queue.length === 0) return;
      
      console.log(`⏳ Processing ${queue.length} rounds in sync queue`);
      
      const processedRounds = [];
      
      for (const roundId of queue) {
        try {
          const success = await this.syncGameToBackend(token, roundId);
          if (success) {
            processedRounds.push(roundId);
          }
        } catch (error) {
          console.error('❌ Error syncing round:', roundId, error);
        }
      }
      
      // Remove processed items from queue
      const remainingQueue = queue.filter(roundId => !processedRounds.includes(roundId));
      await AsyncStorage.setItem(this.SYNC_QUEUE_KEY, JSON.stringify(remainingQueue));
      
      console.log(`✅ Processed ${processedRounds.length} rounds from sync queue`);
      return processedRounds.length;
    } catch (error) {
      console.error('❌ Error processing sync queue:', error);
      return 0;
    }
  }

  /**
   * Enhanced sync method that handles offline state
   */
  async syncGameToBackendWithQueue(token, roundId) {
    try {
      // First, try to process any queued items
      await this.processSyncQueue(token);
      
      // Then try to sync the current game
      const success = await this.syncGameToBackend(token, roundId);
      
      if (!success) {
        // If sync failed (possibly offline), add to queue
        await this.addToSyncQueue(roundId);
      } else {
        // Record successful sync
        await AsyncStorage.setItem(`${this.LAST_SYNC_KEY}_${roundId}`, new Date().toISOString());
      }
      
      return success;
    } catch (error) {
      console.error('❌ Error in sync with queue:', error);
      // Add to queue on any error
      await this.addToSyncQueue(roundId);
      return false;
    }
  }

  /**
   * Get last sync time for a round
   */
  async getLastSyncTime(roundId) {
    try {
      const lastSync = await AsyncStorage.getItem(`${this.LAST_SYNC_KEY}_${roundId}`);
      return lastSync ? new Date(lastSync) : null;
    } catch (error) {
      console.error('❌ Error getting last sync time:', error);
      return null;
    }
  }
}

// Export singleton instance
export default new GamePersistenceService();