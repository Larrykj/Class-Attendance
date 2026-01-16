import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import classRoutes from './class.routes';
import attendanceRoutes from './attendance.routes';
import qrcodeRoutes from './qrcode.routes';
import faceDetectionRoutes from './faceDetection.routes';

const router = Router();

// Mount all route modules
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/classes', classRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/qrcode', qrcodeRoutes);
router.use('/face-detection', faceDetectionRoutes);

export default router;