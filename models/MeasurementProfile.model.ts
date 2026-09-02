import mongoose, { Schema, type Document, type Model } from 'mongoose';
import type { ClothingCategory, MeasurementUnit, MeasurementData } from '../types/index.ts';

export interface IMeasurementProfile extends Document {
  customer: mongoose.Types.ObjectId;
  title: string;
  clothingCategory: ClothingCategory;
  unit: MeasurementUnit;
  measurements: MeasurementData;
  isDefault: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MeasurementProfileSchema = new Schema<IMeasurementProfile>(
  {
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'CustomerProfile',
      required: [true, 'Customer reference is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Measurement profile title is required (e.g. Personal, Eid, Slim Fit)'],
      trim: true,
      maxlength: 80,
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
    unit: {
      type: String,
      enum: ['inches', 'cm'],
      default: 'inches',
      required: true,
    },
    measurements: {
      qameez: {
        length: { type: Number },      // Lambai / لمبائی
        shoulder: { type: Number },    // Teera / تیرا
        chest: { type: Number },       // Chhaati / چھاتی
        waist: { type: Number },       // Kamar / کمر
        hip: { type: Number },         // Hip / ہپ
        sleeve: { type: Number },      // Bazu / بازو
        collar: { type: Number },      // Collar / کالر
        cuff: { type: Number },        // Cuff / کف
        ghera: { type: Number },       // Daman/Ghera / گھیرا
        armhole: { type: Number },     // Mudha / موڈھا
        bicep: { type: Number },       // Dola / ڈولہ
        frontNeck: { type: Number },   // Gala / گلا
      },
      shalwaar: {
        length: { type: Number },      // Lambai / لمبائی
        waist: { type: Number },       // Kamar / کمر
        hip: { type: Number },         // Hip / ہپ
        thigh: { type: Number },       // Raan / ران
        paincha: { type: Number },     // Paincha / پائینچہ
        aasan: { type: Number },       // Aasan / آسن
        fly: { type: Number },
      },
      customFields: {
        type: Map,
        of: Schema.Types.Mixed,
        default: {},
      },
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

MeasurementProfileSchema.index({ customer: 1, isDefault: -1 });

export const MeasurementProfile: Model<IMeasurementProfile> =
  mongoose.models.MeasurementProfile ||
  mongoose.model<IMeasurementProfile>('MeasurementProfile', MeasurementProfileSchema);

