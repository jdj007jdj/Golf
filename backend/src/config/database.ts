/**
 * @file config/database.ts
 * @description Database connection and Prisma client
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '@/utils/logger';
import { config } from './config';

/**
 * Prisma client instance
 */
export const prisma = new PrismaClient({
  log: config.nodeEnv === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
  datasources: {
    db: {
      url: config.databaseUrl,
    },
  },
});

/**
 * Connect to database
 */
export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info('Connected to PostgreSQL database');
    
    // Test the connection
    await prisma.$queryRaw`SELECT 1`;
    logger.info('Database connection test successful');
    
    // Check PostGIS extension (optional)
    try {
      const postgisCheck = await prisma.$queryRaw`SELECT postgis_version()`;
      logger.info('PostGIS extension verified:', postgisCheck);
    } catch (error) {
      logger.warn('PostGIS extension not available - geographic features will be limited');
    }
    
  } catch (error) {
    logger.error('Failed to connect to database:', error);
    throw error;
  }
}

/**
 * Disconnect from database
 */
export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    logger.info('Disconnected from database');
  } catch (error) {
    logger.error('Error disconnecting from database:', error);
    throw error;
  }
}

/**
 * Health check for database
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error('Database health check failed:', error);
    return false;
  }
}