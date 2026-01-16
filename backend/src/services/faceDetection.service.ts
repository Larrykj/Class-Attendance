import crypto from 'crypto';
import { Op } from 'sequelize';
import axios from 'axios';
import FormData from 'form-data';
import logger from '../config/logger';
import { User, Class } from '../db/models';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
const BIOMETRIC_KEY_ENV = process.env.BIOMETRIC_ENC_KEY;

interface ServiceResult<T> {
  success: boolean;
  message?: string;
  data?: T;
}

interface EncryptedBiometricPayload {
  v: number;
  iv: string;
  data: string;
  tag: string;
}

const getBiometricKey = (): Buffer | null => {
  if (!BIOMETRIC_KEY_ENV) {
    return null;
  }

  try {
    return crypto.createHash('sha256').update(BIOMETRIC_KEY_ENV).digest();
  } catch (error) {
    logger.error('Error deriving biometric encryption key:', error);
    return null;
  }
};

const encryptBiometric = (plain: string): string => {
  const key = getBiometricKey();
  if (!key) {
    return plain;
  }

  try {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    const payload: EncryptedBiometricPayload = {
      v: 1,
      iv: iv.toString('base64'),
      data: encrypted.toString('base64'),
      tag: authTag.toString('base64'),
    };

    const encoded = Buffer.from(JSON.stringify(payload)).toString('base64');
    return `ENC::${encoded}`;
  } catch (error) {
    logger.error('Error encrypting biometric data:', error);
    return plain;
  }
};

const decryptBiometric = (stored: string): string => {
  const key = getBiometricKey();
  if (!key || !stored.startsWith('ENC::')) {
    return stored;
  }

  try {
    const encoded = stored.substring(5);
    const json = Buffer.from(encoded, 'base64').toString('utf8');
    const payload = JSON.parse(json) as EncryptedBiometricPayload;
    const iv = Buffer.from(payload.iv, 'base64');
    const data = Buffer.from(payload.data, 'base64');
    const tag = Buffer.from(payload.tag, 'base64');

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
    return decrypted.toString('utf8');
  } catch (error) {
    logger.error('Error decrypting biometric data:', error);
    return stored;
  }
};

/**
 * Get embedding from ML Service
 */
const getFaceEmbedding = async (base64Image: string): Promise<number[] | null> => {
    try {
        // Strip header if present
        const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, 'base64');
        
        const form = new FormData();
        form.append('file', buffer, { filename: 'face.jpg', contentType: 'image/jpeg' });
        
        const response = await axios.post(`${ML_SERVICE_URL}/embed`, form, {
            headers: {
                ...form.getHeaders()
            }
        });
        
        if (response.data && response.data.success) {
            return response.data.embedding;
        }
        return null;
    } catch (error) {
        logger.error('Error calling ML service /embed:', error);
        return null;
    }
};

/**
 * Register face data for a user
 */
export const registerFaceData = async (userId: number, imageData: string): Promise<ServiceResult<void>> => {
  try {
    const user = await User.findByPk(userId);
    if (!user) {
        return { success: false, message: 'User not found' };
    }
    
    // Call ML service to get embedding
    const embedding = await getFaceEmbedding(imageData);
    if (!embedding) {
        return { success: false, message: 'Could not detect face in the provided image' };
    }
    
    // Encrypt and store the JSON string of the embedding
    const storedFaceData = encryptBiometric(JSON.stringify(embedding));
    await user.update({ faceData: storedFaceData });
    
    logger.info(`Face embedding registered for user ${user.firstName} ${user.lastName} (ID: ${userId})`);
    
    return {
      success: true
    };
  } catch (error) {
    logger.error('Error registering face data:', error);
    return {
      success: false,
      message: 'Failed to register face data'
    };
  }
};

/**
 * Verify a face against registered users in a class
 */
export const verifyFace = async (imageData: string, classId: number): Promise<ServiceResult<{ studentId: number }>> => {
  try {
    // Check if class exists
    const classData = await Class.findByPk(classId);
    if (!classData) {
      return { success: false, message: 'Class not found' };
    }
    
    // 1. Get candidate embedding
    const candidateEmbedding = await getFaceEmbedding(imageData);
    if (!candidateEmbedding) {
         return { success: false, message: 'No face detected in the captured image' };
    }
    
    // 2. Get students and their embeddings
    const classStudents = await (classData as any).getStudents({
      attributes: ['id', 'firstName', 'lastName', 'faceData'],
      where: {
        faceData: {
          [Op.not]: null
        }
      }
    });
    
    if (classStudents.length === 0) {
      return { success: false, message: 'No students with registered face data in this class' };
    }

    const references = classStudents.map((s: any) => {
        try {
            const jsonStr = decryptBiometric(s.faceData);
            const embedding = JSON.parse(jsonStr);
            return { id: s.id, embedding };
        } catch (e) {
            return null;
        }
    }).filter((r: any) => r !== null);
    
    if (references.length === 0) {
        return { success: false, message: 'Failed to process student face data' };
    }

    // 3. Call ML Service to verify
    const verifyPayload = {
        candidate_embedding: candidateEmbedding,
        reference_embeddings: references
    };
    
    const response = await axios.post(`${ML_SERVICE_URL}/verify`, verifyPayload);

    if (response.data && response.data.match) {
        const studentId = response.data.student_id || response.data.studentId;
        const matchedStudent = classStudents.find((s: any) => s.id === studentId);
        
        if (matchedStudent) {
             logger.info(`Face verified as student ${matchedStudent.firstName} ${matchedStudent.lastName} (ID: ${studentId})`);
             return {
                success: true,
                data: {
                    studentId: studentId
                }
             };
        }
    }
    
    return {
      success: false,
      message: 'Face does not match any student in this class'
    };
  } catch (error) {
    logger.error('Error verifying face:', error);
    return {
      success: false,
      message: 'Failed to verify face'
    };
  }
};

export default {
  registerFaceData,
  verifyFace
};