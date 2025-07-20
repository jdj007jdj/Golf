/**
 * @file middleware/rateLimitMiddleware.ts
 * @description Rate limiting middleware for API endpoints
 */

import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

/**
 * Create rate limit middleware with custom options
 */
export function rateLimitMiddleware(options: {
  windowMs: number;
  max: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
}) {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: options.message || 'Too many requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: options.message || 'Too many requests, please try again later.',
          retryAfter: req.rateLimit?.resetTime
        }
      });
    }
  });
}

/**
 * Default rate limiters for common use cases
 */

// General API rate limit (100 requests per 15 minutes)
export const generalRateLimit = rateLimitMiddleware({
  windowMs: 15 * 60 * 1000,
  max: 100
});

// Auth rate limit (10 requests per 15 minutes)
export const authRateLimit = rateLimitMiddleware({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many authentication attempts. Please try again later.'
});

// Conversion rate limit (5 requests per hour)
export const conversionRateLimit = rateLimitMiddleware({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: 'Too many conversion attempts. Please try again later.'
});

// Data upload rate limit (1000 requests per hour)
export const uploadRateLimit = rateLimitMiddleware({
  windowMs: 60 * 60 * 1000,
  max: 1000,
  message: 'Upload rate limit exceeded. Please slow down.',
  skipSuccessfulRequests: true
});