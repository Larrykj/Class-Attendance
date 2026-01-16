import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../../src/db/models';
import { authenticate } from '../../src/middlewares/auth.middleware';
import { jwtConfig } from '../../src/config';
import { UserRole } from '../../src/db/models/user.model';

// Mock external dependencies
jest.mock('jsonwebtoken');
jest.mock('../../src/db/models', () => ({
  User: {
    findByPk: jest.fn(),
  },
}));

describe('Auth Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  
  beforeEach(() => {
    req = {
      headers: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  it('should call next() when token is valid', async () => {
    // Mock request with auth header
    req.headers = {
      authorization: 'Bearer valid-token',
    };
    
    // Mock JWT verification
    (jwt.verify as jest.Mock).mockReturnValue({
      id: 1,
      email: 'user@example.com',
      role: UserRole.STUDENT,
    });
    
    // Mock user retrieval
    (User.findByPk as jest.Mock).mockResolvedValue({
      id: 1,
      email: 'user@example.com',
      role: UserRole.STUDENT,
      active: true,
    });
    
    await authenticate(req as Request, res as Response, next);
    
    expect(jwt.verify).toHaveBeenCalledWith('valid-token', jwtConfig.secret);
    expect(User.findByPk).toHaveBeenCalledWith(1);
    expect(req.user).toEqual({
      id: 1,
      email: 'user@example.com',
      role: UserRole.STUDENT,
    });
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
  
  it('should return 401 when no token is provided', async () => {
    // Request without auth header
    req.headers = {};
    
    await authenticate(req as Request, res as Response, next);
    
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Authentication required. No token provided.',
    });
    expect(next).not.toHaveBeenCalled();
  });
  
  it('should return 401 when token verification fails', async () => {
    // Mock request with auth header
    req.headers = {
      authorization: 'Bearer invalid-token',
    };
    
    // Mock JWT verification to throw error
    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid token');
    });
    
    await authenticate(req as Request, res as Response, next);
    
    expect(jwt.verify).toHaveBeenCalledWith('invalid-token', jwtConfig.secret);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Invalid or expired token.',
    });
    expect(next).not.toHaveBeenCalled();
  });
  
  it('should return 401 when user does not exist', async () => {
    // Mock request with auth header
    req.headers = {
      authorization: 'Bearer valid-token',
    };
    
    // Mock JWT verification
    (jwt.verify as jest.Mock).mockReturnValue({
      id: 1,
      email: 'user@example.com',
      role: UserRole.STUDENT,
    });
    
    // Mock user retrieval - user not found
    (User.findByPk as jest.Mock).mockResolvedValue(null);
    
    await authenticate(req as Request, res as Response, next);
    
    expect(jwt.verify).toHaveBeenCalledWith('valid-token', jwtConfig.secret);
    expect(User.findByPk).toHaveBeenCalledWith(1);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: 'User not found or inactive.',
    });
    expect(next).not.toHaveBeenCalled();
  });
  
  it('should return 401 when user is inactive', async () => {
    // Mock request with auth header
    req.headers = {
      authorization: 'Bearer valid-token',
    };
    
    // Mock JWT verification
    (jwt.verify as jest.Mock).mockReturnValue({
      id: 1,
      email: 'user@example.com',
      role: UserRole.STUDENT,
    });
    
    // Mock user retrieval - inactive user
    (User.findByPk as jest.Mock).mockResolvedValue({
      id: 1,
      email: 'user@example.com',
      role: UserRole.STUDENT,
      active: false,
    });
    
    await authenticate(req as Request, res as Response, next);
    
    expect(jwt.verify).toHaveBeenCalledWith('valid-token', jwtConfig.secret);
    expect(User.findByPk).toHaveBeenCalledWith(1);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: 'User not found or inactive.',
    });
    expect(next).not.toHaveBeenCalled();
  });
});