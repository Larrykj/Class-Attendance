import { Router } from 'express';
import { faceDetectionController } from '../controllers';
import { authenticate } from '../middlewares';
import { body } from 'express-validator';

const router = Router();

// Protect all face detection routes with authentication
router.use(authenticate);

// Register face data
router.post(
  '/register',
  [
    body('userId').isInt().withMessage('Valid user ID is required'),
    body('imageData').notEmpty().withMessage('Image data is required'),
  ],
  faceDetectionController.registerFace
);

// Verify face
router.post(
  '/verify',
  [
    body('classId').isInt().withMessage('Valid class ID is required'),
    body('imageData').notEmpty().withMessage('Image data is required'),
  ],
  faceDetectionController.verifyFace
);

export default router;