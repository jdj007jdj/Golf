/**
 * @file config/redis.ts
 * @description Redis connection and client
 */

import { createClient, RedisClientType } from 'redis';
import { logger } from '@/utils/logger';
import { config } from './config';

/**
 * Redis client instance
 */
let redisClient: any = null;

/**
 * Create Redis client
 */
function createRedisClient(): any {
  let clientConfig: any = {};

  if (config.redisUrl) {
    clientConfig = {
      url: config.redisUrl,
    };
  } else {
    clientConfig = {
      socket: {
        host: config.redisHost,
        port: config.redisPort,
      },
    };
    
    if (config.redisPassword) {
      clientConfig.password = config.redisPassword;
    }
  }

  const client = createClient(clientConfig);

  // Error handling
  client.on('error', (err) => {
    logger.error('Redis client error:', err);
  });

  client.on('connect', () => {
    logger.info('Redis client connected');
  });

  client.on('ready', () => {
    logger.info('Redis client ready');
  });

  client.on('end', () => {
    logger.info('Redis client disconnected');
  });

  return client;
}

/**
 * Connect to Redis
 */
export async function connectRedis(): Promise<void> {
  try {
    if (!redisClient) {
      redisClient = createRedisClient();
    }

    if (!redisClient.isOpen) {
      await redisClient.connect();
      logger.info('Connected to Redis');
    }
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    throw error;
  }
}

/**
 * Disconnect from Redis
 */
export async function disconnectRedis(): Promise<void> {
  try {
    if (redisClient && redisClient.isOpen) {
      await redisClient.disconnect();
      logger.info('Disconnected from Redis');
    }
  } catch (error) {
    logger.error('Error disconnecting from Redis:', error);
    throw error;
  }
}

/**
 * Get Redis client
 */
export function getRedisClient(): any {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call connectRedis() first.');
  }
  return redisClient;
}

/**
 * Health check for Redis
 */
export async function checkRedisHealth(): Promise<boolean> {
  try {
    if (!redisClient || !redisClient.isOpen) {
      return false;
    }
    
    await redisClient.ping();
    return true;
  } catch (error) {
    logger.error('Redis health check failed:', error);
    return false;
  }
}

/**
 * Cache utility functions
 */
export class CacheService {
  private client: any;

  constructor() {
    this.client = getRedisClient();
  }

  /**
   * Set a value in cache
   */
  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    
    if (ttlSeconds) {
      await this.client.setEx(key, ttlSeconds, stringValue);
    } else {
      await this.client.set(key, stringValue);
    }
  }

  /**
   * Get a value from cache
   */
  async get<T = any>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    if (!value) return null;

    try {
      return JSON.parse(value);
    } catch {
      return value as T;
    }
  }

  /**
   * Delete a key from cache
   */
  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    return (await this.client.exists(key)) === 1;
  }

  /**
   * Set expiration for a key
   */
  async expire(key: string, seconds: number): Promise<void> {
    await this.client.expire(key, seconds);
  }

  /**
   * Get keys matching pattern
   */
  async keys(pattern: string): Promise<string[]> {
    return await this.client.keys(pattern);
  }
}