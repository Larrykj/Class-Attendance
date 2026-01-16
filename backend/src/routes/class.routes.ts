import { Router } from 'express';
import { classController } from '../controllers';
import { authenticate, checkRole } from '../middlewares';
import { UserRole } from '../db/models/user.model';
import { body, param } from 'express-validator';

const router = Router();

// Protect all class routes with authentication
router.use(authenticate);

// Get all classes - accessible to all authenticated users
router.get('/', classController.getAllClasses);

// Get class by ID - accessible to all authenticated users
router.get('/:id', classController.getClassById);

// Create class - admin and teacher only
router.post(
  '/',
  checkRole([UserRole.ADMIN, UserRole.TEACHER]),
  [
    body('name').notEmpty().withMessage('Class name is required'),
    body('code').notEmpty().withMessage('Class code is required'),
    body('startDate').isISO8601().withMessage('Valid start date is required'),
    body('endDate').isISO8601().withMessage('Valid end date is required'),
    body('schedule').notEmpty().withMessage('Schedule is required'),
  ],
  classController.createClass
);

// Update class - admin and teacher only
router.put(
  '/:id',
  checkRole([UserRole.ADMIN, UserRole.TEACHER]),
  [
    param('id').isInt().withMessage('Valid class ID is required'),
    body('name').optional().notEmpty().withMessage('Class name cannot be empty'),
    body('code').optional().notEmpty().withMessage('Class code cannot be empty'),
    body('startDate').optional().isISO8601().withMessage('Valid start date is required'),
    body('endDate').optional().isISO8601().withMessage('Valid end date is required'),
    body('schedule').optional().notEmpty().withMessage('Schedule cannot be empty'),
  ],
  classController.updateClass
);

// Delete class - admin only
router.delete(
  '/:id',
  checkRole([UserRole.ADMIN]),
  param('id').isInt().withMessage('Valid class ID is required'),
  classController.deleteClass
);

// Get students enrolled in a class - admin and teacher only
router.get(
  '/:id/students',
  checkRole([UserRole.ADMIN, UserRole.TEACHER]),
  param('id').isInt().withMessage('Valid class ID is required'),
  classController.getClassStudents
);

// Enroll students in a class - admin and teacher only
router.post(
  '/:id/enroll',
  checkRole([UserRole.ADMIN, UserRole.TEACHER]),
  [
    param('id').isInt().withMessage('Valid class ID is required'),
    body('studentIds').isArray().withMessage('Student IDs must be an array'),
  ],
  classController.enrollStudents
);

// Remove students from a class - admin and teacher only
router.post(
  '/:id/unenroll',
  checkRole([UserRole.ADMIN, UserRole.TEACHER]),
  [
    param('id').isInt().withMessage('Valid class ID is required'),
    body('studentIds').isArray().withMessage('Student IDs must be an array'),
  ],
  classController.unenrollStudents
);

export default router;