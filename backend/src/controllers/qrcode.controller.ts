import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { qrcodeService } from '../services';
import { Class } from '../db/models';
import { UserRole } from '../db/models/user.model';
import logger from '../config/logger';

/**
 * Generate QR code for a class
 */
export const generateQRCode = async (req: Request, res: Response) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const classId = parseInt(req.params.classId, 10);
    const expiration = req.query.expiration ? parseInt(req.query.expiration as string, 10) : 60; // Default 60 minutes
    
    // Check if class exists
    const classData = await Class.findByPk(classId);
    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }
    
    // Teachers can only generate QR codes for their own classes
    if (req.user?.role === UserRole.TEACHER && classData.teacherId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. You can only generate QR codes for your own classes.' });
    }
    
    // Generate QR code
    const qrCodeResult = await qrcodeService.generateQRCode(classId, expiration);
    
    if (!qrCodeResult.success) {
      return res.status(500).json({ message: qrCodeResult.message });
    }
    
    logger.info(`QR code generated for class ID ${classId} with expiration ${expiration} minutes`);
    
    return res.status(200).json(qrCodeResult.data);
  } catch (error) {
    logger.error('Generate QR code error:', error);
    return res.status(500).json({ message: 'Error generating QR code' });
  }
};

/**
 * Validate QR code
 */
export const validateQRCode = async (req: Request, res: Response) => {
  try {
    const { qrCodeData } = req.body;
    
    if (!qrCodeData) {
      return res.status(400).json({ message: 'QR code data is required' });
    }
    
    // Validate QR code
    const validationResult = await qrcodeService.validateQRCode(qrCodeData);
    
    if (!validationResult.success) {
      return res.status(400).json({ message: validationResult.message });
    }
    
    return res.status(200).json(validationResult.data);
  } catch (error) {
    logger.error('Validate QR code error:', error);
    return res.status(500).json({ message: 'Error validating QR code' });
  }
};

export default {
  generateQRCode,
  validateQRCode,
};