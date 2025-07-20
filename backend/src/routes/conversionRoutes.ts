/**
 * @file routes/conversionRoutes.ts
 * @description Account conversion routes
 */

import { Router } from 'express';
import {
  checkUsernameAvailability,
  convertAccount
} from '@/controllers/authConversionController';
import {
  uploadConversionData,
  getConversionStatus,
  updateConversionStatus
} from '@/controllers/conversionDataController';
import { authMiddleware } from '@/middleware/authMiddleware';
import { rateLimitMiddleware } from '@/middleware/rateLimitMiddleware';

const router = Router();

/**
 * Auth conversion routes
 */

/**
 * @route GET /api/auth/check-username/:username
 * @description Check if username is available
 * @access Public
 */
router.get('/auth/check-username/:username', checkUsernameAvailability);

/**
 * @route POST /api/auth/convert-account
 * @description Convert local account to online account
 * @access Public
 * @rateLimit 5 requests per hour per IP
 */
router.post(
  '/auth/convert-account', 
  rateLimitMiddleware({ 
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    message: 'Too many conversion attempts. Please try again later.'
  }),
  convertAccount
);

/**
 * Data conversion routes
 */

/**
 * @route POST /api/conversion/upload-data
 * @description Upload conversion data in batches
 * @access Private (requires auth token from converted account)
 */
router.post('/conversion/upload-data', authMiddleware, uploadConversionData);

/**
 * @route GET /api/conversion/:id/status
 * @description Get conversion status
 * @access Private
 */
router.get('/conversion/:id/status', authMiddleware, getConversionStatus);

/**
 * @route PUT /api/conversion/:id/status
 * @description Update conversion status
 * @access Private
 */
router.put('/conversion/:id/status', authMiddleware, updateConversionStatus);

export default router;