import mongoose, { Schema, type Document, type Model } from 'mongoose';
import type {
  ClothingCategory,
  MeasurementData,
  GarmentDesignOptions,
  OrderStatus,
  PaymentStatus,
  OrderStatusHistoryEntry,
} from '../types/index.ts';

export interface IOrder extends Document {
  orderNumber: string;
  customer: mongoose.Types.ObjectId;
  measurementProfile?: mongoose.Types.ObjectId;
  measurementSnapshot: MeasurementData;
  clothingCategory: ClothingCategory;
  quantity: number;
  fabric: {
    providedBy: 'customer' | 'shop';
    fabricType?: string;
    color?: string;
    lengthMeters?: number;
  };
  designOptions: GarmentDesignOptions;
  stitchingPrice: number;
  fabricPrice: number;
  totalAmount: number;
  advancePayment: number;
  remainingAmount: number;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  statusHistory: OrderStatusHistoryEntry[];
  orderDate: Date;
  expectedDeliveryDate: Date;
  actualDeliveredDate?: Date;
  assignedStaff?: mongoose.Types.ObjectId;
  createdBy?: mongoose.Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'CustomerProfile',
      required: [true, 'Customer reference is required'],
      index: true,
    },
    measurementProfile: {
      type: Schema.Types.ObjectId,
      ref: 'MeasurementProfile',
    },
    measurementSnapshot: {
      type: Schema.Types.Mixed,
      required: [true, 'Measurement snapshot is required for order integrity'],
    },
    clothingCategory: {
      type: String,
      enum: [
        'shalwaar_qameez',
        'kurta_pajama',
        'waistcoat',
        'trouser_shirt',
        'sherwani',
        'safari_suit',
        'custom',
      ],
      default: 'shalwaar_qameez',
      required: true,
    },
    quantity: {
      type: Number,
      default: 1,
      min: [1, 'Quantity must be at least 1 suit'],
    },
    fabric: {
      providedBy: {
        type: String,
        enum: ['customer', 'shop'],
        default: 'customer',
      },
      fabricType: { type: String, trim: true },
      color: { type: String, trim: true },
      lengthMeters: { type: Number, min: 0 },
    },
    designOptions: {
      collarStyle: {
        type: String,
        enum: ['regular', 'sherwani_chinese', 'soft_collar', 'ban_collar'],
        default: 'ban_collar',
      },
      cuffStyle: {
        type: String,
        enum: ['single_button', 'double_button', 'french', 'open_sleeve'],
        default: 'single_button',
      },
      pocketStyle: {
        type: String,
        enum: ['single_front', 'double_front', 'side_pockets', 'secret_pocket'],
        default: 'single_front',
      },
      damanStyle: {
        type: String,
        enum: ['round_gol', 'straight_chors'],
        default: 'round_gol',
      },
      shalwaarStyle: {
        type: String,
        enum: ['simple_shalwaar', 'trouser_pajama', 'dhoti_shalwaar'],
        default: 'simple_shalwaar',
      },
      embroideryDetails: { type: String, trim: true },
      specialInstructions: { type: String, trim: true },
    },
    stitchingPrice: {
      type: Number,
      required: [true, 'Stitching price is required'],
      min: [0, 'Price cannot be negative'],
    },
    fabricPrice: {
      type: Number,
      default: 0,
      min: [0, 'Fabric price cannot be negative'],
    },
    totalAmount: {
      type: Number,
      min: [0, 'Total amount cannot be negative'],
    },
    advancePayment: {
      type: Number,
      default: 0,
      min: [0, 'Advance cannot be negative'],
    },
    remainingAmount: {
      type: Number,
      default: 0,
      min: [0, 'Remaining cannot be negative'],
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'partially_paid', 'paid'],
      default: 'unpaid',
      index: true,
    },
    status: {
      type: String,
      enum: [
        'pending',
        'confirmed',
        'cutting',
        'stitching',
        'quality_check',
        'ready',
        'delivered',
        'on_hold',
        'cancelled',
      ],
      default: 'pending',
      index: true,
    },
    statusHistory: [
      {
        status: { type: String, required: true },
        updatedAt: { type: Date, default: Date.now },
        updatedBy: { type: String },
        notes: { type: String },
      },
    ],
    orderDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    expectedDeliveryDate: {
      type: Date,
      required: [true, 'Expected delivery date is required'],
      index: true,
    },
    actualDeliveredDate: {
      type: Date,
    },
    assignedStaff: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save calculation hook for reliable financial balance
OrderSchema.pre<IOrder>('save', function () {
  this.totalAmount = (this.stitchingPrice || 0) + (this.fabricPrice || 0);
  this.remainingAmount = Math.max(0, this.totalAmount - (this.advancePayment || 0));

  if (this.advancePayment >= this.totalAmount && this.totalAmount > 0) {
    this.paymentStatus = 'paid';
  } else if (this.advancePayment > 0) {
    this.paymentStatus = 'partially_paid';
  } else {
    this.paymentStatus = 'unpaid';
  }
});

// Indexes for operational queries
OrderSchema.index({ status: 1, expectedDeliveryDate: 1 });
OrderSchema.index({ customer: 1, createdAt: -1 });

export const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);
