/**
 * @file services/error/errorHandler.ts
 * @description Comprehensive error handling and retry logic
 */

import { logger } from '@/utils/logger';
import { ApiError, ErrorCode, ERROR_CODES } from '@golf/shared-types';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryCondition?: (error: Error) => boolean;
}

interface ErrorContext {
  userId?: string;
  action: string;
  component?: string;
  metadata?: Record<string, any>;
}

class ErrorHandler {
  private readonly defaultRetryConfig: RetryConfig = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 2,
    retryCondition: (error) => this.isRetryableError(error),
  };

  private errorCounts: Map<string, number> = new Map();
  private lastErrorTimes: Map<string, number> = new Map();

  /**
   * Handle errors with automatic retry logic
   */
  async withRetry<T>(
    operation: () => Promise<T>,
    context: ErrorContext,
    config?: Partial<RetryConfig>
  ): Promise<T> {
    const retryConfig = { ...this.defaultRetryConfig, ...config };
    let lastError: Error;
    
    for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
      try {
        const result = await operation();
        
        // Reset error count on success
        this.resetErrorCount(context.action);
        
        return result;
      } catch (error) {
        lastError = error as Error;
        
        // Log the error
        this.logError(lastError, context, attempt);
        
        // Check if we should retry
        if (attempt === retryConfig.maxAttempts || !retryConfig.retryCondition?.(lastError)) {
          break;
        }
        
        // Calculate delay with exponential backoff
        const delay = Math.min(
          retryConfig.baseDelay * Math.pow(retryConfig.backoffFactor, attempt - 1),
          retryConfig.maxDelay
        );
        
        logger.info(`Retrying ${context.action} in ${delay}ms (attempt ${attempt + 1}/${retryConfig.maxAttempts})`);
        
        await this.delay(delay);
      }
    }
    
    // All retries failed
    this.handleFinalError(lastError!, context);
    throw lastError!;
  }

  /**
   * Handle errors without retry
   */
  handleError(error: Error, context: ErrorContext): void {
    this.logError(error, context);
    this.handleFinalError(error, context);
  }

  /**
   * Create a standardized API error
   */
  createApiError(
    code: ErrorCode,
    message: string,
    details?: any,
    originalError?: Error
  ): ApiError {
    return {
      code,
      message,
      details: {
        ...details,
        originalError: originalError?.message,
        stack: originalError?.stack,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Check if an error is retryable
   */
  private isRetryableError(error: Error): boolean {
    // Network errors are retryable
    if (error.message.includes('Network') || error.message.includes('fetch')) {
      return true;
    }
    
    // Timeout errors are retryable
    if (error.message.includes('timeout') || error.message.includes('Timeout')) {
      return true;
    }
    
    // Server errors (5xx) are retryable
    if ('status' in error && typeof error.status === 'number') {
      return error.status >= 500 && error.status < 600;
    }
    
    // Rate limit errors are retryable with delay
    if ('status' in error && error.status === 429) {
      return true;
    }
    
    // Database busy errors are retryable
    if (error.message.includes('database is locked') || error.message.includes('busy')) {
      return true;
    }
    
    return false;
  }

  /**
   * Log error with context
   */
  private logError(error: Error, context: ErrorContext, attempt?: number): void {
    const errorKey = `${context.action}_${error.message}`;
    const now = Date.now();
    
    // Track error frequency
    this.errorCounts.set(errorKey, (this.errorCounts.get(errorKey) || 0) + 1);
    this.lastErrorTimes.set(errorKey, now);
    
    const logData = {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      context,
      attempt,
      errorCount: this.errorCounts.get(errorKey),
      timestamp: new Date().toISOString(),
    };
    
    if (attempt) {
      logger.warn(`Error on attempt ${attempt} for ${context.action}:`, logData);
    } else {
      logger.error(`Error in ${context.action}:`, logData);
    }
    
    // Store error for crash reporting
    this.storeErrorForReporting(error, context).catch(err => {
      logger.warn('Failed to store error for reporting:', err);
    });
  }

  /**
   * Handle final error after all retries failed
   */
  private handleFinalError(error: Error, context: ErrorContext): void {
    const errorCount = this.errorCounts.get(`${context.action}_${error.message}`) || 1;
    
    // Show user-friendly error message
    this.showUserError(error, context, errorCount);
    
    // Track critical errors
    if (errorCount >= 3) {
      logger.error(`Critical error in ${context.action} (${errorCount} occurrences):`, {
        error: error.message,
        context,
      });
    }
  }

  /**
   * Show user-friendly error message
   */
  private showUserError(error: Error, context: ErrorContext, errorCount: number): void {
    let title = 'Error';
    let message = 'Something went wrong. Please try again.';
    
    // Customize message based on error type
    if (error.message.includes('Network') || error.message.includes('fetch')) {
      title = 'Connection Error';
      message = 'Please check your internet connection and try again.';
    } else if (error.message.includes('timeout')) {
      title = 'Request Timeout';
      message = 'The request took too long. Please try again.';
    } else if (context.action.includes('sync')) {
      title = 'Sync Error';
      message = 'Failed to sync data. Your changes are saved locally and will sync when connection is restored.';
    } else if (context.action.includes('save')) {
      title = 'Save Error';
      message = 'Failed to save changes. Please try again.';
    }
    
    // Add frequency info for repeated errors
    if (errorCount > 1) {
      message += ` (${errorCount} times)`;
    }
    
    Alert.alert(title, message, [
      { text: 'OK', style: 'default' },
      ...(errorCount >= 3 ? [{ text: 'Report Issue', onPress: () => this.reportIssue(error, context) }] : []),
    ]);
  }

  /**
   * Reset error count for successful operations
   */
  private resetErrorCount(action: string): void {
    const keysToRemove: string[] = [];
    
    for (const key of this.errorCounts.keys()) {
      if (key.startsWith(action)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => {
      this.errorCounts.delete(key);
      this.lastErrorTimes.delete(key);
    });
  }

  /**
   * Store error for crash reporting
   */
  private async storeErrorForReporting(error: Error, context: ErrorContext): Promise<void> {
    try {
      const errorReport = {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        context,
        timestamp: new Date().toISOString(),
        userAgent: 'React Native Mobile App',
      };
      
      const existingReports = await AsyncStorage.getItem('error_reports');
      const reports = existingReports ? JSON.parse(existingReports) : [];
      
      reports.push(errorReport);
      
      // Keep only last 50 reports
      if (reports.length > 50) {
        reports.splice(0, reports.length - 50);
      }
      
      await AsyncStorage.setItem('error_reports', JSON.stringify(reports));
    } catch (storageError) {
      logger.warn('Failed to store error report:', storageError);
    }
  }

  /**
   * Report issue to support
   */
  private reportIssue(error: Error, context: ErrorContext): void {
    // This could integrate with crash reporting services like Crashlytics, Sentry, etc.
    logger.info('User requested to report issue:', {
      error: error.message,
      context,
    });
    
    Alert.alert(
      'Report Issue',
      'Error details have been logged. Our team will investigate the issue.',
      [{ text: 'OK' }]
    );
  }

  /**
   * Get error statistics
   */
  getErrorStatistics(): {
    totalErrors: number;
    uniqueErrors: number;
    recentErrors: number;
    topErrors: Array<{ error: string; count: number }>;
  } {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    
    let recentErrors = 0;
    const errorCounts: Record<string, number> = {};
    
    for (const [key, time] of this.lastErrorTimes.entries()) {
      if (time > oneHourAgo) {
        recentErrors++;
      }
      
      const errorMessage = key.split('_').slice(1).join('_');
      errorCounts[errorMessage] = (errorCounts[errorMessage] || 0) + (this.errorCounts.get(key) || 0);
    }
    
    const topErrors = Object.entries(errorCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([error, count]) => ({ error, count }));
    
    return {
      totalErrors: Array.from(this.errorCounts.values()).reduce((sum, count) => sum + count, 0),
      uniqueErrors: this.errorCounts.size,
      recentErrors,
      topErrors,
    };
  }

  /**
   * Clear error history
   */
  clearErrorHistory(): void {
    this.errorCounts.clear();
    this.lastErrorTimes.clear();
    AsyncStorage.removeItem('error_reports').catch(err => {
      logger.warn('Failed to clear error reports:', err);
    });
  }

  /**
   * Utility function for delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const errorHandler = new ErrorHandler();

// Helper function for easy usage
export const withRetry = <T>(
  operation: () => Promise<T>,
  context: ErrorContext,
  config?: Partial<RetryConfig>
): Promise<T> => {
  return errorHandler.withRetry(operation, context, config);
};

// Higher-order function for wrapping async functions with error handling
export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context: Omit<ErrorContext, 'action'>
) {
  return async (...args: T): Promise<R> => {
    const action = context.component ? `${context.component}.${fn.name}` : fn.name;
    
    return errorHandler.withRetry(
      () => fn(...args),
      { ...context, action }
    );
  };
}