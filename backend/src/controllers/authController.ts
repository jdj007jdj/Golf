/**
 * @file controllers/authController.ts
 * @description Authentication controller
 */

import { Request, Response } from 'express';
import { 
  register, 
  login, 
  refreshAccessToken, 
  LoginCredentials, 
  RegisterData 
} from '@/services/authService';
import { logger } from '@/utils/logger';

/**
 * Register new user
 * @route POST /api/auth/register
 */
export async function registerController(req: Request, res: Response) {
  try {
    const { email, username, password, firstName, lastName }: RegisterData = req.body;

    // Validation
    if (!email || !username || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email, username, and password are required',
        },
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_EMAIL',
          message: 'Please provide a valid email address',
        },
      });
    }

    // Username validation
    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_USERNAME',
          message: 'Username must be between 3 and 20 characters',
        },
      });
    }

    // Password validation
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'WEAK_PASSWORD',
          message: 'Password must be at least 6 characters long',
        },
      });
    }

    const authResponse = await register({
      email,
      username,
      password,
      firstName,
      lastName,
    });

    res.status(201).json({
      success: true,
      data: authResponse,
    });
  } catch (error: any) {
    logger.error('Register controller error:', error);
    
    let statusCode = 500;
    let errorCode = 'REGISTRATION_ERROR';
    let errorMessage = 'Registration failed';

    if (error.message.includes('Email already registered')) {
      statusCode = 409;
      errorCode = 'EMAIL_EXISTS';
      errorMessage = error.message;
    } else if (error.message.includes('Username already taken')) {
      statusCode = 409;
      errorCode = 'USERNAME_EXISTS';
      errorMessage = error.message;
    }

    res.status(statusCode).json({
      success: false,
      error: {
        code: errorCode,
        message: errorMessage,
      },
    });
  }
}

/**
 * Login user
 * @route POST /api/auth/login
 */
export async function loginController(req: Request, res: Response) {
  try {
    const { email, password }: LoginCredentials = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email and password are required',
        },
      });
    }

    const authResponse = await login({ email, password });

    res.json({
      success: true,
      data: authResponse,
    });
  } catch (error: any) {
    logger.error('Login controller error:', error);
    
    let statusCode = 500;
    let errorCode = 'LOGIN_ERROR';
    let errorMessage = 'Login failed';

    if (error.message.includes('Invalid email or password')) {
      statusCode = 401;
      errorCode = 'INVALID_CREDENTIALS';
      errorMessage = error.message;
    }

    res.status(statusCode).json({
      success: false,
      error: {
        code: errorCode,
        message: errorMessage,
      },
    });
  }
}

/**
 * Refresh access token
 * @route POST /api/auth/refresh
 */
export async function refreshTokenController(req: Request, res: Response) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Refresh token is required',
        },
      });
    }

    const tokens = await refreshAccessToken(refreshToken);

    res.json({
      success: true,
      data: tokens,
    });
  } catch (error: any) {
    logger.error('Refresh token controller error:', error);
    
    let statusCode = 500;
    let errorCode = 'REFRESH_ERROR';
    let errorMessage = 'Token refresh failed';

    if (error.message.includes('Invalid or expired')) {
      statusCode = 401;
      errorCode = 'INVALID_REFRESH_TOKEN';
      errorMessage = 'Invalid or expired refresh token';
    } else if (error.message.includes('User not found')) {
      statusCode = 401;
      errorCode = 'USER_NOT_FOUND';
      errorMessage = 'User account not found';
    }

    res.status(statusCode).json({
      success: false,
      error: {
        code: errorCode,
        message: errorMessage,
      },
    });
  }
}

/**
 * Get current user profile
 * @route GET /api/auth/me
 */
export async function getMeController(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        },
      });
    }

    res.json({
      success: true,
      data: {
        user: req.user,
      },
    });
  } catch (error: any) {
    logger.error('Get me controller error:', error);
    
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to get user profile',
      },
    });
  }
}

/**
 * Logout user (placeholder for future token blacklisting)
 * @route POST /api/auth/logout
 */
export async function logoutController(req: Request, res: Response) {
  try {
    // In a production app, you might want to blacklist the token
    // For now, we'll just return success
    
    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error: any) {
    logger.error('Logout controller error:', error);
    
    res.status(500).json({
      success: false,
      error: {
        code: 'LOGOUT_ERROR',
        message: 'Logout failed',
      },
    });
  }
}