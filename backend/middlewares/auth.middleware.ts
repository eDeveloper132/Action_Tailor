import type { Request, Response, NextFunction } from 'express';
import { verifyToken, AUTH_COOKIE_NAME } from '../utils/jwt.ts';
import type { JwtUserPayload } from '../types/index.ts';

import mongoose from 'mongoose';
import { User } from '../models/index.ts';

// Extend Express Request interface locally
export interface AuthRequest extends Request {
  user?: JwtUserPayload;
}

/**
 * Authentication Middleware
 * Validates JWT from secure HTTP-only cookies, or fallback Authorization Bearer header.
 * Prohibits tokens in query strings.
 */
export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  // Prohibit query-string token authentication
  if (req.query && (req.query as any).token) {
    res.status(400).json({
      status: 'error',
      message: 'Token in query string is prohibited for security / یو آر ایل میں ٹوکن بھیجنا منع ہے',
    });
    return;
  }

  let token: string | undefined;

  // 1. Check secure HTTP-only cookie first (primary browser mechanism)
  if ((req as any).cookies) {
    token = (req as any).cookies[AUTH_COOKIE_NAME] || (req as any).cookies.token;
  }

  // 2. Check Authorization Bearer header (for non-browser CLI or integration clients)
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
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

  // Verify user still exists and is active, and ensure customerProfile is populated
  if (mongoose.connection.readyState >= 1) {
    try {
      const userRecord = await User.findById(decoded.userId).select('isActive customerProfile');
      if (!userRecord || userRecord.isActive === false) {
        res.status(403).json({
          status: 'error',
          message: 'Account is inactive or has been disabled / اکاؤنٹ معطل ہے',
        });
        return;
      }
      if (decoded.role === 'customer' && !req.user.customerProfile && userRecord.customerProfile) {
        req.user.customerProfile = userRecord.customerProfile.toString();
      }
    } catch (_e) {}
  }

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

  if ((req as any).cookies) {
    token = (req as any).cookies[AUTH_COOKIE_NAME] || (req as any).cookies.token;
  }

  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
  }

  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      req.user = decoded;
    }
  }

  next();
};
