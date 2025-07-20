/**
 * @file controllers/conversionDataController.ts
 * @description Handles data upload during account conversion
 */

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { logger } from '@/utils/logger';
import { authenticateToken } from '@/middleware/auth';

const prisma = new PrismaClient();

// Validation schemas
const uploadDataSchema = z.object({
  body: z.object({
    conversionId: z.string().uuid(),
    dataType: z.enum(['rounds', 'shots', 'games']),
    data: z.array(z.any()),
    batchNumber: z.number().int().min(1).optional(),
    totalBatches: z.number().int().min(1).optional()
  })
});

const conversionStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  })
});

const updateStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  }),
  body: z.object({
    status: z.enum(['pending', 'in_progress', 'completed', 'failed']),
    error: z.string().optional(),
    completedAt: z.string().datetime().optional()
  })
});

/**
 * Upload conversion data in batches
 * @route POST /api/conversion/upload-data
 */
export async function uploadConversionData(req: Request & { user?: any }, res: Response) {
  try {
    const { body } = uploadDataSchema.parse(req);
    const { conversionId, dataType, data, batchNumber, totalBatches } = body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
    }

    // Verify conversion belongs to user
    const conversion = await prisma.accountConversion.findFirst({
      where: {
        id: conversionId,
        userId: userId
      }
    });

    if (!conversion) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Conversion not found'
        }
      });
    }

    if (conversion.status === 'completed') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ALREADY_COMPLETED',
          message: 'Conversion already completed'
        }
      });
    }

    if (conversion.status === 'failed') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CONVERSION_FAILED',
          message: 'Cannot upload data to failed conversion'
        }
      });
    }

    // Update status to in_progress
    if (conversion.status === 'pending') {
      await prisma.accountConversion.update({
        where: { id: conversionId },
        data: { status: 'in_progress' }
      });
    }

    // Process data based on type
    let processedCount = 0;
    let errors: any[] = [];

    switch (dataType) {
      case 'rounds':
        const roundResult = await processRounds(userId, data);
        processedCount = roundResult.processed;
        errors = roundResult.errors;
        
        // Update conversion progress
        await prisma.accountConversion.update({
          where: { id: conversionId },
          data: {
            roundsConverted: conversion.roundsConverted + processedCount
          }
        });
        break;

      case 'shots':
        const shotResult = await processShots(userId, data);
        processedCount = shotResult.processed;
        errors = shotResult.errors;
        
        // Update conversion progress
        await prisma.accountConversion.update({
          where: { id: conversionId },
          data: {
            shotsConverted: conversion.shotsConverted + processedCount
          }
        });
        break;

      case 'games':
        const gameResult = await processGames(userId, data);
        processedCount = gameResult.processed;
        errors = gameResult.errors;
        
        // Update conversion progress
        await prisma.accountConversion.update({
          where: { id: conversionId },
          data: {
            gamesConverted: conversion.gamesConverted + processedCount
          }
        });
        break;
    }

    logger.info(`Processed ${processedCount} ${dataType} for conversion ${conversionId}`);

    return res.status(200).json({
      success: true,
      data: {
        processed: processedCount,
        errors: errors.length,
        batchNumber,
        totalBatches,
        partialSuccess: errors.length > 0
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid upload data',
          details: error.errors
        }
      });
    }

    logger.error('Error uploading conversion data:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to upload conversion data'
      }
    });
  }
}

/**
 * Get conversion status
 * @route GET /api/conversion/:id/status
 */
export async function getConversionStatus(req: Request & { user?: any }, res: Response) {
  try {
    const { params } = conversionStatusSchema.parse(req);
    const { id } = params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
    }

    const conversion = await prisma.accountConversion.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!conversion) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Conversion not found'
        }
      });
    }

    // Calculate progress
    const dataSnapshot = conversion.dataSnapshot as any;
    const totalRounds = dataSnapshot?.rounds || 0;
    const totalShots = dataSnapshot?.shots || 0;
    const totalGames = dataSnapshot?.games || 0;
    const totalItems = totalRounds + totalShots + totalGames;
    const processedItems = conversion.roundsConverted + conversion.shotsConverted + conversion.gamesConverted;
    const progress = totalItems > 0 ? Math.round((processedItems / totalItems) * 100) : 0;

    return res.status(200).json({
      success: true,
      data: {
        id: conversion.id,
        status: conversion.status,
        progress,
        rounds: {
          total: totalRounds,
          processed: conversion.roundsConverted
        },
        shots: {
          total: totalShots,
          processed: conversion.shotsConverted
        },
        games: {
          total: totalGames,
          processed: conversion.gamesConverted
        },
        startedAt: conversion.startedAt,
        completedAt: conversion.completedAt,
        error: conversion.error
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid conversion ID',
          details: error.errors
        }
      });
    }

    logger.error('Error getting conversion status:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to get conversion status'
      }
    });
  }
}

/**
 * Update conversion status
 * @route PUT /api/conversion/:id/status
 */
export async function updateConversionStatus(req: Request & { user?: any }, res: Response) {
  try {
    const { params, body } = updateStatusSchema.parse(req);
    const { id } = params;
    const { status, error, completedAt } = body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
    }

    const conversion = await prisma.accountConversion.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!conversion) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Conversion not found'
        }
      });
    }

    // Update conversion status
    const updated = await prisma.accountConversion.update({
      where: { id },
      data: {
        status,
        error,
        completedAt: completedAt ? new Date(completedAt) : undefined
      }
    });

    logger.info(`Conversion ${id} status updated to ${status}`);

    return res.status(200).json({
      success: true,
      data: {
        id: updated.id,
        status: updated.status,
        error: updated.error,
        completedAt: updated.completedAt
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid status update',
          details: error.errors
        }
      });
    }

    logger.error('Error updating conversion status:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to update conversion status'
      }
    });
  }
}

/**
 * Process rounds data
 */
async function processRounds(userId: string, rounds: any[]): Promise<{ processed: number; errors: any[] }> {
  let processed = 0;
  const errors: any[] = [];

  for (const round of rounds) {
    try {
      // Validate and transform round data
      const roundData = {
        userId,
        courseId: round.courseId,
        teeBoxId: round.teeBoxId,
        startedAt: new Date(round.startedAt),
        completedAt: round.completedAt ? new Date(round.completedAt) : undefined,
        weather: round.weather || {},
        notes: round.notes || ''
      };

      // Create round
      const createdRound = await prisma.round.create({
        data: roundData
      });

      // Create hole scores if provided
      if (round.scores) {
        const holeScores = Object.entries(round.scores).map(([holeNumber, score]) => ({
          roundId: createdRound.id,
          holeNumber: parseInt(holeNumber),
          score: score as number,
          putts: round.putts?.[holeNumber] || 0
        }));

        await prisma.holeScore.createMany({
          data: holeScores
        });
      }

      processed++;
    } catch (error) {
      logger.error(`Failed to process round: ${error}`);
      errors.push({
        roundId: round.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return { processed, errors };
}

/**
 * Process shots data
 */
async function processShots(userId: string, shots: any[]): Promise<{ processed: number; errors: any[] }> {
  let processed = 0;
  const errors: any[] = [];

  // Group shots by round for efficiency
  const shotsByRound = shots.reduce((acc, shot) => {
    if (!acc[shot.roundId]) acc[shot.roundId] = [];
    acc[shot.roundId].push(shot);
    return acc;
  }, {} as Record<string, any[]>);

  for (const [roundId, roundShots] of Object.entries(shotsByRound)) {
    try {
      // Verify round exists and belongs to user
      const round = await prisma.round.findFirst({
        where: {
          id: roundId,
          userId
        }
      });

      if (!round) {
        errors.push({
          roundId,
          error: 'Round not found or does not belong to user'
        });
        continue;
      }

      // Create shots
      const shotData = roundShots.map(shot => ({
        roundId: round.id,
        holeNumber: shot.holeNumber,
        shotNumber: shot.shotNumber,
        clubId: shot.clubId,
        startLatitude: shot.startLatitude,
        startLongitude: shot.startLongitude,
        endLatitude: shot.endLatitude,
        endLongitude: shot.endLongitude,
        distance: shot.distance,
        createdAt: new Date(shot.timestamp || shot.createdAt)
      }));

      await prisma.shot.createMany({
        data: shotData,
        skipDuplicates: true
      });

      processed += shotData.length;
    } catch (error) {
      logger.error(`Failed to process shots for round ${roundId}: ${error}`);
      errors.push({
        roundId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return { processed, errors };
}

/**
 * Process games data
 */
async function processGames(userId: string, games: any[]): Promise<{ processed: number; errors: any[] }> {
  let processed = 0;
  const errors: any[] = [];

  for (const game of games) {
    try {
      // Verify round exists and belongs to user
      const round = await prisma.round.findFirst({
        where: {
          id: game.roundId,
          userId
        }
      });

      if (!round) {
        errors.push({
          gameId: game.id,
          error: 'Round not found or does not belong to user'
        });
        continue;
      }

      // Create game
      const createdGame = await prisma.game.create({
        data: {
          name: game.gameConfig?.name || 'Converted Game',
          type: game.gameConfig?.type || 'stroke_play',
          config: game.gameConfig || {},
          startedAt: new Date(game.startedAt),
          completedAt: game.completedAt ? new Date(game.completedAt) : undefined
        }
      });

      // Create round participants
      if (game.players) {
        for (const player of game.players) {
          const participant = await prisma.roundParticipant.create({
            data: {
              roundId: round.id,
              userId: player.userId || userId,
              localPlayerName: player.name,
              status: 'completed'
            }
          });

          // Create game scores
          if (game.playerScores?.[player.id]) {
            const scores = game.playerScores[player.id];
            for (const [holeNumber, score] of Object.entries(scores)) {
              await prisma.gameScore.create({
                data: {
                  gameId: createdGame.id,
                  roundParticipantId: participant.id,
                  holeNumber: parseInt(holeNumber as string),
                  score: score as number
                }
              });
            }
          }
        }
      }

      processed++;
    } catch (error) {
      logger.error(`Failed to process game: ${error}`);
      errors.push({
        gameId: game.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return { processed, errors };
}