import { CustomerProfile, type ICustomerProfile, MeasurementProfile, Order } from '../models/index.ts';

export interface CustomerFilterOptions {
  query?: string;
  page?: number;
  limit?: number;
}

export class CustomerService {
  /**
   * Search customers by name, phone, or WhatsApp with lean projection
   */
  static async searchCustomers(query: string, limit = 20): Promise<ICustomerProfile[]> {
    const trimmed = query.trim();
    if (!trimmed) {
      return CustomerProfile.find()
        .sort({ updatedAt: -1 })
        .limit(limit)
        .lean() as unknown as Promise<ICustomerProfile[]>;
    }

    const regex = new RegExp(trimmed, 'i');
    return CustomerProfile.find({
      $or: [{ name: regex }, { phone: regex }, { whatsapp: regex }, { city: regex }],
    })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .lean() as unknown as Promise<ICustomerProfile[]>;
  }

  /**
   * Paginated list of customers
   */
  static async listCustomers(page = 1, limit = 20): Promise<{ customers: ICustomerProfile[]; total: number; pages: number }> {
    const skip = (page - 1) * limit;
    const [customers, total] = await Promise.all([
      CustomerProfile.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      CustomerProfile.countDocuments(),
    ]);

    return {
      customers: customers as unknown as ICustomerProfile[],
      total,
      pages: Math.ceil(total / limit),
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
    const customer = await CustomerProfile.findById(id).lean();
    if (!customer) {
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
    notes?: string;
    user?: string;
  }): Promise<ICustomerProfile> {
    const phone = data.phone.trim();

    // Check if phone already registered
    const existing = await CustomerProfile.findOne({ phone });
    if (existing) {
      throw new Error(`Customer with phone number ${phone} already exists / گاہک کا یہ فون نمبر پہلے سے درج ہے`);
    }

    const newCustomer = await CustomerProfile.create({
      name: data.name.trim(),
      phone,
      whatsapp: data.whatsapp ? data.whatsapp.trim() : phone,
      alternatePhone: data.alternatePhone?.trim(),
      address: data.address?.trim(),
      city: data.city?.trim() || 'Lahore',
      notes: data.notes?.trim(),
      user: data.user,
    });

    return newCustomer;
  }

  /**
   * Update customer profile
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
      notes: string;
    }>
  ): Promise<ICustomerProfile | null> {
    const updated = await CustomerProfile.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
    return updated;
  }

  /**
   * Delete customer profile and associated measurement profiles
   */
  static async deleteCustomer(id: string): Promise<boolean> {
    const deleted = await CustomerProfile.findByIdAndDelete(id);
    if (deleted) {
      await MeasurementProfile.deleteMany({ customer: id });
      return true;
    }
    return false;
  }
}

