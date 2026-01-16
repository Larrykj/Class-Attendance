import { Router } from 'express';
import { userController } from '../controllers';
import { authenticate, checkRole } from '../middlewares';
import { UserRole } from '../db/models/user.model';
import { body } from 'express-validator';

const router = Router();

// Protect all user routes with authentication
router.use(authenticate);

// Get all users - admin only
router.get(
  '/',
  checkRole([UserRole.ADMIN]),
  userController.getAllUsers
);

router.get(
  '/me/children',
  checkRole([UserRole.PARENT]),
  userController.getMyChildren
);

// Get user by ID - admin or self
router.get(
  '/:id',
  userController.getUserById
);

// Update user - admin or self
router.put(
  '/:id',
  [
    body('firstName').optional().notEmpty().withMessage('First name cannot be empty'),
    body('lastName').optional().notEmpty().withMessage('Last name cannot be empty'),
    body('email').optional().isEmail().withMessage('Please enter a valid email'),
    body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['admin', 'teacher', 'student', 'parent']).withMessage('Invalid role'),
  ],
  userController.updateUser
);

// Delete user - admin only
router.delete(
  '/:id',
  checkRole([UserRole.ADMIN]),
  userController.deleteUser
);

// Register face data - any authenticated user
router.post(
  '/:id/face-data',
  userController.registerFaceData
);

export default router;