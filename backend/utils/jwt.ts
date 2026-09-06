import jwt, { type SignOptions } from 'jsonwebtoken';
import type { JwtUserPayload } from '../types/index.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'action_tailor_jwt_secret_key_default_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generate a signed JWT token
 */
export const generateToken = (
  payload: Omit<JwtUserPayload, 'iat' | 'exp'>,
  expiresIn: string | number = JWT_EXPIRES_IN
): string => {
  const options: SignOptions = {
    expiresIn: expiresIn as any,
  };
  return jwt.sign(payload, JWT_SECRET, options);
};

/**
 * Verify and decode a JWT token
 */
export const verifyToken = (token: string): JwtUserPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded as JwtUserPayload;
  } catch (_error) {
    return null;
  }
};

