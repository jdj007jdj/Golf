import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/expressValidatorMiddleware';
import { body } from 'express-validator';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /profile - Get current user profile
 */
router.get('/profile', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

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
        homeCourseId: true,
        preferences: true,
        subscriptionTier: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * PUT /profile - Update user profile
 */
router.put('/profile', authMiddleware, [
  body('firstName').optional().isString().trim().isLength({ min: 1, max: 50 }),
  body('lastName').optional().isString().trim().isLength({ min: 1, max: 50 }),
  body('handicap').optional({ nullable: true }).isFloat({ min: -10, max: 54 }).withMessage('Handicap must be between -10 and 54'),
  body('email').optional().isEmail().normalizeEmail(),
  body('preferences').optional().isObject(),
], validateRequest, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { firstName, lastName, handicap, email, preferences } = req.body;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Build update data object
    const updateData: any = {};
    
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (handicap !== undefined) updateData.handicap = handicap;
    if (preferences !== undefined) updateData.preferences = preferences;
    
    // Email update requires checking uniqueness
    if (email && email !== req.user?.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });
      
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Email already in use'
        });
      }
      
      updateData.email = email;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        handicap: true,
        profileImageUrl: true,
        preferences: true,
        updatedAt: true,
      }
    });

    res.json({
      success: true,
      data: updatedUser,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /stats - Get user statistics
 */
router.get('/stats', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Get total rounds
    const totalRounds = await prisma.roundParticipant.count({
      where: { 
        userId,
        round: {
          finishedAt: { not: null }
        }
      }
    });

    // Get recent rounds with scores
    const recentRounds = await prisma.roundParticipant.findMany({
      where: { 
        userId,
        round: {
          finishedAt: { not: null }
        }
      },
      include: {
        round: {
          include: {
            course: {
              select: {
                name: true,
                holes: {
                  select: {
                    par: true
                  }
                }
              }
            }
          }
        },
        holeScores: {
          select: {
            score: true,
            hole: {
              select: {
                par: true
              }
            }
          }
        }
      },
      orderBy: {
        round: {
          finishedAt: 'desc'
        }
      },
      take: 10
    });

    // Calculate statistics
    let totalStrokes = 0;
    let totalPar = 0;
    let bestScore: number | null = null;
    let averageScore = 0;
    let roundsWithScores = 0;

    recentRounds.forEach(participant => {
      const roundStrokes = participant.holeScores.reduce((sum, hs) => sum + hs.score, 0);
      const roundPar = participant.holeScores.reduce((sum, hs) => sum + hs.hole.par, 0);
      
      if (roundStrokes > 0) {
        totalStrokes += roundStrokes;
        totalPar += roundPar;
        roundsWithScores++;
        
        const scoreToPar = roundStrokes - roundPar;
        if (bestScore === null || scoreToPar < bestScore) {
          bestScore = scoreToPar;
        }
      }
    });

    if (roundsWithScores > 0) {
      averageScore = Math.round(totalStrokes / roundsWithScores);
    }

    res.json({
      success: true,
      data: {
        totalRounds,
        roundsWithScores,
        averageScore,
        bestScore,
        averageScoreToPar: roundsWithScores > 0 ? Math.round((totalStrokes - totalPar) / roundsWithScores) : 0,
        recentRounds: recentRounds.map(p => ({
          date: p.round.finishedAt,
          courseName: p.round.course.name,
          totalStrokes: p.holeScores.reduce((sum, hs) => sum + hs.score, 0),
          totalPar: p.holeScores.reduce((sum, hs) => sum + hs.hole.par, 0),
          holesPlayed: p.holeScores.length
        }))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user statistics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;