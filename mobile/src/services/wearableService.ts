import { NativeModules, NativeEventEmitter, EmitterSubscription } from 'react-native';

// Native module interface
interface WearableModuleInterface {
  startRound(roundData: RoundData): Promise<boolean>;
  endRound(): Promise<boolean>;
  sendStatsToWatch(stats: StatsData): Promise<boolean>;
  updateCurrentHole(holeNumber: number): Promise<boolean>;
  isWatchConnected(): Promise<boolean>;
  
  // Message API methods
  sendTestBroadcast(message: string): Promise<boolean>;
  sendRoundDataMessage(roundData: RoundData): Promise<boolean>;
  sendHoleDataMessage(holeData: HoleData): Promise<boolean>;
  sendShotDataMessage(shotData: ShotBroadcastData): Promise<boolean>;
  sendStatsDataMessage(statsData: StatsBroadcastData): Promise<boolean>;
  
  // Debug methods
  getConnectedNodes(): Promise<{nodes: any[], count: number}>;
  sendMessage(nodeId: string, path: string, message: string): Promise<any>;
}

// Data types
export interface RoundData {
  roundId: string;
  courseName: string;
  currentHole: number;
  totalHoles: number;
}

export interface StatsData {
  distanceToPin: number;
  distanceLastShot: number;
  measurementUnit: 'metric' | 'imperial';
  currentHole: number;
}

export interface ShotData {
  timestamp: number;
  latitude: number;
  longitude: number;
  accuracy: number;
  holeNumber: number;
}

export interface ClubData {
  club: string;
  timestamp: number;
}

export interface PuttData {
  putts: number;
  holeNumber: number;
}

export interface ConnectionStatus {
  connected: boolean;
  nodeCount: number;
}

export interface HoleData {
  holeNumber: number;
  par: number;
  distance: number;
}

export interface ShotBroadcastData {
  club: string;
  distance: number;
  latitude: number;
  longitude: number;
}

export interface StatsBroadcastData {
  distanceToPin: number;
  currentScore: number;
  totalScore: number;
}

// Event types
export type WearableEventType = 
  | 'onShotRecorded'
  | 'onClubSelected'
  | 'onPuttUpdated'
  | 'onConnectionStatusChanged'
  | 'onSyncStatusChanged';

// Native module
const { WearableModule } = NativeModules;
const wearableEventEmitter = WearableModule ? new NativeEventEmitter(WearableModule) : null;

class WearableService {
  private subscriptions: Map<string, EmitterSubscription> = new Map();
  private isInitialized = false;

  initialize() {
    if (!WearableModule) {
      console.warn('WearableModule is not available. Make sure the native module is properly linked.');
      return;
    }

    if (this.isInitialized) {
      return;
    }

    this.isInitialized = true;
    console.log('WearableService initialized');
  }

  // Round management
  async startRound(roundData: RoundData): Promise<boolean> {
    console.log('[WearableService] startRound called with:', roundData);
    
    if (!WearableModule) {
      console.warn('[WearableService] WearableModule not available');
      return false;
    }
    
    try {
      // Use the Wearable MessageClient API
      console.log('[WearableService] Sending round data via Wearable API...');
      const result = await WearableModule.sendRoundDataMessage(roundData);
      console.log('[WearableService] Round started successfully:', result);
      return result;
    } catch (error) {
      console.error('[WearableService] Error starting round on watch:', error);
      return false;
    }
  }

  async endRound(): Promise<boolean> {
    if (!WearableModule) return false;
    
    try {
      return await WearableModule.endRound();
    } catch (error) {
      console.error('Error ending round on watch:', error);
      return false;
    }
  }

  // Stats updates
  async sendStats(stats: StatsData): Promise<boolean> {
    if (!WearableModule) return false;
    
    try {
      return await WearableModule.sendStatsToWatch(stats);
    } catch (error) {
      console.error('Error sending stats to watch:', error);
      return false;
    }
  }

  async updateHole(holeNumber: number): Promise<boolean> {
    if (!WearableModule) return false;
    
    try {
      return await WearableModule.updateCurrentHole(holeNumber);
    } catch (error) {
      console.error('Error updating hole on watch:', error);
      return false;
    }
  }

  async updateScore(holeNumber: number, score: number): Promise<boolean> {
    if (!WearableModule) return false;
    
    try {
      console.log('[WearableService] Updating score on watch:', { holeNumber, score });
      // Send score update message to watch
      const scoreData = JSON.stringify({ holeNumber, score });
      return await WearableModule.sendMessage('', '/score/update', scoreData);
    } catch (error) {
      console.error('Error updating score on watch:', error);
      return false;
    }
  }

  // Connection status
  async isConnected(): Promise<boolean> {
    if (!WearableModule) return false;
    
    try {
      return await WearableModule.isWatchConnected();
    } catch (error) {
      console.error('Error checking watch connection:', error);
      return false;
    }
  }

  // Event subscriptions
  onShotRecorded(callback: (data: ShotData) => void): () => void {
    if (!wearableEventEmitter) {
      return () => {};
    }

    const subscription = wearableEventEmitter.addListener('onShotRecorded', callback);
    this.subscriptions.set('onShotRecorded', subscription);
    
    return () => {
      subscription.remove();
      this.subscriptions.delete('onShotRecorded');
    };
  }

  onClubSelected(callback: (data: ClubData) => void): () => void {
    if (!wearableEventEmitter) {
      return () => {};
    }

    const subscription = wearableEventEmitter.addListener('onClubSelected', callback);
    this.subscriptions.set('onClubSelected', subscription);
    
    return () => {
      subscription.remove();
      this.subscriptions.delete('onClubSelected');
    };
  }

  onPuttUpdated(callback: (data: PuttData) => void): () => void {
    if (!wearableEventEmitter) {
      return () => {};
    }

    const subscription = wearableEventEmitter.addListener('onPuttUpdated', callback);
    this.subscriptions.set('onPuttUpdated', subscription);
    
    return () => {
      subscription.remove();
      this.subscriptions.delete('onPuttUpdated');
    };
  }

  onConnectionStatusChanged(callback: (status: ConnectionStatus) => void): () => void {
    if (!wearableEventEmitter) {
      return () => {};
    }

    const subscription = wearableEventEmitter.addListener('onConnectionStatusChanged', callback);
    this.subscriptions.set('onConnectionStatusChanged', subscription);
    
    return () => {
      subscription.remove();
      this.subscriptions.delete('onConnectionStatusChanged');
    };
  }

  // Cleanup
  dispose() {
    this.subscriptions.forEach(subscription => subscription.remove());
    this.subscriptions.clear();
    this.isInitialized = false;
  }

  // ============================================
  // Broadcast-based communication methods
  // ============================================

  async sendTestMessage(message: string): Promise<boolean> {
    if (!WearableModule) return false;
    
    try {
      console.log('[WearableService] Sending test broadcast:', message);
      return await WearableModule.sendTestBroadcast(message);
    } catch (error) {
      console.error('[WearableService] Error sending test broadcast:', error);
      return false;
    }
  }

  async sendHoleData(holeData: HoleData): Promise<boolean> {
    if (!WearableModule) return false;
    
    try {
      console.log('[WearableService] Sending hole data:', holeData);
      return await WearableModule.sendHoleDataMessage(holeData);
    } catch (error) {
      console.error('[WearableService] Error sending hole data:', error);
      return false;
    }
  }

  async sendShotData(shotData: ShotBroadcastData): Promise<boolean> {
    if (!WearableModule) return false;
    
    try {
      console.log('[WearableService] Sending shot data:', shotData);
      return await WearableModule.sendShotDataMessage(shotData);
    } catch (error) {
      console.error('[WearableService] Error sending shot data:', error);
      return false;
    }
  }

  async sendStatsData(statsData: StatsBroadcastData): Promise<boolean> {
    if (!WearableModule) return false;
    
    try {
      console.log('[WearableService] Sending stats data:', statsData);
      return await WearableModule.sendStatsDataMessage(statsData);
    } catch (error) {
      console.error('[WearableService] Error sending stats data:', error);
      return false;
    }
  }

  // Debug methods
  async getConnectedNodes(): Promise<{nodes: any[], count: number} | null> {
    if (!WearableModule) return null;
    
    try {
      return await WearableModule.getConnectedNodes();
    } catch (error) {
      console.error('[WearableService] Error getting connected nodes:', error);
      return null;
    }
  }

  async sendDirectMessage(nodeId: string, path: string, message: string): Promise<any> {
    if (!WearableModule) return false;
    
    try {
      return await WearableModule.sendMessage(nodeId, path, message);
    } catch (error) {
      console.error('[WearableService] Error sending direct message:', error);
      return false;
    }
  }
}

// Export singleton instance
export const wearableService = new WearableService();