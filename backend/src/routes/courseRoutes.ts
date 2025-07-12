import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validateRequest';
import { body, param } from 'express-validator';

const router = Router();
const prisma = new PrismaClient();

router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const courses = await prisma.course.findMany({
      include: {
        holes: {
          orderBy: { holeNumber: 'asc' }
        },
        _count: {
          select: { rounds: true }
        }
      }
    });

    res.json({
      success: true,
      data: courses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch courses',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/:id', authMiddleware, [
  param('id').isUUID().withMessage('Invalid course ID')
], validateRequest, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        holes: {
          orderBy: { holeNumber: 'asc' }
        }
      }
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    res.json({
      success: true,
      data: course
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch course',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/', authMiddleware, [
  body('name').trim().isLength({ min: 1 }).withMessage('Course name is required'),
  body('location').optional().trim(),
  body('holes').isArray({ min: 1, max: 18 }).withMessage('Course must have 1-18 holes'),
  body('holes.*.number').isInt({ min: 1, max: 18 }).withMessage('Hole number must be between 1-18'),
  body('holes.*.par').isInt({ min: 3, max: 6 }).withMessage('Par must be between 3-6'),
  body('holes.*.name').optional().trim()
], validateRequest, async (req: Request, res: Response) => {
  try {
    const { name, location, holes } = req.body;
    const userId = req.user?.id;

    const course = await prisma.course.create({
      data: {
        name,
        location,
        createdBy: userId,
        holes: {
          create: holes.map((hole: any) => ({
            number: hole.number,
            par: hole.par,
            name: hole.name || `Hole ${hole.number}`
          }))
        }
      },
      include: {
        holes: {
          orderBy: { holeNumber: 'asc' }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: course,
      message: 'Course created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create course',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.put('/:id', authMiddleware, [
  param('id').isUUID().withMessage('Invalid course ID'),
  body('name').optional().trim().isLength({ min: 1 }).withMessage('Course name cannot be empty'),
  body('location').optional().trim()
], validateRequest, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, location } = req.body;
    const userId = req.user?.id;

    const existingCourse = await prisma.course.findUnique({
      where: { id }
    });

    if (!existingCourse) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    if (existingCourse.createdBy !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this course'
      });
    }

    const course = await prisma.course.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(location && { location })
      },
      include: {
        holes: {
          orderBy: { holeNumber: 'asc' }
        }
      }
    });

    res.json({
      success: true,
      data: course,
      message: 'Course updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update course',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.delete('/:id', authMiddleware, [
  param('id').isUUID().withMessage('Invalid course ID')
], validateRequest, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const existingCourse = await prisma.course.findUnique({
      where: { id }
    });

    if (!existingCourse) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    if (existingCourse.createdBy !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this course'
      });
    }

    await prisma.course.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete course',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;