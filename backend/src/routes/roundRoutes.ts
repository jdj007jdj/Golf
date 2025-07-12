import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validateRequest';
import { body, param, query } from 'express-validator';

const router = Router();
const prisma = new PrismaClient();

router.get('/', authMiddleware, [
  query('status').optional().isIn(['active', 'completed', 'abandoned']).withMessage('Invalid status')
], validateRequest, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { status } = req.query;

    const rounds = await prisma.round.findMany({
      where: {
        playerId: userId,
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
        scores: {
          include: {
            hole: {
              select: {
                number: true,
                par: true,
                name: true
              }
            }
          },
          orderBy: {
            hole: { number: 'asc' }
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
], validateRequest, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const round = await prisma.round.findFirst({
      where: {
        id,
        playerId: userId
      },
      include: {
        course: {
          include: {
            holes: {
              orderBy: { number: 'asc' }
            }
          }
        },
        scores: {
          include: {
            hole: {
              select: {
                number: true,
                par: true,
                name: true
              }
            }
          },
          orderBy: {
            hole: { number: 'asc' }
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
  body('tees').optional().isString().withMessage('Tees must be a string')
], validateRequest, async (req, res) => {
  try {
    const { courseId, tees } = req.body;
    const userId = req.user?.id;

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
        playerId: userId!,
        courseId,
        tees: tees || 'Regular',
        status: 'active',
        startedAt: new Date()
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
], validateRequest, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const existingRound = await prisma.round.findFirst({
      where: {
        id,
        playerId: userId,
        status: 'active'
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
        status: 'completed',
        completedAt: new Date()
      },
      include: {
        course: {
          select: {
            id: true,
            name: true,
            location: true
          }
        },
        scores: {
          include: {
            hole: {
              select: {
                number: true,
                par: true,
                name: true
              }
            }
          },
          orderBy: {
            hole: { number: 'asc' }
          }
        }
      }
    });

    const totalStrokes = round.scores.reduce((sum, score) => sum + score.strokes, 0);
    const totalPar = round.scores.reduce((sum, score) => sum + score.hole.par, 0);
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
], validateRequest, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const existingRound = await prisma.round.findFirst({
      where: {
        id,
        playerId: userId,
        status: 'active'
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
        status: 'abandoned'
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
], validateRequest, async (req, res) => {
  try {
    const { roundId } = req.params;
    const { holeId, strokes, putts } = req.body;
    const userId = req.user?.id;

    const round = await prisma.round.findFirst({
      where: {
        id: roundId,
        playerId: userId,
        status: 'active'
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

    const score = await prisma.score.upsert({
      where: {
        roundId_holeId: {
          roundId,
          holeId
        }
      },
      update: {
        strokes,
        putts
      },
      create: {
        roundId,
        holeId,
        strokes,
        putts
      },
      include: {
        hole: {
          select: {
            number: true,
            par: true,
            name: true
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