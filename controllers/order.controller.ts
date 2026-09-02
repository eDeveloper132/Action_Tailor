import type { Response } from 'express';
import type { AuthRequest } from '../middlewares/auth.middleware.ts';
import { OrderService } from '../services/order.service.ts';
import type { ApiResponse, OrderStatus } from '../types/index.ts';

export class OrderController {
  static async list(req: AuthRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const { status, customerId, search, page, limit } = req.query;

      // If logged in as customer, enforce only viewing their own orders
      let resolvedCustomerId = typeof customerId === 'string' ? customerId : undefined;
      if (req.user && req.user.role === 'customer') {
        const customerProfileId = (req.user as any).customerProfile;
        if (customerProfileId) {
          resolvedCustomerId = customerProfileId.toString();
        }
      }

      const result = await OrderService.listOrders({
        status: status as OrderStatus,
        customerId: resolvedCustomerId,
        search: typeof search === 'string' ? search : undefined,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 20,
      });

      res.json({ status: 'success', data: result });
    } catch (err: any) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  }

  static async getById(req: AuthRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const order = await OrderService.getOrderById(id);
      if (!order) {
        res.status(404).json({ status: 'error', message: 'Order not found / آرڈر نہیں ملا' });
        return;
      }

      // IDOR protection: if user is customer, ensure order belongs to them
      if (req.user && req.user.role === 'customer') {
        const userCustId = (req.user as any).customerProfile?.toString();
        const orderCustId = (order.customer as any)._id?.toString() || order.customer?.toString();
        if (userCustId && orderCustId && userCustId !== orderCustId) {
          res.status(403).json({ status: 'error', message: 'Access denied to this order' });
          return;
        }
      }

      res.json({ status: 'success', data: order });
    } catch (err: any) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  }

  static async create(req: AuthRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const order = await OrderService.createOrder(req.body, req.user?.userId);
      res.status(201).json({
        status: 'success',
        message: `Order #${order.orderNumber} booked successfully / نیا آرڈر بک ہو گیا ہے`,
        data: order,
      });
    } catch (err: any) {
      res.status(400).json({ status: 'error', message: err.message });
    }
  }

  static async updateStatus(req: AuthRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { status, notes } = req.body;

      if (!status) {
        res.status(400).json({ status: 'error', message: 'Status is required' });
        return;
      }

      const updated = await OrderService.updateOrderStatus(
        id,
        status as OrderStatus,
        req.user?.userId,
        notes
      );

      if (!updated) {
        res.status(404).json({ status: 'error', message: 'Order not found' });
        return;
      }

      res.json({
        status: 'success',
        message: `Order status changed to ${status} / آرڈر کی حالت تبدیل ہو گئی ہے`,
        data: updated,
      });
    } catch (err: any) {
      res.status(400).json({ status: 'error', message: err.message });
    }
  }
}
