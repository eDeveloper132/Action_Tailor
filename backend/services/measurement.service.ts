import { MeasurementProfile, type IMeasurementProfile } from '../models/index.ts';
import {
  type ClothingCategory,
  type MeasurementUnit,
  type MeasurementData,
  normalizeClothingCategory,
} from '../types/index.ts';

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
   * Get the current/latest measurement profile for a customer and specific garment type
   */
  static async getProfileByCustomerAndGarment(
    customerId: string,
    clothingCategory: string
  ): Promise<IMeasurementProfile | null> {
    const normalizedCategory = normalizeClothingCategory(clothingCategory);
    return MeasurementProfile.findOne({
      customer: customerId,
      clothingCategory: normalizedCategory,
    })
      .sort({ updatedAt: -1 })
      .lean() as unknown as Promise<IMeasurementProfile | null>;
  }

  /**
   * Upsert measurement profile for customer and garment type:
   * Exactly one current/latest measurement per: Customer + Garment Type.
   * Updates existing profile if present, else creates new profile.
   */
  static async upsertProfileForCustomerAndGarment(data: {
    customer: string;
    clothingCategory: string;
    title?: string;
    unit?: MeasurementUnit;
    measurements: MeasurementData;
    isDefault?: boolean;
    notes?: string;
  }): Promise<IMeasurementProfile> {
    const normalizedCategory = normalizeClothingCategory(data.clothingCategory);
    const existing = await MeasurementProfile.findOne({
      customer: data.customer,
      clothingCategory: normalizedCategory,
    }).sort({ updatedAt: -1 });

    const defaultTitle = `${normalizedCategory.replace('_', ' ').toUpperCase()} Fit`;
    const title = data.title?.trim() || existing?.title || defaultTitle;

    if (existing) {
      existing.title = title;
      existing.measurements = data.measurements;
      if (data.unit) existing.unit = data.unit;
      if (data.notes !== undefined) existing.notes = data.notes?.trim();
      if (data.isDefault !== undefined) existing.isDefault = !!data.isDefault;
      await existing.save();
      return existing;
    }

    return MeasurementProfile.create({
      customer: data.customer,
      title,
      clothingCategory: normalizedCategory,
      unit: data.unit || 'inches',
      measurements: data.measurements,
      isDefault: !!data.isDefault,
      notes: data.notes?.trim(),
    });
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

