/**
 * @file config/config.ts
 * @description Application configuration
 */

// Configuration interface
interface Config {
  nodeEnv: 'development' | 'production' | 'test';
  port: number;
  
  // Database
  databaseUrl: string;
  
  // Redis
  redisUrl?: string;
  redisHost: string;
  redisPort: number;
  redisPassword?: string;
  
  // JWT
  jwtSecret: string;
  jwtExpiresIn: string;
  jwtRefreshSecret: string;
  jwtRefreshExpiresIn: string;
  
  // CORS
  cors: {
    origin: string | string[];
    credentials: boolean;
  };
  
  // File uploads
  uploads: {
    maxFileSize: number;
    allowedTypes: string[];
  };
  
  // External APIs
  apis: {
    weather: {
      apiKey?: string;
      baseUrl: string;
    };
    maps: {
      apiKey?: string;
      tileServer: string;
    };
  };
}

// Parse environment variables
const parseConfig = (): Config => {
  // Validate required environment variables
  const requiredVars = ['DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      throw new Error(`Required environment variable ${varName} is not set`);
    }
  }

  return {
    nodeEnv: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    
    // Database
    databaseUrl: process.env.DATABASE_URL!,
    
    // Redis
    redisUrl: process.env.REDIS_URL,
    redisHost: process.env.REDIS_HOST || 'localhost',
    redisPort: parseInt(process.env.REDIS_PORT || '6379', 10),
    redisPassword: process.env.REDIS_PASSWORD,
    
    // JWT
    jwtSecret: process.env.JWT_SECRET!,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET!,
    jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    
    // CORS
    cors: {
      origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3001', 'http://localhost:19006'],
      credentials: process.env.CORS_CREDENTIALS !== 'false',
    },
    
    // File uploads
    uploads: {
      maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB
      allowedTypes: process.env.ALLOWED_FILE_TYPES?.split(',') || ['image/jpeg', 'image/png', 'image/webp'],
    },
    
    // External APIs
    apis: {
      weather: {
        apiKey: process.env.WEATHER_API_KEY,
        baseUrl: process.env.WEATHER_API_URL || 'https://api.openweathermap.org/data/2.5',
      },
      maps: {
        apiKey: process.env.MAPS_API_KEY,
        tileServer: process.env.TILE_SERVER_URL || 'https://tile.openstreetmap.org',
      },
    },
  };
};

export const config = parseConfig();
export type { Config };