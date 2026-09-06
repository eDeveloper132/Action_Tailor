import mongoose, { Schema, type Document, type Model } from 'mongoose';
import { normalizePakistaniPhone } from '../types/tailoring.types.ts';

export interface ICustomerProfile extends Document {
  name: string;
  phone: string;
  whatsapp?: string;
  alternatePhone?: string;
  address?: string;
  city?: string;
  email?: string;
  user?: mongoose.Types.ObjectId;
  notes?: string;
  totalOrders: number;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerProfileSchema = new Schema<ICustomerProfile>(
  {
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
      maxlength: 120,
    },
    phone: {
      type: String,
      required: [true, 'Customer phone number is required'],
      trim: true,
    },
    whatsapp: {
      type: String,
      trim: true,
    },
    alternatePhone: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
      maxlength: 250,
    },
    city: {
      type: String,
      trim: true,
      default: 'Lahore',
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      sparse: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    totalOrders: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Normalize phone and auto-fill whatsapp before saving
CustomerProfileSchema.pre<ICustomerProfile>('save', function () {
  if (this.phone) {
    this.phone = normalizePakistaniPhone(this.phone);
  }
  if (this.whatsapp) {
    this.whatsapp = normalizePakistaniPhone(this.whatsapp);
  } else if (this.phone) {
    this.whatsapp = this.phone;
  }
});

// Fast lookups and prevent duplicate customer phone numbers
CustomerProfileSchema.index({ phone: 1 }, { unique: true });
CustomerProfileSchema.index({ name: 1 });
CustomerProfileSchema.index({ name: 'text', phone: 'text', whatsapp: 'text' });

export const CustomerProfile: Model<ICustomerProfile> =
  mongoose.models.CustomerProfile ||
  mongoose.model<ICustomerProfile>('CustomerProfile', CustomerProfileSchema);

