import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { authService } from '../services';
import logger from '../config/logger';
import { UserRole } from '../db/models/user.model';
import { User } from '../db/models';

/**
 * Login controller
 */
export const login = async (req: Request, res: Response) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Authenticate user
    const result = await authService.authenticate(email, password);

    if (result.success) {
      logger.info(`User logged in: ${email}`);
      return res.status(200).json(result.data);
    } else {
      return res.status(401).json({ message: result.message });
    }
  } catch (error) {
    logger.error('Login controller error:', error);
    return res.status(500).json({ message: 'Internal server error during login.' });
  }
};

/**
 * Get current user profile
 */
export const getProfile = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'faceData', 'active', 'createdAt']
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      hasFaceData: !!user.faceData,
      active: user.active,
      createdAt: user.createdAt,
    });
  } catch (error) {
    logger.error('Get profile error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * User registration controller
 */
export const register = async (req: Request, res: Response) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, email, password, role } = req.body;

    // Create user
    const result = await authService.registerUser({
      firstName,
      lastName,
      email,
      password,
      role: role as UserRole,
      active: true,
    });

    if (!result.success || !result.data) {
      return res.status(400).json({ message: result.message || 'Failed to register user' });
    }

    logger.info(`User registered: ${email} with role ${role}`);
    return res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: result.data.id,
        firstName: result.data.firstName,
        lastName: result.data.lastName,
        email: result.data.email,
        role: result.data.role,
      }
    });
  } catch (error) {
    logger.error('Registration controller error:', error);
    return res.status(500).json({ message: 'Internal server error during registration.' });
  }
};

export default {
  login,
  register,
  getProfile,
};