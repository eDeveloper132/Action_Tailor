import type { Response, NextFunction } from 'express';
import type { AuthRequest } from './auth.middleware.ts';
import type { UserRole } from '../types/index.ts';

/**
 * Role-Based Access Control (RBAC) Middleware
 * Ensures the authenticated user has one of the required roles
 */
export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        status: 'error',
        message: 'Authentication required / لاگ ان ضروری ہے',
      });
      return;
    }

    const userRole = (req.user.role || 'customer') as UserRole;

    if (!allowedRoles.includes(userRole)) {
      res.status(403).json({
        status: 'error',
        message: `Forbidden: Access restricted to [${allowedRoles.join(', ')}] / اس کارروائی کی اجازت نہیں ہے`,
      });
      return;
    }

    next();
  };
};

