import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validateRequest';
import { body, param, query } from 'express-validator';

const router = Router();
const prisma = new PrismaClient();

router.get('/', authMiddleware, [
  query('status').optional().isIn(['active', 'completed', 'abandoned']).withMessage('Invalid status')
], validateRequest, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { status } = req.query;

    const rounds = await prisma.round.findMany({
      where: {
        participants: {
          some: {
            userId: userId
          }
        },
        ...(status && { status: status as string })
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

router.get('/:id', authMiddleware, [
  param('id').isUUID().withMessage('Invalid round ID')
], validateRequest, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

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
              orderBy: { holeNumber: 'asc' }
            }
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
    });

    if (!round) {
      return res.status(404).json({
        success: false,
        message: 'Round not found'
      });
    }

    res.json({
      success: true,
      data: round
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch round',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/', authMiddleware, [
  body('courseId').isUUID().withMessage('Valid course ID is required'),
  body('teeBoxId').isUUID().withMessage('Valid tee box ID is required')
], validateRequest, async (req: Request, res: Response) => {
  try {
    const { courseId, teeBoxId } = req.body;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

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

    const round = await prisma.round.create({
      data: {
        courseId,
        teeBoxId: teeBoxId,
        startedAt: new Date(),
        participants: {
          create: {
            userId: userId,
            teeBoxId: teeBoxId
          }
        }
      },
      include: {
        course: {
          select: {
            id: true,
            name: true,
            location: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: round,
      message: 'Round started successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to start round',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.put('/:id/complete', authMiddleware, [
  param('id').isUUID().withMessage('Invalid round ID')
], validateRequest, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const existingRound = await prisma.round.findFirst({
      where: {
        id,
        participants: {
          some: {
            userId: userId
          }
        },
        finishedAt: null
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
    });

    const participants = (round as any).participants || [];
    const holeScores = participants[0]?.holeScores || [];
    const totalStrokes = holeScores.reduce((sum: number, score: any) => sum + score.score, 0);
    const totalPar = holeScores.reduce((sum: number, score: any) => sum + score.hole.par, 0);
    const scoreToPar = totalStrokes - totalPar;

    res.json({
      success: true,
      data: {
        ...round,
        summary: {
          totalStrokes,
          totalPar,
          scoreToPar
        }
      },
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

router.put('/:id/abandon', authMiddleware, [
  param('id').isUUID().withMessage('Invalid round ID')
], validateRequest, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const existingRound = await prisma.round.findFirst({
      where: {
        id,
        participants: {
          some: {
            userId: userId
          }
        },
        finishedAt: null
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
        finishedAt: new Date()
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

router.post('/:roundId/scores', authMiddleware, [
  param('roundId').isUUID().withMessage('Invalid round ID'),
  body('holeId').isUUID().withMessage('Valid hole ID is required'),
  body('strokes').isInt({ min: 1, max: 15 }).withMessage('Strokes must be between 1-15'),
  body('putts').optional().isInt({ min: 0, max: 10 }).withMessage('Putts must be between 0-10')
], validateRequest, async (req: Request, res: Response) => {
  try {
    const { roundId } = req.params;
    const { holeId, strokes, putts } = req.body;
    const userId = req.user?.id;

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

    // First find the round participant for this user and round
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
        updatedBy: userId!
      },
      create: {
        roundParticipantId: participant.id,
        holeId,
        score: strokes,
        putts,
        updatedBy: userId!
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
      message: 'Score saved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to save score',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;