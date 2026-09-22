import mongoose from 'mongoose';
import {
  Order,
  type IOrder,
  CustomerProfile,
  MeasurementProfile,
  Payment,
  Notification,
  AuditLog,
  Counter,
} from '../models/index.ts';
import { getIO } from '../sockets/socket.ts';
import { MeasurementService } from './measurement.service.ts';
import {
  type OrderStatus,
  type ClothingCategory,
  type MeasurementData,
  type GarmentDesignOptions,
  ORDER_STATUS_TRANSITIONS,
  normalizeClothingCategory,
  normalizePakistaniPhone,
} from '../types/index.ts';
import { escapeRegExp } from '../utils/regex.ts';
import { parsePagination } from '../utils/pagination.ts';

export interface OrderFilterOptions {
  status?: OrderStatus;
  customerId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export class OrderService {
  /**
   * Initializes the atomic counter sequence from existing orders if not already set
   */
  static async initializeOrderCounter(): Promise<void> {
    const orders = await Order.find({ orderNumber: /^AT-\d+$/ })
      .select('orderNumber')
      .lean();

    let maxSeq = 1000;
    for (const ord of orders) {
      if (ord.orderNumber) {
        const parsed = parseInt(ord.orderNumber.replace('AT-', ''), 10);
        if (!isNaN(parsed) && parsed > maxSeq) {
          maxSeq = parsed;
        }
      }
    }

    const existing = await Counter.findById('orderNumber');
    if (!existing || existing.seq < maxSeq) {
      await Counter.findByIdAndUpdate(
        'orderNumber',
        { $max: { seq: maxSeq } },
        { upsert: true, returnDocument: 'after' }
      );
    }
  }

  /**
   * Generates readable, gapless, concurrency-safe order code e.g. AT-1045
   */
  static async generateOrderNumber(): Promise<string> {
    const counter = await Counter.findByIdAndUpdate(
      'orderNumber',
      { $inc: { seq: 1 } },
      { returnDocument: 'after', upsert: true }
    );
    return `AT-${counter.seq}`;
  }

  /**
   * Create a new stitching order with atomic number generation,
   * immutable measurement snapshots, and transaction-backed payment + customer stats.
   */
  static async createOrder(
    data: {
      customer: string;
      measurementProfileId?: string;
      customMeasurements?: MeasurementData;
      saveMeasurementProfile?: boolean;
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
    // 0. Validate customer existence and active status (reject soft-deleted customers)
    const customer = await CustomerProfile.findById(data.customer);
    if (!customer || (customer as any).isDeleted) {
      throw new Error('Customer profile not found or has been deactivated / گاہک موجود نہیں ہے یا معطل ہے');
    }

    const normalizedCategory = normalizeClothingCategory(data.clothingCategory);

    // 1. Resolve Measurement Snapshot
    let snapshot: MeasurementData | undefined = data.customMeasurements;

    if (data.measurementProfileId) {
      const profile = await MeasurementProfile.findById(data.measurementProfileId);
      if (!profile) {
        throw new Error('Specified measurement profile not found / منتخب شدہ ناپ کا پروفائل نہیں ملا');
      }
      const profileCustId = (profile.customer as any)?._id?.toString() || profile.customer?.toString();
      if (profileCustId !== data.customer.toString()) {
        throw new Error('Measurement profile does not belong to the selected customer / ناپ کا پروفائل منتخب گاہک کا نہیں ہے');
      }
      snapshot = profile.measurements;
    }

    if (!snapshot) {
      // Look for customer's latest profile for this specific garment
      const garmentProfile = await MeasurementService.getProfileByCustomerAndGarment(
        data.customer,
        normalizedCategory
      );
      if (garmentProfile) {
        snapshot = garmentProfile.measurements;
      } else {
        // Fallback to customer's default profile
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
    }

    // Crucial: Deep clone snapshot so that subsequent profile edits never alter this order's record
    const immutableSnapshot: MeasurementData = JSON.parse(JSON.stringify(snapshot || { qameez: {}, shalwaar: {} }));

    // 2. If requested or measurements provided, update/create the latest measurement for this garment
    if (data.saveMeasurementProfile !== false && data.customMeasurements) {
      const q = data.customMeasurements.qameez || {};
      const s = data.customMeasurements.shalwaar || {};
      const hasAnyValue = Object.values(q).some((v) => v !== undefined && v !== null && v !== '') ||
                          Object.values(s).some((v) => v !== undefined && v !== null && v !== '');
      if (hasAnyValue) {
        await MeasurementService.upsertProfileForCustomerAndGarment({
          customer: data.customer,
          clothingCategory: normalizedCategory,
          measurements: immutableSnapshot,
          unit: 'inches',
        });
      }
    }

    // 3. Generate atomic unique order number
    const orderNumber = await this.generateOrderNumber();

    // 4. Wrap multi-document write in session transaction with retry on transient write conflict
    const MAX_RETRIES = 5;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
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
        const orderDocs = await Order.create(
          [
            {
              orderNumber,
              customer: data.customer,
              measurementProfile: data.measurementProfileId,
              measurementSnapshot: immutableSnapshot,
              clothingCategory: normalizedCategory,
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
            },
          ],
          session ? { session } : {}
        );

        const newOrder = orderDocs[0];

        // If advance payment was made, record it in Payments
        if (data.advancePayment && data.advancePayment > 0) {
          await Payment.create(
            [
              {
                order: newOrder._id,
                customer: data.customer,
                amount: data.advancePayment,
                type: 'advance',
                method: data.paymentMethod || 'cash',
                receivedBy: (createdByUserId && mongoose.Types.ObjectId.isValid(createdByUserId)) ? createdByUserId : undefined,
                notes: 'Advance recorded at order creation',
              },
            ],
            session ? { session } : {}
          );
        }

        if (session && useTransaction) {
          await session.commitTransaction();
        }

        // Customer tally update is performed as an atomic single-document operation
        // outside the multi-document transaction to prevent cross-transaction WriteConflict
        await CustomerProfile.findByIdAndUpdate(data.customer, { $inc: { totalOrders: 1 } });

        // Target Real-Time Events via Scoped Socket.IO Rooms
        try {
          const io = getIO();
          io.to('staff').emit('order:created', {
            orderId: newOrder._id.toString(),
            orderNumber: newOrder.orderNumber,
            customer: data.customer,
            totalAmount: newOrder.totalAmount,
          });
          io.to(`customer:${data.customer}`).emit('order:created', {
            orderId: newOrder._id.toString(),
            orderNumber: newOrder.orderNumber,
            totalAmount: newOrder.totalAmount,
          });
        } catch (_err) {}

        return newOrder;
      } catch (error: any) {
        if (session && useTransaction) {
          try {
            await session.abortTransaction();
          } catch (_abortErr) {}
        }

        const isTransient =
          error?.hasErrorLabel?.('TransientTransactionError') ||
          error?.hasErrorLabel?.('UnknownTransactionCommitResult') ||
          error?.code === 112 ||
          error?.message?.includes('WriteConflict');

        if (isTransient && attempt < MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, 40 * attempt + Math.random() * 40));
          continue;
        }

        throw error;
      } finally {
        if (session) {
          await session.endSession();
        }
      }
    }

    throw new Error('Failed to create order after multiple retry attempts');
  }

  /**
   * List and filter orders
   */
  static async listOrders(
    options: OrderFilterOptions = {}
  ): Promise<{ orders: IOrder[]; total: number; pages: number; page: number; limit: number }> {
    const { status, customerId, search, page, limit } = options;
    const { page: resolvedPage, limit: resolvedLimit, skip } = parsePagination({ page, limit }, 20);

    const filter: Record<string, any> = {};

    if (status) {
      filter.status = status;
    }

    if (customerId) {
      filter.customer = customerId;
    }

    if (search && search.trim()) {
      const trimmed = search.trim().slice(0, 100);
      const escaped = escapeRegExp(trimmed);
      const orderNumRegex = new RegExp(escaped, 'i');
      const normPhone = normalizePakistaniPhone(trimmed);

      const custOrConditions: any[] = [
        { name: new RegExp(escaped, 'i') },
        { phone: new RegExp(escaped, 'i') },
      ];
      if (normPhone && normPhone.length >= 3) {
        const escapedPhone = escapeRegExp(normPhone);
        custOrConditions.unshift({ phone: escapedPhone });
        custOrConditions.push({ phone: new RegExp('^' + escapedPhone) });
      }

      // Check if searching by customer name/phone (ignoring soft-deleted)
      const matchingCustomers = await CustomerProfile.find({
        $or: custOrConditions,
        isDeleted: { $ne: true },
      }).select('_id').limit(50);

      const customerIds = matchingCustomers.map((c) => c._id);

      filter.$or = [{ orderNumber: orderNumRegex }, { customer: { $in: customerIds } }];
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('customer', 'name phone whatsapp address city')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(resolvedLimit)
        .lean(),
      Order.countDocuments(filter),
    ]);

    return {
      orders: orders as unknown as IOrder[],
      total,
      pages: Math.ceil(total / resolvedLimit) || 1,
      page: resolvedPage,
      limit: resolvedLimit,
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

    if (oldStatus !== newStatus) {
      let allowed = ORDER_STATUS_TRANSITIONS[oldStatus] || [];
      if (oldStatus === 'on_hold' && order.previousOperationalStatus) {
        allowed = Array.from(new Set([...allowed, order.previousOperationalStatus]));
      }

      if (!allowed.includes(newStatus)) {
        throw new Error(
          `Cannot transition order status from "${oldStatus}" to "${newStatus}". Allowed: [${allowed.join(', ')}] / اس حالت میں تبدیلی ممکن نہیں ہے`
        );
      }
    }

    if (newStatus === 'on_hold' && oldStatus !== 'on_hold') {
      order.previousOperationalStatus = oldStatus;
    }

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

    if (!order.measurementSnapshot) {
      order.measurementSnapshot = { qameez: {}, shalwaar: {} };
    }

    await order.save({ validateModifiedOnly: true });

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

    // Target Real-Time Events via Scoped Socket.IO Rooms
    try {
      const io = getIO();
      const customerRoom = `customer:${order.customer.toString()}`;

      io.to('staff').emit('order:status_changed', {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        newStatus,
        customerId: order.customer.toString(),
      });

      io.to(customerRoom).emit('order:status_changed', {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        newStatus,
      });

      if (newStatus === 'ready') {
        io.to('staff').emit('order:ready', {
          orderId: order._id.toString(),
          orderNumber: order.orderNumber,
          customerName: customer?.name || '',
          customerPhone: customer?.phone || '',
        });
        io.to(customerRoom).emit('order:ready', {
          orderId: order._id.toString(),
          orderNumber: order.orderNumber,
        });
      }
    } catch (_err) {}

    return order;
  }
}
