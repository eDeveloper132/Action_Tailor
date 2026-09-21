import type { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  timestamps: number[];
}

const memoryStore = new Map<string, RateLimitRecord>();

// Clean up stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of memoryStore.entries()) {
    record.timestamps = record.timestamps.filter((ts) => now - ts < 15 * 60 * 1000);
    if (record.timestamps.length === 0) {
      memoryStore.delete(key);
    }
  }
}, 5 * 60 * 1000).unref();

export function createRateLimiter(options: {
  windowMs: number;
  max: number;
  message?: string;
  skipFailedRequests?: boolean;
}) {
  const { windowMs, max, message = 'Too many requests. Please try again later / بہت زیادہ درخواستیں، بعد میں کوشش کریں' } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    // Determine client IP
    const forwarded = req.headers['x-forwarded-for'];
    const ip = (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.socket.remoteAddress) || '127.0.0.1';
    const key = `${req.baseUrl || req.path}:${ip}`;
    const now = Date.now();

    let record = memoryStore.get(key);
    if (!record) {
      record = { timestamps: [] };
      memoryStore.set(key, record);
    }

    // Filter timestamps within window
    record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

    const remaining = Math.max(0, max - record.timestamps.length);
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil((now + windowMs) / 1000));

    if (record.timestamps.length >= max) {
      res.status(429).json({
        status: 'error',
        error: 'Too Many Requests',
        message,
        retryAfterSeconds: Math.ceil(windowMs / 1000),
      });
      return;
    }

    record.timestamps.push(now);
    next();
  };
}

// 20 attempts per 15 minutes for sensitive auth routes
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many authentication attempts. Please try again in 15 minutes / لاگ ان کی کوششیں زیادہ ہیں، 15 منٹ بعد کوشش کریں',
});

// 300 requests per minute for standard API routes
export const apiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 300,
  message: 'API rate limit exceeded. Please slow down / درخواستوں کی رفتار کم کریں',
});

