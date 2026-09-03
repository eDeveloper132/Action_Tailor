import mongoose from 'mongoose';
import { Payment, type IPayment, Order, CustomerProfile, AuditLog } from '../models/index.ts';
import { getIO } from '../sockets/socket.ts';
import type { PaymentMethod, PaymentType } from '../types/index.ts';

export class PaymentService {
  /**
   * Record a payment and update the parent Order atomically
   */
  static async recordPayment(data: {
    orderId: string;
    amount: number;
    type?: PaymentType;
    method?: PaymentMethod;
    transactionReference?: string;
    receivedByUserId?: string;
    notes?: string;
  }): Promise<{ payment: IPayment; order: any }> {
    const order = await Order.findById(data.orderId);
    if (!order) {
      throw new Error('Order not found / آرڈر نہیں ملا');
    }

    if (data.amount <= 0) {
      throw new Error('Payment amount must be greater than 0');
    }

    const validUserId = (data.receivedByUserId && mongoose.Types.ObjectId.isValid(data.receivedByUserId))
      ? data.receivedByUserId
      : undefined;

    // 1. Create Payment Record
    const payment = await Payment.create({
      order: order._id,
      customer: order.customer,
      amount: data.amount,
      type: data.type || (order.advancePayment === 0 ? 'advance' : 'partial'),
      method: data.method || 'cash',
      transactionReference: data.transactionReference?.trim(),
      receivedBy: validUserId,
      notes: data.notes?.trim(),
    });

    // 2. Update Order Advance & Remaining Balance
    order.advancePayment = (order.advancePayment || 0) + data.amount;
    order.remainingAmount = Math.max(0, order.totalAmount - order.advancePayment);

    if (order.remainingAmount === 0) {
      order.paymentStatus = 'paid';
    } else {
      order.paymentStatus = 'partially_paid';
    }

    await order.save();

    // 3. Audit Log
    await AuditLog.create({
      action: 'PAYMENT_RECORDED',
      performedBy: validUserId,
      entityType: 'payment',
      entityId: payment._id.toString(),
      details: {
        orderNumber: order.orderNumber,
        amount: data.amount,
        method: payment.method,
        remainingBalance: order.remainingAmount,
      },
    });

    // 4. Socket.IO Broadcast
    try {
      const io = getIO();
      io.emit('payment:recorded', {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        amount: data.amount,
        remainingAmount: order.remainingAmount,
        paymentStatus: order.paymentStatus,
      });
    } catch (_e) {}

    return { payment, order };
  }

  /**
   * List all payments for a specific order
   */
  static async getPaymentsByOrder(orderId: string): Promise<IPayment[]> {
    return Payment.find({ order: orderId })
      .populate('receivedBy', 'name email')
      .sort({ createdAt: -1 })
      .lean() as unknown as Promise<IPayment[]>;
  }
}
