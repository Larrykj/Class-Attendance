import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { User } from '../db/models';
import { UserRole } from '../db/models/user.model';
import logger from '../config/logger';
import { faceDetectionService } from '../services';

/**
 * Get all users - admin only
 */
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    // Get query parameters for filtering
    const { role } = req.query;
    
    // Build filter options
    const filter: any = {};
    if (role) {
      filter.where = { role };
    }
    
    // Fetch users
    const users = await User.findAll({
      ...filter,
      attributes: { exclude: ['password', 'faceData'] },
    });
    
    return res.status(200).json(users);
  } catch (error) {
    logger.error('Get all users error:', error);
    return res.status(500).json({ message: 'Error fetching users' });
  }
};

/**
 * Get user by ID - admin or self
 */
export const getUserById = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id, 10);
    
    // Authorization check: only admin or the user themselves can access user data
    if (req.user?.role !== UserRole.ADMIN && req.user?.id !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Find user
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password', 'faceData'] },
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    return res.status(200).json(user);
  } catch (error) {
    logger.error('Get user by ID error:', error);
    return res.status(500).json({ message: 'Error fetching user' });
  }
};

export const getMyChildren = async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== UserRole.PARENT) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const parent = (await User.findByPk(req.user.id, {
      include: [
        {
          model: User,
          as: 'children',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
    })) as any;

    if (!parent) {
      return res.status(404).json({ message: 'User not found' });
    }

    const children = (parent.children || []).map((child: any) => ({
      id: child.id,
      firstName: child.firstName,
      lastName: child.lastName,
      email: child.email,
    }));

    return res.status(200).json(children);
  } catch (error) {
    logger.error('Get my children error:', error);
    return res.status(500).json({ message: 'Error fetching children' });
  }
};

/**
 * Update user - admin or self
 */
export const updateUser = async (req: Request, res: Response) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const userId = parseInt(req.params.id, 10);
    
    // Authorization check: only admin or the user themselves can update user data
    if (req.user?.role !== UserRole.ADMIN && req.user?.id !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Find user
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Role can only be updated by admin
    if (req.body.role && req.user?.role !== UserRole.ADMIN) {
      return res.status(403).json({ message: 'Only administrators can update user roles' });
    }
    
    // Update user
    await user.update(req.body);
    
    // Return updated user without sensitive data
    const updatedUser = await User.findByPk(userId, {
      attributes: { exclude: ['password', 'faceData'] },
    });
    
    return res.status(200).json({
      message: 'User updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    logger.error('Update user error:', error);
    return res.status(500).json({ message: 'Error updating user' });
  }
};

/**
 * Delete user - admin only
 */
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id, 10);
    
    // Find user
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Delete user (soft delete by setting active to false)
    await user.update({ active: false });
    
    return res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    logger.error('Delete user error:', error);
    return res.status(500).json({ message: 'Error deleting user' });
  }
};

/**
 * Register face data for user
 */
export const registerFaceData = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const { imageData } = req.body;
    
    // Authorization check: only admin or the user themselves can register face data
    if (req.user?.role !== UserRole.ADMIN && req.user?.id !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Find user
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Process and store face data
    const result = await faceDetectionService.registerFaceData(userId, imageData);
    
    if (!result.success) {
      return res.status(400).json({ message: result.message });
    }
    
    return res.status(200).json({ message: 'Face data registered successfully' });
  } catch (error) {
    logger.error('Register face data error:', error);
    return res.status(500).json({ message: 'Error registering face data' });
  }
};

export default {
  getAllUsers,
  getUserById,
  getMyChildren,
  updateUser,
  deleteUser,
  registerFaceData,
};