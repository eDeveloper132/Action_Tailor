import type { Request, Response, NextFunction } from 'express';
import chalk from 'chalk';

/**
 * Request Logger Middleware
 */
export const requestLogger = (req: Request, _res: Response, next: NextFunction): void => {
  const timestamp = new Date().toISOString();
  console.log(chalk.gray(`[${timestamp}]`) + ` ${chalk.cyan(req.method)} ${chalk.white(req.originalUrl || req.url)}`);
  next();
};

