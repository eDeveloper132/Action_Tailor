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

export const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'token';

/**
 * Parses duration string (e.g., '7d', '24h', '60m') to milliseconds
 */
export function parseDurationMs(duration: string | number): number {
  if (typeof duration === 'number') return duration;
  const match = duration.match(/^(\d+)([dhms])?$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const val = parseInt(match[1], 10);
  const unit = match[2] || 's';
  switch (unit) {
    case 'd':
      return val * 24 * 60 * 60 * 1000;
    case 'h':
      return val * 60 * 60 * 1000;
    case 'm':
      return val * 60 * 1000;
    case 's':
      return val * 1000;
    default:
      return val * 1000;
  }
}

/**
 * Returns environment-driven, secure cookie options
 */
export function getAuthCookieOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  const maxAgeMs = process.env.AUTH_COOKIE_MAX_AGE
    ? parseInt(process.env.AUTH_COOKIE_MAX_AGE, 10)
    : parseDurationMs(JWT_EXPIRES_IN);

  const rawSameSite = (process.env.AUTH_COOKIE_SAME_SITE || 'lax').toLowerCase();
  const sameSite: 'lax' | 'strict' | 'none' =
    rawSameSite === 'none' || rawSameSite === 'strict' ? (rawSameSite as any) : 'lax';

  const secure =
    process.env.AUTH_COOKIE_SECURE !== undefined
      ? process.env.AUTH_COOKIE_SECURE === 'true'
      : isProd || sameSite === 'none';

  const domain = process.env.AUTH_COOKIE_DOMAIN || undefined;

  return {
    httpOnly: true,
    secure,
    sameSite,
    maxAge: maxAgeMs,
    domain,
    path: '/',
  };
}

