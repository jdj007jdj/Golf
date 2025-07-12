/**
 * @file services/api/apiWrapper.ts
 * @description Wrapper for API service to handle response formatting
 */

import { apiService } from './apiService';
import { logger } from '@/utils/logger';
import { ApiResponse } from '@/types';

export interface SimpleApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

class ApiWrapper {
  /**
   * GET request with simplified response
   */
  async get<T>(endpoint: string): Promise<SimpleApiResponse<T>> {
    try {
      const response = await apiService.get<T>(endpoint);
      return {
        success: response.data.success || true,
        data: response.data.data || response.data,
        message: response.data.message,
      };
    } catch (error: any) {
      logger.error(`GET ${endpoint} failed:`, error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Network error',
      };
    }
  }

  /**
   * POST request with simplified response
   */
  async post<T>(endpoint: string, data?: any): Promise<SimpleApiResponse<T>> {
    try {
      const response = await apiService.post<T>(endpoint, data);
      return {
        success: response.data.success || true,
        data: response.data.data || response.data,
        message: response.data.message,
      };
    } catch (error: any) {
      logger.error(`POST ${endpoint} failed:`, error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Network error',
      };
    }
  }

  /**
   * PUT request with simplified response
   */
  async put<T>(endpoint: string, data?: any): Promise<SimpleApiResponse<T>> {
    try {
      const response = await apiService.put<T>(endpoint, data);
      return {
        success: response.data.success || true,
        data: response.data.data || response.data,
        message: response.data.message,
      };
    } catch (error: any) {
      logger.error(`PUT ${endpoint} failed:`, error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Network error',
      };
    }
  }

  /**
   * DELETE request with simplified response
   */
  async delete<T>(endpoint: string): Promise<SimpleApiResponse<T>> {
    try {
      const response = await apiService.delete<T>(endpoint);
      return {
        success: response.data.success || true,
        data: response.data.data || response.data,
        message: response.data.message,
      };
    } catch (error: any) {
      logger.error(`DELETE ${endpoint} failed:`, error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Network error',
      };
    }
  }
}

export const apiWrapper = new ApiWrapper();