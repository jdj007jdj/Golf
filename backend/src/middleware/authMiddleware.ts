/**
 * @file middleware/authMiddleware.ts
 * @description JWT authentication middleware
 */

import { Request, Response, NextFunction } from 'express';
import { verifyToken, getUserById } from '@/services/authService';
import { logger } from '@/utils/logger';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        username: string;
        firstName?: string;
        lastName?: string;
        handicap?: number;
        profileImageUrl?: string;
        preferences: any;
      };
    }
  }
}

/**
 * Authentication middleware
 */
export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'NO_TOKEN',
          message: 'Access token is required',
        },
      });
    }

    // Extract token from Bearer format
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN_FORMAT',
          message: 'Token format should be: Bearer <token>',
        },
      });
    }

    // Verify token
    const payload = verifyToken(token);
    
    // Get user details
    const user = await getUserById(payload.userId);
    
    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
      handicap: user.handicap || undefined,
      profileImageUrl: user.profileImageUrl || undefined,
      preferences: user.preferences,
    };

    next();
  } catch (error: any) {
    logger.error('Authentication middleware error:', error);
    
    let errorCode = 'AUTH_ERROR';
    let errorMessage = 'Authentication failed';
    
    if (error.message.includes('Invalid or expired token')) {
      errorCode = 'TOKEN_EXPIRED';
      errorMessage = 'Token has expired';
    } else if (error.message.includes('User not found')) {
      errorCode = 'USER_NOT_FOUND';
      errorMessage = 'User account not found';
    }

    return res.status(401).json({
      success: false,
      error: {
        code: errorCode,
        message: errorMessage,
      },
    });
  }
}

/**
 * Optional authentication middleware (for public routes that can benefit from user context)
 */
export async function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return next();
    }

    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    if (!token) {
      return next();
    }

    const payload = verifyToken(token);
    const user = await getUserById(payload.userId);
    
    req.user = {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
      handicap: user.handicap || undefined,
      profileImageUrl: user.profileImageUrl || undefined,
      preferences: user.preferences,
    };

    next();
  } catch (error) {
    // Silently fail for optional auth
    next();
  }
}