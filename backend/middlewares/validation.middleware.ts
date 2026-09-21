import type { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { normalizePakistaniPhone } from '../types/tailoring.types.ts';

const isValidObjectId = (id: any): boolean => {
  return typeof id === 'string' && mongoose.Types.ObjectId.isValid(id) && id.length === 24;
};

export const validateSignin = (req: Request, res: Response, next: NextFunction): void => {
  const { email, password } = req.body || {};
  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    res.status(400).json({
      status: 'error',
      message: 'Valid email address is required / درست ای میل ضروری ہے',
    });
    return;
  }
  if (!password || typeof password !== 'string') {
    res.status(400).json({
      status: 'error',
      message: 'Password is required / پاس ورڈ ضروری ہے',
    });
    return;
  }
  next();
};

export const validateSignup = (req: Request, res: Response, next: NextFunction): void => {
  const { email, password, fullname, name, phone } = req.body || {};
  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    res.status(400).json({
      status: 'error',
      message: 'Valid email address is required / درست ای میل ضروری ہے',
    });
    return;
  }
  if (!password || typeof password !== 'string' || password.length < 8 || !/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
    res.status(400).json({
      status: 'error',
      message: 'Password must be at least 8 characters long and contain both letters and numbers',
    });
    return;
  }
  const resolvedName = (fullname || name || '').trim();
  if (!resolvedName || resolvedName.length < 2) {
    res.status(400).json({
      status: 'error',
      message: 'Full name is required / مکمل نام ضروری ہے',
    });
    return;
  }
  if (phone) {
    const normalized = normalizePakistaniPhone(phone);
    if (!normalized || normalized.length !== 11 || !normalized.startsWith('03')) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid Pakistani mobile phone number (03XXXXXXXXX) / درست موبائل فون نمبر درج کریں',
      });
      return;
    }
  }
  next();
};

export const validateOrderCreation = (req: Request, res: Response, next: NextFunction): void => {
  const { customer, clothingCategory, stitchingPrice, expectedDeliveryDate, advancePayment } = req.body || {};

  if (!customer || !isValidObjectId(customer)) {
    res.status(400).json({
      status: 'error',
      message: 'Valid customer ID is required / درست گاہک کا انتخاب کریں',
    });
    return;
  }

  if (!clothingCategory || typeof clothingCategory !== 'string') {
    res.status(400).json({
      status: 'error',
      message: 'Garment category is required / کپڑوں کی قسم منتخب کریں',
    });
    return;
  }

  const price = Number(stitchingPrice);
  if (isNaN(price) || price < 0) {
    res.status(400).json({
      status: 'error',
      message: 'Stitching price must be a valid non-negative number / سلائی کی قیمت درست درج کریں',
    });
    return;
  }

  if (advancePayment !== undefined) {
    const advance = Number(advancePayment);
    if (isNaN(advance) || advance < 0) {
      res.status(400).json({
        status: 'error',
        message: 'Advance payment cannot be negative / پیشگی رقم منفی نہیں ہو سکتی',
      });
      return;
    }
  }

  if (!expectedDeliveryDate || isNaN(new Date(expectedDeliveryDate).getTime())) {
    res.status(400).json({
      status: 'error',
      message: 'Valid expected delivery date is required / واپسی کی تاریخ درست درج کریں',
    });
    return;
  }

  next();
};

export const validatePaymentRecord = (req: Request, res: Response, next: NextFunction): void => {
  const { orderId, amount, method } = req.body || {};

  if (!orderId || !isValidObjectId(orderId)) {
    res.status(400).json({
      status: 'error',
      message: 'Valid order ID is required / درست آرڈر نمبر ضروری ہے',
    });
    return;
  }

  const numericAmount = Number(amount);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    res.status(400).json({
      status: 'error',
      message: 'Payment amount must be greater than 0 / رقم صفر سے زیادہ ہونی چاہیے',
    });
    return;
  }

  const allowedMethods = ['cash', 'easypaisa', 'jazzcash', 'bank_transfer', 'other'];
  if (method && !allowedMethods.includes(method)) {
    res.status(400).json({
      status: 'error',
      message: `Invalid payment method. Allowed: ${allowedMethods.join(', ')}`,
    });
    return;
  }

  next();
};

