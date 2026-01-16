import { Request, Response } from 'express';
import { authController } from '../../src/controllers';
import { authService } from '../../src/services';
import { mockRequest, mockResponse } from 'jest-mock-req-res';
import { validationResult } from 'express-validator';

// Mock external services and dependencies
jest.mock('../../src/services', () => ({
  authService: {
    authenticate: jest.fn(),
    registerUser: jest.fn(),
  },
}));

jest.mock('express-validator', () => ({
  validationResult: jest.fn(),
}));

describe('Auth Controller', () => {
  let req: Request;
  let res: Response;
  
  beforeEach(() => {
    req = mockRequest();
    res = mockResponse();
    (validationResult as jest.Mock).mockReturnValue({
      isEmpty: () => true,
      array: () => [],
    });
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('login', () => {
    it('should return 200 and user data when login is successful', async () => {
      // Mock request body
      req.body = {
        email: 'user@example.com',
        password: 'password123',
      };
      
      // Mock authentication service response
      (authService.authenticate as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'user@example.com',
          role: 'student',
          token: 'test-token',
        },
      });
      
      await authController.login(req, res);
      
      expect(authService.authenticate).toHaveBeenCalledWith('user@example.com', 'password123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'user@example.com',
        role: 'student',
        token: 'test-token',
      });
    });
    
    it('should return 401 when authentication fails', async () => {
      // Mock request body
      req.body = {
        email: 'user@example.com',
        password: 'wrong-password',
      };
      
      // Mock authentication service response
      (authService.authenticate as jest.Mock).mockResolvedValueOnce({
        success: false,
        message: 'Invalid email or password.',
      });
      
      await authController.login(req, res);
      
      expect(authService.authenticate).toHaveBeenCalledWith('user@example.com', 'wrong-password');
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid email or password.' });
    });
    
    it('should return 400 when validation fails', async () => {
      // Mock validation errors
      (validationResult as jest.Mock).mockReturnValueOnce({
        isEmpty: () => false,
        array: () => [{ msg: 'Email is required' }],
      });
      
      await authController.login(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ errors: [{ msg: 'Email is required' }] });
    });
  });
  
  describe('register', () => {
    it('should return 201 when registration is successful', async () => {
      // Mock request body
      req.body = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'newuser@example.com',
        password: 'password123',
        role: 'student',
      };
      
      // Mock registration service response
      (authService.registerUser as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: {
          id: 2,
          firstName: 'John',
          lastName: 'Doe',
          email: 'newuser@example.com',
          role: 'student',
        },
      });
      
      await authController.register(req, res);
      
      expect(authService.registerUser).toHaveBeenCalledWith({
        firstName: 'John',
        lastName: 'Doe',
        email: 'newuser@example.com',
        password: 'password123',
        role: 'student',
        active: true,
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'User registered successfully',
        user: {
          id: 2,
          firstName: 'John',
          lastName: 'Doe',
          email: 'newuser@example.com',
          role: 'student',
        }
      });
    });
    
    it('should return 400 when registration fails', async () => {
      // Mock request body
      req.body = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'existing@example.com',
        password: 'password123',
        role: 'student',
      };
      
      // Mock registration service response
      (authService.registerUser as jest.Mock).mockResolvedValueOnce({
        success: false,
        message: 'Email is already in use.',
      });
      
      await authController.register(req, res);
      
      expect(authService.registerUser).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Email is already in use.' });
    });
  });
});