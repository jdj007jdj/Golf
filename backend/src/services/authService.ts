/**
 * @file services/authService.ts
 * @description Authentication service with JWT and bcrypt
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/config/database';
import { config } from '@/config/config';
import { logger } from '@/utils/logger';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    username: string;
    firstName?: string;
    lastName?: string;
    handicap?: number;
    profileImageUrl?: string;
    preferences: any;
  };
  token: string;
  refreshToken: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  username: string;
  iat: number;
  exp: number;
}

/**
 * Hash password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

/**
 * Generate JWT token
 */
export function generateToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  } as jwt.SignOptions);
}

/**
 * Generate refresh token
 */
export function generateRefreshToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, config.jwtRefreshSecret, {
    expiresIn: config.jwtRefreshExpiresIn,
  } as jwt.SignOptions);
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, config.jwtSecret) as TokenPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, config.jwtRefreshSecret) as TokenPayload;
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
}

/**
 * Register new user
 */
export async function register(userData: RegisterData): Promise<AuthResponse> {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: userData.email },
          { username: userData.username },
        ],
      },
    });

    if (existingUser) {
      if (existingUser.email === userData.email) {
        throw new Error('Email already registered');
      }
      if (existingUser.username === userData.username) {
        throw new Error('Username already taken');
      }
    }

    // Hash password
    const passwordHash = await hashPassword(userData.password);

    // Create user
    const user = await prisma.user.create({
      data: {
        id: uuidv4(),
        email: userData.email,
        username: userData.username,
        passwordHash,
        firstName: userData.firstName,
        lastName: userData.lastName,
        preferences: {
          units: 'imperial',
          defaultTeeBox: 'white',
          autoGPS: true,
          shareData: true,
          notifications: {
            roundReminders: true,
            friendRequests: true,
            achievements: true,
          },
        },
      },
    });

    // Generate tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      username: user.username,
    };

    const token = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    logger.info(`New user registered: ${user.email}`);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
        handicap: user.handicap || undefined,
        profileImageUrl: user.profileImageUrl || undefined,
        preferences: user.preferences,
      },
      token,
      refreshToken,
    };
  } catch (error) {
    logger.error('Registration error:', error);
    throw error;
  }
}

/**
 * Login user
 */
export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: credentials.email },
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isValidPassword = await verifyPassword(credentials.password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Update last sync time
    await prisma.user.update({
      where: { id: user.id },
      data: { lastSyncAt: new Date() },
    });

    // Generate tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      username: user.username,
    };

    const token = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    logger.info(`User logged in: ${user.email}`);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
        handicap: user.handicap || undefined,
        profileImageUrl: user.profileImageUrl || undefined,
        preferences: user.preferences,
      },
      token,
      refreshToken,
    };
  } catch (error) {
    logger.error('Login error:', error);
    throw error;
  }
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(refreshToken: string): Promise<{ token: string; refreshToken: string }> {
  try {
    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);

    // Check if user still exists
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Generate new tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      username: user.username,
    };

    const newToken = generateToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);

    logger.info(`Token refreshed for user: ${user.email}`);

    return {
      token: newToken,
      refreshToken: newRefreshToken,
    };
  } catch (error) {
    logger.error('Token refresh error:', error);
    throw error;
  }
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        handicap: true,
        profileImageUrl: true,
        preferences: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  } catch (error) {
    logger.error('Get user error:', error);
    throw error;
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(userId: string, updateData: any) {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        handicap: true,
        profileImageUrl: true,
        preferences: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    logger.info(`User profile updated: ${user.email}`);
    return user;
  } catch (error) {
    logger.error('Update user profile error:', error);
    throw error;
  }
}