/**
 * @file services/api/apiService.ts
 * @description API service for making HTTP requests
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { storageService } from '@/services/storage/storageService';
import { offlineQueue } from '@/services/sync/offlineQueue';
import { logger } from '@/utils/logger';
import { ApiResponse } from '@/types';

// Base URL for API - this should come from environment config
const BASE_URL = __DEV__ ? 'http://localhost:3000/api' : 'https://your-production-api.com/api';

/**
 * API service class
 */
export class ApiService {
  private client: AxiosInstance;
  private isRefreshing = false;

  constructor() {
    this.client = axios.create({
      baseURL: BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  /**
   * Setup request and response interceptors
   */
  private setupInterceptors() {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      async (config) => {
        try {
          const token = await storageService.getSecure('auth_token');
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (error) {
          logger.warn('Failed to get auth token for request');
        }
        
        logger.debug(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        logger.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for token refresh and error handling
    this.client.interceptors.response.use(
      (response) => {
        logger.debug(`API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      async (error) => {
        const originalRequest = error.config;

        // Handle token expiration
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // Wait for refresh to complete
            return new Promise((resolve) => {
              setTimeout(() => resolve(this.client(originalRequest)), 1000);
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const refreshToken = await storageService.getSecure('refresh_token');
            if (refreshToken) {
              const response = await this.refreshToken(refreshToken);
              await storageService.storeSecure('auth_token', response.token);
              await storageService.storeSecure('refresh_token', response.refreshToken);
              
              // Retry original request with new token
              originalRequest.headers.Authorization = `Bearer ${response.token}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            logger.error('Token refresh failed:', refreshError);
            await this.clearAuthTokens();
            // Redirect to login - this should be handled by the auth state
          } finally {
            this.isRefreshing = false;
          }
        }

        logger.error(`API Error: ${error.response?.status} ${error.config?.url}`, {
          message: error.message,
          data: error.response?.data,
        });

        return Promise.reject(error);
      }
    );
  }

  /**
   * Refresh authentication token
   */
  private async refreshToken(refreshToken: string) {
    const response = await axios.post(`${BASE_URL}/auth/refresh`, {
      refreshToken,
    });
    return response.data.data;
  }

  /**
   * Clear authentication tokens
   */
  private async clearAuthTokens() {
    try {
      await storageService.removeSecure('auth_token');
      await storageService.removeSecure('refresh_token');
    } catch (error) {
      logger.error('Failed to clear auth tokens:', error);
    }
  }

  /**
   * GET request
   */
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> {
    return this.client.get(url, config);
  }

  /**
   * POST request
   */
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> {
    return this.client.post(url, data, config);
  }

  /**
   * PUT request
   */
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> {
    return this.client.put(url, data, config);
  }

  /**
   * DELETE request
   */
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> {
    return this.client.delete(url, config);
  }

  /**
   * PATCH request
   */
  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> {
    return this.client.patch(url, data, config);
  }

  /**
   * Upload file
   */
  async uploadFile<T = any>(url: string, file: any, onProgress?: (progress: number) => void): Promise<AxiosResponse<ApiResponse<T>>> {
    const formData = new FormData();
    formData.append('file', file);

    return this.client.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
  }

  /**
   * Check if online and attempt to sync offline queue
   */
  async checkConnectivity(): Promise<boolean> {
    try {
      await this.get('/health');
      offlineQueue.handleNetworkChange(true);
      return true;
    } catch (error) {
      offlineQueue.handleNetworkChange(false);
      return false;
    }
  }

  /**
   * Queue request for offline sync
   */
  async queueForSync(
    method: 'POST' | 'PUT' | 'DELETE',
    url: string,
    data?: any,
    recordId?: string
  ): Promise<void> {
    const operation = method === 'POST' ? 'insert' : method === 'PUT' ? 'update' : 'delete';
    const tableName = url.split('/')[1]; // Extract table name from URL
    
    await offlineQueue.addToQueue(
      tableName,
      operation,
      recordId || data?.id || '',
      data
    );
  }
}

export const apiService = new ApiService();