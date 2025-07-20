import { NativeModules, NativeEventEmitter, EmitterSubscription } from 'react-native';

// Native module interface
interface WearableModuleInterface {
  startRound(roundData: RoundData): Promise<boolean>;
  endRound(): Promise<boolean>;
  sendStatsToWatch(stats: StatsData): Promise<boolean>;
  updateCurrentHole(holeNumber: number): Promise<boolean>;
  isWatchConnected(): Promise<boolean>;
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
    if (!WearableModule) return false;
    
    try {
      return await WearableModule.startRound(roundData);
    } catch (error) {
      console.error('Error starting round on watch:', error);
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
}

// Export singleton instance
export const wearableService = new WearableService();