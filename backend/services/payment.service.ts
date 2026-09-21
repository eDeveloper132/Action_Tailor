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
    idempotencyKey?: string;
    receivedByUserId?: string;
    notes?: string;
  }): Promise<{ payment: IPayment; order: any }> {
    const order = await Order.findById(data.orderId);
    if (!order) {
      throw new Error('Order not found / آرڈر نہیں ملا');
    }

    if (data.amount <= 0) {
      throw new Error('Payment amount must be greater than 0 / رقم صفر سے زیادہ ہونی چاہیے');
    }

    const txRef = (data.idempotencyKey || data.transactionReference)?.trim();

    // Idempotency check: if payment with this key already recorded for this order, return existing
    if (txRef) {
      const existing = await Payment.findOne({
        order: order._id,
        transactionReference: txRef,
      });
      if (existing) {
        return { payment: existing, order };
      }
    }

    // Overpayment prevention: payment cannot exceed outstanding balance
    if (data.type !== 'refund' && data.amount > order.remainingAmount) {
      throw new Error(
        `Payment amount (Rs. ${data.amount}) cannot exceed remaining balance (Rs. ${order.remainingAmount}) / ادا کی جانے والی رقم واجب الادا رقم سے زیادہ نہیں ہو سکتی`
      );
    }

    const validUserId = (data.receivedByUserId && mongoose.Types.ObjectId.isValid(data.receivedByUserId))
      ? data.receivedByUserId
      : undefined;

    let session: mongoose.ClientSession | null = null;
    let useTransaction = false;
    try {
      session = await mongoose.startSession();
      session.startTransaction();
      useTransaction = true;
    } catch (_err) {
      session = null;
      useTransaction = false;
    }

    try {
      // 1. Create Payment Record
      const paymentDocs = await Payment.create(
        [
          {
            order: order._id,
            customer: order.customer,
            amount: data.amount,
            type: data.type || (order.advancePayment === 0 ? 'advance' : 'partial'),
            method: data.method || 'cash',
            transactionReference: txRef,
            receivedBy: validUserId,
            notes: data.notes?.trim(),
          },
        ],
        session ? { session } : {}
      );
      const payment = paymentDocs[0];

      // 2. Update Order Advance & Remaining Balance
      if (data.type === 'refund') {
        order.advancePayment = Math.max(0, (order.advancePayment || 0) - data.amount);
        order.remainingAmount = Math.min(order.totalAmount, order.totalAmount - order.advancePayment);
        order.paymentStatus = order.advancePayment === 0 ? 'unpaid' : 'partially_paid';
      } else {
        order.advancePayment = (order.advancePayment || 0) + data.amount;
        order.remainingAmount = Math.max(0, order.totalAmount - order.advancePayment);
        order.paymentStatus = order.remainingAmount === 0 ? 'paid' : 'partially_paid';
      }

      if (!order.measurementSnapshot) {
        order.measurementSnapshot = { qameez: {}, shalwaar: {} };
      }

      await order.save(session ? { session, validateModifiedOnly: true } : { validateModifiedOnly: true });

      // 3. Audit Log
      await AuditLog.create(
        [
          {
            action: data.type === 'refund' ? 'PAYMENT_REFUNDED' : 'PAYMENT_RECORDED',
            performedBy: validUserId,
            entityType: 'payment',
            entityId: payment._id.toString(),
            details: {
              orderNumber: order.orderNumber,
              amount: data.amount,
              method: payment.method,
              remainingBalance: order.remainingAmount,
              paymentStatus: order.paymentStatus,
              transactionReference: txRef,
            },
          },
        ],
        session ? { session } : {}
      );

      if (session && useTransaction) {
        await session.commitTransaction();
      }

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
    } catch (error) {
      if (session && useTransaction) {
        await session.abortTransaction();
      }
      throw error;
    } finally {
      if (session) {
        await session.endSession();
      }
    }
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
