import { Class, User } from '../db/models';
import { UserRole } from '../db/models/user.model';
import logger from '../config/logger';
import { Op } from 'sequelize';

/**
 * Service result interface
 */
interface ServiceResult<T> {
  success: boolean;
  message?: string;
  data?: T;
}

/**
 * Get classes for a specific user
 */
export const getClassesForUser = async (userId: number): Promise<ServiceResult<Class[]>> => {
  try {
    // Get user
    const user = await User.findByPk(userId);
    if (!user) {
      return {
        success: false,
        message: 'User not found'
      };
    }
    
    let classes: Class[] = [];
    
    // Get classes based on user role
    if (user.role === UserRole.ADMIN) {
      // Admins can see all classes
      classes = await Class.findAll({
        include: [{
          model: User,
          as: 'teacher',
          attributes: ['id', 'firstName', 'lastName']
        }]
      });
    } else if (user.role === UserRole.TEACHER) {
      // Teachers can see classes they teach
      classes = await Class.findAll({
        where: { teacherId: userId },
        include: [{
          model: User,
          as: 'teacher',
          attributes: ['id', 'firstName', 'lastName']
        }]
      });
    } else {
      // Students can see classes they are enrolled in
      const student = await User.findByPk(userId, {
        include: [{
          model: Class,
          as: 'enrolledClasses',
          include: [{
            model: User,
            as: 'teacher',
            attributes: ['id', 'firstName', 'lastName']
          }]
        }]
      });
      
      classes = (student as any).enrolledClasses || [];
    }
    
    return {
      success: true,
      data: classes
    };
  } catch (error) {
    logger.error('Error getting classes for user:', error);
    return {
      success: false,
      message: 'Failed to get classes'
    };
  }
};

/**
 * Get active classes
 */
export const getActiveClasses = async (): Promise<ServiceResult<Class[]>> => {
  try {
    const classes = await Class.findAll({
      where: { active: true },
      include: [{
        model: User,
        as: 'teacher',
        attributes: ['id', 'firstName', 'lastName']
      }]
    });
    
    return {
      success: true,
      data: classes
    };
  } catch (error) {
    logger.error('Error getting active classes:', error);
    return {
      success: false,
      message: 'Failed to get active classes'
    };
  }
};

export default {
  getClassesForUser,
  getActiveClasses,
};