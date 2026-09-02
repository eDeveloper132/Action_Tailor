import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.ts';
import type { JwtUserPayload } from '../types/index.ts';

// Extend Express Request interface locally
export interface AuthRequest extends Request {
  user?: JwtUserPayload;
}

/**
 * Authentication Middleware
 * Validates JWT from Authorization header, HTTP-only cookies, or query string.
 * Supports both HTML views (redirect to /signin) and API endpoints (401 JSON).
 */
export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  let token: string | undefined;

  // 1. Check Authorization Bearer header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  // 2. Check cookies if available
  if (!token && (req as any).cookies) {
    token = (req as any).cookies.token || (req as any).cookies.jwt;
  }

  // 3. Check query string (optional fallback)
  if (!token && typeof req.query.token === 'string') {
    token = req.query.token;
  }

  if (!token) {
    handleUnauthenticated(req, res);
    return;
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    handleUnauthenticated(req, res, 'Invalid or expired authentication token');
    return;
  }

  // Attach decoded user to request
  req.user = decoded;
  next();
};

/**
 * Helper to handle unauthenticated response based on client Accept header
 */
const handleUnauthenticated = (req: Request, res: Response, message = 'Authentication required'): void => {
  // Only HTML view routes (not /api/*) should redirect to signin
  const isApiRoute = (req.originalUrl || req.url).startsWith('/api');

  if (!isApiRoute && req.accepts('html') && !req.headers['x-requested-with'] && req.method === 'GET') {
    const redirectUrl = req.originalUrl ? `?redirect=${encodeURIComponent(req.originalUrl)}` : '';
    res.redirect(`/signin${redirectUrl}`);
    return;
  }

  // API response
  res.status(401).json({
    status: 'error',
    error: 'Unauthorized',
    message,
  });
};

/**
 * Optional Authentication Middleware
 * Attaches user to request if valid token exists, but doesn't block unauthenticated requests.
 */
export const optionalAuth = (req: AuthRequest, _res: Response, next: NextFunction): void => {
  let token: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if ((req as any).cookies) {
    token = (req as any).cookies.token || (req as any).cookies.jwt;
  }

  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      req.user = decoded;
    }
  }

  next();
};
