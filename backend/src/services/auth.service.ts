import { User } from '../db/models';
import { UserCreationAttributes, UserRole } from '../db/models/user.model';
import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config';
import logger from '../config/logger';

/**
 * Service result interface
 */
interface ServiceResult<T> {
  success: boolean;
  message?: string;
  data?: T;
}

/**
 * Authenticate a user with email and password
 */
export const authenticate = async (email: string, password: string): Promise<ServiceResult<any>> => {
  try {
    // Find user by email
    const user = await User.findOne({ where: { email } });
    
    // Check if user exists and is active
    if (!user || !user.active) {
      return {
        success: false,
        message: 'Invalid email or password.'
      };
    }
    
    // Validate password
    const isPasswordValid = await user.validatePassword(password);
    if (!isPasswordValid) {
      return {
        success: false,
        message: 'Invalid email or password.'
      };
    }
    
    // Generate JWT token
    const expiresInSeconds = jwtConfig.expiresIn === '1d' ? 86400 : 86400; // Default to 1 day
    // @ts-ignore
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      jwtConfig.secret as string,
      { expiresIn: expiresInSeconds }
    );
    
    return {
      success: true,
      data: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        token
      }
    };
  } catch (error) {
    logger.error('Authentication error:', error);
    return {
      success: false,
      message: 'An error occurred during authentication.'
    };
  }
};

/**
 * Register a new user
 */
export const registerUser = async (userData: UserCreationAttributes): Promise<ServiceResult<User>> => {
  try {
    // Check if email is already in use
    const existingUser = await User.findOne({ where: { email: userData.email } });
    if (existingUser) {
      return {
        success: false,
        message: 'Email is already in use.'
      };
    }
    
    // Create new user
    const newUser = await User.create(userData);
    
    return {
      success: true,
      data: newUser
    };
  } catch (error) {
    logger.error('User registration error:', error);
    return {
      success: false,
      message: 'An error occurred during user registration.'
    };
  }
};

/**
 * Verify JWT token
 */
export const verifyToken = (token: string): ServiceResult<any> => {
  try {
    // Verify token
    const decoded = jwt.verify(token, jwtConfig.secret);
    
    return {
      success: true,
      data: decoded
    };
  } catch (error) {
    logger.error('Token verification error:', error);
    return {
      success: false,
      message: 'Invalid or expired token.'
    };
  }
};

export default {
  authenticate,
  registerUser,
  verifyToken
};