import { Router, type Request, type Response } from 'express';

const router = Router();

// Root route
router.get('/', (_req: Request, res: Response) => {
  res.json({
    status: 'success',
    message: 'Action Tailor API is running',
    version: '1.0.0',
  });
});

// Health check route
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

export default router;
