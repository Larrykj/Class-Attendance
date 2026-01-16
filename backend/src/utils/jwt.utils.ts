import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config';
import { JwtPayload } from '../types/auth.types';
import logger from '../config/logger';

export const generateToken = (payload: { id: number; email: string; role: string }): string => {
  return jwt.sign(payload, jwtConfig.secret, {
    expiresIn: jwtConfig.expiresIn as string,
  });
};

/**
 * Verify and decode a JWT token
 */
export const verifyToken = (token: string): JwtPayload | null => {
  try {
    const decoded = jwt.verify(token, jwtConfig.secret) as JwtPayload;
    return decoded;
  } catch (error) {
    logger.error('JWT verification error:', error);
    return null;
  }
};

export default {
  generateToken,
  verifyToken,
};