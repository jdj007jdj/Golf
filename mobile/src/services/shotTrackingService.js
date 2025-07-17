/**
 * Shot tracking service for managing GPS shot data
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import Geolocation from 'react-native-geolocation-service';
import { Shot, ShotCollection } from '../models/Shot';
import { calculateDistance, calculateShotDistances } from '../utils/gpsCalculations';
import courseKnowledgeService from './courseKnowledgeService';

const STORAGE_KEY_PREFIX = 'golf_shots_';
const CURRENT_ROUND_KEY = 'current_round_shots';

class ShotTrackingService {
  constructor() {
    this.currentRoundShots = new ShotCollection();
    this.isInitialized = false;
    this.courseId = null;
  }

  /**
   * Initialize the service and load existing shots
   */
  async initialize(roundId, courseId = null) {
    try {
      this.roundId = roundId;
      this.courseId = courseId;
      console.log('Loading shots for round:', roundId, 'course:', courseId);
      
      // Initialize course knowledge service
      await courseKnowledgeService.initialize();
      
      await this.loadShots();
      console.log('Loaded shots:', this.currentRoundShots.shots.length);
      
      // Add demo shots at Augusta National for testing
      if (this.currentRoundShots.shots.length === 0) {
        console.log('No shots found, adding demo shots');
        await this.addDemoShots();
      } else {
        console.log('Found existing shots, not adding demo shots');
      }
      
      // Process existing shots through course knowledge if we have a course ID
      if (this.courseId && this.currentRoundShots.shots.length > 0) {
        console.log('Processing existing shots through course knowledge system');
        await courseKnowledgeService.processRound(this.currentRoundShots.shots, this.courseId);
      }
      
      this.isInitialized = true;
      console.log('Shot tracking service initialized');
    } catch (error) {
      console.error('Failed to initialize shot tracking:', error);
    }
  }

  /**
   * Add demo shots for testing at Augusta National
   */
  async addDemoShots() {
    console.log('Adding demo shots at Augusta National center: -82.0206, 33.5031');
    
    // Create shots in a visible pattern around the center
    // Each coordinate change of 0.001 is approximately 100 meters
    const centerLat = 33.5031;
    const centerLng = -82.0206;
    
    const demoShots = [
      {
        holeNumber: 1,
        shotNumber: 1,
        coordinates: {
          latitude: centerLat,
          longitude: centerLng,
          accuracy: 5,
          timestamp: new Date().toISOString()
        },
        clubId: 'driver',
        scoreAfterShot: 1
      },
      {
        holeNumber: 1,
        shotNumber: 2,
        coordinates: {
          latitude: centerLat - 0.0015,  // ~150m south
          longitude: centerLng + 0.0020,  // ~200m east
          accuracy: 5,
          timestamp: new Date().toISOString()
        },
        clubId: '7iron',
        scoreAfterShot: 2
      },
      {
        holeNumber: 1,
        shotNumber: 3,
        coordinates: {
          latitude: centerLat - 0.0025,  // ~250m south
          longitude: centerLng + 0.0030,  // ~300m east
          accuracy: 5,
          timestamp: new Date().toISOString()
        },
        clubId: 'pwedge',
        scoreAfterShot: 3
      },
      {
        holeNumber: 1,
        shotNumber: 4,
        coordinates: {
          latitude: centerLat - 0.0028,  // ~280m south
          longitude: centerLng + 0.0032,  // ~320m east
          accuracy: 5,
          timestamp: new Date().toISOString()
        },
        clubId: 'putter',
        scoreAfterShot: 4
      }
    ];

    for (const shotData of demoShots) {
      const shot = new Shot(shotData);
      this.currentRoundShots.addShot(shot);
      console.log(`Added shot ${shot.shotNumber} at: ${shot.coordinates.latitude}, ${shot.coordinates.longitude}`);
    }

    await this.saveShots();
    console.log('Demo shots added:', this.currentRoundShots.shots.length);
  }

  /**
   * Get current GPS position
   */
  getCurrentPosition() {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString()
          });
        },
        (error) => {
          console.error('GPS error:', error);
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000
        }
      );
    });
  }

  /**
   * Log a shot with current GPS coordinates
   */
  async logShot(holeNumber, shotNumber, score, clubId = null) {
    try {
      const coordinates = await this.getCurrentPosition();
      
      const shot = new Shot({
        roundId: this.roundId,
        holeNumber,
        shotNumber,
        coordinates,
        clubId,
        scoreAfterShot: score
      });

      // Calculate distance from previous shot if exists
      const previousShot = this.getPreviousShot(holeNumber, shotNumber);
      if (previousShot && previousShot.coordinates) {
        const distance = calculateDistance(
          previousShot.coordinates.latitude,
          previousShot.coordinates.longitude,
          coordinates.latitude,
          coordinates.longitude,
          'yards'
        );
        previousShot.distanceToNext = distance;
      }

      this.currentRoundShots.addShot(shot);
      await this.saveShots();
      
      // Process shot through course knowledge system
      if (this.courseId) {
        await courseKnowledgeService.processShot(shot, this.currentRoundShots.shots, this.courseId);
      }
      
      console.log(`Shot logged: Hole ${holeNumber}, Shot ${shotNumber}`);
      return shot;
    } catch (error) {
      console.error('Failed to log shot:', error);
      throw error;
    }
  }

  /**
   * Get previous shot for distance calculation
   */
  getPreviousShot(holeNumber, shotNumber) {
    const holeShots = this.currentRoundShots.getShotsByHole(holeNumber);
    
    if (shotNumber > 1) {
      // Previous shot on same hole
      return holeShots.find(s => s.shotNumber === shotNumber - 1);
    } else if (holeNumber > 1) {
      // Last shot of previous hole
      const previousHoleShots = this.currentRoundShots.getShotsByHole(holeNumber - 1);
      return previousHoleShots[previousHoleShots.length - 1];
    }
    
    return null;
  }

  /**
   * Get shots for a specific hole
   */
  getShotsForHole(holeNumber) {
    return this.currentRoundShots.getShotsByHole(holeNumber);
  }

  /**
   * Get all shots for current round
   */
  getAllShots() {
    return this.currentRoundShots.shots;
  }

  /**
   * Calculate statistics for a hole
   */
  getHoleStats(holeNumber) {
    const shots = this.getShotsForHole(holeNumber);
    
    if (shots.length === 0) {
      return null;
    }

    const totalDistance = shots.reduce((sum, shot) => {
      return sum + (shot.distanceToNext || 0);
    }, 0);

    const clubsUsed = shots
      .filter(s => s.clubId)
      .map(s => s.clubId);

    return {
      shotCount: shots.length,
      totalDistance,
      averageShotDistance: shots.length > 1 ? Math.round(totalDistance / (shots.length - 1)) : 0,
      clubsUsed,
      score: shots[shots.length - 1]?.scoreAfterShot || null
    };
  }

  /**
   * Save shots to AsyncStorage
   */
  async saveShots() {
    try {
      const data = {
        roundId: this.roundId,
        shots: this.currentRoundShots.toJSON(),
        lastUpdated: new Date().toISOString()
      };
      
      await AsyncStorage.setItem(CURRENT_ROUND_KEY, JSON.stringify(data));
      
      // Also save to round-specific key for history
      if (this.roundId) {
        await AsyncStorage.setItem(
          `${STORAGE_KEY_PREFIX}${this.roundId}`,
          JSON.stringify(data)
        );
      }
    } catch (error) {
      console.error('Failed to save shots:', error);
    }
  }

  /**
   * Load shots from AsyncStorage
   */
  async loadShots() {
    try {
      const data = await AsyncStorage.getItem(CURRENT_ROUND_KEY);
      
      if (data) {
        const parsed = JSON.parse(data);
        
        // Only load if same round
        if (parsed.roundId === this.roundId) {
          this.currentRoundShots = ShotCollection.fromJSON(parsed.shots);
          console.log(`Loaded ${this.currentRoundShots.shots.length} shots from storage`);
        }
      }
    } catch (error) {
      console.error('Failed to load shots:', error);
    }
  }

  /**
   * Clear current round shots
   */
  async clearCurrentRound() {
    this.currentRoundShots = new ShotCollection();
    await AsyncStorage.removeItem(CURRENT_ROUND_KEY);
  }

  /**
   * Get shot history for a specific round
   */
  async getRoundShots(roundId) {
    try {
      const data = await AsyncStorage.getItem(`${STORAGE_KEY_PREFIX}${roundId}`);
      
      if (data) {
        const parsed = JSON.parse(data);
        return ShotCollection.fromJSON(parsed.shots);
      }
    } catch (error) {
      console.error('Failed to load round shots:', error);
    }
    
    return null;
  }

  /**
   * Get distance to pin using learned course data
   */
  async getDistanceToPin(holeNumber, latitude, longitude) {
    if (!this.courseId) {
      return null;
    }

    return await courseKnowledgeService.getDistanceToPin(
      this.courseId,
      holeNumber,
      latitude,
      longitude
    );
  }

  /**
   * Get distance to nearest tee box
   */
  async getDistanceToTee(holeNumber, latitude, longitude) {
    if (!this.courseId) {
      return null;
    }

    try {
      const teeBoxes = await courseKnowledgeService.getTeeBoxes(this.courseId, holeNumber);
      
      if (teeBoxes.length === 0) {
        return null;
      }

      // Find nearest tee box
      let nearestTee = null;
      let minDistance = Infinity;

      teeBoxes.forEach(teeBox => {
        const distance = calculateDistance(
          latitude,
          longitude,
          teeBox.coordinates.latitude,
          teeBox.coordinates.longitude,
          'yards'
        );

        if (distance < minDistance) {
          minDistance = distance;
          nearestTee = {
            distance: Math.round(distance),
            teeBox,
            confidence: teeBox.confidence
          };
        }
      });

      return nearestTee;
    } catch (error) {
      console.error('Error getting distance to tee:', error);
      return null;
    }
  }

  /**
   * Get green boundary information
   */
  async getGreenInfo(holeNumber) {
    if (!this.courseId) {
      return null;
    }

    try {
      const green = await courseKnowledgeService.getGreenBoundary(this.courseId, holeNumber);
      return green;
    } catch (error) {
      console.error('Error getting green info:', error);
      return null;
    }
  }

  /**
   * Get course learning summary
   */
  async getCourseLearningProgress() {
    if (!this.courseId) {
      return null;
    }

    try {
      const summary = await courseKnowledgeService.getCourseSummary(this.courseId);
      return summary;
    } catch (error) {
      console.error('Error getting course learning progress:', error);
      return null;
    }
  }

  /**
   * Get real-time distances for current position
   */
  async getCurrentDistances(holeNumber) {
    try {
      const coordinates = await this.getCurrentPosition();
      
      const distances = {
        timestamp: coordinates.timestamp,
        accuracy: coordinates.accuracy,
        pin: null,
        tee: null,
        green: null
      };

      // Get distance to pin
      const pinDistance = await this.getDistanceToPin(
        holeNumber,
        coordinates.latitude,
        coordinates.longitude
      );
      if (pinDistance) {
        distances.pin = pinDistance;
      }

      // Get distance to nearest tee
      const teeDistance = await this.getDistanceToTee(
        holeNumber,
        coordinates.latitude,
        coordinates.longitude
      );
      if (teeDistance) {
        distances.tee = teeDistance;
      }

      // Get green info
      const greenInfo = await this.getGreenInfo(holeNumber);
      if (greenInfo) {
        distances.green = {
          confidence: greenInfo.confidence,
          area: greenInfo.area,
          samples: greenInfo.samples
        };
      }

      return distances;
    } catch (error) {
      console.error('Error getting current distances:', error);
      return null;
    }
  }

  /**
   * Export shots for backend sync
   */
  exportForSync() {
    return {
      roundId: this.roundId,
      shots: this.currentRoundShots.toJSON(),
      metadata: {
        deviceId: 'mobile',
        appVersion: '1.0.0',
        timestamp: new Date().toISOString()
      }
    };
  }
}

// Create singleton instance
const shotTrackingService = new ShotTrackingService();

export default shotTrackingService;