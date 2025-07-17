/**
 * CourseKnowledgeService
 * 
 * Service for managing crowd-sourced course learning including:
 * - Processing shots to learn course features
 * - Storing/retrieving course knowledge
 * - Calculating distances to learned features
 * - Managing user contributions
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { CourseKnowledge } from '../models/CourseKnowledge';

class CourseKnowledgeService {
  constructor() {
    this.courseKnowledge = new Map(); // courseId -> CourseKnowledge
    this.storageKey = 'course_knowledge_v1';
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      console.log('🎓 Initializing CourseKnowledgeService...');
      
      const storedData = await AsyncStorage.getItem(this.storageKey);
      if (storedData) {
        const data = JSON.parse(storedData);
        
        // Restore CourseKnowledge instances
        Object.keys(data).forEach(courseId => {
          this.courseKnowledge.set(courseId, new CourseKnowledge(data[courseId]));
        });
        
        console.log(`🎓 Loaded knowledge for ${Object.keys(data).length} courses`);
      }
      
      this.initialized = true;
    } catch (error) {
      console.error('❌ Error initializing CourseKnowledgeService:', error);
    }
  }

  async getCourseKnowledge(courseId) {
    await this.initialize();
    
    if (!this.courseKnowledge.has(courseId)) {
      console.log(`🎓 Creating new course knowledge for course ${courseId}`);
      const newKnowledge = new CourseKnowledge({ courseId });
      this.courseKnowledge.set(courseId, newKnowledge);
      await this.saveKnowledge();
    }
    
    return this.courseKnowledge.get(courseId);
  }

  async processShot(shot, allShotsForRound, courseId) {
    try {
      console.log(`🎓 Processing shot for course learning: ${shot.holeNumber}-${shot.shotNumber}`);
      
      const knowledge = await this.getCourseKnowledge(courseId);
      
      // Process the shot to learn course features
      knowledge.processShot(shot, allShotsForRound);
      
      // Save updated knowledge
      await this.saveKnowledge();
      
      console.log(`🎓 Shot processed - Course knowledge updated for hole ${shot.holeNumber}`);
      
      // Log learning progress
      this.logLearningProgress(knowledge, shot.holeNumber);
      
    } catch (error) {
      console.error('❌ Error processing shot for course learning:', error);
    }
  }

  async processRound(shots, courseId) {
    try {
      console.log(`🎓 Processing complete round for course learning: ${shots.length} shots`);
      
      const knowledge = await this.getCourseKnowledge(courseId);
      
      // Process all shots
      for (const shot of shots) {
        knowledge.processShot(shot, shots);
      }
      
      // Save updated knowledge
      await this.saveKnowledge();
      
      console.log(`🎓 Round processed - Course knowledge updated`);
      
      // Log summary
      this.logCourseSummary(knowledge);
      
    } catch (error) {
      console.error('❌ Error processing round for course learning:', error);
    }
  }

  async getDistanceToPin(courseId, holeNumber, latitude, longitude) {
    try {
      const knowledge = await this.getCourseKnowledge(courseId);
      const result = knowledge.getDistanceToPin(holeNumber, latitude, longitude);
      
      if (result) {
        console.log(`🎓 Distance to pin: ${Math.round(result.distance)}m (${result.type}, confidence: ${result.confidence.toFixed(2)})`);
      }
      
      return result;
    } catch (error) {
      console.error('❌ Error calculating distance to pin:', error);
      return null;
    }
  }

  async getTeeBoxes(courseId, holeNumber) {
    try {
      const knowledge = await this.getCourseKnowledge(courseId);
      const hole = knowledge.holes.find(h => h.holeNumber === holeNumber);
      
      return hole ? hole.teeBoxes : [];
    } catch (error) {
      console.error('❌ Error getting tee boxes:', error);
      return [];
    }
  }

  async getGreenBoundary(courseId, holeNumber) {
    try {
      const knowledge = await this.getCourseKnowledge(courseId);
      const hole = knowledge.holes.find(h => h.holeNumber === holeNumber);
      
      return hole ? hole.green : null;
    } catch (error) {
      console.error('❌ Error getting green boundary:', error);
      return null;
    }
  }

  async getPinHistory(courseId, holeNumber) {
    try {
      const knowledge = await this.getCourseKnowledge(courseId);
      const hole = knowledge.holes.find(h => h.holeNumber === holeNumber);
      
      return hole ? hole.pin.history : [];
    } catch (error) {
      console.error('❌ Error getting pin history:', error);
      return [];
    }
  }

  async getCourseSummary(courseId) {
    try {
      const knowledge = await this.getCourseKnowledge(courseId);
      
      const summary = {
        courseId: knowledge.courseId,
        lastUpdated: knowledge.lastUpdated,
        contributorCount: knowledge.contributorCount,
        holes: knowledge.holes.map(hole => ({
          holeNumber: hole.holeNumber,
          par: hole.par,
          teeBoxCount: hole.teeBoxes.length,
          teeBoxConfidence: hole.teeBoxes.reduce((sum, tb) => sum + tb.confidence, 0) / hole.teeBoxes.length || 0,
          pinConfidence: hole.pin.current.confidence,
          greenConfidence: hole.green.confidence,
          greenArea: hole.green.area,
          totalSamples: hole.teeBoxes.reduce((sum, tb) => sum + tb.samples, 0) + hole.green.samples
        }))
      };
      
      return summary;
    } catch (error) {
      console.error('❌ Error getting course summary:', error);
      return null;
    }
  }

  async saveKnowledge() {
    try {
      const data = {};
      
      this.courseKnowledge.forEach((knowledge, courseId) => {
        data[courseId] = knowledge.toJSON();
      });
      
      await AsyncStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('❌ Error saving course knowledge:', error);
    }
  }

  async clearKnowledge(courseId) {
    try {
      if (courseId) {
        this.courseKnowledge.delete(courseId);
        console.log(`🎓 Cleared knowledge for course ${courseId}`);
      } else {
        this.courseKnowledge.clear();
        console.log('🎓 Cleared all course knowledge');
      }
      
      await this.saveKnowledge();
    } catch (error) {
      console.error('❌ Error clearing course knowledge:', error);
    }
  }

  async exportKnowledge(courseId) {
    try {
      const knowledge = await this.getCourseKnowledge(courseId);
      return knowledge.toJSON();
    } catch (error) {
      console.error('❌ Error exporting course knowledge:', error);
      return null;
    }
  }

  async importKnowledge(courseId, data) {
    try {
      const knowledge = new CourseKnowledge(data);
      this.courseKnowledge.set(courseId, knowledge);
      await this.saveKnowledge();
      
      console.log(`🎓 Imported knowledge for course ${courseId}`);
    } catch (error) {
      console.error('❌ Error importing course knowledge:', error);
    }
  }

  // Quality control methods
  async validateShot(shot) {
    // Basic validation rules
    const validations = {
      hasCoordinates: shot.coordinates && shot.coordinates.latitude && shot.coordinates.longitude,
      reasonableAccuracy: shot.coordinates && shot.coordinates.accuracy && shot.coordinates.accuracy < 100,
      validHoleNumber: shot.holeNumber && shot.holeNumber >= 1 && shot.holeNumber <= 18,
      validShotNumber: shot.shotNumber && shot.shotNumber >= 1,
      recentTimestamp: shot.coordinates && shot.coordinates.timestamp && 
                      (Date.now() - new Date(shot.coordinates.timestamp).getTime()) < 24 * 60 * 60 * 1000
    };

    const isValid = Object.values(validations).every(v => v);
    
    if (!isValid) {
      console.log('🎓 Shot validation failed:', {
        shotId: shot.id,
        validations,
        shot: {
          holeNumber: shot.holeNumber,
          shotNumber: shot.shotNumber,
          coordinates: shot.coordinates
        }
      });
    }
    
    return isValid;
  }

  async detectOutliers(shots) {
    // Simple outlier detection for GPS coordinates
    const outliers = [];
    
    if (shots.length < 3) return outliers;
    
    // Group shots by hole
    const holeShots = {};
    shots.forEach(shot => {
      if (!holeShots[shot.holeNumber]) {
        holeShots[shot.holeNumber] = [];
      }
      holeShots[shot.holeNumber].push(shot);
    });
    
    // Check each hole for outliers
    Object.keys(holeShots).forEach(holeNumber => {
      const shots = holeShots[holeNumber];
      if (shots.length < 3) return;
      
      // Calculate center point
      const avgLat = shots.reduce((sum, s) => sum + s.coordinates.latitude, 0) / shots.length;
      const avgLng = shots.reduce((sum, s) => sum + s.coordinates.longitude, 0) / shots.length;
      
      // Find shots that are too far from center
      shots.forEach(shot => {
        const distance = this.calculateDistance(
          shot.coordinates.latitude,
          shot.coordinates.longitude,
          avgLat,
          avgLng
        );
        
        // Flag shots more than 1km from hole center as outliers
        if (distance > 1000) {
          outliers.push({
            shot,
            reason: 'too_far_from_hole',
            distance: Math.round(distance)
          });
        }
      });
    });
    
    return outliers;
  }

  logLearningProgress(knowledge, holeNumber) {
    const hole = knowledge.holes.find(h => h.holeNumber === holeNumber);
    if (!hole) return;
    
    console.log(`🎓 Learning progress for hole ${holeNumber}:`);
    console.log(`  - Tee boxes: ${hole.teeBoxes.length} (avg confidence: ${(hole.teeBoxes.reduce((sum, tb) => sum + tb.confidence, 0) / hole.teeBoxes.length || 0).toFixed(2)})`);
    console.log(`  - Pin confidence: ${hole.pin.current.confidence.toFixed(2)}`);
    console.log(`  - Green confidence: ${hole.green.confidence.toFixed(2)} (${hole.green.samples} samples)`);
    console.log(`  - Green area: ${hole.green.area} sq yards`);
  }

  logCourseSummary(knowledge) {
    console.log('🎓 Course Learning Summary:');
    console.log(`  - Course ID: ${knowledge.courseId}`);
    console.log(`  - Last updated: ${knowledge.lastUpdated}`);
    console.log(`  - Holes with data: ${knowledge.holes.length}`);
    
    const totalTeeBoxes = knowledge.holes.reduce((sum, h) => sum + h.teeBoxes.length, 0);
    const avgPinConfidence = knowledge.holes.reduce((sum, h) => sum + h.pin.current.confidence, 0) / knowledge.holes.length;
    const avgGreenConfidence = knowledge.holes.reduce((sum, h) => sum + h.green.confidence, 0) / knowledge.holes.length;
    
    console.log(`  - Total tee boxes: ${totalTeeBoxes}`);
    console.log(`  - Average pin confidence: ${avgPinConfidence.toFixed(2)}`);
    console.log(`  - Average green confidence: ${avgGreenConfidence.toFixed(2)}`);
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
}

// Export singleton instance
export default new CourseKnowledgeService();