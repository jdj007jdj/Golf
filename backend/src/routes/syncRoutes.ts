/**
 * @file routes/syncRoutes.ts
 * @description Data synchronization routes with PostGIS transformation
 * @updated Schema fixed - removed incorrect foreign key constraint
 */

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { 
  coordinatesToPoint, 
  coordinatesToPolygon,
  validateCoordinates,
  calculateDistance 
} from '../utils/postgisTransform';

const router = Router();
const prisma = new PrismaClient();

// Extend Express Request to include user
interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    username: string;
    firstName?: string;
    lastName?: string;
    handicap?: number;
    profileImageUrl?: string;
    preferences: any;
  };
}

/**
 * @route POST /api/sync/shots
 * @description Sync shot data from mobile app
 * @access Private
 */
router.post('/shots', async (req: AuthRequest, res: Response) => {
  try {
    const { shots } = req.body;
    const userId = req.user?.id;

    console.log('Shot sync request received:', {
      userId,
      shotsCount: shots?.length,
      bodyKeys: Object.keys(req.body),
      hasShots: !!shots,
      isArray: Array.isArray(shots)
    });

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Unauthorized' }
      });
    }

    if (!shots || !Array.isArray(shots)) {
      console.log('Invalid shot data:', { shots, type: typeof shots });
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid shot data format' }
      });
    }

    console.log(`Syncing ${shots.length} shots for user ${userId}`);

    const syncedShots = [];
    const errors = [];

    // Process shots by round
    const shotsByRound = shots.reduce((acc: any, shot: any) => {
      const roundId = shot.roundId;
      // Skip shots without a valid roundId
      if (!roundId || roundId === 'null') {
        console.log(`Skipping shot without valid roundId: hole ${shot.holeNumber}, shot ${shot.shotNumber}`);
        errors.push({
          shot: `${shot.holeNumber}-${shot.shotNumber}`,
          error: 'Missing or invalid roundId'
        });
        return acc;
      }
      if (!acc[roundId]) {
        acc[roundId] = [];
      }
      acc[roundId].push(shot);
      return acc;
    }, {});

    for (const [roundId, roundShots] of Object.entries(shotsByRound)) {
      try {
        // Get the round participant for this user and round
        const roundParticipant = await prisma.roundParticipant.findFirst({
          where: {
            roundId: roundId as string,
            userId: userId
          }
        });

        if (!roundParticipant) {
          console.log(`No RoundParticipant found for roundId: ${roundId}, userId: ${userId}`);
          errors.push({ roundId, error: 'Round not found or user not participant' });
          continue;
        }

        // Get the round with course and holes
        const round = await prisma.round.findUnique({
          where: { id: roundId as string },
          include: {
            course: {
              include: {
                holes: true
              }
            }
          }
        });

        if (!round) {
          errors.push({ roundId, error: 'Round not found' });
          continue;
        }

        // Process each shot
        for (const shotData of roundShots as any[]) {
          try {
            // Validate coordinates
            if (!validateCoordinates(shotData.coordinates.latitude, shotData.coordinates.longitude)) {
              errors.push({
                shot: `${shotData.holeNumber}-${shotData.shotNumber}`,
                error: 'Invalid coordinates'
              });
              continue;
            }

            // Find the hole
            const hole = round.course.holes.find(
              (h: any) => h.holeNumber === shotData.holeNumber
            );

            if (!hole) {
              errors.push({
                shot: `${shotData.holeNumber}-${shotData.shotNumber}`,
                error: 'Hole not found'
              });
              continue;
            }

            // Transform coordinates to PostGIS format
            const position = coordinatesToPoint(
              shotData.coordinates.latitude,
              shotData.coordinates.longitude
            );

            // For shots, we use the same position for start and end
            // In a real implementation, you'd calculate trajectory
            const shotRecord = {
              roundParticipantId: roundParticipant.id,
              holeId: hole.id,
              shotNumber: shotData.shotNumber,
              clubId: shotData.clubId || null,
              startPosition: position,
              endPosition: position, // Same as start for now
              distanceYards: shotData.distanceToNext || 0,
              lieType: 'fairway', // Default values
              shotType: 'full',
              shotShape: 'straight'
            };

            // Check if shot already exists
            const existingShot = await prisma.shot.findFirst({
              where: {
                roundParticipantId: roundParticipant.id,
                holeId: hole.id,
                shotNumber: shotData.shotNumber
              }
            });

            let shot;
            if (existingShot) {
              // Update existing shot
              shot = await prisma.shot.update({
                where: { id: existingShot.id },
                data: shotRecord
              });
            } else {
              // Create new shot
              shot = await prisma.shot.create({
                data: shotRecord
              });
            }

            syncedShots.push({
              id: shot.id,
              holeNumber: shotData.holeNumber,
              shotNumber: shot.shotNumber
            });

          } catch (shotError: any) {
            console.error(`Error syncing shot:`, shotError);
            errors.push({
              shot: `${shotData.holeNumber}-${shotData.shotNumber}`,
              error: shotError.message
            });
          }
        }
      } catch (roundError: any) {
        console.error(`Error processing round ${roundId}:`, roundError);
        errors.push({ roundId, error: roundError.message });
      }
    }

    const response = {
      success: syncedShots.length > 0 || errors.length === 0,
      data: {
        synced: syncedShots.length,
        total: shots.length,
        skipped: errors.length,
        errors: errors
      }
    };

    console.log(`Shot sync completed: ${syncedShots.length} synced, ${errors.length} errors out of ${shots.length} total`);
    
    res.status(syncedShots.length > 0 || errors.length === 0 ? 200 : 400).json(response);

  } catch (error: any) {
    console.error('Shot sync error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to sync shots' }
    });
  }
});

/**
 * @route POST /api/sync/course-learning
 * @description Sync course learning data from mobile app
 * @access Private
 */
router.post('/course-learning', async (req: AuthRequest, res: Response) => {
  try {
    const { courseId, knowledge } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Unauthorized' }
      });
    }

    if (!courseId || !knowledge) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid course learning data' }
      });
    }

    console.log(`Syncing course knowledge for ${courseId} from user ${userId}`);

    const syncedFeatures = [];
    const errors = [];

    // Validate courseId is a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(courseId)) {
      console.log(`Invalid course ID format: ${courseId}`);
      return res.status(400).json({
        success: false,
        error: { message: `Invalid course ID format: ${courseId}` }
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
        error: { message: 'Course not found' }
      });
    }

    // Process each hole's learning data
    for (const holeData of knowledge.holes || []) {
      try {
        const hole = course.holes.find((h: any) => h.holeNumber === holeData.holeNumber);
        if (!hole) {
          errors.push({
            hole: holeData.holeNumber,
            error: 'Hole not found'
          });
          continue;
        }

        // Process tee boxes
        for (const teeBox of holeData.teeBoxes || []) {
          try {
            if (!validateCoordinates(teeBox.coordinates.latitude, teeBox.coordinates.longitude)) {
              continue;
            }

            const centerPoint = coordinatesToPoint(
              teeBox.coordinates.latitude,
              teeBox.coordinates.longitude
            );

            const feature = await prisma.courseFeature.create({
              data: {
                holeId: hole.id,
                featureType: 'TEE_BOX',
                name: `${teeBox.color || 'White'} Tee`,
                centerPoint,
                confidenceScore: teeBox.confidence || 0.5,
                createdBy: userId
              }
            });

            syncedFeatures.push({ type: 'TEE_BOX', id: feature.id });
          } catch (teeError: any) {
            console.error('Error syncing tee box:', teeError);
          }
        }

        // Process pin positions
        if (holeData.pin?.current) {
          try {
            const pinCoords = holeData.pin.current;
            if (validateCoordinates(pinCoords.latitude, pinCoords.longitude)) {
              const position = coordinatesToPoint(pinCoords.latitude, pinCoords.longitude);

              const pinPosition = await prisma.pinPosition.create({
                data: {
                  holeId: hole.id,
                  position,
                  recordedBy: userId,
                  isActive: true
                }
              });

              syncedFeatures.push({ type: 'PIN', id: pinPosition.id });
            }
          } catch (pinError: any) {
            console.error('Error syncing pin position:', pinError);
          }
        }

        // Process green boundaries
        if (holeData.green?.boundary && holeData.green.boundary.length >= 3) {
          try {
            const boundary = coordinatesToPolygon(holeData.green.boundary);

            const feature = await prisma.courseFeature.create({
              data: {
                holeId: hole.id,
                featureType: 'GREEN',
                name: 'Green Boundary',
                boundary,
                confidenceScore: holeData.green.confidence || 0.5,
                createdBy: userId
              }
            });

            syncedFeatures.push({ type: 'GREEN', id: feature.id });
          } catch (greenError: any) {
            console.error('Error syncing green boundary:', greenError);
          }
        }

      } catch (holeError: any) {
        console.error(`Error syncing hole ${holeData.holeNumber}:`, holeError);
        errors.push({
          hole: holeData.holeNumber,
          error: holeError.message
        });
      }
    }

    res.json({
      success: true,
      data: {
        synced: syncedFeatures.length,
        errors: errors
      }
    });

  } catch (error: any) {
    console.error('Course learning sync error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to sync course learning data' }
    });
  }
});

export default router;