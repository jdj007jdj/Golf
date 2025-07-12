/**
 * @file middleware/notFoundHandler.ts
 * @description 404 Not Found middleware
 */

import { Request, Response } from 'express';
import { logger } from '@/utils/logger';

/**
 * 404 Not Found handler
 */
export function notFoundHandler(req: Request, res: Response) {
  logger.warn(`404 Not Found: ${req.method} ${req.url}`, {
    userAgent: req.get('User-Agent'),
    ip: req.ip,
  });

  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.url} not found`,
    },
  });
}