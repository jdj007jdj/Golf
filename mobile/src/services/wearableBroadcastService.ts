import { NativeModules, DeviceEventEmitter } from 'react-native';

const { WearableModule } = NativeModules;

/**
 * Wearable MessageClient API communication service for Wear OS
 * Uses official Android Wearable API for production-ready communication
 */
class WearableBroadcastService {
  // Broadcast actions - must match wear app
  static ACTIONS = {
    ROUND_DATA: 'com.minimalapp.wear.ROUND_DATA',
    HOLE_DATA: 'com.minimalapp.wear.HOLE_DATA',
    SHOT_DATA: 'com.minimalapp.wear.SHOT_DATA',
    STATS_DATA: 'com.minimalapp.wear.STATS_DATA',
    TEST_MESSAGE: 'com.minimalapp.wear.TEST_MESSAGE',
  };

  /**
   * Send round data to watch
   */
  static async sendRoundData(courseName: string, currentHole: number, totalScore: number) {
    const data = JSON.stringify({
      courseName,
      currentHole,
      totalScore,
      timestamp: Date.now()
    });

    try {
      const roundData = {
        roundId: `round-${Date.now()}`,
        courseName,
        currentHole,
        totalHoles: 18
      };
      await WearableModule.sendRoundDataMessage(roundData);
      console.log('Round data sent via Wearable API:', roundData);
    } catch (error) {
      console.error('Failed to send round data broadcast:', error);
    }
  }

  /**
   * Send hole data to watch
   */
  static async sendHoleData(holeNumber: number, par: number, distance: number) {
    const data = JSON.stringify({
      holeNumber,
      par,
      distance,
      timestamp: Date.now()
    });

    try {
      const holeData = {
        holeNumber,
        par,
        distance
      };
      await WearableModule.sendHoleDataMessage(holeData);
      console.log('Hole data sent via Wearable API:', holeData);
    } catch (error) {
      console.error('Failed to send hole data broadcast:', error);
    }
  }

  /**
   * Send shot data to watch
   */
  static async sendShotData(club: string, distance: number) {
    const data = JSON.stringify({
      club,
      distance,
      timestamp: Date.now()
    });

    try {
      const shotData = {
        club,
        distance,
        latitude: 0,
        longitude: 0
      };
      await WearableModule.sendShotDataMessage(shotData);
      console.log('Shot data sent via Wearable API:', shotData);
    } catch (error) {
      console.error('Failed to send shot data broadcast:', error);
    }
  }

  /**
   * Send stats data to watch
   */
  static async sendStatsData(stats: any) {
    const data = JSON.stringify({
      ...stats,
      timestamp: Date.now()
    });

    try {
      const statsData = {
        distanceToPin: stats.distanceToPin || 0,
        currentScore: stats.currentScore || 0,
        totalScore: stats.totalScore || 0
      };
      await WearableModule.sendStatsDataMessage(statsData);
      console.log('Stats data sent via Wearable API:', statsData);
    } catch (error) {
      console.error('Failed to send stats data broadcast:', error);
    }
  }

  /**
   * Send test message to watch
   */
  static async sendTestMessage(message: string) {
    try {
      await WearableModule.sendTestBroadcast(message);
      console.log('Test message sent via broadcast:', message);
    } catch (error) {
      console.error('Failed to send test broadcast:', error);
    }
  }

  /**
   * Check if watch is connected via Wearable API
   */
  static async checkConnection(): Promise<boolean> {
    try {
      return await WearableModule.isWatchConnected();
    } catch (error) {
      console.error('Watch connection check failed:', error);
      return false;
    }
  }
}

export default WearableBroadcastService;