/**
 * Club Service
 * 
 * Manages user's golf bag and club data
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Club, ClubBag, CLUB_TYPES, CLUB_BRANDS, SHAFT_TYPES } from '../models/Club';

const STORAGE_KEY = 'user_golf_bag';
const DEFAULT_CLUBS_KEY = 'default_clubs_created';

class ClubService {
  constructor() {
    this.bag = new ClubBag();
    this.initialized = false;
  }

  /**
   * Initialize the service
   */
  async initialize() {
    if (this.initialized) return;

    try {
      console.log('🏌️ Initializing ClubService...');
      
      // Load user's bag from storage
      await this.loadBag();
      
      // Create default clubs if first time
      const defaultsCreated = await AsyncStorage.getItem(DEFAULT_CLUBS_KEY);
      if (!defaultsCreated && this.bag.clubs.length === 0) {
        await this.createDefaultClubs();
      }
      
      this.initialized = true;
      console.log(`✅ ClubService initialized with ${this.bag.clubs.length} clubs`);
    } catch (error) {
      console.error('❌ Error initializing ClubService:', error);
    }
  }

  /**
   * Create a default set of clubs for new users
   */
  async createDefaultClubs() {
    console.log('🏌️ Creating default club set...');
    
    const defaultClubs = [
      { clubType: 'driver', brand: 'TaylorMade', avgDistance: 250 },
      { clubType: '3wood', brand: 'TaylorMade', avgDistance: 220 },
      { clubType: '4hybrid', brand: 'TaylorMade', avgDistance: 200 },
      { clubType: '5iron', brand: 'TaylorMade', avgDistance: 180 },
      { clubType: '6iron', brand: 'TaylorMade', avgDistance: 170 },
      { clubType: '7iron', brand: 'TaylorMade', avgDistance: 160 },
      { clubType: '8iron', brand: 'TaylorMade', avgDistance: 150 },
      { clubType: '9iron', brand: 'TaylorMade', avgDistance: 140 },
      { clubType: 'pwedge', brand: 'TaylorMade', avgDistance: 130 },
      { clubType: 'awedge', brand: 'Cleveland', avgDistance: 110 },
      { clubType: 'swedge', brand: 'Cleveland', avgDistance: 85 },
      { clubType: 'putter', brand: 'Odyssey', avgDistance: null }
    ];

    for (const clubData of defaultClubs) {
      const club = new Club(clubData);
      this.bag.addClub(club);
    }

    await this.saveBag();
    await AsyncStorage.setItem(DEFAULT_CLUBS_KEY, 'true');
    
    console.log('✅ Default clubs created');
  }

  /**
   * Load bag from storage
   */
  async loadBag() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        this.bag = ClubBag.fromJSON(JSON.parse(data));
        console.log(`📦 Loaded ${this.bag.clubs.length} clubs from storage`);
      }
    } catch (error) {
      console.error('❌ Error loading clubs:', error);
    }
  }

  /**
   * Save bag to storage
   */
  async saveBag() {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.bag.toJSON()));
    } catch (error) {
      console.error('❌ Error saving clubs:', error);
    }
  }

  /**
   * Add a new club
   */
  async addClub(clubData) {
    try {
      const club = new Club(clubData);
      this.bag.addClub(club);
      await this.saveBag();
      return club;
    } catch (error) {
      console.error('❌ Error adding club:', error);
      throw error;
    }
  }

  /**
   * Update an existing club
   */
  async updateClub(clubId, updates) {
    try {
      const club = this.bag.getClub(clubId);
      if (!club) {
        throw new Error('Club not found');
      }

      // Update club properties
      Object.assign(club, updates);
      club.updatedAt = new Date().toISOString();

      await this.saveBag();
      return club;
    } catch (error) {
      console.error('❌ Error updating club:', error);
      throw error;
    }
  }

  /**
   * Remove a club
   */
  async removeClub(clubId) {
    try {
      this.bag.removeClub(clubId);
      await this.saveBag();
    } catch (error) {
      console.error('❌ Error removing club:', error);
      throw error;
    }
  }

  /**
   * Get all clubs
   */
  getAllClubs() {
    return this.bag.clubs;
  }

  /**
   * Get active clubs for shot tracking
   */
  getActiveClubs() {
    return this.bag.getActiveClubs();
  }

  /**
   * Get clubs grouped by category
   */
  getClubsByCategory() {
    const categories = ['woods', 'hybrids', 'irons', 'wedges', 'putter'];
    const grouped = {};

    categories.forEach(category => {
      grouped[category] = this.bag.getClubsByCategory(category);
    });

    return grouped;
  }

  /**
   * Get club by ID
   */
  getClub(clubId) {
    return this.bag.getClub(clubId);
  }

  /**
   * Get a club by name
   */
  getClubByName(name) {
    return this.bag.clubs.find(club => 
      club.name.toLowerCase() === name.toLowerCase() ||
      club.clubType.toLowerCase() === name.toLowerCase()
    );
  }

  /**
   * Update club performance after a shot
   */
  async updateClubPerformance(clubId, distance) {
    try {
      const club = this.bag.getClub(clubId);
      if (club) {
        club.updatePerformance(distance);
        await this.saveBag();
      }
    } catch (error) {
      console.error('❌ Error updating club performance:', error);
    }
  }

  /**
   * Get club recommendations for a distance
   */
  getClubRecommendations(targetDistance) {
    const recommendations = [];
    const activeClubs = this.getActiveClubs();

    activeClubs.forEach(club => {
      if (club.avgDistance && club.clubType !== 'putter') {
        const difference = Math.abs(club.avgDistance - targetDistance);
        recommendations.push({
          club,
          difference,
          percentage: Math.round((1 - difference / targetDistance) * 100)
        });
      }
    });

    // Sort by closest match
    recommendations.sort((a, b) => a.difference - b.difference);

    // Return top 3 recommendations
    return recommendations.slice(0, 3);
  }

  /**
   * Reset to default clubs
   */
  async resetToDefaults() {
    try {
      this.bag = new ClubBag();
      await AsyncStorage.removeItem(DEFAULT_CLUBS_KEY);
      await this.createDefaultClubs();
    } catch (error) {
      console.error('❌ Error resetting clubs:', error);
      throw error;
    }
  }

  /**
   * Export club data for sync
   */
  exportForSync() {
    return {
      clubs: this.bag.toJSON(),
      exportedAt: new Date().toISOString()
    };
  }

  /**
   * Import club data from sync
   */
  async importFromSync(data) {
    try {
      if (data.clubs && Array.isArray(data.clubs)) {
        this.bag = ClubBag.fromJSON(data.clubs);
        await this.saveBag();
        console.log(`📥 Imported ${this.bag.clubs.length} clubs from sync`);
      }
    } catch (error) {
      console.error('❌ Error importing clubs:', error);
      throw error;
    }
  }
}

// Create singleton instance
const clubService = new ClubService();

export default clubService;