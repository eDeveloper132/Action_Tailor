import path from 'node:path';
import { Router, type Request, type Response } from 'express';
import { authenticate } from '../middlewares/auth.middleware.ts';

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
// Protected Views (Dashboard & Internal)
// ==========================================

// Protected dashboard view (requires valid JWT in cookie or Authorization header)
router.get('/dashboard', authenticate, (_req: Request, res: Response) => {
  res.sendFile(path.join(publicDir, 'protected', 'index.html'));
});

// Protected alias
router.get('/protected', authenticate, (_req: Request, res: Response) => {
  res.sendFile(path.join(publicDir, 'protected', 'index.html'));
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

