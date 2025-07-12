/**
 * @file services/storage/storageService.ts
 * @description Local storage service for React Native
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import Keychain from 'react-native-keychain';
import { logger } from '@/utils/logger';

/**
 * Storage service for non-sensitive data
 */
export class StorageService {
  /**
   * Store data in AsyncStorage
   */
  async store(key: string, value: any): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
      logger.error('Storage error:', error);
      throw new Error('Failed to store data');
    }
  }

  /**
   * Get data from AsyncStorage
   */
  async get<T = any>(key: string): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      logger.error('Storage retrieval error:', error);
      return null;
    }
  }

  /**
   * Remove data from AsyncStorage
   */
  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      logger.error('Storage removal error:', error);
      throw new Error('Failed to remove data');
    }
  }

  /**
   * Clear all data from AsyncStorage
   */
  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      logger.error('Storage clear error:', error);
      throw new Error('Failed to clear storage');
    }
  }

  /**
   * Get all keys from AsyncStorage
   */
  async getAllKeys(): Promise<string[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return [...keys]; // Convert readonly to mutable array
    } catch (error) {
      logger.error('Get all keys error:', error);
      return [];
    }
  }

  /**
   * Store sensitive data in Keychain
   */
  async storeSecure(key: string, value: string): Promise<void> {
    try {
      await Keychain.setInternetCredentials(key, key, value);
    } catch (error) {
      logger.error('Secure storage error:', error);
      throw new Error('Failed to store secure data');
    }
  }

  /**
   * Get sensitive data from Keychain
   */
  async getSecure(key: string): Promise<string | null> {
    try {
      const credentials = await Keychain.getInternetCredentials(key);
      if (credentials && credentials.password) {
        return credentials.password;
      }
      return null;
    } catch (error) {
      logger.error('Secure storage retrieval error:', error);
      return null;
    }
  }

  /**
   * Remove sensitive data from Keychain
   */
  async removeSecure(key: string): Promise<void> {
    try {
      await Keychain.resetInternetCredentials(key);
    } catch (error) {
      logger.error('Secure storage removal error:', error);
      throw new Error('Failed to remove secure data');
    }
  }

  /**
   * Check if Keychain is available
   */
  async hasSecureStorage(): Promise<boolean> {
    try {
      const hasKeychain = await Keychain.getSupportedBiometryType();
      return hasKeychain !== null;
    } catch (error) {
      return false;
    }
  }
}

export const storageService = new StorageService();