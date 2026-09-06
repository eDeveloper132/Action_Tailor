import { Router, type Request, type Response } from 'express';
import mongoose from 'mongoose';
import { generateToken } from '../utils/jwt.ts';
import { authenticate, type AuthRequest } from '../middlewares/auth.middleware.ts';
import { User, CustomerProfile } from '../models/index.ts';
import type { ApiResponse, AuthResponse, JwtUserPayload } from '../types/index.ts';

const router = Router();

/**
 * POST /api/auth/signin
 * Authenticates user against MongoDB with bcrypt, issues JWT, sets HTTP-only cookie
 */
router.post('/signin', async (req: Request, res: Response<ApiResponse<AuthResponse>>) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({
      status: 'error',
      message: 'Email and password are required / ای میل اور پاس ورڈ ضروری ہیں',
    });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    // If MongoDB is connected, authenticate against real database
    if (mongoose.connection.readyState >= 1) {
      const user = await User.findOne({ email: normalizedEmail }).select('+password');

      if (!user) {
        res.status(401).json({
          status: 'error',
          message: 'Invalid email or password / ای میل یا پاس ورڈ درست نہیں ہے',
        });
        return;
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        res.status(401).json({
          status: 'error',
          message: 'Invalid email or password / ای میل یا پاس ورڈ درست نہیں ہے',
        });
        return;
      }

      const tokenPayload: JwtUserPayload = {
        userId: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        customerProfile: user.customerProfile ? user.customerProfile.toString() : undefined,
      };

      const token = generateToken(tokenPayload);

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({
        status: 'success',
        message: 'Authenticated successfully / لاگ ان کامیاب',
        data: {
          token,
          user: tokenPayload,
        },
      });
      return;
    }

    // Fallback if database is offline (demo mode)
    const mockUser = {
      userId: 'usr_' + Buffer.from(normalizedEmail).toString('hex').slice(0, 8),
      email: normalizedEmail,
      name: normalizedEmail.split('@')[0],
      role: 'customer',
    };

    const token = generateToken(mockUser);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      status: 'success',
      message: 'Authenticated successfully (Offline fallback)',
      data: {
        token,
        user: mockUser,
      },
    });
  } catch (err: any) {
    res.status(500).json({
      status: 'error',
      message: 'Authentication error: ' + (err.message || err),
    });
  }
});

/**
 * POST /api/auth/signup
 * Registers new user in MongoDB and auto-creates linked CustomerProfile
 */
router.post('/signup', async (req: Request, res: Response<ApiResponse<AuthResponse>>) => {
  const { fullname, email, password, phone } = req.body;

  if (!email || !password) {
    res.status(400).json({
      status: 'error',
      message: 'Full name, email, and password are required',
    });
    return;
  }

  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);

  if (password.length < 8 || !hasLetter || !hasNumber) {
    res.status(400).json({
      status: 'error',
      message: 'Password must be at least 8 characters long and contain both letters and numbers.',
    });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const userName = (fullname || email.split('@')[0]).trim();
  const userPhone = (phone || '').trim();

  try {
    if (mongoose.connection.readyState >= 1) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser) {
        res.status(409).json({
          status: 'error',
          message: 'An account with this email already exists / یہ ای میل پہلے سے موجود ہے',
        });
        return;
      }

      // Create linked CustomerProfile
      const customerProfile = await CustomerProfile.create({
        name: userName,
        phone: userPhone || '0300-0000000',
        whatsapp: userPhone || '0300-0000000',
      });

      // Create User
      const newUser = await User.create({
        name: userName,
        email: normalizedEmail,
        password,
        phone: userPhone,
        role: 'customer',
        customerProfile: customerProfile._id,
      });

      customerProfile.user = newUser._id;
      await customerProfile.save();

      const tokenPayload: JwtUserPayload = {
        userId: newUser._id.toString(),
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        customerProfile: customerProfile._id.toString(),
      };

      const token = generateToken(tokenPayload);

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(201).json({
        status: 'success',
        message: 'Account created successfully / اکاؤنٹ کامیابی سے بن گیا ہے',
        data: {
          token,
          user: tokenPayload,
        },
      });
      return;
    }

    // Fallback if DB offline
    const newUser = {
      userId: 'usr_' + Date.now().toString(36),
      email: normalizedEmail,
      name: userName,
      role: 'customer',
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
  } catch (err: any) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to create account: ' + (err.message || err),
    });
  }
});

/**
 * GET /api/auth/me
 * Returns current authenticated user and linked CustomerProfile
 */
router.get('/me', authenticate, async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    if (mongoose.connection.readyState >= 1 && req.user?.userId) {
      const user = await User.findById(req.user.userId).populate('customerProfile');
      if (user) {
        res.json({
          status: 'success',
          data: {
            userId: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            customerProfile: user.customerProfile,
          },
        });
        return;
      }
    }

    res.json({
      status: 'success',
      data: req.user,
    });
  } catch (err: any) {
    res.status(500).json({
      status: 'error',
      message: 'Error fetching user: ' + (err.message || err),
    });
  }
});

/**
 * POST or GET /api/auth/signout
 * Clears authentication cookie
 */
const signOutHandler = (_req: Request, res: Response<ApiResponse>) => {
  res.clearCookie('token');
  res.json({
    status: 'success',
    message: 'Signed out successfully / لاگ آؤٹ ہو گیا ہے',
  });
};

router.post('/signout', signOutHandler);
router.get('/signout', signOutHandler);

export default router;
