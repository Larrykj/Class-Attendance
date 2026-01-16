import QRCode from 'qrcode';
import { Class } from '../db/models';
import logger from '../config/logger';
import crypto from 'crypto';

// In-memory store for generated QR codes (in production, use Redis or similar)
interface QRCodeEntry {
  classId: number;
  expires: Date;
  token: string;
}

const qrCodeStore: QRCodeEntry[] = [];

/**
 * Service result interface
 */
interface ServiceResult<T> {
  success: boolean;
  message?: string;
  data?: T;
}

/**
 * Clean up expired QR codes
 */
const cleanupExpiredCodes = () => {
  const now = new Date();
  const initialLength = qrCodeStore.length;
  
  // Filter out expired entries
  const validCodes = qrCodeStore.filter(entry => entry.expires > now);
  
  // If any entries were removed, update the store
  if (validCodes.length < initialLength) {
    qrCodeStore.length = 0;
    qrCodeStore.push(...validCodes);
    logger.info(`Cleaned up ${initialLength - validCodes.length} expired QR codes`);
  }
};

// Run cleanup every minute
setInterval(cleanupExpiredCodes, 60000);

/**
 * Generate a QR code for class attendance
 */
export const generateQRCode = async (classId: number, expirationMinutes: number = 60): Promise<ServiceResult<any>> => {
  try {
    // Check if class exists
    const classData = await Class.findByPk(classId);
    if (!classData) {
      return {
        success: false,
        message: 'Class not found'
      };
    }
    
    // Calculate expiration time
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + expirationMinutes);
    
    // Generate a unique token for the QR code
    const token = crypto.randomBytes(20).toString('hex');
    
    // Create QR code data
    const qrCodeData = JSON.stringify({
      type: 'attendance',
      classId,
      className: classData.name,
      classCode: classData.code,
      token,
      generated: new Date().toISOString(),
      expires: expires.toISOString()
    });
    
    // Generate QR code as base64
    const qrCodeImage = await QRCode.toDataURL(qrCodeData);
    
    // Store QR code information for validation
    // Remove any existing codes for this class
    const existingIndex = qrCodeStore.findIndex(entry => entry.classId === classId);
    if (existingIndex >= 0) {
      qrCodeStore.splice(existingIndex, 1);
    }
    
    // Add new code
    qrCodeStore.push({
      classId,
      expires,
      token
    });
    
    logger.info(`Generated QR code for class ${classData.name} (ID: ${classId}), expires in ${expirationMinutes} minutes`);
    
    return {
      success: true,
      data: {
        qrCode: qrCodeImage,
        classId,
        className: classData.name,
        expiresAt: expires.toISOString(),
        expiresIn: `${expirationMinutes} minutes`
      }
    };
  } catch (error) {
    logger.error('QR code generation error:', error);
    return {
      success: false,
      message: 'Failed to generate QR code'
    };
  }
};

/**
 * Validate a QR code for attendance
 */
export const validateQRCode = async (qrCodeData: string): Promise<ServiceResult<any>> => {
  try {
    let decodedData;
    
    // Parse QR code data
    try {
      decodedData = JSON.parse(qrCodeData);
    } catch (error) {
      return {
        success: false,
        message: 'Invalid QR code format'
      };
    }
    
    // Validate QR code structure
    if (decodedData.type !== 'attendance' || !decodedData.classId || !decodedData.token) {
      return {
        success: false,
        message: 'Invalid QR code format'
      };
    }
    
    // Check if QR code exists in store
    const qrEntry = qrCodeStore.find(
      entry => entry.classId === decodedData.classId && entry.token === decodedData.token
    );
    
    if (!qrEntry) {
      return {
        success: false,
        message: 'QR code not found or has been revoked'
      };
    }
    
    // Check if QR code has expired
    if (new Date() > qrEntry.expires) {
      return {
        success: false,
        message: 'QR code has expired'
      };
    }
    
    // Check if class exists and is active
    const classData = await Class.findByPk(decodedData.classId);
    if (!classData || !classData.active) {
      return {
        success: false,
        message: 'Class not found or inactive'
      };
    }
    
    // QR code is valid
    return {
      success: true,
      data: {
        classId: decodedData.classId,
        className: classData.name,
        classCode: classData.code
      }
    };
  } catch (error) {
    logger.error('QR code validation error:', error);
    return {
      success: false,
      message: 'Failed to validate QR code'
    };
  }
};

export default {
  generateQRCode,
  validateQRCode
};