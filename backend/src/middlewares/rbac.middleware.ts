import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../db/models/user.model';
import logger from '../config/logger';

/**
 * Middleware to check if user has the required role
 * @param roles - Roles allowed to access the route
 */
export const checkRole = (roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if user exists in the request (set by authenticate middleware)
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required.' });
      }

      // Check if user has one of the required roles
      if (!roles.includes(req.user.role)) {
        logger.warn(`Access denied for user ${req.user.email} with role ${req.user.role} (required: ${roles.join(',')})`);
        return res.status(403).json({ 
          message: 'Access denied. Insufficient permissions.',
          required: roles,
          current: req.user.role
        });
      }

      // User has the required role, proceed to the next middleware/controller
      next();
    } catch (error) {
      logger.error('RBAC middleware error:', error);
      return res.status(500).json({ message: 'Internal server error during role verification.' });
    }
  };
};

export default { checkRole };