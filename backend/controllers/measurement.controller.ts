import type { Response } from 'express';
import type { AuthRequest } from '../middlewares/auth.middleware.ts';
import { MeasurementService } from '../services/measurement.service.ts';
import type { ApiResponse } from '../types/index.ts';

export class MeasurementController {
  static async getByCustomer(req: AuthRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const customerId = Array.isArray(req.params.customerId)
        ? req.params.customerId[0]
        : req.params.customerId;

      // IDOR Protection: Customer can only view their own measurements
      if (req.user && req.user.role === 'customer') {
        const userCustId = (req.user as any).customerProfile?.toString();
        if (!userCustId || userCustId !== customerId) {
          res.status(403).json({
            status: 'error',
            message: 'Access denied: You can only view your own measurements / صرف اپنے ناپ دیکھنے کی اجازت ہے',
          });
          return;
        }
      }

      const profiles = await MeasurementService.getProfilesByCustomer(customerId);
      res.json({ status: 'success', data: profiles });
    } catch (err: any) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  }

  static async getById(req: AuthRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const profile = await MeasurementService.getProfileById(id);
      if (!profile) {
        res.status(404).json({ status: 'error', message: 'Measurement profile not found / ناپ نہیں ملا' });
        return;
      }

      // IDOR Protection: Customer can only view their own measurement profile
      if (req.user && req.user.role === 'customer') {
        const userCustId = (req.user as any).customerProfile?.toString();
        const profileCustId = (profile.customer as any)?._id?.toString() || profile.customer?.toString();
        if (!userCustId || userCustId !== profileCustId) {
          res.status(403).json({
            status: 'error',
            message: 'Access denied: You can only view your own measurements / صرف اپنے ناپ دیکھنے کی اجازت ہے',
          });
          return;
        }
      }

      res.json({ status: 'success', data: profile });
    } catch (err: any) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  }

  static async create(req: AuthRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const profile = await MeasurementService.createProfile(req.body);
      res.status(201).json({
        status: 'success',
        message: 'Measurement profile saved / ناپ محفوظ ہو گیا ہے',
        data: profile,
      });
    } catch (err: any) {
      res.status(400).json({ status: 'error', message: err.message });
    }
  }

  static async update(req: AuthRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const updated = await MeasurementService.updateProfile(id, req.body);
      if (!updated) {
        res.status(404).json({ status: 'error', message: 'Measurement profile not found' });
        return;
      }
      res.json({
        status: 'success',
        message: 'Measurement profile updated / ناپ اپڈیٹ ہو گیا ہے',
        data: updated,
      });
    } catch (err: any) {
      res.status(400).json({ status: 'error', message: err.message });
    }
  }

  static async delete(req: AuthRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const success = await MeasurementService.deleteProfile(id);
      if (!success) {
        res.status(404).json({ status: 'error', message: 'Measurement profile not found' });
        return;
      }
      res.json({ status: 'success', message: 'Measurement profile removed / ناپ ڈیلیٹ کر دیا گیا ہے' });
    } catch (err: any) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  }
}

