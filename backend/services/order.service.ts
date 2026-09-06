import mongoose from 'mongoose';
import {
  Order,
  type IOrder,
  CustomerProfile,
  MeasurementProfile,
  Payment,
  Notification,
  AuditLog,
} from '../models/index.ts';
import { getIO } from '../sockets/socket.ts';
import type {
  OrderStatus,
  ClothingCategory,
  MeasurementData,
  GarmentDesignOptions,
} from '../types/index.ts';

export interface OrderFilterOptions {
  status?: OrderStatus;
  customerId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export class OrderService {
  /**
   * Generates readable order code e.g. AT-2045
   */
  static async generateOrderNumber(): Promise<string> {
    const count = await Order.countDocuments();
    const nextNum = 1001 + count;
    return `AT-${nextNum}`;
  }

  /**
   * Create a new stitching order
   */
  static async createOrder(
    data: {
      customer: string;
      measurementProfileId?: string;
      customMeasurements?: MeasurementData;
      clothingCategory: ClothingCategory;
      quantity?: number;
      fabric?: {
        providedBy: 'customer' | 'shop';
        fabricType?: string;
        color?: string;
        lengthMeters?: number;
      };
      designOptions?: GarmentDesignOptions;
      stitchingPrice: number;
      fabricPrice?: number;
      advancePayment?: number;
      paymentMethod?: 'cash' | 'easypaisa' | 'jazzcash' | 'bank_transfer' | 'other';
      expectedDeliveryDate: Date | string;
      notes?: string;
    },
    createdByUserId?: string
  ): Promise<IOrder> {
    // 1. Resolve Measurement Snapshot
    let snapshot: MeasurementData | undefined = data.customMeasurements;

    if (data.measurementProfileId) {
      const profile = await MeasurementProfile.findById(data.measurementProfileId);
      if (profile) {
        snapshot = profile.measurements;
      }
    }

    if (!snapshot) {
      // Look for customer's default profile
      const defaultProfile = await MeasurementProfile.findOne({
        customer: data.customer,
        isDefault: true,
      });
      if (defaultProfile) {
        snapshot = defaultProfile.measurements;
      } else {
        snapshot = { qameez: {}, shalwaar: {} };
      }
    }

    // 2. Generate unique order number
    let orderNumber = await this.generateOrderNumber();
    let exists = await Order.findOne({ orderNumber });
    let salt = 1;
    while (exists) {
      orderNumber = `AT-${1001 + (await Order.countDocuments()) + salt++}`;
      exists = await Order.findOne({ orderNumber });
    }

    // 3. Create Order
    const newOrder = await Order.create({
      orderNumber,
      customer: data.customer,
      measurementProfile: data.measurementProfileId,
      measurementSnapshot: snapshot,
      clothingCategory: data.clothingCategory || 'shalwaar_qameez',
      quantity: data.quantity || 1,
      fabric: data.fabric || { providedBy: 'customer' },
      designOptions: data.designOptions || {},
      stitchingPrice: data.stitchingPrice,
      fabricPrice: data.fabricPrice || 0,
      advancePayment: data.advancePayment || 0,
      status: 'pending',
      statusHistory: [
        {
          status: 'pending',
          updatedAt: new Date(),
          updatedBy: createdByUserId || 'Staff',
          notes: 'Order initiated / نیا آرڈر بک ہوا',
        },
      ],
      expectedDeliveryDate: new Date(data.expectedDeliveryDate),
      createdBy: (createdByUserId && mongoose.Types.ObjectId.isValid(createdByUserId)) ? createdByUserId : undefined,
      notes: data.notes?.trim(),
    });

    // 4. If advance payment was made, record it in Payments
    if (data.advancePayment && data.advancePayment > 0) {
      await Payment.create({
        order: newOrder._id,
        customer: data.customer,
        amount: data.advancePayment,
        type: 'advance',
        method: data.paymentMethod || 'cash',
        receivedBy: (createdByUserId && mongoose.Types.ObjectId.isValid(createdByUserId)) ? createdByUserId : undefined,
        notes: 'Advance recorded at order creation',
      });
    }

    // 5. Increment customer totalOrders tally
    await CustomerProfile.findByIdAndUpdate(data.customer, { $inc: { totalOrders: 1 } });

    // 6. Broadcast Real-Time Event via Socket.IO
    try {
      const io = getIO();
      io.emit('order:created', {
        orderId: newOrder._id.toString(),
        orderNumber: newOrder.orderNumber,
        customer: data.customer,
        totalAmount: newOrder.totalAmount,
      });
    } catch (_err) {
      // Serverless or socket not initialized
    }

    return newOrder;
  }

  /**
   * List and filter orders
   */
  static async listOrders(
    options: OrderFilterOptions = {}
  ): Promise<{ orders: IOrder[]; total: number; pages: number }> {
    const { status, customerId, search, page = 1, limit = 20 } = options;
    const filter: Record<string, any> = {};

    if (status) {
      filter.status = status;
    }

    if (customerId) {
      filter.customer = customerId;
    }

    if (search && search.trim()) {
      const trimmed = search.trim();
      const orderNumRegex = new RegExp(trimmed, 'i');

      // Check if searching by customer name/phone
      const matchingCustomers = await CustomerProfile.find({
        $or: [{ name: new RegExp(trimmed, 'i') }, { phone: new RegExp(trimmed, 'i') }],
      }).select('_id');

      const customerIds = matchingCustomers.map((c) => c._id);

      filter.$or = [{ orderNumber: orderNumRegex }, { customer: { $in: customerIds } }];
    }

    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('customer', 'name phone whatsapp address city')
        .sort({ expectedDeliveryDate: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter),
    ]);

    return {
      orders: orders as unknown as IOrder[],
      total,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Get single order by ID
   */
  static async getOrderById(id: string): Promise<IOrder | null> {
    const order = await Order.findById(id)
      .populate('customer')
      .populate('measurementProfile')
      .populate('assignedStaff', 'name email role')
      .populate('createdBy', 'name email')
      .lean();

    return order as unknown as IOrder | null;
  }

  /**
   * Update order status with business lifecycle transitions
   */
  static async updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus,
    updatedByUserId?: string,
    notes?: string
  ): Promise<IOrder | null> {
    const order = await Order.findById(orderId);
    if (!order) return null;

    const oldStatus = order.status;
    order.status = newStatus;

    if (newStatus === 'delivered') {
      order.actualDeliveredDate = new Date();
    }

    order.statusHistory.push({
      status: newStatus,
      updatedAt: new Date(),
      updatedBy: updatedByUserId || 'Staff',
      notes: notes || `Status changed from ${oldStatus} to ${newStatus}`,
    });

    await order.save();

    // Audit Log
    await AuditLog.create({
      action: 'ORDER_STATUS_CHANGED',
      performedBy: (updatedByUserId && mongoose.Types.ObjectId.isValid(updatedByUserId)) ? updatedByUserId : undefined,
      entityType: 'order',
      entityId: order._id.toString(),
      details: { from: oldStatus, to: newStatus, notes },
    });

    // Notify customer if linked to a user account
    const customer = await CustomerProfile.findById(order.customer);
    if (customer && customer.user) {
      await Notification.create({
        recipient: customer.user,
        title: `آرڈر کی حالت اپڈیٹ / Order ${newStatus.toUpperCase()}`,
        message: `آپ کا آرڈر نمبر ${order.orderNumber} اب ${newStatus} کی حالت میں ہے۔`,
        type: newStatus === 'ready' ? 'order_ready' : 'status_changed',
        relatedOrder: order._id,
      });
    }

    // Broadcast Real-Time Event via Socket.IO
    try {
      const io = getIO();
      io.emit('order:status_changed', {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        newStatus,
        customerId: order.customer.toString(),
      });

      if (newStatus === 'ready') {
        io.emit('order:ready', {
          orderId: order._id.toString(),
          orderNumber: order.orderNumber,
          customerName: customer?.name || '',
          customerPhone: customer?.phone || '',
        });
      }
    } catch (_err) {}

    return order;
  }
}
