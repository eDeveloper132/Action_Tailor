import { Router, type Request, type Response } from 'express';
import { generateToken } from '../utils/jwt.ts';
import { authenticate, type AuthRequest } from '../middlewares/auth.middleware.ts';
import type { ApiResponse, AuthResponse } from '../types/index.ts';

const router = Router();

/**
 * POST /api/auth/signin
 * Authenticates user, issues JWT, sets HTTP-only cookie, and returns token payload
 */
router.post('/signin', (req: Request, res: Response<ApiResponse<AuthResponse>>) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({
      status: 'error',
      message: 'Email and password are required',
    });
    return;
  }

  // Demo user authentication (replace with MongoDB User model query & bcrypt.compare)
  const mockUser = {
    userId: 'usr_' + Buffer.from(email).toString('hex').slice(0, 8),
    email,
    name: email.split('@')[0],
    role: 'user',
  };

  const token = generateToken(mockUser);

  // Set HTTP-only cookie for seamless browser navigation
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.json({
    status: 'success',
    message: 'Authenticated successfully',
    data: {
      token,
      user: mockUser,
    },
  });
});

/**
 * POST /api/auth/signup
 * Registers user and issues initial JWT
 */
router.post('/signup', (req: Request, res: Response<ApiResponse<AuthResponse>>) => {
  const { fullname, email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({
      status: 'error',
      message: 'Full name, email, and password are required',
    });
    return;
  }

  const newUser = {
    userId: 'usr_' + Date.now().toString(36),
    email,
    name: fullname || email.split('@')[0],
    role: 'user',
  };

  const token = generateToken(newUser);

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(201).json({
    status: 'success',
    message: 'Account created successfully',
    data: {
      token,
      user: newUser,
    },
  });
});

/**
 * GET /api/auth/me
 * Returns current authenticated user from verified JWT
 */
router.get('/me', authenticate, (req: AuthRequest, res: Response<ApiResponse>) => {
  res.json({
    status: 'success',
    data: req.user,
  });
});

/**
 * POST or GET /api/auth/signout
 * Clears authentication cookie
 */
const signOutHandler = (_req: Request, res: Response<ApiResponse>) => {
  res.clearCookie('token');
  res.json({
    status: 'success',
    message: 'Signed out successfully',
  });
};

router.post('/signout', signOutHandler);
router.get('/signout', signOutHandler);

export default router;
