import type { Response } from 'express';
import type { AuthRequest } from '../middlewares/auth.middleware.ts';
import { CustomerService } from '../services/customer.service.ts';
import type { ApiResponse } from '../types/index.ts';

export class CustomerController {
  static async search(req: AuthRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const q = typeof req.query.q === 'string' ? req.query.q : '';
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const customers = await CustomerService.searchCustomers(q, limit);
      res.json({ status: 'success', data: customers });
    } catch (err: any) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  }

  static async list(req: AuthRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const result = await CustomerService.listCustomers(page, limit);
      res.json({ status: 'success', data: result });
    } catch (err: any) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  }

  static async getById(req: AuthRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const details = await CustomerService.getCustomerDetails(id);
      if (!details.customer) {
        res.status(404).json({ status: 'error', message: 'Customer not found / گاہک نہیں ملا' });
        return;
      }
      res.json({ status: 'success', data: details });
    } catch (err: any) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  }

  static async create(req: AuthRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const customer = await CustomerService.createCustomer(req.body);
      res.status(201).json({
        status: 'success',
        message: 'Customer registered successfully / گاہک رجسٹر ہو گیا ہے',
        data: customer,
      });
    } catch (err: any) {
      res.status(400).json({ status: 'error', message: err.message });
    }
  }

  static async update(req: AuthRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const updated = await CustomerService.updateCustomer(id, req.body);
      if (!updated) {
        res.status(404).json({ status: 'error', message: 'Customer not found' });
        return;
      }
      res.json({
        status: 'success',
        message: 'Customer updated / معلومات تبدیل ہو گئی ہیں',
        data: updated,
      });
    } catch (err: any) {
      res.status(400).json({ status: 'error', message: err.message });
    }
  }

  static async delete(req: AuthRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const success = await CustomerService.deleteCustomer(id);
      if (!success) {
        res.status(404).json({ status: 'error', message: 'Customer not found' });
        return;
      }
      res.json({ status: 'success', message: 'Customer deleted / گاہک ڈیلیٹ ہو گیا ہے' });
    } catch (err: any) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  }
}
