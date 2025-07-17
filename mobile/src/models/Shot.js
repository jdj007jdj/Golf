/**
 * Shot data model for GPS tracking
 */

export class Shot {
  constructor(data = {}) {
    this.id = data.id || `shot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.roundId = data.roundId || null;
    this.holeNumber = data.holeNumber || 1;
    this.shotNumber = data.shotNumber || 1;
    this.coordinates = data.coordinates || {
      latitude: null,
      longitude: null,
      accuracy: null,
      timestamp: new Date().toISOString()
    };
    this.clubId = data.clubId || null;
    this.scoreAfterShot = data.scoreAfterShot || null;
    this.distanceToNext = data.distanceToNext || null;
    this.conditions = data.conditions || {
      wind: null,
      weather: null
    };
    this.createdAt = data.createdAt || new Date().toISOString();
  }

  /**
   * Validate shot data
   */
  isValid() {
    return (
      this.coordinates &&
      this.coordinates.latitude !== null &&
      this.coordinates.longitude !== null &&
      this.holeNumber > 0 &&
      this.shotNumber > 0
    );
  }

  /**
   * Convert to plain object for storage
   */
  toJSON() {
    return {
      id: this.id,
      roundId: this.roundId,
      holeNumber: this.holeNumber,
      shotNumber: this.shotNumber,
      coordinates: this.coordinates,
      clubId: this.clubId,
      scoreAfterShot: this.scoreAfterShot,
      distanceToNext: this.distanceToNext,
      conditions: this.conditions,
      createdAt: this.createdAt
    };
  }

  /**
   * Create Shot instance from plain object
   */
  static fromJSON(data) {
    return new Shot(data);
  }
}

/**
 * Shot collection management
 */
export class ShotCollection {
  constructor() {
    this.shots = [];
  }

  /**
   * Add a shot to the collection
   */
  addShot(shot) {
    if (shot instanceof Shot && shot.isValid()) {
      this.shots.push(shot);
      return true;
    }
    return false;
  }

  /**
   * Get shots for a specific hole
   */
  getShotsByHole(holeNumber) {
    return this.shots.filter(shot => shot.holeNumber === holeNumber);
  }

  /**
   * Get the last shot
   */
  getLastShot() {
    return this.shots[this.shots.length - 1] || null;
  }

  /**
   * Get shot by ID
   */
  getShotById(id) {
    return this.shots.find(shot => shot.id === id) || null;
  }

  /**
   * Update shot distance to next
   */
  updateShotDistance(shotId, distance) {
    const shot = this.getShotById(shotId);
    if (shot) {
      shot.distanceToNext = distance;
      return true;
    }
    return false;
  }

  /**
   * Get all shots as JSON
   */
  toJSON() {
    return this.shots.map(shot => shot.toJSON());
  }

  /**
   * Load shots from JSON
   */
  static fromJSON(data) {
    const collection = new ShotCollection();
    if (Array.isArray(data)) {
      data.forEach(shotData => {
        const shot = Shot.fromJSON(shotData);
        collection.addShot(shot);
      });
    }
    return collection;
  }
}