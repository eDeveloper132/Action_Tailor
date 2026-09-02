import { Router, type Request, type Response } from 'express';
import type { ApiResponse, HealthResponse } from '../types/index.ts';

const router = Router();

// Root route
router.get('/', (_req: Request, res: Response<ApiResponse>) => {
  res.json({
    status: 'success',
    message: 'Action Tailor API is running',
    version: '1.0.0',
  });
});

// Health check route
router.get('/health', (_req: Request, res: Response<HealthResponse>) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

export default router;
