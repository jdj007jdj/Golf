/**
 * @file routes/authRoutes.ts
 * @description Authentication routes
 */

import { Router } from 'express';
import {
  registerController,
  loginController,
  refreshTokenController,
  getMeController,
  logoutController,
} from '@/controllers/authController';
import { authMiddleware } from '@/middleware/authMiddleware';

const router = Router();

/**
 * @route POST /api/auth/register
 * @description Register new user
 * @access Public
 */
router.post('/register', registerController);

/**
 * @route POST /api/auth/login
 * @description Login user
 * @access Public
 */
router.post('/login', loginController);

/**
 * @route POST /api/auth/refresh
 * @description Refresh access token
 * @access Public
 */
router.post('/refresh', refreshTokenController);

/**
 * @route GET /api/auth/me
 * @description Get current user profile
 * @access Private
 */
router.get('/me', authMiddleware, getMeController);

/**
 * @route POST /api/auth/logout
 * @description Logout user
 * @access Private
 */
router.post('/logout', authMiddleware, logoutController);

export default router;