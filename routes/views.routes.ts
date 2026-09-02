import path from 'node:path';
import { Router, type Request, type Response } from 'express';
import { authenticate, type AuthRequest } from '../middlewares/auth.middleware.ts';
import { requireRole } from '../middlewares/role.middleware.ts';

const router = Router();
const publicDir = path.join(process.cwd(), 'public');

// ==========================================
// Unprotected Views (Authentication)
// ==========================================

// Sign In view
router.get('/signin', (_req: Request, res: Response) => {
  res.sendFile(path.join(publicDir, 'unprotected', 'authentication', 'signin.html'));
});

// Sign Up view
router.get('/signup', (_req: Request, res: Response) => {
  res.sendFile(path.join(publicDir, 'unprotected', 'authentication', 'signup.html'));
});

// Route aliases
router.get('/auth/signin', (_req: Request, res: Response) => {
  res.sendFile(path.join(publicDir, 'unprotected', 'authentication', 'signin.html'));
});

router.get('/auth/signup', (_req: Request, res: Response) => {
  res.sendFile(path.join(publicDir, 'unprotected', 'authentication', 'signup.html'));
});

// ==========================================
// Smart Dashboard Dispatcher
// ==========================================

// Smart redirector based on user role
router.get('/dashboard', authenticate, (req: AuthRequest, res: Response) => {
  if (req.user?.role === 'customer') {
    res.redirect('/portal');
  } else {
    res.redirect('/admin');
  }
});

router.get('/protected', authenticate, (req: AuthRequest, res: Response) => {
  if (req.user?.role === 'customer') {
    res.redirect('/portal');
  } else {
    res.redirect('/admin');
  }
});

// ==========================================
// 1. ADMIN / SHOP MANAGEMENT PORTAL
// ==========================================

// Admin main desk (restricted to admin & staff)
router.get('/admin', authenticate, requireRole('admin', 'staff'), (_req: Request, res: Response) => {
  res.sendFile(path.join(publicDir, 'protected', 'admin', 'index.html'));
});

router.get('/admin/dashboard', authenticate, requireRole('admin', 'staff'), (_req: Request, res: Response) => {
  res.sendFile(path.join(publicDir, 'protected', 'admin', 'index.html'));
});

// ==========================================
// 2. CUSTOMER PORTAL
// ==========================================

// Dedicated Customer Portal (suit tracking, measurements & receipts)
router.get('/portal', authenticate, (_req: Request, res: Response) => {
  res.sendFile(path.join(publicDir, 'protected', 'customer', 'index.html'));
});

router.get('/customer/portal', authenticate, (_req: Request, res: Response) => {
  res.sendFile(path.join(publicDir, 'protected', 'customer', 'index.html'));
});

// Orders queue view
router.get('/orders', authenticate, (_req: Request, res: Response) => {
  res.sendFile(path.join(publicDir, 'protected', 'orders.html'));
});

// Book new suit view
router.get('/orders/new', authenticate, (_req: Request, res: Response) => {
  res.sendFile(path.join(publicDir, 'protected', 'new-order.html'));
});

// Customers directory view
router.get('/customers', authenticate, (_req: Request, res: Response) => {
  res.sendFile(path.join(publicDir, 'protected', 'customers.html'));
});

// Measurement profiles view
router.get('/measurements', authenticate, (_req: Request, res: Response) => {
  res.sendFile(path.join(publicDir, 'protected', 'measurements.html'));
});

// User profile view
router.get('/profile', authenticate, (_req: Request, res: Response) => {
  res.sendFile(path.join(publicDir, 'protected', 'profile.html'));
});

export default router;

