import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/expressValidatorMiddleware';
import { body, param, query } from 'express-validator';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET / - List rounds for authenticated user with optional status filtering
 * Status logic: finishedAt = null (active), finishedAt = date (completed)
 */
router.get('/', authMiddleware, [
  query('status').optional().isIn(['active', 'completed']).withMessage('Invalid status')
], validateRequest, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { status } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Build where clause based on status
    let whereClause: any = {
      participants: {
        some: {
          userId: userId
        }
      }
    };

    // Convert status to finishedAt logic
    if (status === 'active') {
      whereClause.finishedAt = null;
    } else if (status === 'completed') {
      whereClause.finishedAt = { not: null };
    }

    const rounds = await prisma.round.findMany({
      where: whereClause,
      include: {
        course: {
          select: {
            id: true,
            name: true,
            location: true
          }
        },
        participants: {
          include: {
            holeScores: {
              include: {
                hole: {
                  select: {
                    holeNumber: true,
                    par: true,
                    handicapIndex: true
                  }
                }
              },
              orderBy: {
                hole: { holeNumber: 'asc' }
              }
            }
          }
        }
      },
      orderBy: {
        startedAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: rounds
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch rounds',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /:id - Get specific round with full details
 */
router.get('/:id', authMiddleware, [
  param('id').isUUID().withMessage('Invalid round ID')
], validateRequest, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const round = await prisma.round.findFirst({
      where: {
        id,
        participants: {
          some: {
            userId: userId
          }
        }
      },
      include: {
        course: {
          include: {
            holes: {
              orderBy: { holeNumber: 'asc' },
              include: {
                holeTees: {
                  include: {
                    teeBox: true
                  }
                }
              }
            },
            teeBoxes: true
          }
        },
        participants: {
          include: {
            holeScores: {
              include: {
                hole: {
                  select: {
                    holeNumber: true,
                    par: true,
                    handicapIndex: true
                  }
                }
              },
              orderBy: {
                hole: { holeNumber: 'asc' }
              }
            }
          }
        }
      }
    });

    if (!round) {
      return res.status(404).json({
        success: false,
        message: 'Round not found'
      });
    }

    // Calculate round statistics
    const participants = round.participants || [];
    const holeScores = participants[0]?.holeScores || [];
    const totalStrokes = holeScores.reduce((sum: number, score: any) => sum + score.score, 0);
    const totalPar = holeScores.reduce((sum: number, score: any) => sum + score.hole.par, 0);
    const scoreToPar = totalStrokes - totalPar;

    res.json({
      success: true,
      data: {
        ...round,
        stats: {
          totalStrokes,
          totalPar,
          scoreToPar,
          holesCompleted: holeScores.length
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch round',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /test - Simple test endpoint
 */
router.post('/test', (req: Request, res: Response) => {
  console.log('TEST POST endpoint hit!');
  res.json({
    success: true,
    message: 'POST test works!',
    body: req.body
  });
});

/**
 * POST /test-auth - Test authMiddleware in isolation
 */
router.post('/test-auth', authMiddleware, (req: Request, res: Response) => {
  console.log('AUTH TEST POST endpoint hit!');
  res.json({
    success: true,
    message: 'Auth test works!',
    user: req.user?.id
  });
});

/**
 * POST / - Create new round with participant
 */
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  console.log('=== ROUNDS POST ROUTE HIT ===');
  console.log('Request body:', req.body);
  console.log('User ID:', req.user?.id);
  
  try {
    const { courseId, teeBoxId, roundType = 'casual' } = req.body;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Verify course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { holes: true }
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Verify tee box exists
    const teeBox = await prisma.teeBox.findUnique({
      where: { id: teeBoxId }
    });

    if (!teeBox) {
      return res.status(404).json({
        success: false,
        message: 'Tee box not found'
      });
    }

    // Create round first
    const round = await prisma.round.create({
      data: {
        courseId,
        teeBoxId,
        roundType,
        startedAt: new Date(),
      },
    });

    // Then create participant
    await prisma.roundParticipant.create({
      data: {
        roundId: round.id,
        userId: userId!,
        teeBoxId: teeBoxId,
        isScorer: true
      }
    });

    // Get complete round with relations
    const completeRound = await prisma.round.findUnique({
      where: { id: round.id },
      include: {
        course: {
          select: {
            id: true,
            name: true,
            city: true,
            state: true,
            country: true
          }
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: completeRound,
      message: 'Round created successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to create round',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * PUT /:id/complete - Complete a round
 */
router.put('/:id/complete', authMiddleware, [
  param('id').isUUID().withMessage('Invalid round ID')
], validateRequest, async (req: Request, res: Response) => {
  console.log('=== COMPLETE ROUND ENDPOINT HIT ===');
  console.log('Round ID:', req.params.id);
  console.log('User ID:', req.user?.id);
  
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Verify round exists and user is participant
    const existingRound = await prisma.round.findFirst({
      where: {
        id,
        participants: {
          some: {
            userId: userId
          }
        },
        finishedAt: null // Only allow completing active rounds
      }
    });

    if (!existingRound) {
      return res.status(404).json({
        success: false,
        message: 'Active round not found'
      });
    }

    const round = await prisma.round.update({
      where: { id },
      data: {
        finishedAt: new Date()
      },
      include: {
        course: {
          select: {
            id: true,
            name: true,
            location: true
          }
        },
        participants: {
          include: {
            holeScores: {
              include: {
                hole: {
                  select: {
                    holeNumber: true,
                    par: true,
                    handicapIndex: true
                  }
                }
              },
              orderBy: {
                hole: { holeNumber: 'asc' }
              }
            }
          }
        }
      }
    });

    res.json({
      success: true,
      data: round,
      message: 'Round completed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to complete round',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * PUT /:id/abandon - Abandon a round
 */
router.put('/:id/abandon', authMiddleware, [
  param('id').isUUID().withMessage('Invalid round ID')
], validateRequest, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Verify round exists and user is participant
    const existingRound = await prisma.round.findFirst({
      where: {
        id,
        participants: {
          some: {
            userId: userId
          }
        },
        finishedAt: null // Only allow abandoning active rounds
      }
    });

    if (!existingRound) {
      return res.status(404).json({
        success: false,
        message: 'Active round not found'
      });
    }

    await prisma.round.update({
      where: { id },
      data: {
        finishedAt: new Date() // Mark as finished (abandoned rounds are just finished early)
      }
    });

    res.json({
      success: true,
      message: 'Round abandoned successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to abandon round',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /:roundId/scores - Add or update hole score
 */
router.post('/:roundId/scores', authMiddleware, [
  param('roundId').isUUID().withMessage('Invalid round ID'),
  body('holeId').isUUID().withMessage('Valid hole ID is required'),
  body('strokes').isInt({ min: 1, max: 15 }).withMessage('Strokes must be between 1-15'),
  body('putts').optional({ nullable: true }).isInt({ min: 0, max: 10 }).withMessage('Putts must be between 0-10')
], validateRequest, async (req: Request, res: Response) => {
  console.log('=== SCORE POST ENDPOINT HIT ===');
  console.log('Round ID:', req.params.roundId);
  console.log('Request body:', req.body);
  console.log('User ID:', req.user?.id);
  
  try {
    const { roundId } = req.params;
    const { holeId, strokes, putts } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Verify round exists and is active
    const round = await prisma.round.findFirst({
      where: {
        id: roundId,
        participants: {
          some: {
            userId: userId
          }
        },
        finishedAt: null
      }
    });

    if (!round) {
      return res.status(404).json({
        success: false,
        message: 'Active round not found'
      });
    }

    // Verify hole exists for this course
    const hole = await prisma.hole.findFirst({
      where: {
        id: holeId,
        courseId: round.courseId
      }
    });

    if (!hole) {
      return res.status(404).json({
        success: false,
        message: 'Hole not found for this course'
      });
    }

    // Find the round participant for this user and round
    const participant = await prisma.roundParticipant.findFirst({
      where: {
        roundId,
        userId
      }
    });

    if (!participant) {
      return res.status(404).json({
        success: false,
        message: 'Round participant not found'
      });
    }

    // Upsert hole score using correct unique constraint
    const score = await prisma.holeScore.upsert({
      where: {
        roundParticipantId_holeId: {
          roundParticipantId: participant.id,
          holeId
        }
      },
      update: {
        score: strokes,
        putts,
        updatedBy: userId
      },
      create: {
        roundParticipantId: participant.id,
        holeId,
        score: strokes,
        putts,
        updatedBy: userId
      },
      include: {
        hole: {
          select: {
            holeNumber: true,
            par: true,
            handicapIndex: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: score,
      message: 'Score updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update score',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;