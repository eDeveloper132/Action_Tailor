import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface ICustomerProfile extends Document {
  name: string;
  phone: string;
  whatsapp?: string;
  alternatePhone?: string;
  address?: string;
  city?: string;
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
      index: true,
    },
    whatsapp: {
      type: String,
      trim: true,
      index: true,
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

// Auto-fill whatsapp with primary phone if not provided
CustomerProfileSchema.pre<ICustomerProfile>('save', function () {
  if (!this.whatsapp && this.phone) {
    this.whatsapp = this.phone;
  }
});

// Compound text index for instant customer search by name or phone
CustomerProfileSchema.index({ name: 'text', phone: 'text', whatsapp: 'text' });

export const CustomerProfile: Model<ICustomerProfile> =
  mongoose.models.CustomerProfile ||
  mongoose.model<ICustomerProfile>('CustomerProfile', CustomerProfileSchema);
