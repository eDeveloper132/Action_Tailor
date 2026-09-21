import type { Request, Response, NextFunction } from 'express';
import chalk from 'chalk';
import type { ErrorResponse } from '../types/index.ts';

/**
 * 404 Not Found Middleware
 */
export const notFoundHandler = (req: Request, res: Response<ErrorResponse | any>): void => {
  if (req.accepts('html') && !req.path.startsWith('/api')) {
    res.status(404).send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>404 - Not Found / صفحہ دستیاب نہیں - Action Tailor</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; color: #0f172a; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 1rem; }
    .card { background: white; border: 1px solid #e2e8f0; border-radius: 1.25rem; padding: 2.5rem; max-width: 480px; text-align: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .badge { display: inline-flex; align-items: center; justify-content: center; width: 4.5rem; height: 4.5rem; border-radius: 1rem; background: #ecfdf5; border: 1px solid #a7f3d0; font-size: 2rem; margin-bottom: 1rem; }
    .code { font-size: 2.5rem; font-weight: 800; color: #059669; line-height: 1; margin: 0.25rem 0; }
    h1 { font-size: 1.2rem; font-weight: 700; margin: 0.5rem 0 0.25rem; color: #0f172a; }
    p { font-size: 0.85rem; color: #64748b; line-height: 1.5; margin: 0.5rem 0 1.5rem; }
    a { display: inline-block; background: #059669; color: white; text-decoration: none; font-weight: 600; font-size: 0.85rem; padding: 0.65rem 1.25rem; border-radius: 0.625rem; }
    a:hover { background: #047857; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">✂️</div>
    <div class="code">404</div>
    <h1>Page Not Found / صفحہ دستیاب نہیں</h1>
    <p>The requested resource or endpoint was not found on this server.<br>مطلوبہ اینڈ پوائنٹ یا صفحہ اس سرور پر دستیاب نہیں ہے۔</p>
    <a href="/">Return to Home / ہوم پیج پر جائیں</a>
  </div>
</body>
</html>`);
    return;
  }

  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource or endpoint was not found / مطلوبہ ریسورس یا اینڈ پوائنٹ نہیں ملا۔',
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

