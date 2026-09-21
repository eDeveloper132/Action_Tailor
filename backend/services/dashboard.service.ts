import { Order, CustomerProfile, MeasurementProfile, User } from '../models/index.ts';
import { normalizePakistaniPhone } from '../types/tailoring.types.ts';

export class DashboardService {
  /**
   * Fast, lean operational metrics for Pakistani tailor shop admin/staff
   */
  static async getAdminMetrics(): Promise<{
    totalOrders: number;
    todayOrdersCount: number;
    statusCounts: Record<string, number>;
    upcomingDeliveries: any[];
    totalRemainingPayments: number;
    totalCustomers: number;
    recentOrders: any[];
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const threeDaysLater = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

    const [
      todayOrdersCount,
      statusAgg,
      totalCustomers,
      upcomingDeliveries,
      recentOrders,
    ] = await Promise.all([
      Order.countDocuments({ createdAt: { $gte: today } }),
      Order.aggregate<{ _id: string; count: number; remainingDue: number }>([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            remainingDue: {
              $sum: {
                $cond: [
                  { $ne: ['$status', 'cancelled'] },
                  { $ifNull: ['$remainingAmount', 0] },
                  0,
                ],
              },
            },
          },
        },
      ]),
      CustomerProfile.countDocuments(),
      Order.find({
        status: { $in: ['pending', 'confirmed', 'cutting', 'stitching', 'quality_check', 'ready'] },
        expectedDeliveryDate: { $lte: threeDaysLater },
      })
        .populate('customer', 'name phone whatsapp')
        .sort({ expectedDeliveryDate: 1 })
        .limit(10)
        .lean(),
      Order.find()
        .populate('customer', 'name phone whatsapp')
        .sort({ createdAt: -1 })
        .limit(6)
        .lean(),
    ]);

    // Aggregate status counts and remaining balance from lean aggregation results
    const statusCounts: Record<string, number> = {
      pending: 0,
      confirmed: 0,
      cutting: 0,
      stitching: 0,
      quality_check: 0,
      ready: 0,
      delivered: 0,
      on_hold: 0,
      cancelled: 0,
    };

    let totalRemainingPayments = 0;

    for (const row of statusAgg) {
      if (statusCounts[row._id] !== undefined) {
        statusCounts[row._id] = row.count;
      }
      totalRemainingPayments += row.remainingDue || 0;
    }

    const totalOrders = Object.values(statusCounts).reduce((a, b) => a + b, 0);

    return {
      totalOrders,
      todayOrdersCount,
      statusCounts,
      upcomingDeliveries,
      totalRemainingPayments,
      totalCustomers,
      recentOrders,
    };
  }

  /**
   * Tailor portal dashboard for an authenticated customer
   */
  static async getCustomerDashboard(userId: string): Promise<{
    customerProfile: any;
    activeOrders: any[];
    completedOrders: any[];
    measurementProfiles: any[];
  }> {
    const user = await User.findById(userId).populate('customerProfile');
    if (!user) {
      return {
        customerProfile: null,
        activeOrders: [],
        completedOrders: [],
        measurementProfiles: [],
      };
    }

    let customerProfile = user.customerProfile as any;
    if (!customerProfile) {
      const phoneNorm = user.phone ? normalizePakistaniPhone(user.phone) : '';
      if (phoneNorm) {
        customerProfile = await CustomerProfile.findOne({ phone: phoneNorm });
      }
      if (!customerProfile && user.email) {
        customerProfile = await CustomerProfile.findOne({ email: user.email.toLowerCase() });
      }
      if (!customerProfile) {
        customerProfile = await CustomerProfile.create({
          name: user.name || 'Customer',
          phone: phoneNorm || '03000000000',
          email: user.email,
          user: user._id,
        });
      }
      user.customerProfile = customerProfile._id;
      await user.save();
    }

    const customerId = customerProfile._id;

    const [activeOrders, completedOrders, measurementProfiles] = await Promise.all([
      Order.find({
        customer: customerId,
        status: { $ne: 'delivered' },
      })
        .sort({ createdAt: -1 })
        .lean(),
      Order.find({
        customer: customerId,
        status: 'delivered',
      })
        .sort({ actualDeliveredDate: -1, createdAt: -1 })
        .limit(10)
        .lean(),
      MeasurementProfile.find({ customer: customerId })
        .sort({ isDefault: -1, createdAt: -1 })
        .lean(),
    ]);

    return {
      customerProfile,
      activeOrders: activeOrders || [],
      completedOrders: completedOrders || [],
      measurementProfiles: measurementProfiles || [],
    };
  }
}

