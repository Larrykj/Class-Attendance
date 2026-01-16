import { validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to validate request based on express-validator rules
 */
export const validate = (req: Request, res: Response, next: NextFunction): void | Response => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array(),
    });
  }
  next();
};

/**
 * Utility to validate and parse a number from a string
 */
export const parseNumber = (value: string, defaultValue: number = 0): number => {
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

/**
 * Utility to validate and parse a date from a string
 */
export const parseDate = (value: string, defaultValue: Date = new Date()): Date => {
  const date = new Date(value);
  return isNaN(date.getTime()) ? defaultValue : date;
};

export default {
  validate,
  parseNumber,
  parseDate,
};