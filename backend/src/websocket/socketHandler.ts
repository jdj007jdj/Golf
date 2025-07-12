/**
 * @file websocket/socketHandler.ts
 * @description WebSocket event handlers for real-time features
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import { verifyToken } from '@/services/authService';
import { logger } from '@/utils/logger';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  username?: string;
  currentRoundId?: string;
}

interface SocketUser {
  socketId: string;
  userId: string;
  username: string;
  currentRoundId?: string;
}

// Track connected users
const connectedUsers = new Map<string, SocketUser>();
const roundParticipants = new Map<string, Set<string>>(); // roundId -> Set of userIds

/**
 * Setup WebSocket server
 */
export function setupWebSocket(io: SocketIOServer) {
  // Authentication middleware for WebSocket
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const payload = verifyToken(token);
      socket.userId = payload.userId;
      socket.username = payload.username;
      
      logger.info(`Socket authenticated: ${payload.username} (${socket.id})`);
      next();
    } catch (error) {
      logger.error('Socket authentication failed:', error);
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info(`User connected: ${socket.username} (${socket.id})`);

    // Add user to connected users
    if (socket.userId && socket.username) {
      connectedUsers.set(socket.userId, {
        socketId: socket.id,
        userId: socket.userId,
        username: socket.username,
      });
    }

    // Join user to their personal room
    socket.join(`user:${socket.userId}`);

    /**
     * Handle joining a round room
     */
    socket.on('join_round', (data: { roundId: string }) => {
      const { roundId } = data;
      
      if (!roundId || !socket.userId) {
        socket.emit('error', { message: 'Invalid round ID or user not authenticated' });
        return;
      }

      // Leave previous round if any
      if (socket.currentRoundId) {
        socket.leave(`round:${socket.currentRoundId}`);
        
        // Remove from previous round participants
        const prevParticipants = roundParticipants.get(socket.currentRoundId);
        if (prevParticipants) {
          prevParticipants.delete(socket.userId);
          if (prevParticipants.size === 0) {
            roundParticipants.delete(socket.currentRoundId);
          }
        }
      }

      // Join new round
      socket.join(`round:${roundId}`);
      socket.currentRoundId = roundId;

      // Update connected user data
      const user = connectedUsers.get(socket.userId);
      if (user) {
        user.currentRoundId = roundId;
        connectedUsers.set(socket.userId, user);
      }

      // Add to round participants
      if (!roundParticipants.has(roundId)) {
        roundParticipants.set(roundId, new Set());
      }
      roundParticipants.get(roundId)?.add(socket.userId);

      // Notify others in the round
      socket.to(`round:${roundId}`).emit('user_joined_round', {
        userId: socket.userId,
        username: socket.username,
        timestamp: new Date().toISOString(),
      });

      // Confirm join to user
      socket.emit('round_joined', {
        roundId,
        participants: Array.from(roundParticipants.get(roundId) || []),
      });

      logger.info(`User ${socket.username} joined round ${roundId}`);
    });

    /**
     * Handle leaving a round room
     */
    socket.on('leave_round', () => {
      if (socket.currentRoundId && socket.userId) {
        // Remove from round participants
        const participants = roundParticipants.get(socket.currentRoundId);
        if (participants) {
          participants.delete(socket.userId);
          if (participants.size === 0) {
            roundParticipants.delete(socket.currentRoundId);
          }
        }

        // Notify others in the round
        socket.to(`round:${socket.currentRoundId}`).emit('user_left_round', {
          userId: socket.userId,
          username: socket.username,
          timestamp: new Date().toISOString(),
        });

        // Leave the room
        socket.leave(`round:${socket.currentRoundId}`);
        
        logger.info(`User ${socket.username} left round ${socket.currentRoundId}`);
        socket.currentRoundId = undefined;

        // Update connected user data
        const user = connectedUsers.get(socket.userId);
        if (user) {
          delete user.currentRoundId;
          connectedUsers.set(socket.userId, user);
        }
      }
    });

    /**
     * Handle score updates (for real-time sync)
     */
    socket.on('score_update', (data: {
      roundId: string;
      holeId: string;
      playerId: string;
      score: number;
      timestamp: string;
    }) => {
      const { roundId, holeId, playerId, score, timestamp } = data;

      if (!roundId || !socket.userId) {
        socket.emit('error', { message: 'Invalid data or user not authenticated' });
        return;
      }

      // Broadcast to other participants in the round
      socket.to(`round:${roundId}`).emit('score_updated', {
        holeId,
        playerId,
        score,
        updatedBy: socket.userId,
        updatedByUsername: socket.username,
        timestamp,
      });

      logger.debug(`Score update in round ${roundId}: Player ${playerId}, Hole ${holeId}, Score ${score}`);
    });

    /**
     * Handle shot tracking updates
     */
    socket.on('shot_update', (data: {
      roundId: string;
      holeId: string;
      playerId: string;
      shotData: any;
      timestamp: string;
    }) => {
      const { roundId, holeId, playerId, shotData, timestamp } = data;

      if (!roundId || !socket.userId) {
        socket.emit('error', { message: 'Invalid data or user not authenticated' });
        return;
      }

      // Broadcast to other participants in the round
      socket.to(`round:${roundId}`).emit('shot_tracked', {
        holeId,
        playerId,
        shotData,
        trackedBy: socket.userId,
        trackedByUsername: socket.username,
        timestamp,
      });

      logger.debug(`Shot tracked in round ${roundId}: Player ${playerId}, Hole ${holeId}`);
    });

    /**
     * Handle typing indicators (for chat features)
     */
    socket.on('typing_start', (data: { roundId: string }) => {
      if (data.roundId && socket.userId) {
        socket.to(`round:${data.roundId}`).emit('user_typing', {
          userId: socket.userId,
          username: socket.username,
        });
      }
    });

    socket.on('typing_stop', (data: { roundId: string }) => {
      if (data.roundId && socket.userId) {
        socket.to(`round:${data.roundId}`).emit('user_stop_typing', {
          userId: socket.userId,
          username: socket.username,
        });
      }
    });

    /**
     * Handle disconnection
     */
    socket.on('disconnect', (reason) => {
      logger.info(`User disconnected: ${socket.username} (${socket.id}) - Reason: ${reason}`);

      if (socket.userId) {
        // Remove from connected users
        connectedUsers.delete(socket.userId);

        // Leave round if connected
        if (socket.currentRoundId) {
          const participants = roundParticipants.get(socket.currentRoundId);
          if (participants) {
            participants.delete(socket.userId);
            if (participants.size === 0) {
              roundParticipants.delete(socket.currentRoundId);
            }
          }

          // Notify others in the round
          socket.to(`round:${socket.currentRoundId}`).emit('user_left_round', {
            userId: socket.userId,
            username: socket.username,
            timestamp: new Date().toISOString(),
            reason: 'disconnected',
          });
        }
      }
    });

    /**
     * Handle ping/pong for connection health
     */
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: new Date().toISOString() });
    });
  });

  logger.info('WebSocket server setup complete');
}

/**
 * Get connected users count
 */
export function getConnectedUsersCount(): number {
  return connectedUsers.size;
}

/**
 * Get round participants count
 */
export function getRoundParticipantsCount(roundId: string): number {
  return roundParticipants.get(roundId)?.size || 0;
}

/**
 * Send message to specific user
 */
export function sendToUser(io: SocketIOServer, userId: string, event: string, data: any) {
  io.to(`user:${userId}`).emit(event, data);
}

/**
 * Send message to round participants
 */
export function sendToRound(io: SocketIOServer, roundId: string, event: string, data: any) {
  io.to(`round:${roundId}`).emit(event, data);
}