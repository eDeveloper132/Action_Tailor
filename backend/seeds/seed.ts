import dotenv from 'dotenv';
import chalk from 'chalk';
import { connectDB, disconnectDB } from '../config/db.ts';
import {
  User,
  CustomerProfile,
  MeasurementProfile,
  Order,
  Payment,
  Notification,
  AuditLog,
} from '../models/index.ts';

dotenv.config();

export async function runSeeder(): Promise<void> {
  console.log(chalk.cyan.bold('\n======================================================'));
  console.log(chalk.cyan.bold('  Action Tailor - Pakistani Tailor Shop Data Seeder   '));
  console.log(chalk.cyan.bold('======================================================\n'));

  try {
    await connectDB();

    console.log(chalk.yellow('1. Clearing existing tailoring test data...'));
    await Promise.all([
      User.deleteMany({}),
      CustomerProfile.deleteMany({}),
      MeasurementProfile.deleteMany({}),
      Order.deleteMany({}),
      Payment.deleteMany({}),
      Notification.deleteMany({}),
      AuditLog.deleteMany({}),
    ]);
    console.log(chalk.green('✓ Collections cleared successfully.\n'));

    // ==========================================
    // 2. SEED USERS (Admin, Staff, Customer)
    // ==========================================
    console.log(chalk.yellow('2. Seeding Users (Master Tailor, Staff Cutter, Customers)...'));

    const adminUser = await User.create({
      name: 'Ustad Aslam / استاد اسلم',
      email: 'admin@actiontailor.pk',
      password: 'Password123',
      role: 'admin',
      phone: '03001234567',
    });

    const staffUser = await User.create({
      name: 'Karigar Rasheed / کاریگر رشید',
      email: 'staff@actiontailor.pk',
      password: 'Password123',
      role: 'staff',
      phone: '03123456789',
    });

    const customerUser1 = await User.create({
      name: 'Tariq Mehmood / طارق محمود',
      email: 'tariq@gmail.com',
      password: 'Password123',
      role: 'customer',
      phone: '03331122334',
    });

    const customerUser2 = await User.create({
      name: 'Zubair Ahmed / زبیر احمد',
      email: 'zubair@gmail.com',
      password: 'Password123',
      role: 'customer',
      phone: '03455566778',
    });

    console.log(chalk.green(`✓ Created 4 Users (Admin: ${adminUser.email}, Staff: ${staffUser.email}).\n`));

    // ==========================================
    // 3. SEED CUSTOMER PROFILES
    // ==========================================
    console.log(chalk.yellow('3. Seeding Pakistani Tailor Customer Profiles...'));

    const customersData = [
      {
        name: 'Chaudhry Nadeem / چوہدری ندیم',
        phone: '03214567890',
        whatsapp: '03214567890',
        city: 'Lahore',
        address: 'House 14-B, Gulberg III, Lahore',
        notes: 'Prefers classic Ban collar, soft patti, double button cuff',
        totalOrders: 2,
      },
      {
        name: 'Haji Abdul Sattar / حاجی عبدالستار',
        phone: '03009876543',
        whatsapp: '03009876543',
        city: 'Faisalabad',
        address: 'Bazaar 4, D-Ground, Peoples Colony, Faisalabad',
        notes: 'Needs loose fit Kurta with round gol daman and side pockets',
        totalOrders: 1,
      },
      {
        name: 'Tariq Mehmood / طارق محمود',
        phone: '03331122334',
        whatsapp: '03331122334',
        city: 'Lahore',
        address: 'Model Town, Block C, Lahore',
        notes: 'Prefers Boski & Wash-and-Wear fabric, slim fit cut',
        totalOrders: 1,
        user: customerUser1._id,
      },
      {
        name: 'Zubair Ahmed / زبیر احمد',
        phone: '03455566778',
        whatsapp: '03455566778',
        city: 'Rawalpindi',
        address: 'Bank Road, Saddar, Rawalpindi',
        notes: 'Wants double mobile pockets in Shalwaar and front chest pocket',
        totalOrders: 1,
        user: customerUser2._id,
      },
      {
        name: 'Mian Kashif / میاں کاشف',
        phone: '03018899001',
        whatsapp: '03018899001',
        city: 'Gujranwala',
        address: 'Satellite Town, Gujranwala',
        notes: 'Prefers Karandi and heavy winter cloth stitching',
        totalOrders: 1,
      },
      {
        name: 'Dr. Salman Khan / ڈاکٹر سلمان خان',
        phone: '03023344556',
        whatsapp: '03023344556',
        city: 'Karachi',
        address: 'Khayaban-e-Shamsheer, DHA Phase 5, Karachi',
        notes: 'Slim modern fit with open sleeve (gol bazu)',
        totalOrders: 1,
      },
    ];

    const customers = await CustomerProfile.insertMany(customersData);

    // Link customer profiles back to user records
    await User.findByIdAndUpdate(customerUser1._id, { customerProfile: customers[2]._id });
    await User.findByIdAndUpdate(customerUser2._id, { customerProfile: customers[3]._id });

    console.log(chalk.green(`✓ Created ${customers.length} Pakistani Customer Profiles.\n`));

    // ==========================================
    // 4. SEED MEASUREMENT PROFILES
    // ==========================================
    console.log(chalk.yellow('4. Seeding Pakistani Tailoring Measurement Profiles...'));

    const measurementsData = [
      // Chaudhry Nadeem
      {
        customer: customers[0]._id,
        title: 'Regular Fit - Shalwaar Qameez',
        clothingCategory: 'shalwaar_qameez',
        unit: 'inches',
        measurements: {
          qameez: { length: 42, shoulder: 19, chest: 23, waist: 22, sleeve: 25, collar: 16.5, cuff: 9.5, ghera: 24.5 },
          shalwaar: { length: 39.5, paincha: 9, aasan: 17.5, waist: 26 },
        },
        isDefault: true,
      },
      // Haji Abdul Sattar
      {
        customer: customers[1]._id,
        title: 'Loose Fit - Kurta Pajama',
        clothingCategory: 'kurta_pajama',
        unit: 'inches',
        measurements: {
          qameez: { length: 43, shoulder: 19.5, chest: 24, waist: 23.5, sleeve: 24, collar: 17, cuff: 10, ghera: 26 },
          shalwaar: { length: 38, paincha: 9.5, aasan: 18, waist: 27 },
        },
        isDefault: true,
      },
      // Tariq Mehmood
      {
        customer: customers[2]._id,
        title: 'Eid 2026 Fitted / عید کلیکشن',
        clothingCategory: 'shalwaar_qameez',
        unit: 'inches',
        measurements: {
          qameez: { length: 40.5, shoulder: 18, chest: 21.5, waist: 20, sleeve: 24, collar: 15.5, cuff: 9, ghera: 22.5 },
          shalwaar: { length: 38.5, paincha: 8.5, aasan: 16.5, waist: 24 },
        },
        isDefault: true,
      },
      // Zubair Ahmed
      {
        customer: customers[3]._id,
        title: 'Smart Waistcoat & Suit / واسکٹ ناپ',
        clothingCategory: 'waistcoat',
        unit: 'inches',
        measurements: {
          qameez: { length: 41, shoulder: 18.5, chest: 22, waist: 21, sleeve: 24.5, collar: 16, cuff: 9, ghera: 23 },
          shalwaar: { length: 39, paincha: 8.5, aasan: 17, waist: 25 },
        },
        isDefault: true,
      },
      // Dr. Salman Khan
      {
        customer: customers[5]._id,
        title: 'Slim Fit Kurta / سلم فٹ کرتہ',
        clothingCategory: 'kurta_pajama',
        unit: 'inches',
        measurements: {
          qameez: { length: 41, shoulder: 18, chest: 21, waist: 19.5, sleeve: 25, collar: 15.5, cuff: 9, ghera: 22 },
          shalwaar: { length: 39, paincha: 8, aasan: 16, waist: 23 },
        },
        isDefault: true,
      },
    ];

    const measurementProfiles = await MeasurementProfile.insertMany(measurementsData);
    console.log(chalk.green(`✓ Created ${measurementProfiles.length} Measurement Profiles.\n`));

    // ==========================================
    // 5. SEED ORDERS & WORKFLOW STATUSES
    // ==========================================
    console.log(chalk.yellow('5. Seeding Orders with Pakistani Garment Specs & Balances...'));

    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    const ordersData = [
      // 1. Delivered Suit
      {
        orderNumber: 'AT-1001',
        customer: customers[0]._id,
        measurementProfile: measurementProfiles[0]._id,
        measurementSnapshot: measurementProfiles[0].measurements,
        clothingCategory: 'shalwaar_qameez',
        quantity: 1,
        fabric: { providedBy: 'customer', fabricType: 'Boski / بوسکی', color: 'Cream Off-White / کریمی' },
        designOptions: {
          collarStyle: 'ban_collar',
          cuffStyle: 'single_button',
          damanStyle: 'round_gol',
          shalwaarStyle: 'simple_shalwaar',
          pocketOption: 'front_and_side',
        },
        stitchingPrice: 3000,
        fabricPrice: 0,
        totalAmount: 3000,
        advancePayment: 3000,
        remainingAmount: 0,
        paymentStatus: 'paid',
        status: 'delivered',
        expectedDeliveryDate: new Date(now - 2 * dayMs),
        actualDeliveredDate: new Date(now - 1 * dayMs),
        statusHistory: [
          { status: 'pending', updatedAt: new Date(now - 10 * dayMs), updatedBy: 'Master Ji', notes: 'Booked' },
          { status: 'cutting', updatedAt: new Date(now - 8 * dayMs), updatedBy: 'Rasheed Cutter', notes: 'Cutting complete' },
          { status: 'stitching', updatedAt: new Date(now - 6 * dayMs), updatedBy: 'Karigar', notes: 'Stitching finished' },
          { status: 'ready', updatedAt: new Date(now - 3 * dayMs), updatedBy: 'Master Ji', notes: 'Suit ironed & ready' },
          { status: 'delivered', updatedAt: new Date(now - 1 * dayMs), updatedBy: 'Master Ji', notes: 'Handed over to customer' },
        ],
        createdBy: adminUser._id,
      },

      // 2. Ready Suit (Due in 1 day)
      {
        orderNumber: 'AT-1002',
        customer: customers[1]._id,
        measurementProfile: measurementProfiles[1]._id,
        measurementSnapshot: measurementProfiles[1].measurements,
        clothingCategory: 'kurta_pajama',
        quantity: 1,
        fabric: { providedBy: 'shop', fabricType: 'Egyptian Cotton / کاٹن', color: 'Pure White / سفید' },
        designOptions: {
          collarStyle: 'ban_collar',
          cuffStyle: 'open_sleeve',
          damanStyle: 'round_gol',
          shalwaarStyle: 'trouser_pajama',
          pocketOption: 'side_only',
        },
        stitchingPrice: 2400,
        fabricPrice: 1200,
        totalAmount: 3600,
        advancePayment: 2000,
        remainingAmount: 1600,
        paymentStatus: 'partially_paid',
        status: 'ready',
        expectedDeliveryDate: new Date(now + 1 * dayMs),
        statusHistory: [
          { status: 'pending', updatedAt: new Date(now - 5 * dayMs), updatedBy: 'Master Ji', notes: 'Order initiated' },
          { status: 'cutting', updatedAt: new Date(now - 3 * dayMs), updatedBy: 'Rasheed Cutter', notes: 'Cut' },
          { status: 'stitching', updatedAt: new Date(now - 2 * dayMs), updatedBy: 'Karigar', notes: 'Stitched' },
          { status: 'ready', updatedAt: new Date(now - 2 * 60 * 60 * 1000), updatedBy: 'Master Ji', notes: 'Packed & Ready for customer pickup' },
        ],
        createdBy: adminUser._id,
      },

      // 3. In Stitching (Due in 2 days)
      {
        orderNumber: 'AT-1003',
        customer: customers[2]._id,
        measurementProfile: measurementProfiles[2]._id,
        measurementSnapshot: measurementProfiles[2].measurements,
        clothingCategory: 'shalwaar_qameez',
        quantity: 1,
        fabric: { providedBy: 'customer', fabricType: 'Karandi / کرنڈی', color: 'Navy Blue / نیوی بلیو' },
        designOptions: {
          collarStyle: 'ban_collar',
          cuffStyle: 'double_button',
          damanStyle: 'straight_chors',
          shalwaarStyle: 'simple_shalwaar',
          pocketOption: 'front_and_side',
        },
        stitchingPrice: 2800,
        fabricPrice: 0,
        totalAmount: 2800,
        advancePayment: 1500,
        remainingAmount: 1300,
        paymentStatus: 'partially_paid',
        status: 'stitching',
        expectedDeliveryDate: new Date(now + 2 * dayMs),
        statusHistory: [
          { status: 'pending', updatedAt: new Date(now - 4 * dayMs), updatedBy: 'Staff', notes: 'Booked for Eid' },
          { status: 'cutting', updatedAt: new Date(now - 2 * dayMs), updatedBy: 'Rasheed Cutter', notes: 'Cutting complete' },
          { status: 'stitching', updatedAt: new Date(now - 1 * dayMs), updatedBy: 'Karigar', notes: 'On stitching machine' },
        ],
        createdBy: staffUser._id,
      },

      // 4. In Cutting (Due in 3 days)
      {
        orderNumber: 'AT-1004',
        customer: customers[3]._id,
        measurementProfile: measurementProfiles[3]._id,
        measurementSnapshot: measurementProfiles[3].measurements,
        clothingCategory: 'waistcoat',
        quantity: 1,
        fabric: { providedBy: 'customer', fabricType: 'Jamawar / جامہ وار', color: 'Maroon / گہرا سرخ' },
        designOptions: {
          collarStyle: 'ban_collar',
          pocketOption: 'front_and_side',
        },
        stitchingPrice: 3500,
        fabricPrice: 0,
        totalAmount: 3500,
        advancePayment: 2000,
        remainingAmount: 1500,
        paymentStatus: 'partially_paid',
        status: 'cutting',
        expectedDeliveryDate: new Date(now + 3 * dayMs),
        statusHistory: [
          { status: 'pending', updatedAt: new Date(now - 2 * dayMs), updatedBy: 'Staff', notes: 'Booked wedding waistcoat' },
          { status: 'cutting', updatedAt: new Date(now - 6 * 60 * 60 * 1000), updatedBy: 'Rasheed Cutter', notes: 'Marked on cutting table' },
        ],
        createdBy: staffUser._id,
      },

      // 5. Confirmed Suit (Due in 5 days)
      {
        orderNumber: 'AT-1005',
        customer: customers[4]._id,
        clothingCategory: 'shalwaar_qameez',
        measurementSnapshot: {
          qameez: { length: 42, shoulder: 18.5, chest: 22, waist: 21, sleeve: 24.5, collar: 16, cuff: 9, ghera: 23 },
          shalwaar: { length: 39, paincha: 8.5, aasan: 17, waist: 25 },
        },
        quantity: 1,
        fabric: { providedBy: 'customer', fabricType: 'Wash & Wear / واش اینڈ ویئر', color: 'Steel Grey / سرمئی' },
        designOptions: {
          collarStyle: 'regular',
          cuffStyle: 'single_button',
          damanStyle: 'round_gol',
          shalwaarStyle: 'simple_shalwaar',
        },
        stitchingPrice: 2500,
        fabricPrice: 0,
        totalAmount: 2500,
        advancePayment: 1000,
        remainingAmount: 1500,
        paymentStatus: 'partially_paid',
        status: 'confirmed',
        expectedDeliveryDate: new Date(now + 5 * dayMs),
        statusHistory: [
          { status: 'pending', updatedAt: new Date(now - 1 * dayMs), updatedBy: 'Master Ji', notes: 'Booked' },
          { status: 'confirmed', updatedAt: new Date(now - 12 * 60 * 60 * 1000), updatedBy: 'Master Ji', notes: 'Fabric verified' },
        ],
        createdBy: adminUser._id,
      },

      // 6. Pending Sherwani (Due in 10 days)
      {
        orderNumber: 'AT-1006',
        customer: customers[5]._id,
        measurementProfile: measurementProfiles[4]._id,
        measurementSnapshot: measurementProfiles[4].measurements,
        clothingCategory: 'sherwani',
        quantity: 1,
        fabric: { providedBy: 'shop', fabricType: 'Raw Silk & Embroidery / سلک اور کڑھائی', color: 'Golden Ivory / سنہرا' },
        designOptions: {
          collarStyle: 'ban_collar',
          cuffStyle: 'french',
          pocketOption: 'front_and_side',
        },
        stitchingPrice: 8000,
        fabricPrice: 4000,
        totalAmount: 12000,
        advancePayment: 5000,
        remainingAmount: 7000,
        paymentStatus: 'partially_paid',
        status: 'pending',
        expectedDeliveryDate: new Date(now + 10 * dayMs),
        statusHistory: [
          { status: 'pending', updatedAt: new Date(now - 4 * 60 * 60 * 1000), updatedBy: 'Master Ji', notes: 'Groom Sherwani booked' },
        ],
        createdBy: adminUser._id,
      },
    ];

    const orders = await Order.insertMany(ordersData);
    console.log(chalk.green(`✓ Created ${orders.length} Orders across pipeline (pending, cutting, stitching, ready, delivered).\n`));

    // ==========================================
    // 6. SEED PAYMENTS
    // ==========================================
    console.log(chalk.yellow('6. Seeding Payment Transactions (Cash, JazzCash, EasyPaisa)...'));

    const paymentsData = [
      {
        order: orders[0]._id,
        customer: customers[0]._id,
        amount: 3000,
        type: 'final',
        method: 'cash',
        transactionReference: 'CASH-REC-001',
        receivedBy: adminUser._id,
        notes: 'Full payment cleared in cash upon delivery',
      },
      {
        order: orders[1]._id,
        customer: customers[1]._id,
        amount: 2000,
        type: 'advance',
        method: 'jazzcash',
        transactionReference: 'JC-883921938',
        receivedBy: adminUser._id,
        notes: 'JazzCash mobile account transfer',
      },
      {
        order: orders[2]._id,
        customer: customers[2]._id,
        amount: 1500,
        type: 'advance',
        method: 'easypaisa',
        transactionReference: 'EP-994012847',
        receivedBy: staffUser._id,
        notes: 'EasyPaisa advance recorded',
      },
      {
        order: orders[3]._id,
        customer: customers[3]._id,
        amount: 2000,
        type: 'advance',
        method: 'cash',
        transactionReference: 'CASH-REC-002',
        receivedBy: staffUser._id,
        notes: 'Advance cash token for wedding waistcoat',
      },
      {
        order: orders[4]._id,
        customer: customers[4]._id,
        amount: 1000,
        type: 'advance',
        method: 'cash',
        receivedBy: adminUser._id,
        notes: 'Advance at counter',
      },
      {
        order: orders[5]._id,
        customer: customers[5]._id,
        amount: 5000,
        type: 'advance',
        method: 'bank_transfer',
        transactionReference: 'MBL-PK-7749201',
        receivedBy: adminUser._id,
        notes: 'Meezan Bank online transfer for sherwani booking',
      },
    ];

    const payments = await Payment.insertMany(paymentsData);
    console.log(chalk.green(`✓ Created ${payments.length} Payment transaction records.\n`));

    // ==========================================
    // 7. SEED NOTIFICATIONS & AUDIT LOGS
    // ==========================================
    console.log(chalk.yellow('7. Seeding Notifications & Audit Logs...'));

    await Notification.create({
      recipient: customerUser1._id,
      title: 'آرڈر سلائی پر ہے / Order In Stitching',
      message: 'آپ کا سوٹ نمبر AT-1003 کاریگر کے پاس سلائی کی حالت میں ہے۔',
      type: 'status_changed',
      relatedOrder: orders[2]._id,
    });

    await Notification.create({
      recipient: customerUser2._id,
      title: 'آرڈر تیار ہے / Suit Ready For Pickup',
      message: 'آپ کا واسکٹ سوٹ نمبر AT-1004 کٹائی مکمل ہو چکی ہے۔',
      type: 'status_changed',
      relatedOrder: orders[3]._id,
    });

    await AuditLog.create({
      action: 'ORDER_STATUS_CHANGED',
      performedBy: adminUser._id,
      entityType: 'order',
      entityId: orders[1]._id.toString(),
      details: { from: 'stitching', to: 'ready', orderNumber: 'AT-1002' },
    });

    console.log(chalk.green('✓ Notifications & Audit logs created.\n'));

    console.log(chalk.cyan.bold('======================================================'));
    console.log(chalk.green.bold('  SUCCESS: Database Seeded with Pakistani Tailor Data!'));
    console.log(chalk.cyan.bold('======================================================\n'));
    console.log(chalk.white('Demo Login Credentials:'));
    console.log(chalk.white('  • Master Tailor (Admin): ') + chalk.bold.yellow('admin@actiontailor.pk') + ' / ' + chalk.bold.yellow('Password123'));
    console.log(chalk.white('  • Karigar / Staff:       ') + chalk.bold.yellow('staff@actiontailor.pk') + ' / ' + chalk.bold.yellow('Password123'));
    console.log(chalk.white('  • Customer Account 1:    ') + chalk.bold.yellow('tariq@gmail.com') + ' / ' + chalk.bold.yellow('Password123'));
    console.log(chalk.white('  • Customer Account 2:    ') + chalk.bold.yellow('zubair@gmail.com') + ' / ' + chalk.bold.yellow('Password123'));
    console.log('\n');

  } catch (err: any) {
    console.error(chalk.red.bold('Error during seeding:'), err);
    throw err;
  } finally {
    await disconnectDB();
  }
}

// Auto-run when executed directly via CLI
runSeeder()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
