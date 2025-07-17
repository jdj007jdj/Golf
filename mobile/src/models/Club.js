/**
 * Club model for user's golf bag
 */

// No external UUID library needed

// Standard club types
export const CLUB_TYPES = {
  DRIVER: { id: 'driver', name: 'Driver', category: 'woods', order: 1 },
  FAIRWAY_3: { id: '3wood', name: '3 Wood', category: 'woods', order: 2 },
  FAIRWAY_5: { id: '5wood', name: '5 Wood', category: 'woods', order: 3 },
  FAIRWAY_7: { id: '7wood', name: '7 Wood', category: 'woods', order: 4 },
  HYBRID_2: { id: '2hybrid', name: '2 Hybrid', category: 'hybrids', order: 5 },
  HYBRID_3: { id: '3hybrid', name: '3 Hybrid', category: 'hybrids', order: 6 },
  HYBRID_4: { id: '4hybrid', name: '4 Hybrid', category: 'hybrids', order: 7 },
  HYBRID_5: { id: '5hybrid', name: '5 Hybrid', category: 'hybrids', order: 8 },
  IRON_2: { id: '2iron', name: '2 Iron', category: 'irons', order: 9 },
  IRON_3: { id: '3iron', name: '3 Iron', category: 'irons', order: 10 },
  IRON_4: { id: '4iron', name: '4 Iron', category: 'irons', order: 11 },
  IRON_5: { id: '5iron', name: '5 Iron', category: 'irons', order: 12 },
  IRON_6: { id: '6iron', name: '6 Iron', category: 'irons', order: 13 },
  IRON_7: { id: '7iron', name: '7 Iron', category: 'irons', order: 14 },
  IRON_8: { id: '8iron', name: '8 Iron', category: 'irons', order: 15 },
  IRON_9: { id: '9iron', name: '9 Iron', category: 'irons', order: 16 },
  WEDGE_P: { id: 'pwedge', name: 'PW', category: 'wedges', order: 17 },
  WEDGE_A: { id: 'awedge', name: 'AW', category: 'wedges', order: 18 },
  WEDGE_S: { id: 'swedge', name: 'SW', category: 'wedges', order: 19 },
  WEDGE_L: { id: 'lwedge', name: 'LW', category: 'wedges', order: 20 },
  PUTTER: { id: 'putter', name: 'Putter', category: 'putter', order: 21 }
};

// Popular brands (can be extended)
export const CLUB_BRANDS = [
  'TaylorMade',
  'Callaway',
  'Titleist',
  'Ping',
  'Cobra',
  'Mizuno',
  'Cleveland',
  'Odyssey',
  'Scotty Cameron',
  'Other'
];

// Shaft types
export const SHAFT_TYPES = {
  REGULAR: { id: 'regular', name: 'Regular', order: 1 },
  STIFF: { id: 'stiff', name: 'Stiff', order: 2 },
  X_STIFF: { id: 'x-stiff', name: 'X-Stiff', order: 3 },
  SENIOR: { id: 'senior', name: 'Senior', order: 4 },
  LADIES: { id: 'ladies', name: 'Ladies', order: 5 }
};

export class Club {
  constructor(data = {}) {
    this.id = data.id || `club_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.clubType = data.clubType || null; // CLUB_TYPES key
    this.brand = data.brand || null;
    this.model = data.model || null;
    this.shaftType = data.shaftType || 'regular';
    this.avgDistance = data.avgDistance || null;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    
    // Performance tracking
    this.shotCount = data.shotCount || 0;
    this.totalDistance = data.totalDistance || 0;
    this.accuracyPercentage = data.accuracyPercentage || null;
  }

  /**
   * Get display name for the club
   */
  getDisplayName() {
    const clubInfo = Object.values(CLUB_TYPES).find(ct => ct.id === this.clubType);
    const baseName = clubInfo ? clubInfo.name : 'Unknown Club';
    
    if (this.brand && this.model) {
      return `${this.brand} ${this.model} (${baseName})`;
    } else if (this.brand) {
      return `${this.brand} ${baseName}`;
    }
    return baseName;
  }

  /**
   * Get short display name (just the club type)
   */
  getShortName() {
    const clubInfo = Object.values(CLUB_TYPES).find(ct => ct.id === this.clubType);
    return clubInfo ? clubInfo.name : 'Unknown';
  }

  /**
   * Update performance stats
   */
  updatePerformance(distance) {
    this.shotCount += 1;
    this.totalDistance += distance;
    this.avgDistance = Math.round(this.totalDistance / this.shotCount);
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Convert to JSON for storage
   */
  toJSON() {
    return {
      id: this.id,
      clubType: this.clubType,
      brand: this.brand,
      model: this.model,
      shaftType: this.shaftType,
      avgDistance: this.avgDistance,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      isActive: this.isActive,
      shotCount: this.shotCount,
      totalDistance: this.totalDistance,
      accuracyPercentage: this.accuracyPercentage
    };
  }

  /**
   * Create from JSON
   */
  static fromJSON(json) {
    return new Club(json);
  }
}

export class ClubBag {
  constructor() {
    this.clubs = [];
  }

  /**
   * Add a club to the bag
   */
  addClub(club) {
    if (this.clubs.length >= 14) {
      throw new Error('Maximum 14 clubs allowed in bag');
    }
    this.clubs.push(club);
    this.sortClubs();
  }

  /**
   * Remove a club from the bag
   */
  removeClub(clubId) {
    this.clubs = this.clubs.filter(club => club.id !== clubId);
  }

  /**
   * Get club by ID
   */
  getClub(clubId) {
    return this.clubs.find(club => club.id === clubId);
  }

  /**
   * Get clubs by category
   */
  getClubsByCategory(category) {
    return this.clubs.filter(club => {
      const clubInfo = Object.values(CLUB_TYPES).find(ct => ct.id === club.clubType);
      return clubInfo && clubInfo.category === category;
    });
  }

  /**
   * Sort clubs by their natural order
   */
  sortClubs() {
    this.clubs.sort((a, b) => {
      const aInfo = Object.values(CLUB_TYPES).find(ct => ct.id === a.clubType);
      const bInfo = Object.values(CLUB_TYPES).find(ct => ct.id === b.clubType);
      return (aInfo?.order || 999) - (bInfo?.order || 999);
    });
  }

  /**
   * Get all active clubs
   */
  getActiveClubs() {
    return this.clubs.filter(club => club.isActive);
  }

  /**
   * Convert to JSON
   */
  toJSON() {
    return this.clubs.map(club => club.toJSON());
  }

  /**
   * Create from JSON
   */
  static fromJSON(json) {
    const bag = new ClubBag();
    if (Array.isArray(json)) {
      bag.clubs = json.map(clubData => Club.fromJSON(clubData));
      bag.sortClubs();
    }
    return bag;
  }
}