import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { Attendance, Class, User } from '../db/models';
import { UserRole } from '../db/models/user.model';
import { VerificationMethod } from '../db/models/attendance.model';
import logger from '../config/logger';
import { qrcodeService, faceDetectionService, attendanceService, websocketService, attendanceLogService, smsService } from '../services';
import { Op } from 'sequelize';

/**
 * Get attendance records with filtering
 */
export const getAttendanceRecords = async (req: Request, res: Response) => {
  try {
    // Parse query parameters
    const { 
      classId, 
      studentId, 
      date, 
      status, 
      startDate, 
      endDate, 
      method,
      page = '1',
      limit = '50'
    } = req.query;
    
    // Convert page and limit to numbers
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;
    
    // Build where conditions
    const where: any = {};
    
    if (classId) {
      where.classId = parseInt(classId as string, 10);
    }
    
    // If student role, only show their own records
    if (req.user?.role === UserRole.STUDENT) {
      where.studentId = req.user.id;
    } else if (studentId) {
      where.studentId = parseInt(studentId as string, 10);
    }
    
    // Filter by specific date
    if (date) {
      where.date = date;
    }
    
    // Filter by date range
    if (startDate && endDate) {
      where.date = {
        [Op.between]: [startDate, endDate]
      };
    } else if (startDate) {
      where.date = {
        [Op.gte]: startDate
      };
    } else if (endDate) {
      where.date = {
        [Op.lte]: endDate
      };
    }
    
    // Filter by status
    if (status) {
      where.status = status;
    }
    
    // Filter by verification method
    if (method) {
      where.verificationMethod = method;
    }
    
    // If teacher role, only show records for their classes
    if (req.user?.role === UserRole.TEACHER) {
      const teacherClasses = await Class.findAll({ 
        where: { teacherId: req.user.id },
        attributes: ['id']
      });
      
      const classIds = teacherClasses.map(c => c.id);
      where.classId = { [Op.in]: classIds };
    }
    
    // Get attendance records with pagination
    const { count, rows: records } = await Attendance.findAndCountAll({
      where,
      limit: limitNum,
      offset,
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: Class,
          as: 'class',
          attributes: ['id', 'name', 'code']
        }
      ],
      order: [['date', 'DESC'], ['createdAt', 'DESC']]
    });
    
    return res.status(200).json({
      total: count,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(count / limitNum),
      records
    });
  } catch (error) {
    logger.error('Get attendance records error:', error);
    return res.status(500).json({ message: 'Error fetching attendance records' });
  }
};

/**
 * Sync offline attendance records (from mobile/offline clients)
 */
export const syncOfflineAttendance = async (req: Request, res: Response) => {
  try {
    const { records } = req.body as { records?: any[] };

    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ message: 'records array is required' });
    }

    const results: any[] = [];

    for (const item of records) {
      const {
        localId,
        classId,
        studentId,
        date,
        status,
        verificationMethod,
        latitude,
        longitude,
        deviceId,
        notes,
      } = item;

      if (!classId || !studentId || !date || !status || !verificationMethod) {
        results.push({
          localId,
          success: false,
          message: 'Missing required fields',
        });
        continue;
      }

      try {
        const [record] = await Attendance.findOrCreate({
          where: {
            classId,
            studentId,
            date,
          },
          defaults: {
            status,
            verificationMethod,
            verifiedBy: null,
            notes,
            latitude,
            longitude,
            deviceId,
            syncStatus: 'synced',
          },
        });

        if (
          record.status !== status ||
          record.verificationMethod !== verificationMethod ||
          record.latitude !== latitude ||
          record.longitude !== longitude ||
          record.deviceId !== deviceId
        ) {
          await record.update({
            status,
            verificationMethod,
            notes: notes || record.notes,
            latitude,
            longitude,
            deviceId,
            syncStatus: 'synced',
          });
        }

        try {
          await attendanceLogService.logAttendance({
            studentId,
            classId,
            attendanceId: record.id,
            status,
            methodUsed:
              verificationMethod === VerificationMethod.FACE_RECOGNITION
                ? 'face'
                : verificationMethod === VerificationMethod.QR_CODE
                ? 'qr'
                : 'manual',
            latitude,
            longitude,
            deviceId,
            source: 'offline',
            syncStatus: 'synced',
          });
        } catch (logError) {
          logger.error('Failed to log offline attendance to MongoDB:', logError);
        }

        if (status === 'absent') {
          try {
            await smsService.notifyParentOnAbsent(studentId, date);
          } catch (smsError) {
            logger.error('Error sending absence SMS notification:', smsError);
          }
        }

        results.push({
          localId,
          success: true,
          attendanceId: record.id,
        });
      } catch (err) {
        logger.error('Error syncing offline attendance record:', err);
        results.push({
          localId,
          success: false,
          message: 'Failed to sync record',
        });
      }
    }

    return res.status(200).json({
      message: 'Offline attendance sync completed',
      results,
    });
  } catch (error) {
    logger.error('Offline attendance sync error:', error);
    return res.status(500).json({ message: 'Error syncing offline attendance records' });
  }
};

/**
 * Get attendance by class
 */
export const getAttendanceByClass = async (req: Request, res: Response) => {
  try {
    const classId = parseInt(req.params.classId, 10);
    const { date, startDate, endDate } = req.query;
    
    // Check if class exists
    const classData = await Class.findByPk(classId);
    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }
    
    // If teacher, verify they teach this class
    if (req.user?.role === UserRole.TEACHER && classData.teacherId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. You can only view attendance for your own classes.' });
    }
    
    // Build where conditions
    const where: any = { classId };
    
    // If student, only show their own records
    if (req.user?.role === UserRole.STUDENT) {
      where.studentId = req.user.id;
      
      // Verify student is enrolled in the class
      const enrollment = await (classData as any).hasStudent(req.user.id);
      if (!enrollment) {
        return res.status(403).json({ message: 'Access denied. You are not enrolled in this class.' });
      }
    }
    
    // Filter by specific date
    if (date) {
      where.date = date;
    }
    
    // Filter by date range
    if (startDate && endDate) {
      where.date = {
        [Op.between]: [startDate, endDate]
      };
    } else if (startDate) {
      where.date = {
        [Op.gte]: startDate
      };
    } else if (endDate) {
      where.date = {
        [Op.lte]: endDate
      };
    }
    
    // Get attendance records
    const records = await Attendance.findAll({
      where,
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ],
      order: [['date', 'DESC'], ['createdAt', 'DESC']]
    });
    
    return res.status(200).json(records);
  } catch (error) {
    logger.error('Get attendance by class error:', error);
    return res.status(500).json({ message: 'Error fetching attendance records' });
  }
};

/**
 * Get attendance by student
 */
export const getAttendanceByStudent = async (req: Request, res: Response) => {
  try {
    const studentId = parseInt(req.params.studentId, 10);
    
    // Authorization check
    if (req.user?.role === UserRole.STUDENT && req.user.id !== studentId) {
      return res.status(403).json({ message: 'Access denied. You can only view your own attendance.' });
    }
    
    // Check if student exists
    const student = await User.findOne({
      where: { id: studentId, role: UserRole.STUDENT }
    });
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    if (req.user?.role === UserRole.PARENT) {
      const parent = (await User.findByPk(req.user.id, {
        include: [
          {
            model: User,
            as: 'children',
            attributes: ['id'],
          },
        ],
      })) as any;

      const isLinked =
        parent &&
        Array.isArray(parent.children) &&
        parent.children.some((child: any) => child.id === studentId);

      if (!isLinked) {
        return res.status(403).json({ message: 'Access denied. This student is not linked to your account.' });
      }
    }
    
    // For teachers, verify they teach classes this student is in
    if (req.user?.role === UserRole.TEACHER) {
      const teacherClasses = await Class.findAll({ 
        where: { teacherId: req.user.id },
        attributes: ['id']
      });
      
      const classIds = teacherClasses.map(c => c.id);
      
      // Get attendance records for this student in teacher's classes
      const records = await Attendance.findAll({
        where: {
          studentId,
          classId: { [Op.in]: classIds }
        },
        include: [
          {
            model: Class,
            as: 'class',
            attributes: ['id', 'name', 'code']
          }
        ],
        order: [['date', 'DESC'], ['createdAt', 'DESC']]
      });
      
      return res.status(200).json(records);
    }
    
    // For admin, student (viewing self), or parent (linked child), get all attendance records
    const records = await Attendance.findAll({
      where: { studentId },
      include: [
        {
          model: Class,
          as: 'class',
          attributes: ['id', 'name', 'code']
        }
      ],
      order: [['date', 'DESC'], ['createdAt', 'DESC']]
    });
    
    return res.status(200).json(records);
  } catch (error) {
    logger.error('Get attendance by student error:', error);
    return res.status(500).json({ message: 'Error fetching attendance records' });
  }
};

/**
 * Mark attendance manually (by teacher or admin)
 */
export const markAttendanceManually = async (req: Request, res: Response) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { classId, studentId, date, status, notes } = req.body;
    
    // Check if class exists
    const classData = await Class.findByPk(classId);
    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }
    
    // Check if teacher teaches this class
    if (req.user?.role === UserRole.TEACHER && classData.teacherId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. You can only mark attendance for your own classes.' });
    }
    
    // Check if student exists and is enrolled in the class
    const student = await User.findOne({
      where: { id: studentId, role: UserRole.STUDENT }
    });
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    const isEnrolled = await (classData as any).hasStudent(studentId);
    if (!isEnrolled) {
      return res.status(400).json({ message: 'Student is not enrolled in this class' });
    }
    
    // Create or update attendance record
    const [record, created] = await Attendance.findOrCreate({
      where: {
        classId,
        studentId,
        date
      },
      defaults: {
        status,
        verificationMethod: VerificationMethod.MANUAL,
        verifiedBy: req.user?.id,
        notes
      }
    });
    
    // If record already exists, update it
    if (!created) {
      await record.update({
        status,
        verificationMethod: VerificationMethod.MANUAL,
        verifiedBy: req.user?.id,
        notes: notes || record.notes
      });
    }
    
    // Notify via WebSocket
    websocketService.broadcastAttendanceUpdate({
      attendanceId: record.id,
      classId,
      studentId,
      date,
      status,
      verificationMethod: VerificationMethod.MANUAL,
      message: 'Attendance marked manually'
    });
    
    try {
      await attendanceLogService.logAttendance({
        studentId,
        classId,
        attendanceId: record.id,
        status,
        methodUsed: 'manual',
        source: 'online',
        syncStatus: 'synced',
      });
    } catch (logError) {
      logger.error('Failed to log manual attendance to MongoDB:', logError);
    }

    if (status === 'absent') {
      try {
        await smsService.notifyParentOnAbsent(studentId, date);
      } catch (smsError) {
        logger.error('Error sending absence SMS notification (manual):', smsError);
      }
    }
    
    return res.status(created ? 201 : 200).json({
      message: `Attendance ${created ? 'recorded' : 'updated'} successfully`,
      record
    });
  } catch (error) {
    logger.error('Mark attendance manually error:', error);
    return res.status(500).json({ message: 'Error marking attendance' });
  }
};

/**
 * Mark attendance with QR code
 */
export const markAttendanceWithQR = async (req: Request, res: Response) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { qrCodeData } = req.body;
    // Use the provided studentId or get it from the authenticated user
    const studentId = req.body.studentId || req.user?.id;
    
    if (!studentId) {
      return res.status(400).json({ message: 'Student ID is required' });
    }
    
    // Validate QR code and get class information
    const qrValidation = await qrcodeService.validateQRCode(qrCodeData);
    
    if (!qrValidation.success) {
      return res.status(400).json({ message: qrValidation.message });
    }
    
    const { classId } = qrValidation.data;
    
    // Check if student is enrolled in the class
    const classData = await Class.findByPk(classId);
    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }
    
    const isEnrolled = await (classData as any).hasStudent(studentId);
    if (!isEnrolled) {
      return res.status(400).json({ message: 'Student is not enrolled in this class' });
    }
    
    // Create or update attendance record
    const today = new Date().toISOString().split('T')[0];
    
    const [record, created] = await Attendance.findOrCreate({
      where: {
        classId,
        studentId,
        date: today
      },
      defaults: {
        status: 'present',
        verificationMethod: VerificationMethod.QR_CODE,
        verifiedBy: null,
        notes: 'Marked via QR code'
      }
    });
    
    // If record already exists, update it
    if (!created) {
      await record.update({
        status: 'present',
        verificationMethod: VerificationMethod.QR_CODE,
        notes: 'Marked via QR code (updated)'
      });
    }
    
    // Notify via WebSocket
    websocketService.broadcastAttendanceUpdate({
      attendanceId: record.id,
      classId,
      studentId,
      date: new Date(today),
      status: 'present',
      verificationMethod: VerificationMethod.QR_CODE,
      message: 'Attendance marked via QR code'
    });
    
    try {
      await attendanceLogService.logAttendance({
        studentId,
        classId,
        attendanceId: record.id,
        status: 'present',
        methodUsed: 'qr',
        source: 'online',
        syncStatus: 'synced',
      });
    } catch (logError) {
      logger.error('Failed to log QR attendance to MongoDB:', logError);
    }

    return res.status(created ? 201 : 200).json({
      message: `Attendance ${created ? 'recorded' : 'updated'} successfully via QR code`,
      record
    });
  } catch (error) {
    logger.error('Mark attendance with QR error:', error);
    return res.status(500).json({ message: 'Error marking attendance' });
  }
};

/**
 * Mark attendance with face recognition
 */
export const markAttendanceWithFace = async (req: Request, res: Response) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { classId, imageData } = req.body;
    
    // Check if class exists
    const classData = await Class.findByPk(classId);
    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }
    
    // Verify face and identify student
    const verificationResult = await faceDetectionService.verifyFace(imageData, classId);
    
    if (!verificationResult.success) {
      return res.status(400).json({ message: verificationResult.message });
    }
    
    const { studentId } = verificationResult.data;
    
    // Check if student is enrolled in the class
    const isEnrolled = await (classData as any).hasStudent(studentId);
    if (!isEnrolled) {
      return res.status(400).json({ message: 'Student is not enrolled in this class' });
    }
    
    // Create or update attendance record
    const today = new Date().toISOString().split('T')[0];
    
    const [record, created] = await Attendance.findOrCreate({
      where: {
        classId,
        studentId,
        date: today
      },
      defaults: {
        status: 'present',
        verificationMethod: VerificationMethod.FACE_RECOGNITION,
        verifiedBy: null,
        notes: 'Marked via face recognition'
      }
    });
    
    // If record already exists, update it
    if (!created) {
      await record.update({
        status: 'present',
        verificationMethod: VerificationMethod.FACE_RECOGNITION,
        notes: 'Marked via face recognition (updated)'
      });
    }
    
    // Notify via WebSocket
    websocketService.broadcastAttendanceUpdate({
      attendanceId: record.id,
      classId,
      studentId,
      date: new Date(today),
      status: 'present',
      verificationMethod: VerificationMethod.FACE_RECOGNITION,
      message: 'Attendance marked via face recognition'
    });
    
    try {
      await attendanceLogService.logAttendance({
        studentId,
        classId,
        attendanceId: record.id,
        status: 'present',
        methodUsed: 'face',
        source: 'online',
        syncStatus: 'synced',
      });
    } catch (logError) {
      logger.error('Failed to log face attendance to MongoDB:', logError);
    }

    return res.status(created ? 201 : 200).json({
      message: `Attendance ${created ? 'recorded' : 'updated'} successfully via face recognition`,
      studentId,
      record
    });
  } catch (error) {
    logger.error('Mark attendance with face error:', error);
    return res.status(500).json({ message: 'Error marking attendance' });
  }
};

/**
 * Update attendance record
 */
export const updateAttendance = async (req: Request, res: Response) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const attendanceId = parseInt(req.params.id, 10);
    const { status, notes } = req.body;
    
    // Find attendance record
    const attendance = await Attendance.findByPk(attendanceId, {
      include: [{
        model: Class,
        as: 'class'
      }]
    });
    
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }
    
    // Authorization check for teachers
    if (req.user?.role === UserRole.TEACHER) {
      const classData = (attendance as any).class;
      if (classData.teacherId !== req.user.id) {
        return res.status(403).json({ message: 'Access denied. You can only update attendance for your own classes.' });
      }
    }
    
    // Update attendance
    await attendance.update({
      status,
      notes: notes || attendance.notes,
      verifiedBy: req.user?.id
    });
    
    // Notify via WebSocket
    websocketService.broadcastAttendanceUpdate({
      attendanceId,
      classId: attendance.classId,
      studentId: attendance.studentId,
      date: attendance.date,
      status,
      verificationMethod: attendance.verificationMethod,
      message: 'Attendance record updated'
    });
    
    try {
      await attendanceLogService.logAttendance({
        studentId: attendance.studentId,
        classId: attendance.classId,
        attendanceId,
        status,
        methodUsed:
          attendance.verificationMethod === VerificationMethod.FACE_RECOGNITION
            ? 'face'
            : attendance.verificationMethod === VerificationMethod.QR_CODE
            ? 'qr'
            : 'manual',
        source: 'online',
        syncStatus: 'synced',
      });
    } catch (logError) {
      logger.error('Failed to log updated attendance to MongoDB:', logError);
    }

    if (status === 'absent') {
      try {
        const absenceDate =
          attendance.date instanceof Date
            ? attendance.date.toISOString().split('T')[0]
            : String(attendance.date);
        await smsService.notifyParentOnAbsent(attendance.studentId, absenceDate);
      } catch (smsError) {
        logger.error('Error sending absence SMS notification (update):', smsError);
      }
    }
    
    return res.status(200).json({
      message: 'Attendance updated successfully',
      attendance
    });
  } catch (error) {
    logger.error('Update attendance error:', error);
    return res.status(500).json({ message: 'Error updating attendance' });
  }
};

/**
 * Delete attendance record
 */
export const deleteAttendance = async (req: Request, res: Response) => {
  try {
    const attendanceId = parseInt(req.params.id, 10);
    
    // Find attendance record
    const attendance = await Attendance.findByPk(attendanceId, {
      include: [{
        model: Class,
        as: 'class'
      }]
    });
    
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }
    
    // Delete attendance record
    await attendance.destroy();
    
    // Notify via WebSocket
    websocketService.broadcastAttendanceUpdate({
      attendanceId,
      classId: attendance.classId,
      studentId: attendance.studentId,
      date: attendance.date,
      status: 'deleted',
      verificationMethod: attendance.verificationMethod,
      message: 'Attendance record deleted'
    });
    
    return res.status(200).json({ message: 'Attendance record deleted successfully' });
  } catch (error) {
    logger.error('Delete attendance error:', error);
    return res.status(500).json({ message: 'Error deleting attendance record' });
  }
};

/**
 * Get attendance report
 */
export const getAttendanceReport = async (req: Request, res: Response) => {
  try {
    const { classId, startDate, endDate } = req.query;
    
    // Validate parameters
    if (!classId) {
      return res.status(400).json({ message: 'Class ID is required' });
    }
    
    // Get report
    const reportData = await attendanceService.generateReport(
      parseInt(classId as string, 10),
      startDate as string,
      endDate as string,
      req.user
    );
    
    return res.status(200).json(reportData);
  } catch (error) {
    logger.error('Get attendance report error:', error);
    return res.status(500).json({ message: 'Error generating attendance report' });
  }
};

export default {
  getAttendanceRecords,
  getAttendanceByClass,
  getAttendanceByStudent,
  markAttendanceManually,
  markAttendanceWithQR,
  markAttendanceWithFace,
  updateAttendance,
  deleteAttendance,
  getAttendanceReport,
  syncOfflineAttendance,
};