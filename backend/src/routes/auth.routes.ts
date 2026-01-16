import { Router } from 'express';
import { authController } from '../controllers';
import { body } from 'express-validator';
import { authenticate } from '../middlewares';

const router = Router();

// Login route with validation
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please enter a valid email address'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  ],
  authController.login
);

// Registration route with validation
router.post(
  '/register',
  [
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    body('email').isEmail().withMessage('Please enter a valid email address'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
      .matches(/\d/)
      .withMessage('Password must contain at least one number'),
    body('role')
      .isIn(['admin', 'teacher', 'student', 'parent'])
      .withMessage('Role must be admin, teacher, student, or parent'),
  ],
  authController.register
);

// Get current user profile (requires authentication)
router.get('/profile', authenticate, authController.getProfile);

export default router;