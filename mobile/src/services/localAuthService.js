/**
 * LocalAuthService
 * 
 * Manages local-only authentication for offline accounts
 * Uses device-local storage for user data and auth tokens
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';
import CryptoJS from 'crypto-js';

class LocalAuthService {
  constructor() {
    this.initialized = false;
    this.deviceId = null;
    this.storagePrefix = 'local_';
  }

  async initialize() {
    if (this.initialized) return;

    try {
      console.log('🔐 Initializing LocalAuthService...');
      
      // Get unique device ID
      this.deviceId = await DeviceInfo.getUniqueId();
      
      this.initialized = true;
      console.log('✅ LocalAuthService initialized');
    } catch (error) {
      console.error('❌ Error initializing LocalAuthService:', error);
    }
  }

  // Hash password using SHA256
  hashPassword(password) {
    return CryptoJS.SHA256(password).toString();
  }

  // Generate a local token
  generateLocalToken(email) {
    const timestamp = Date.now();
    const data = `${email}-${this.deviceId}-${timestamp}`;
    return CryptoJS.SHA256(data).toString();
  }

  // Create a new local user
  async createLocalUser(email, password) {
    try {
      console.log('📝 Creating local user:', email);
      
      // Check if user already exists
      const existingUser = await this.getLocalUser(email);
      if (existingUser) {
        return {
          success: false,
          error: 'An account with this email already exists on this device'
        };
      }

      // Generate user ID
      const userId = `local_${this.deviceId}_${Date.now()}`;
      
      // Generate username from email
      const username = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_');
      
      // Create user data
      const userData = {
        id: userId,
        username: username,
        email: email,
        passwordHash: this.hashPassword(password),
        accountType: 'local',
        deviceId: this.deviceId,
        createdAt: new Date().toISOString(),
        lastLogin: null,
        stats: {
          roundsPlayed: 0,
          holesPlayed: 0,
          totalShots: 0,
          bestScore: null,
          averageScore: null
        }
      };

      // Store user data using email as key
      const userKey = `${this.storagePrefix}user_${email}`;
      await AsyncStorage.setItem(userKey, JSON.stringify(userData));

      // Store email in local users list
      const usersListKey = `${this.storagePrefix}users_list`;
      const usersList = await this.getLocalUsersList();
      usersList.push(email);
      await AsyncStorage.setItem(usersListKey, JSON.stringify(usersList));

      console.log('✅ Local user created successfully');
      return {
        success: true,
        user: {
          id: userData.id,
          username: userData.username,
          email: userData.email,
          accountType: userData.accountType
        }
      };
    } catch (error) {
      console.error('❌ Error creating local user:', error);
      return {
        success: false,
        error: 'Failed to create local account'
      };
    }
  }

  // Authenticate local user
  async authenticateLocal(email, password) {
    try {
      console.log('🔓 Authenticating local user:', email);
      
      const userData = await this.getLocalUser(email);
      console.log('📊 User data found:', userData ? 'Yes' : 'No');
      
      if (!userData) {
        console.log('❌ No user found with email:', email);
        return {
          success: false,
          error: 'Invalid email or password'
        };
      }

      // Verify password
      const passwordHash = this.hashPassword(password);
      console.log('🔑 Password hash comparison:', {
        provided: passwordHash.substring(0, 10) + '...',
        stored: userData.passwordHash?.substring(0, 10) + '...',
        match: passwordHash === userData.passwordHash
      });
      
      if (passwordHash !== userData.passwordHash) {
        console.log('❌ Password mismatch');
        return {
          success: false,
          error: 'Invalid email or password'
        };
      }

      // Generate local token
      const token = this.generateLocalToken(email);

      // Update last login
      userData.lastLogin = new Date().toISOString();
      const userKey = `${this.storagePrefix}user_${email}`;
      await AsyncStorage.setItem(userKey, JSON.stringify(userData));

      // Store current auth
      await AsyncStorage.setItem(`${this.storagePrefix}auth_token`, token);
      await AsyncStorage.setItem(`${this.storagePrefix}current_user`, email);
      
      console.log('✅ Local authentication successful');
      return {
        success: true,
        token,
        user: {
          id: userData.id,
          username: userData.username,
          email: userData.email,
          accountType: userData.accountType,
          stats: userData.stats
        }
      };
    } catch (error) {
      console.error('❌ Error authenticating local user:', error);
      return {
        success: false,
        error: 'Authentication failed'
      };
    }
  }

  // Get local user data
  async getLocalUser(email) {
    try {
      const userKey = `${this.storagePrefix}user_${email}`;
      const userData = await AsyncStorage.getItem(userKey);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting local user:', error);
      return null;
    }
  }

  // Get list of local users
  async getLocalUsersList() {
    try {
      const usersListKey = `${this.storagePrefix}users_list`;
      const usersList = await AsyncStorage.getItem(usersListKey);
      return usersList ? JSON.parse(usersList) : [];
    } catch (error) {
      console.error('Error getting local users list:', error);
      return [];
    }
  }

  // Check if current session is local account
  async isLocalAccount() {
    try {
      const token = await AsyncStorage.getItem(`${this.storagePrefix}auth_token`);
      const username = await AsyncStorage.getItem(`${this.storagePrefix}current_user`);
      return !!(token && username);
    } catch (error) {
      console.error('Error checking local account:', error);
      return false;
    }
  }

  // Get current local user ID
  async getLocalUserId() {
    try {
      const email = await AsyncStorage.getItem(`${this.storagePrefix}current_user`);
      if (!email) return null;
      
      const userData = await this.getLocalUser(email);
      return userData?.id || null;
    } catch (error) {
      console.error('Error getting local user ID:', error);
      return null;
    }
  }

  // Update user stats
  async updateUserStats(email, stats) {
    try {
      const userData = await this.getLocalUser(email);
      if (!userData) return false;

      userData.stats = {
        ...userData.stats,
        ...stats
      };

      const userKey = `${this.storagePrefix}user_${email}`;
      await AsyncStorage.setItem(userKey, JSON.stringify(userData));
      
      return true;
    } catch (error) {
      console.error('Error updating user stats:', error);
      return false;
    }
  }

  // Logout local user
  async logoutLocal() {
    try {
      await AsyncStorage.removeItem(`${this.storagePrefix}auth_token`);
      await AsyncStorage.removeItem(`${this.storagePrefix}current_user`);
      console.log('✅ Local user logged out');
      return true;
    } catch (error) {
      console.error('Error logging out local user:', error);
      return false;
    }
  }

  // Get all local data for conversion
  async getLocalDataForConversion(email) {
    try {
      const userData = await this.getLocalUser(email);
      if (!userData) return null;

      const userId = userData.id;
      
      // Get all local data keys
      const roundsKey = `${this.storagePrefix}rounds_${userId}`;
      const shotsKey = `${this.storagePrefix}shots_${userId}`;
      const gamesKey = `${this.storagePrefix}games_${userId}`;
      
      const rounds = await AsyncStorage.getItem(roundsKey);
      const shots = await AsyncStorage.getItem(shotsKey);
      const games = await AsyncStorage.getItem(gamesKey);

      return {
        user: userData,
        rounds: rounds ? JSON.parse(rounds) : [],
        shots: shots ? JSON.parse(shots) : [],
        games: games ? JSON.parse(games) : [],
        deviceId: this.deviceId
      };
    } catch (error) {
      console.error('Error getting local data for conversion:', error);
      return null;
    }
  }

  // Clear local data after successful conversion
  async clearLocalDataAfterConversion(email) {
    try {
      const userData = await this.getLocalUser(email);
      if (!userData) return false;

      const userId = userData.id;
      
      // Remove all local data
      await AsyncStorage.removeItem(`${this.storagePrefix}user_${email}`);
      await AsyncStorage.removeItem(`${this.storagePrefix}rounds_${userId}`);
      await AsyncStorage.removeItem(`${this.storagePrefix}shots_${userId}`);
      await AsyncStorage.removeItem(`${this.storagePrefix}games_${userId}`);
      await AsyncStorage.removeItem(`${this.storagePrefix}auth_token`);
      await AsyncStorage.removeItem(`${this.storagePrefix}current_user`);
      
      // Remove from users list
      const usersList = await this.getLocalUsersList();
      const updatedList = usersList.filter(u => u !== email);
      await AsyncStorage.setItem(`${this.storagePrefix}users_list`, JSON.stringify(updatedList));
      
      console.log('✅ Local data cleared after conversion');
      return true;
    } catch (error) {
      console.error('Error clearing local data:', error);
      return false;
    }
  }
}

// Create singleton instance
const localAuthService = new LocalAuthService();

export default localAuthService;