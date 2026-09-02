import path from 'node:path';
import { Router, type Request, type Response } from 'express';

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

// Protected dashboard view
router.get('/dashboard', (_req: Request, res: Response) => {
  res.sendFile(path.join(publicDir, 'protected', 'index.html'));
});

// Protected alias
router.get('/protected', (_req: Request, res: Response) => {
  res.sendFile(path.join(publicDir, 'protected', 'index.html'));
});

export default router;
