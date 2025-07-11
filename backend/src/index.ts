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

app.use(cors({
  origin: config.cors.origin,
  credentials: config.cors.credentials,
}));

/**
 * Rate limiting
 */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
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

    // Start server
    server.listen(config.port, () => {
      logger.info(`Server running on port ${config.port} in ${config.nodeEnv} mode`);
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