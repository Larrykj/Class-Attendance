import { authService } from '../../src/services';
import { User } from '../../src/db/models';
import jwt from 'jsonwebtoken';
import { jwtConfig } from '../../src/config';
import { UserRole } from '../../src/db/models/user.model';

// Mock external dependencies
jest.mock('jsonwebtoken');
jest.mock('../../src/db/models', () => ({
  User: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
}));

describe('Auth Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('authenticate', () => {
    it('should authenticate user with valid credentials', async () => {
      // Mock user object with password validation method
      const mockUser = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'user@example.com',
        role: UserRole.STUDENT,
        active: true,
        validatePassword: jest.fn().mockResolvedValue(true),
      };
      
      // Mock user retrieval
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      
      // Mock JWT token generation
      (jwt.sign as jest.Mock).mockReturnValue('mock-token');
      
      const result = await authService.authenticate('user@example.com', 'password123');
      
      expect(User.findOne).toHaveBeenCalledWith({ where: { email: 'user@example.com' } });
      expect(mockUser.validatePassword).toHaveBeenCalledWith('password123');
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: 1, email: 'user@example.com', role: UserRole.STUDENT },
        jwtConfig.secret,
        { expiresIn: jwtConfig.expiresIn }
      );
      
      expect(result).toEqual({
        success: true,
        data: {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'user@example.com',
          role: UserRole.STUDENT,
          token: 'mock-token',
        },
      });
    });
    
    it('should return failure when user is not found', async () => {
      // Mock user retrieval - user not found
      (User.findOne as jest.Mock).mockResolvedValue(null);
      
      const result = await authService.authenticate('nonexistent@example.com', 'password123');
      
      expect(User.findOne).toHaveBeenCalledWith({ where: { email: 'nonexistent@example.com' } });
      expect(result).toEqual({
        success: false,
        message: 'Invalid email or password.',
      });
    });
    
    it('should return failure when password is invalid', async () => {
      // Mock user object with password validation method
      const mockUser = {
        id: 1,
        email: 'user@example.com',
        role: UserRole.STUDENT,
        active: true,
        validatePassword: jest.fn().mockResolvedValue(false),
      };
      
      // Mock user retrieval
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      
      const result = await authService.authenticate('user@example.com', 'wrong-password');
      
      expect(User.findOne).toHaveBeenCalledWith({ where: { email: 'user@example.com' } });
      expect(mockUser.validatePassword).toHaveBeenCalledWith('wrong-password');
      expect(result).toEqual({
        success: false,
        message: 'Invalid email or password.',
      });
    });
    
    it('should return failure when user is inactive', async () => {
      // Mock user object with inactive status
      const mockUser = {
        id: 1,
        email: 'user@example.com',
        role: UserRole.STUDENT,
        active: false,
        validatePassword: jest.fn(),
      };
      
      // Mock user retrieval
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      
      const result = await authService.authenticate('user@example.com', 'password123');
      
      expect(User.findOne).toHaveBeenCalledWith({ where: { email: 'user@example.com' } });
      expect(mockUser.validatePassword).not.toHaveBeenCalled(); // Password validation shouldn't be called for inactive users
      expect(result).toEqual({
        success: false,
        message: 'Invalid email or password.',
      });
    });
  });
  
  describe('registerUser', () => {
    it('should register a new user successfully', async () => {
      // Mock user retrieval - no existing user
      (User.findOne as jest.Mock).mockResolvedValue(null);
      
      // Mock user creation
      const newUser = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'newuser@example.com',
        role: UserRole.STUDENT,
      };
      (User.create as jest.Mock).mockResolvedValue(newUser);
      
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'newuser@example.com',
        password: 'password123',
        role: UserRole.STUDENT,
        active: true,
      };
      
      const result = await authService.registerUser(userData);
      
      expect(User.findOne).toHaveBeenCalledWith({ where: { email: 'newuser@example.com' } });
      expect(User.create).toHaveBeenCalledWith(userData);
      expect(result).toEqual({
        success: true,
        data: newUser,
      });
    });
    
    it('should return failure when email is already in use', async () => {
      // Mock user retrieval - existing user
      (User.findOne as jest.Mock).mockResolvedValue({
        id: 1,
        email: 'existing@example.com',
      });
      
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'existing@example.com',
        password: 'password123',
        role: UserRole.STUDENT,
        active: true,
      };
      
      const result = await authService.registerUser(userData);
      
      expect(User.findOne).toHaveBeenCalledWith({ where: { email: 'existing@example.com' } });
      expect(User.create).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: 'Email is already in use.',
      });
    });
  });
  
  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      // Mock JWT verification
      (jwt.verify as jest.Mock).mockReturnValue({
        id: 1,
        email: 'user@example.com',
        role: UserRole.STUDENT,
      });
      
      const result = authService.verifyToken('valid-token');
      
      expect(jwt.verify).toHaveBeenCalledWith('valid-token', jwtConfig.secret);
      expect(result).toEqual({
        success: true,
        data: {
          id: 1,
          email: 'user@example.com',
          role: UserRole.STUDENT,
        },
      });
    });
    
    it('should return failure for an invalid token', () => {
      // Mock JWT verification to throw error
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });
      
      const result = authService.verifyToken('invalid-token');
      
      expect(jwt.verify).toHaveBeenCalledWith('invalid-token', jwtConfig.secret);
      expect(result).toEqual({
        success: false,
        message: 'Invalid or expired token.',
      });
    });
  });
});