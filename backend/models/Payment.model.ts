import mongoose, { Schema, type Document, type Model } from 'mongoose';
import type { PaymentMethod, PaymentType } from '../types/index.ts';

export interface IPayment extends Document {
  order: mongoose.Types.ObjectId;
  customer: mongoose.Types.ObjectId;
  amount: number;
  type: PaymentType;
  method: PaymentMethod;
  transactionReference?: string;
  idempotencyKey?: string;
  receivedBy?: mongoose.Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    order: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Order reference is required'],
      index: true,
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'CustomerProfile',
      required: [true, 'Customer reference is required'],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [1, 'Payment amount must be at least 1 PKR'],
    },
    type: {
      type: String,
      enum: ['advance', 'partial', 'final', 'refund'],
      default: 'partial',
      required: true,
    },
    method: {
      type: String,
      enum: ['cash', 'easypaisa', 'jazzcash', 'bank_transfer', 'other'],
      default: 'cash',
      required: true,
    },
    transactionReference: {
      type: String,
      trim: true,
    },
    idempotencyKey: {
      type: String,
      trim: true,
      index: true,
    },
    receivedBy: {
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

PaymentSchema.index({ order: 1, createdAt: -1 });
PaymentSchema.index({ order: 1, idempotencyKey: 1 }, { unique: true, sparse: true });

export const Payment: Model<IPayment> =
  mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);

