import type { Response } from 'express';
import type { AuthRequest } from '../middlewares/auth.middleware.ts';
import { PaymentService } from '../services/payment.service.ts';
import type { ApiResponse } from '../types/index.ts';

export class PaymentController {
  static async record(req: AuthRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const { orderId, amount, type, method, transactionReference, notes } = req.body;

      if (!orderId || !amount) {
        res.status(400).json({
          status: 'error',
          message: 'Order ID and amount are required / رقم اور آرڈر آئی ڈی ضروری ہیں',
        });
        return;
      }

      const result = await PaymentService.recordPayment({
        orderId,
        amount: Number(amount),
        type,
        method,
        transactionReference,
        receivedByUserId: req.user?.userId,
        notes,
      });

      res.status(201).json({
        status: 'success',
        message: 'Payment recorded successfully / رقم وصول ہو گئی ہے',
        data: result,
      });
    } catch (err: any) {
      res.status(400).json({ status: 'error', message: err.message });
    }
  }

  static async getByOrder(req: AuthRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const orderId = Array.isArray(req.params.orderId)
        ? req.params.orderId[0]
        : req.params.orderId;
      const payments = await PaymentService.getPaymentsByOrder(orderId);
      res.json({ status: 'success', data: payments });
    } catch (err: any) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  }
}
