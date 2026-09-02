import type { Response } from 'express';
import type { AuthRequest } from '../middlewares/auth.middleware.ts';
import { DashboardService } from '../services/dashboard.service.ts';
import { PAKISTANI_CLOTHING_TYPES } from '../types/tailoring.types.ts';
import type { ApiResponse } from '../types/index.ts';

export class DashboardController {
  static async getAdminData(req: AuthRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const metrics = await DashboardService.getAdminMetrics();
      res.json({
        status: 'success',
        data: {
          ...metrics,
          clothingTypes: PAKISTANI_CLOTHING_TYPES,
        },
      });
    } catch (err: any) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  }

  static async getCustomerData(req: AuthRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      if (!req.user?.userId) {
        res.status(401).json({ status: 'error', message: 'User not authenticated' });
        return;
      }
      const data = await DashboardService.getCustomerDashboard(req.user.userId);
      res.json({
        status: 'success',
        data: {
          ...data,
          clothingTypes: PAKISTANI_CLOTHING_TYPES,
        },
      });
    } catch (err: any) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  }

  static async getClothingTypes(_req: AuthRequest, res: Response<ApiResponse>): Promise<void> {
    res.json({
      status: 'success',
      data: PAKISTANI_CLOTHING_TYPES,
    });
  }
}
