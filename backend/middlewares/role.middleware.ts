import type { Response, NextFunction } from 'express';
import type { AuthRequest } from './auth.middleware.ts';
import type { UserRole } from '../types/index.ts';

/**
 * Role-Based Access Control (RBAC) Middleware
 * Ensures the authenticated user has one of the required roles.
 * Normalizes roles case-insensitively and returns clear Urdu/English responses.
 */
export const requireRole = (...allowedRoles: UserRole[]) => {
  const normalizedAllowed = allowedRoles.map((r) => r.toLowerCase() as UserRole);

  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        status: 'error',
        message: 'Authentication required / لاگ ان ضروری ہے',
      });
      return;
    }

    const userRole = ((req.user.role || 'customer') as string).toLowerCase() as UserRole;

    if (!normalizedAllowed.includes(userRole)) {
      res.status(403).json({
        status: 'error',
        message: `Forbidden: Access restricted to [${allowedRoles.join(', ')}] / اس کارروائی کی اجازت نہیں ہے`,
      });
      return;
    }

    next();
  };
};

/**
 * Convenience guards for common role thresholds
 */
export const requireAdmin = requireRole('admin');
export const requireManagement = requireRole('admin', 'manager');
export const requireStaffOrAbove = requireRole('admin', 'manager', 'staff');
export const requireCustomer = requireRole('customer');

