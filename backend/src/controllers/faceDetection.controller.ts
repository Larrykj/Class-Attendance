import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { faceDetectionService } from '../services';
import { User } from '../db/models';
import { UserRole } from '../db/models/user.model';
import logger from '../config/logger';

/**
 * Register face data for a user
 */
export const registerFace = async (req: Request, res: Response) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { userId, imageData } = req.body;
    
    // Authorization check: only admin or the user themselves can register face data
    if (req.user?.role !== UserRole.ADMIN && req.user?.id !== userId) {
      return res.status(403).json({ message: 'Access denied. You can only register face data for yourself.' });
    }
    
    // Check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Register face data
    const result = await faceDetectionService.registerFaceData(userId, imageData);
    
    if (!result.success) {
      return res.status(400).json({ message: result.message });
    }
    
    logger.info(`Face data registered for user ID ${userId}`);
    
    return res.status(200).json({ 
      message: 'Face data registered successfully'
    });
  } catch (error) {
    logger.error('Register face error:', error);
    return res.status(500).json({ message: 'Error registering face data' });
  }
};

/**
 * Verify face for attendance
 */
export const verifyFace = async (req: Request, res: Response) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { classId, imageData } = req.body;
    
    // Verify face
    const result = await faceDetectionService.verifyFace(imageData, parseInt(classId, 10));
    
    if (!result.success) {
      return res.status(400).json({ message: result.message });
    }
    
    logger.info(`Face verified for student ID ${result.data.studentId} in class ID ${classId}`);
    
    return res.status(200).json({
      message: 'Face verification successful',
      data: result.data
    });
  } catch (error) {
    logger.error('Verify face error:', error);
    return res.status(500).json({ message: 'Error verifying face' });
  }
};

export default {
  registerFace,
  verifyFace,
};