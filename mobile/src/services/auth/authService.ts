/**
 * @file services/auth/authService.ts
 * @description Authentication service for mobile app
 */

import { apiService } from '@/services/api/apiService';
import { storageService } from '@/services/storage/storageService';
import { LoginCredentials, RegisterData, AuthState } from '@/types';
import { logger } from '@/utils/logger';

/**
 * Authentication service
 */
export class AuthService {
  /**
   * Login user
   */
  async login(credentials: LoginCredentials) {
    try {
      const response = await apiService.post('/auth/login', credentials);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.error?.message || 'Login failed');
      }
    } catch (error: any) {
      logger.error('Login error:', error);
      throw new Error(error.response?.data?.error?.message || 'Login failed');
    }
  }

  /**
   * Register user
   */
  async register(userData: RegisterData) {
    try {
      const response = await apiService.post('/auth/register', userData);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.error?.message || 'Registration failed');
      }
    } catch (error: any) {
      logger.error('Registration error:', error);
      throw new Error(error.response?.data?.error?.message || 'Registration failed');
    }
  }

  /**
   * Logout user
   */
  async logout() {
    try {
      await apiService.post('/auth/logout');
    } catch (error) {
      // Ignore logout API errors, we'll clear local data anyway
      logger.warn('Logout API call failed, but continuing with local cleanup');
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string) {
    try {
      const response = await apiService.post('/auth/refresh', { refreshToken });
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.error?.message || 'Token refresh failed');
      }
    } catch (error: any) {
      logger.error('Token refresh error:', error);
      throw new Error(error.response?.data?.error?.message || 'Token refresh failed');
    }
  }

  /**
   * Verify token validity
   */
  async verifyToken(token: string) {
    try {
      const response = await apiService.get('/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.data.success) {
        return response.data.data.user;
      } else {
        throw new Error(response.data.error?.message || 'Token verification failed');
      }
    } catch (error: any) {
      logger.error('Token verification error:', error);
      throw new Error(error.response?.data?.error?.message || 'Token verification failed');
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentUser() {
    try {
      const response = await apiService.get('/auth/me');
      
      if (response.data.success) {
        return response.data.data.user;
      } else {
        throw new Error(response.data.error?.message || 'Failed to get user profile');
      }
    } catch (error: any) {
      logger.error('Get current user error:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to get user profile');
    }
  }
}

export const authService = new AuthService();