/**
 * CourseKnowledge Model
 * 
 * Manages crowd-sourced learning of course features including:
 * - Tee box locations
 * - Pin positions
 * - Green boundaries
 * - Hazards
 * 
 * Uses confidence scoring and clustering algorithms to learn from player data
 */

export class TeeBox {
  constructor(data = {}) {
    this.color = data.color || 'white'; // 'black', 'blue', 'white', 'red', etc.
    this.coordinates = data.coordinates || { latitude: null, longitude: null };
    this.confidence = data.confidence || 0; // 0-1 scale
    this.samples = data.samples || 0;
    this.lastSeen = data.lastSeen || new Date().toISOString();
    this.avgAccuracy = data.avgAccuracy || 0;
    this.shotIds = data.shotIds || []; // Track contributing shots
  }

  addSample(shot) {
    // Update weighted average coordinates
    const newWeight = 1 / shot.coordinates.accuracy; // Higher weight for more accurate GPS
    const totalWeight = this.samples + newWeight;
    
    this.coordinates.latitude = 
      (this.coordinates.latitude * this.samples + shot.coordinates.latitude * newWeight) / totalWeight;
    this.coordinates.longitude = 
      (this.coordinates.longitude * this.samples + shot.coordinates.longitude * newWeight) / totalWeight;
    
    // Update accuracy average
    this.avgAccuracy = 
      (this.avgAccuracy * this.samples + shot.coordinates.accuracy) / (this.samples + 1);
    
    this.samples++;
    this.lastSeen = new Date().toISOString();
    this.shotIds.push(shot.id);
    
    // Update confidence based on samples and accuracy
    this.updateConfidence();
  }

  updateConfidence() {
    // Confidence factors:
    // - Sample count (40% weight)
    // - GPS accuracy (30% weight)
    // - Recency (30% weight)
    
    // For first player scenario: Start with reasonable confidence from first shot
    // Scale from 1-5 samples = 30-60% confidence, then 5+ samples = 60-100%
    let sampleFactor;
    if (this.samples === 1) {
      sampleFactor = 0.3; // 30% confidence from first shot
    } else if (this.samples <= 5) {
      sampleFactor = 0.3 + (this.samples - 1) * 0.075; // 30% to 60% for shots 1-5
    } else {
      sampleFactor = 0.6 + Math.min((this.samples - 5) / 10, 0.4); // 60% to 100% for shots 5+
    }
    sampleFactor *= 0.4; // Apply 40% weight
    
    const accuracyFactor = Math.max(0, (20 - this.avgAccuracy) / 20) * 0.3;
    
    const daysSinceLastSeen = (Date.now() - new Date(this.lastSeen).getTime()) / (1000 * 60 * 60 * 24);
    const recencyFactor = Math.max(0, 1 - daysSinceLastSeen / 30) * 0.3;
    
    this.confidence = sampleFactor + accuracyFactor + recencyFactor;
  }
}

export class PinPosition {
  constructor(data = {}) {
    this.current = data.current || {
      latitude: null,
      longitude: null,
      confidence: 0,
      lastUpdated: new Date().toISOString()
    };
    this.history = data.history || []; // Last 30 days of positions
    this.center = data.center || { latitude: null, longitude: null }; // Green center
  }

  addPuttSample(shot) {
    const today = new Date().toDateString();
    let todaysEntry = this.history.find(h => 
      new Date(h.date).toDateString() === today
    );

    if (!todaysEntry) {
      todaysEntry = {
        latitude: shot.coordinates.latitude,
        longitude: shot.coordinates.longitude,
        date: new Date().toISOString(),
        samples: 1,
        shots: [shot.id]
      };
      this.history.push(todaysEntry);
    } else {
      // Update weighted average
      const weight = 1 / shot.coordinates.accuracy;
      const totalWeight = todaysEntry.samples + weight;
      
      todaysEntry.latitude = 
        (todaysEntry.latitude * todaysEntry.samples + shot.coordinates.latitude * weight) / totalWeight;
      todaysEntry.longitude = 
        (todaysEntry.longitude * todaysEntry.samples + shot.coordinates.longitude * weight) / totalWeight;
      
      todaysEntry.samples++;
      todaysEntry.shots.push(shot.id);
    }

    // Clean up history older than 30 days
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    this.history = this.history.filter(h => 
      new Date(h.date).getTime() > thirtyDaysAgo
    );

    // Update current position
    this.updateCurrentPosition();
  }

  updateCurrentPosition() {
    const today = new Date().toDateString();
    const todaysData = this.history.find(h => 
      new Date(h.date).toDateString() === today
    );

    if (todaysData && todaysData.samples >= 1) {
      // Start with reasonable confidence from first putt
      let confidence;
      if (todaysData.samples === 1) {
        confidence = 0.5; // 50% confidence from first putt
      } else if (todaysData.samples <= 3) {
        confidence = 0.5 + (todaysData.samples - 1) * 0.2; // 50% to 90% for putts 1-3
      } else {
        confidence = Math.min(todaysData.samples / 5, 1); // Original logic for 3+ putts
      }
      
      this.current = {
        latitude: todaysData.latitude,
        longitude: todaysData.longitude,
        confidence: confidence,
        lastUpdated: new Date().toISOString()
      };
    } else if (this.history.length > 0) {
      // Use weighted average of recent positions
      const recentPositions = this.history.slice(-7); // Last 7 days
      let totalWeight = 0;
      let weightedLat = 0;
      let weightedLng = 0;

      recentPositions.forEach((pos, index) => {
        const age = this.history.length - this.history.indexOf(pos);
        const weight = (1 / age) * pos.samples;
        totalWeight += weight;
        weightedLat += pos.latitude * weight;
        weightedLng += pos.longitude * weight;
      });

      if (totalWeight > 0) {
        this.current = {
          latitude: weightedLat / totalWeight,
          longitude: weightedLng / totalWeight,
          confidence: 0.5, // Lower confidence for historical average
          lastUpdated: new Date().toISOString()
        };
      }
    }

    // Update green center if we have enough data
    if (this.history.length >= 5) {
      this.updateGreenCenter();
    }
  }

  updateGreenCenter() {
    // Calculate center from all historical pin positions
    let totalLat = 0;
    let totalLng = 0;
    let totalSamples = 0;

    this.history.forEach(pos => {
      totalLat += pos.latitude * pos.samples;
      totalLng += pos.longitude * pos.samples;
      totalSamples += pos.samples;
    });

    if (totalSamples > 0) {
      this.center = {
        latitude: totalLat / totalSamples,
        longitude: totalLng / totalSamples
      };
    }
  }
}

export class GreenBoundary {
  constructor(data = {}) {
    this.boundary = data.boundary || []; // Polygon points
    this.confidence = data.confidence || 0;
    this.samples = data.samples || 0;
    this.area = data.area || 0; // Square yards
    this.puttPositions = data.puttPositions || []; // All putt locations
  }

  addPuttPosition(shot) {
    this.puttPositions.push({
      latitude: shot.coordinates.latitude,
      longitude: shot.coordinates.longitude,
      accuracy: shot.coordinates.accuracy,
      shotId: shot.id
    });
    
    this.samples++;
    
    // Recalculate boundary if we have enough samples
    if (this.samples >= 10) {
      this.calculateBoundary();
    }
  }

  calculateBoundary() {
    // Use convex hull algorithm to create boundary
    const points = this.puttPositions.map(p => ({
      x: p.longitude,
      y: p.latitude
    }));

    const hull = this.convexHull(points);
    
    // Convert back to lat/lng format
    this.boundary = hull.map(p => ({
      latitude: p.y,
      longitude: p.x
    }));

    // Calculate area
    this.area = this.calculatePolygonArea(this.boundary);
    
    // Update confidence
    this.confidence = Math.min(this.samples / 50, 1);
  }

  // Graham scan algorithm for convex hull
  convexHull(points) {
    if (points.length < 3) return points;

    // Sort points lexicographically
    points.sort((a, b) => a.x - b.x || a.y - b.y);

    // Build lower hull
    const lower = [];
    for (const p of points) {
      while (lower.length >= 2 && 
             this.cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
        lower.pop();
      }
      lower.push(p);
    }

    // Build upper hull
    const upper = [];
    for (let i = points.length - 1; i >= 0; i--) {
      const p = points[i];
      while (upper.length >= 2 && 
             this.cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
        upper.pop();
      }
      upper.push(p);
    }

    // Remove last point of each half because it's repeated
    lower.pop();
    upper.pop();

    return lower.concat(upper);
  }

  cross(o, a, b) {
    return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  }

  calculatePolygonArea(boundary) {
    if (boundary.length < 3) return 0;

    let area = 0;
    for (let i = 0; i < boundary.length; i++) {
      const j = (i + 1) % boundary.length;
      area += boundary[i].longitude * boundary[j].latitude;
      area -= boundary[j].longitude * boundary[i].latitude;
    }
    
    area = Math.abs(area) / 2;
    
    // Convert to square yards (approximate)
    // 1 degree of latitude ≈ 111,111 meters
    // 1 degree of longitude ≈ 111,111 * cos(latitude) meters
    const avgLat = boundary.reduce((sum, p) => sum + p.latitude, 0) / boundary.length;
    const metersPerDegreeLat = 111111;
    const metersPerDegreeLng = 111111 * Math.cos(avgLat * Math.PI / 180);
    
    const areaInSquareMeters = area * metersPerDegreeLat * metersPerDegreeLng;
    const areaInSquareYards = areaInSquareMeters * 1.19599; // Convert to yards
    
    return Math.round(areaInSquareYards);
  }
}

export class HoleKnowledge {
  constructor(data = {}) {
    this.holeNumber = data.holeNumber;
    this.par = data.par;
    this.teeBoxes = (data.teeBoxes || []).map(tb => new TeeBox(tb));
    this.pin = new PinPosition(data.pin);
    this.green = new GreenBoundary(data.green);
    this.fairway = data.fairway || { boundaries: [], confidence: 0 };
    this.hazards = data.hazards || [];
  }

  // Detect tee box from shot
  detectTeeBox(shot, previousShots = []) {
    // Check if this is likely a tee shot
    if (shot.shotNumber !== 1) return null;

    // Find or create appropriate tee box cluster
    const nearestTeeBox = this.findNearestTeeBox(
      shot.coordinates.latitude,
      shot.coordinates.longitude
    );

    if (nearestTeeBox && nearestTeeBox.distance < 10) {
      // Within 10 meters - add to existing cluster
      nearestTeeBox.teeBox.addSample(shot);
      return nearestTeeBox.teeBox;
    } else {
      // Create new tee box cluster
      const newTeeBox = new TeeBox({
        color: this.inferTeeBoxColor(shot, previousShots),
        coordinates: {
          latitude: shot.coordinates.latitude,
          longitude: shot.coordinates.longitude
        },
        samples: 1,
        avgAccuracy: shot.coordinates.accuracy,
        shotIds: [shot.id]
      });
      
      this.teeBoxes.push(newTeeBox);
      return newTeeBox;
    }
  }

  findNearestTeeBox(latitude, longitude) {
    let nearest = null;
    let minDistance = Infinity;

    this.teeBoxes.forEach(teeBox => {
      const distance = this.calculateDistance(
        latitude,
        longitude,
        teeBox.coordinates.latitude,
        teeBox.coordinates.longitude
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearest = { teeBox, distance };
      }
    });

    return nearest;
  }

  inferTeeBoxColor(shot, previousShots) {
    // Simple heuristic - could be enhanced with more data
    // For now, default to white
    return 'white';
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

export class CourseKnowledge {
  constructor(data = {}) {
    this.courseId = data.courseId;
    this.lastUpdated = data.lastUpdated || new Date().toISOString();
    this.contributorCount = data.contributorCount || 0;
    this.holes = (data.holes || []).map(h => new HoleKnowledge(h));
    this.contributors = data.contributors || new Set();
  }

  processShot(shot, allShotsForRound) {
    // Find or create hole knowledge
    let hole = this.holes.find(h => h.holeNumber === shot.holeNumber);
    if (!hole) {
      hole = new HoleKnowledge({ 
        holeNumber: shot.holeNumber,
        par: shot.par || 4 // Default if not provided
      });
      this.holes.push(hole);
    }

    // Classify and process shot
    const classification = this.classifyShot(shot, allShotsForRound);
    
    switch (classification.type) {
      case 'tee':
        hole.detectTeeBox(shot, allShotsForRound);
        break;
      
      case 'putt':
        hole.pin.addPuttSample(shot);
        hole.green.addPuttPosition(shot);
        break;
      
      case 'approach':
      case 'chip':
        // Could be used for fairway/rough detection
        break;
    }

    this.lastUpdated = new Date().toISOString();
  }

  classifyShot(shot, allShotsForRound) {
    const holeShots = allShotsForRound.filter(s => s.holeNumber === shot.holeNumber);
    const shotIndex = holeShots.findIndex(s => s.id === shot.id);
    const isFirstShot = shotIndex === 0;
    const isLastShot = shotIndex === holeShots.length - 1;
    
    // Simple classification based on position and club
    if (isFirstShot) {
      return { type: 'tee', confidence: 0.9 };
    }
    
    if (shot.clubId === 'putter') {
      return { type: 'putt', confidence: 0.95 };
    }
    
    if (isLastShot && !shot.clubId) {
      // Likely a putt even without club selection
      return { type: 'putt', confidence: 0.7 };
    }
    
    // Calculate distance to pin if available
    const hole = this.holes.find(h => h.holeNumber === shot.holeNumber);
    if (hole && hole.pin.current.latitude) {
      const distanceToPin = this.calculateDistance(
        shot.coordinates.latitude,
        shot.coordinates.longitude,
        hole.pin.current.latitude,
        hole.pin.current.longitude
      );
      
      if (distanceToPin < 30) {
        return { type: 'chip', confidence: 0.8 };
      }
    }
    
    return { type: 'approach', confidence: 0.6 };
  }

  getDistanceToPin(holeNumber, latitude, longitude) {
    const hole = this.holes.find(h => h.holeNumber === holeNumber);
    if (!hole) return null;

    // Try current pin position first
    if (hole.pin.current.latitude && hole.pin.current.confidence > 0.3) {
      return {
        distance: this.calculateDistance(
          latitude,
          longitude,
          hole.pin.current.latitude,
          hole.pin.current.longitude
        ),
        confidence: hole.pin.current.confidence,
        type: 'pin'
      };
    }

    // Fall back to green center
    if (hole.pin.center.latitude) {
      return {
        distance: this.calculateDistance(
          latitude,
          longitude,
          hole.pin.center.latitude,
          hole.pin.center.longitude
        ),
        confidence: 0.5,
        type: 'green_center'
      };
    }

    // Fall back to green boundary center
    if (hole.green.boundary.length >= 3) {
      const centerLat = hole.green.boundary.reduce((sum, p) => sum + p.latitude, 0) / hole.green.boundary.length;
      const centerLng = hole.green.boundary.reduce((sum, p) => sum + p.longitude, 0) / hole.green.boundary.length;
      
      return {
        distance: this.calculateDistance(latitude, longitude, centerLat, centerLng),
        confidence: hole.green.confidence * 0.7,
        type: 'green_boundary'
      };
    }

    return null;
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

  toJSON() {
    return {
      courseId: this.courseId,
      lastUpdated: this.lastUpdated,
      contributorCount: this.contributorCount,
      holes: this.holes.map(h => ({
        holeNumber: h.holeNumber,
        par: h.par,
        teeBoxes: h.teeBoxes,
        pin: h.pin,
        green: h.green,
        fairway: h.fairway,
        hazards: h.hazards
      })),
      contributors: Array.from(this.contributors)
    };
  }
}