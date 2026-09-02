import { MeasurementProfile, type IMeasurementProfile } from '../models/index.ts';
import type { ClothingCategory, MeasurementUnit, MeasurementData } from '../types/index.ts';

export class MeasurementService {
  /**
   * Get all measurement profiles for a given customer
   */
  static async getProfilesByCustomer(customerId: string): Promise<IMeasurementProfile[]> {
    return MeasurementProfile.find({ customer: customerId })
      .sort({ isDefault: -1, updatedAt: -1 })
      .lean() as unknown as Promise<IMeasurementProfile[]>;
  }

  /**
   * Get specific profile by ID
   */
  static async getProfileById(id: string): Promise<IMeasurementProfile | null> {
    return MeasurementProfile.findById(id).lean() as unknown as Promise<IMeasurementProfile | null>;
  }

  /**
   * Create new measurement profile
   */
  static async createProfile(data: {
    customer: string;
    title: string;
    clothingCategory: ClothingCategory;
    unit?: MeasurementUnit;
    measurements: MeasurementData;
    isDefault?: boolean;
    notes?: string;
  }): Promise<IMeasurementProfile> {
    // If setting as default, clear previous default flag for this customer
    if (data.isDefault) {
      await MeasurementProfile.updateMany(
        { customer: data.customer },
        { $set: { isDefault: false } }
      );
    }

    const profile = await MeasurementProfile.create({
      customer: data.customer,
      title: data.title.trim(),
      clothingCategory: data.clothingCategory || 'shalwaar_qameez',
      unit: data.unit || 'inches',
      measurements: data.measurements,
      isDefault: !!data.isDefault,
      notes: data.notes?.trim(),
    });

    return profile;
  }

  /**
   * Update existing profile
   */
  static async updateProfile(
    id: string,
    data: Partial<{
      title: string;
      clothingCategory: ClothingCategory;
      unit: MeasurementUnit;
      measurements: MeasurementData;
      isDefault: boolean;
      notes: string;
    }>
  ): Promise<IMeasurementProfile | null> {
    const existing = await MeasurementProfile.findById(id);
    if (!existing) return null;

    if (data.isDefault) {
      await MeasurementProfile.updateMany(
        { customer: existing.customer, _id: { $ne: id } },
        { $set: { isDefault: false } }
      );
    }

    const updated = await MeasurementProfile.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    );
    return updated;
  }

  /**
   * Delete profile
   */
  static async deleteProfile(id: string): Promise<boolean> {
    const res = await MeasurementProfile.findByIdAndDelete(id);
    return !!res;
  }
}

