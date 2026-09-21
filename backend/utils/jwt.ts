import jwt, { type SignOptions } from 'jsonwebtoken';
import type { JwtUserPayload } from '../types/index.ts';

const DEFAULT_DEV_SECRET = 'action_tailor_jwt_secret_key_default_2026';
const configuredSecret = process.env.JWT_SECRET;

if (process.env.NODE_ENV === 'production') {
  if (!configuredSecret || configuredSecret.length < 32 || configuredSecret === DEFAULT_DEV_SECRET) {
    throw new Error(
      'FATAL SECURITY CONFIGURATION: In production, JWT_SECRET must be set in environment variables to a secure secret of at least 32 characters.'
    );
  }
} else if (!configuredSecret) {
  console.warn('⚠️ [SECURITY WARNING] Using default development JWT_SECRET. Set JWT_SECRET in .env for production.');
}

const JWT_SECRET = configuredSecret || DEFAULT_DEV_SECRET;
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

