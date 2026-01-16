import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config';
import logger from '../config/logger';
import { User } from '../db/models';
import { UserRole } from '../db/models/user.model';

// Extending Express Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        role: UserRole;
      };
    }
  }
}

/**
 * Middleware to authenticate JWT token and set user in request object
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required. No token provided.' });
    }
    
    const token = authHeader.split(' ')[1];
    
    try {
      // Verify token
      const decoded = jwt.verify(token, jwtConfig.secret) as { id: number; email: string; role: UserRole };
      
      // Check if user exists
      const user = await User.findByPk(decoded.id);
      if (!user || !user.active) {
        return res.status(401).json({ message: 'User not found or inactive.' });
      }

      // Set user in request object
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
      };
      
      next();
    } catch (error) {
      logger.error('JWT verification error:', error);
      return res.status(401).json({ message: 'Invalid or expired token.' });
    }
  } catch (error) {
    logger.error('Authentication middleware error:', error);
    return res.status(500).json({ message: 'Internal server error during authentication.' });
  }
};

export default { authenticate };