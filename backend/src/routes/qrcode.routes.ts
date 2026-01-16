import { Router } from 'express';
import { qrcodeController } from '../controllers';
import { authenticate, checkRole } from '../middlewares';
import { UserRole } from '../db/models/user.model';
import { param, query } from 'express-validator';

const router = Router();

// Protect all QR code routes with authentication
router.use(authenticate);

// Generate QR code for a class - admin and teachers only
router.get(
  '/generate/:classId',
  checkRole([UserRole.ADMIN, UserRole.TEACHER]),
  [
    param('classId').isInt().withMessage('Valid class ID is required'),
    query('expiration').optional().isInt().withMessage('Expiration must be a number (minutes)'),
  ],
  qrcodeController.generateQRCode
);

// Validate QR code - all authenticated users
router.post(
  '/validate',
  qrcodeController.validateQRCode
);

export default router;