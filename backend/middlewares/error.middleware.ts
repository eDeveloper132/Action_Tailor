import type { Request, Response, NextFunction } from 'express';
import chalk from 'chalk';
import type { ErrorResponse } from '../types/index.ts';

/**
 * 404 Not Found Middleware
 */
export const notFoundHandler = (_req: Request, res: Response<ErrorResponse>): void => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource or endpoint was not found.',
  });
};

/**
 * Global Centralized Error Handler Middleware
 */
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response<ErrorResponse>,
  _next: NextFunction
): void => {
  console.error(chalk.red('[Server Error]'), err);

  if (err.name === 'CastError') {
    res.status(400).json({
      error: 'CastError',
      message: 'Invalid ID format provided / غلط آئی ڈی فارمیٹ',
    });
    return;
  }

  if (err.name === 'ValidationError') {
    res.status(400).json({
      error: 'ValidationError',
      message: err.message,
    });
    return;
  }

  const statusCode = (err as any).statusCode || (err as any).status || 500;

  res.status(statusCode).json({
    error: err.name || 'Internal Server Error',
    message: err.message || 'An unexpected error occurred.',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

