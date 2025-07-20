/**
 * @file controllers/authConversionController.ts
 * @description Handles local to online account conversion
 */

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { logger } from '@/utils/logger';
import { generateToken } from '@/services/authService';

const prisma = new PrismaClient();

// Validation schemas
const checkUsernameSchema = z.object({
  params: z.object({
    username: z.string().min(3).max(30)
  })
});

const convertAccountSchema = z.object({
  body: z.object({
    username: z.string().min(3).max(30),
    email: z.string().email(),
    password: z.string().min(6),
    deviceId: z.string(),
    localData: z.object({
      rounds: z.number().int().min(0),
      shots: z.number().int().min(0),
      games: z.number().int().min(0)
    })
  })
});

/**
 * Check if username is available
 * @route GET /api/auth/check-username/:username
 */
export async function checkUsernameAvailability(req: Request, res: Response) {
  try {
    const { params } = checkUsernameSchema.parse(req);
    const { username } = params;

    // Check if username exists (case-insensitive)
    const existingUser = await prisma.user.findFirst({
      where: {
        username: {
          equals: username,
          mode: 'insensitive'
        }
      }
    });

    if (existingUser) {
      // Generate suggestions
      const suggestions = await generateUsernameSuggestions(username);
      
      return res.status(200).json({
        success: true,
        data: {
          available: false,
          suggestions
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        available: true
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid username format',
          details: error.issues
        }
      });
    }

    logger.error('Error checking username availability:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to check username availability'
      }
    });
  }
}

/**
 * Convert local account to online account
 * @route POST /api/auth/convert-account
 */
export async function convertAccount(req: Request, res: Response) {
  try {
    const { body } = convertAccountSchema.parse(req);
    const { username, email, password, deviceId, localData } = body;

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Check if email already exists
      const existingEmail = await tx.user.findUnique({
        where: { email }
      });

      if (existingEmail) {
        throw new ConversionError('Email already registered', 'EMAIL_EXISTS');
      }

      // Check if username already exists (case-insensitive)
      const existingUsername = await tx.user.findFirst({
        where: {
          username: {
            equals: username,
            mode: 'insensitive'
          }
        }
      });

      if (existingUsername) {
        throw new ConversionError('Username already taken', 'USERNAME_EXISTS');
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user account
      const user = await tx.user.create({
        data: {
          email,
          username,
          passwordHash,
          accountType: 'online',
          localDeviceId: deviceId,
          convertedAt: new Date()
        }
      });

      // Create conversion tracking record
      const conversion = await tx.accountConversion.create({
        data: {
          userId: user.id,
          localDeviceId: deviceId,
          dataSnapshot: localData,
          roundsConverted: 0,
          shotsConverted: 0,
          gamesConverted: 0,
          status: 'pending'
        }
      });

      // Generate auth token
      const tokenPayload = {
        userId: user.id,
        email: user.email,
        username: user.username
      };
      const token = generateToken(tokenPayload);

      return {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          accountType: user.accountType
        },
        token,
        conversionId: conversion.id
      };
    });

    logger.info(`Account conversion started for user: ${result.user.id}`);

    return res.status(201).json({
      success: true,
      data: result
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid conversion data',
          details: error.issues
        }
      });
    }

    if (error instanceof ConversionError) {
      return res.status(400).json({
        success: false,
        error: {
          code: error.code,
          message: error.message
        }
      });
    }

    logger.error('Error converting account:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to convert account'
      }
    });
  }
}

/**
 * Generate username suggestions
 */
async function generateUsernameSuggestions(baseUsername: string): Promise<string[]> {
  const suggestions: string[] = [];
  const suffixes = ['_golf', '_player', '_pro', '123', '2024', '007'];
  
  for (const suffix of suffixes) {
    const suggestion = `${baseUsername}${suffix}`;
    
    // Check if suggestion is available
    const exists = await prisma.user.findFirst({
      where: {
        username: {
          equals: suggestion,
          mode: 'insensitive'
        }
      }
    });
    
    if (!exists) {
      suggestions.push(suggestion);
    }
    
    if (suggestions.length >= 3) break;
  }
  
  // Add random number suggestions if needed
  while (suggestions.length < 3) {
    const randomNum = Math.floor(Math.random() * 999) + 1;
    const suggestion = `${baseUsername}${randomNum}`;
    
    const exists = await prisma.user.findFirst({
      where: {
        username: {
          equals: suggestion,
          mode: 'insensitive'
        }
      }
    });
    
    if (!exists && !suggestions.includes(suggestion)) {
      suggestions.push(suggestion);
    }
  }
  
  return suggestions;
}

/**
 * Custom error class for conversion errors
 */
class ConversionError extends Error {
  code: string;
  
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
    this.name = 'ConversionError';
  }
}