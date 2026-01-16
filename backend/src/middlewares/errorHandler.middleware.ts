import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';

// Custom error class
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Global error handler middleware
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Default values for error response
  const statusCode = (err as AppError).statusCode || 500;
  const message = err.message || 'Something went wrong';
  const isOperational = (err as AppError).isOperational !== undefined 
    ? (err as AppError).isOperational 
    : false;

  // Log error based on type
  if (isOperational) {
    logger.warn(`Operational error: ${message}`);
  } else {
    logger.error(`Unexpected error: ${err.stack || err}`);
  }

  // Send error response
  res.status(statusCode).json({
    status: 'error',
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

// Not found error middleware
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new AppError(`Not Found - ${req.originalUrl}`, 404, true);
  next(error);
};

export default { errorHandler, notFoundHandler, AppError };