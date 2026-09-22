import { CustomerProfile, type ICustomerProfile, MeasurementProfile, Order } from '../models/index.ts';
import { normalizePakistaniPhone } from '../types/tailoring.types.ts';
import { escapeRegExp } from '../utils/regex.ts';
import { parsePagination } from '../utils/pagination.ts';

export interface CustomerFilterOptions {
  query?: string;
  page?: number;
  limit?: number;
}

export class CustomerService {
  /**
   * Search customers by phone or name with fast indexing
   */
  static async searchCustomers(query: string, limit = 20): Promise<ICustomerProfile[]> {
    const trimmed = (query || '').trim().slice(0, 100);
    if (!trimmed) {
      return CustomerProfile.find({ isDeleted: { $ne: true } })
        .sort({ updatedAt: -1 })
        .limit(limit)
        .lean() as unknown as Promise<ICustomerProfile[]>;
    }

    const normPhone = normalizePakistaniPhone(trimmed);
    const isNumeric = /^[\d\s+\-()]+$/.test(trimmed);

    // Fast path: If search query is numeric phone, search indexed phone field first
    if (isNumeric && normPhone && normPhone.length >= 4) {
      const escapedPhone = escapeRegExp(normPhone);
      const phoneMatches = await CustomerProfile.find({
        isDeleted: { $ne: true },
        $or: [
          { phone: normPhone },
          { phone: new RegExp('^' + escapedPhone) },
          { whatsapp: normPhone },
        ],
      })
        .sort({ updatedAt: -1 })
        .limit(limit)
        .lean() as unknown as ICustomerProfile[];

      if (phoneMatches.length > 0) {
        return phoneMatches;
      }
    }

    const escaped = escapeRegExp(trimmed);
    const regex = new RegExp(escaped, 'i');

    const orConditions: any[] = [
      { name: regex },
      { phone: regex },
      { city: regex },
      { address: regex },
    ];

    if (normPhone && normPhone.length >= 3) {
      const escapedPhone = escapeRegExp(normPhone);
      orConditions.unshift({ phone: normPhone });
      orConditions.push({ phone: new RegExp('^' + escapedPhone) });
      orConditions.push({ whatsapp: normPhone });
    }

    return CustomerProfile.find({
      isDeleted: { $ne: true },
      $or: orConditions,
    })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .lean() as unknown as Promise<ICustomerProfile[]>;
  }

  /**
   * Paginated list of customers
   */
  static async listCustomers(
    page = 1,
    limit = 20
  ): Promise<{ customers: ICustomerProfile[]; total: number; pages: number; page: number; limit: number }> {
    const { page: resolvedPage, limit: resolvedLimit, skip } = parsePagination({ page, limit }, 20);
    const filter = { isDeleted: { $ne: true } };
    const [customers, total] = await Promise.all([
      CustomerProfile.find(filter).sort({ createdAt: -1 }).skip(skip).limit(resolvedLimit).lean(),
      CustomerProfile.countDocuments(filter),
    ]);

    return {
      customers: customers as unknown as ICustomerProfile[],
      total,
      pages: Math.ceil(total / resolvedLimit) || 1,
      page: resolvedPage,
      limit: resolvedLimit,
    };
  }

  /**
   * Get single customer with measurement profiles and recent orders
   */
  static async getCustomerDetails(id: string): Promise<{
    customer: ICustomerProfile | null;
    measurementProfiles: any[];
    recentOrders: any[];
  }> {
    const customer = await CustomerProfile.findById(id).lean() as any;
    if (!customer || customer.isDeleted) {
      return { customer: null, measurementProfiles: [], recentOrders: [] };
    }

    const [measurementProfiles, recentOrders] = await Promise.all([
      MeasurementProfile.find({ customer: id }).sort({ isDefault: -1, createdAt: -1 }).lean(),
      Order.find({ customer: id }).sort({ createdAt: -1 }).limit(10).lean(),
    ]);

    return {
      customer: customer as unknown as ICustomerProfile,
      measurementProfiles,
      recentOrders,
    };
  }

  /**
   * Create new customer profile
   */
  static async createCustomer(data: {
    name: string;
    phone: string;
    whatsapp?: string;
    alternatePhone?: string;
    address?: string;
    city?: string;
    email?: string;
    notes?: string;
    user?: string;
  }): Promise<ICustomerProfile> {
    const rawPhone = data.phone?.trim() || '';
    const phone = normalizePakistaniPhone(rawPhone);

    if (!phone) {
      throw new Error('Valid Pakistani phone number is required / درست فون نمبر درج کریں');
    }

    // Prevent duplicate customer phone numbers across different formats
    const existing = await CustomerProfile.findOne({ phone });
    if (existing) {
      throw new Error(
        `Customer with phone number "${rawPhone}" is already registered as "${existing.name}" / یہ فون نمبر پہلے سے رجسٹرڈ ہے`
      );
    }

    const whatsapp = data.whatsapp ? normalizePakistaniPhone(data.whatsapp) : phone;

    const newCustomer = await CustomerProfile.create({
      name: data.name.trim(),
      phone,
      whatsapp,
      alternatePhone: data.alternatePhone ? normalizePakistaniPhone(data.alternatePhone) : undefined,
      address: data.address?.trim(),
      city: data.city?.trim() || 'Lahore',
      email: data.email?.trim()?.toLowerCase(),
      notes: data.notes?.trim(),
      user: data.user,
    });

    return newCustomer;
  }

  /**
   * Update customer profile with phone normalization & uniqueness check
   */
  static async updateCustomer(
    id: string,
    data: Partial<{
      name: string;
      phone: string;
      whatsapp: string;
      alternatePhone: string;
      address: string;
      city: string;
      email: string;
      notes: string;
    }>
  ): Promise<ICustomerProfile | null> {
    if (data.phone) {
      const norm = normalizePakistaniPhone(data.phone);
      const dup = await CustomerProfile.findOne({ phone: norm, _id: { $ne: id } });
      if (dup) {
        throw new Error(`Phone number "${data.phone}" is already assigned to "${dup.name}"`);
      }
      data.phone = norm;
    }

    if (data.whatsapp) {
      data.whatsapp = normalizePakistaniPhone(data.whatsapp);
    }

    const updated = await CustomerProfile.findByIdAndUpdate(id, { $set: data }, { returnDocument: 'after', runValidators: true });
    return updated;
  }

  /**
   * Soft-delete customer profile, preserving historical orders and measurement records
   */
  static async deleteCustomer(id: string): Promise<boolean> {
    const updated = await CustomerProfile.findByIdAndUpdate(
      id,
      { $set: { isDeleted: true, deletedAt: new Date() } },
      { returnDocument: 'after' }
    );
    return !!updated;
  }
}

