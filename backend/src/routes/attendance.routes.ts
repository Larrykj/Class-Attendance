import { Router } from 'express';
import { attendanceController } from '../controllers';
import { authenticate, checkRole } from '../middlewares';
import { UserRole } from '../db/models/user.model';
import { body, param, query } from 'express-validator';

const router = Router();

// Protect all attendance routes with authentication
router.use(authenticate);

// Get attendance records - admin and teachers can get all, students only get their own
router.get('/', attendanceController.getAttendanceRecords);

// Get attendance by class - admin and teachers can get all, students only get their own
router.get(
  '/class/:classId',
  param('classId').isInt().withMessage('Valid class ID is required'),
  attendanceController.getAttendanceByClass
);

// Get attendance by student - admin, teachers, and self (student) only
router.get(
  '/student/:studentId',
  param('studentId').isInt().withMessage('Valid student ID is required'),
  attendanceController.getAttendanceByStudent
);

// Mark attendance manually - admin and teachers only
router.post(
  '/manual',
  checkRole([UserRole.ADMIN, UserRole.TEACHER]),
  [
    body('classId').isInt().withMessage('Valid class ID is required'),
    body('studentId').isInt().withMessage('Valid student ID is required'),
    body('date').isISO8601().withMessage('Valid date is required'),
    body('status').isIn(['present', 'absent', 'late', 'excused']).withMessage('Valid status is required'),
  ],
  attendanceController.markAttendanceManually
);

// Mark attendance with QR code - all authenticated users
router.post(
  '/qr',
  [
    body('qrCodeData').notEmpty().withMessage('QR code data is required'),
    body('studentId').optional().isInt().withMessage('Valid student ID is required'),
  ],
  attendanceController.markAttendanceWithQR
);

// Sync offline attendance records (mobile/offline clients)
router.post(
  '/sync',
  [
    body('records').isArray({ min: 1 }).withMessage('records array is required'),
  ],
  attendanceController.syncOfflineAttendance
);

// Mark attendance with face recognition - all authenticated users
router.post(
  '/face',
  [
    body('classId').isInt().withMessage('Valid class ID is required'),
    body('imageData').notEmpty().withMessage('Face image data is required'),
  ],
  attendanceController.markAttendanceWithFace
);

// Update attendance record - admin and teachers only
router.put(
  '/:id',
  checkRole([UserRole.ADMIN, UserRole.TEACHER]),
  [
    param('id').isInt().withMessage('Valid attendance ID is required'),
    body('status').isIn(['present', 'absent', 'late', 'excused']).withMessage('Valid status is required'),
    body('notes').optional().isString().withMessage('Notes must be a string'),
  ],
  attendanceController.updateAttendance
);

// Delete attendance record - admin only
router.delete(
  '/:id',
  checkRole([UserRole.ADMIN]),
  param('id').isInt().withMessage('Valid attendance ID is required'),
  attendanceController.deleteAttendance
);

// Get attendance report - admin and teachers only
router.get(
  '/report',
  checkRole([UserRole.ADMIN, UserRole.TEACHER]),
  [
    query('classId').optional().isInt().withMessage('Valid class ID is required'),
    query('startDate').optional().isISO8601().withMessage('Valid start date is required'),
    query('endDate').optional().isISO8601().withMessage('Valid end date is required'),
  ],
  attendanceController.getAttendanceReport
);

export default router;