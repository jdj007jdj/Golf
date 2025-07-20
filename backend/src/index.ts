/**
 * @file index.ts
 * @description Main application entry point
 */

import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

import { config } from '@/config/config';
import { logger } from '@/utils/logger';
import { errorHandler } from '@/middleware/errorHandler';
import { notFoundHandler } from '@/middleware/notFoundHandler';
import { authMiddleware } from '@/middleware/authMiddleware';
import { validateRequest } from '@/middleware/validateRequest';
import { setupWebSocket } from '@/websocket/socketHandler';
import { connectDatabase } from '@/config/database';
import { connectRedis } from '@/config/redis';

// Import routes
import authRoutes from '@/routes/authRoutes';
import userRoutes from '@/routes/userRoutes';
import courseRoutes from '@/routes/courseRoutes';
import roundRoutes from '@/routes/roundRoutes';
import syncRoutes from '@/routes/syncRoutes';
import gameRoutes from '@/routes/gameRoutes';
import conversionRoutes from '@/routes/conversionRoutes';

/**
 * Create Express application
 */
const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: config.cors.origin,
    credentials: config.cors.credentials,
  },
});

/**
 * Security middleware
 */
app.use(helmet({
  crossOriginEmbedderPolicy: false,
}));

// Configure CORS - in development, allow any origin
const corsOptions: cors.CorsOptions = {
  credentials: config.cors.credentials,
  origin: (origin, callback) => {
    // In development, allow any origin (including mobile apps)
    if (config.nodeEnv === 'development') {
      callback(null, true);
    } else {
      // In production, use the configured origins
      const allowedOrigins = Array.isArray(config.cors.origin) ? config.cors.origin : [config.cors.origin];
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

/**
 * Rate limiting
 */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs (increased for sync)
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

/**
 * Body parsing middleware
 */
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

/**
 * Logging
 */
if (config.nodeEnv !== 'test') {
  app.use(morgan('combined', {
    stream: {
      write: (message: string) => logger.info(message.trim()),
    },
  }));
}

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Golf API is running',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

/**
 * API routes
 */
app.use('/api/auth', authRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/rounds', roundRoutes);
app.use('/api/sync', authMiddleware, syncRoutes);
app.use('/api/games', authMiddleware, gameRoutes);
app.use('/api', conversionRoutes); // Conversion routes include both /auth and /conversion paths

/**
 * WebSocket setup
 */
setupWebSocket(io);

/**
 * Error handling middleware
 */
app.use(notFoundHandler);
app.use(errorHandler);

/**
 * Start server
 */
async function startServer() {
  try {
    // Connect to database
    await connectDatabase();
    logger.info('Database connected successfully');

    // Connect to Redis
    await connectRedis();
    logger.info('Redis connected successfully');

    // Start server - bind to all interfaces for WSL2 access
    server.listen(config.port, '0.0.0.0', () => {
      logger.info(`Server running on 0.0.0.0:${config.port} in ${config.nodeEnv} mode`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

/**
 * Graceful shutdown
 */
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

// Start the server
if (require.main === module) {
  startServer();
}

export { app, server, io };