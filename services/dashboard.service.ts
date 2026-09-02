import { Order, CustomerProfile, MeasurementProfile, User } from '../models/index.ts';

export class DashboardService {
  /**
   * Fast, lean operational metrics for Pakistani tailor shop admin/staff
   */
  static async getAdminMetrics(): Promise<{
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
      allOrders,
      totalCustomers,
      upcomingDeliveries,
      recentOrders,
    ] = await Promise.all([
      Order.countDocuments({ createdAt: { $gte: today } }),
      Order.find().select('status remainingAmount').lean(),
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

    // Aggregate status counts and remaining balance
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

    for (const order of allOrders) {
      if (statusCounts[order.status] !== undefined) {
        statusCounts[order.status]++;
      }
      if (order.status !== 'cancelled' && order.remainingAmount) {
        totalRemainingPayments += order.remainingAmount;
      }
    }

    return {
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
    const user = await User.findById(userId).populate('customerProfile').lean();
    if (!user || !user.customerProfile) {
      return {
        customerProfile: null,
        activeOrders: [],
        completedOrders: [],
        measurementProfiles: [],
      };
    }

    const customerId = (user.customerProfile as any)._id;

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
      customerProfile: user.customerProfile,
      activeOrders,
      completedOrders,
      measurementProfiles,
    };
  }
}
