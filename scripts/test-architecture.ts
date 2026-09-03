import http from 'node:http';
import { io as ClientIO } from 'socket.io-client';
import chalk from 'chalk';
import app, { server } from '../backend/index.ts';
import { connectDB, disconnectDB } from '../backend/config/db.ts';

const PORT = 5000;

async function runTests() {
  console.log(chalk.bold.cyan('\n======================================================'));
  console.log(chalk.bold.cyan('  Action Tailor - Full Architecture Verification Test  '));
  console.log(chalk.bold.cyan('======================================================\n'));

  await connectDB();
  // Allow server a moment to start
  await new Promise((r) => setTimeout(r, 600));

  const baseUrl = `http://localhost:${PORT}`;
  let adminToken = '';
  let customerToken = '';
  let testCustomerId = '';
  let testOrderId = '';

  try {
    // 1. Root & Health
    console.log(chalk.yellow('\n1. Testing Root and Health endpoints...'));
    const rootRes = await fetch(`${baseUrl}/`).then((r) => r.json());
    if (rootRes.status === 'success' && rootRes.services) {
      console.log(chalk.green('  ✓ GET / returns API and frontend routing information'));
    } else {
      throw new Error('Root endpoint check failed');
    }

    const healthRes = await fetch(`${baseUrl}/api/health`).then((r) => r.json());
    if (healthRes.status === 'healthy') {
      console.log(chalk.green('  ✓ GET /api/health reports system healthy'));
    } else {
      throw new Error('Health check failed');
    }

    // 2. Authentication
    console.log(chalk.yellow('\n2. Testing Authentication & JWT token issuance...'));
    const adminLogin = await fetch(`${baseUrl}/api/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@actiontailor.pk', password: 'Password123' }),
    }).then((r) => r.json());

    if (adminLogin.status === 'success' && adminLogin.data?.token && adminLogin.data?.user?.role === 'admin') {
      adminToken = adminLogin.data.token;
      console.log(chalk.green(`  ✓ Admin authentication successful (Role: ${adminLogin.data.user.role})`));
    } else {
      throw new Error(`Admin signin failed: ${JSON.stringify(adminLogin)}`);
    }

    const customerLogin = await fetch(`${baseUrl}/api/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'tariq@gmail.com', password: 'Password123' }),
    }).then((r) => r.json());

    if (customerLogin.status === 'success' && customerLogin.data?.token && customerLogin.data?.user?.role === 'customer') {
      customerToken = customerLogin.data.token;
      console.log(chalk.green(`  ✓ Customer authentication successful (Role: ${customerLogin.data.user.role})`));
    } else {
      throw new Error(`Customer signin failed: ${JSON.stringify(customerLogin)}`);
    }

    // 3. RBAC & Authorization
    console.log(chalk.yellow('\n3. Testing Role-Based Access Control (RBAC)...'));
    // Admin dashboard accessed by admin -> 200
    const adminDash = await fetch(`${baseUrl}/api/dashboard/admin`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (adminDash.status === 200) {
      console.log(chalk.green('  ✓ Admin can access /api/dashboard/admin (Status: 200)'));
    } else {
      throw new Error(`Admin dash unexpected status: ${adminDash.status}`);
    }

    // Admin dashboard accessed by customer -> 403
    const forbiddenDash = await fetch(`${baseUrl}/api/dashboard/admin`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    if (forbiddenDash.status === 403) {
      console.log(chalk.green('  ✓ Customer blocked from /api/dashboard/admin (Status: 403 Forbidden)'));
    } else {
      throw new Error(`Customer should be blocked from admin dashboard, got status ${forbiddenDash.status}`);
    }

    // Customer dashboard accessed by customer -> 200
    const custDash = await fetch(`${baseUrl}/api/dashboard/customer`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    if (custDash.status === 200) {
      const data = (await custDash.json()).data;
      console.log(chalk.green(`  ✓ Customer dashboard loaded ${data.activeOrders?.length ?? 0} active suits and ${data.measurementProfiles?.length ?? 0} measurement profiles`));
    } else {
      throw new Error(`Customer dash unexpected status: ${custDash.status}`);
    }

    // 4. Pakistani Tailoring Operations
    console.log(chalk.yellow('\n4. Testing Pakistani Tailoring Operations (Customers, Orders, Measurements)...'));
    // List customers
    const custRes = await fetch(`${baseUrl}/api/customers?limit=5`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    }).then((r) => r.json());
    const firstCustomer = custRes.data?.customers?.[0];
    if (firstCustomer) {
      testCustomerId = firstCustomer._id;
      console.log(chalk.green(`  ✓ Customer directory query returned ${custRes.data.customers.length} records. Sample: ${firstCustomer.name} (${firstCustomer.phone})`));
    }

    // Book new suit order
    const orderPayload = {
      customer: testCustomerId,
      clothingCategory: 'shalwaar_qameez',
      quantity: 1,
      measurementSnapshot: {
        qameez: { length: 42, shoulder: 18.5, chest: 40, sleeve: 24.5, collar: 16, ghera: 23 },
        shalwaar: { length: 39, paincha: 8.5, aasan: 17 },
      },
      fabric: { providedBy: 'shop', fabricType: 'Egyptian Cotton Latha', color: 'Pure White' },
      designOptions: { collarStyle: 'ban_collar', cuffStyle: 'single_button', damanStyle: 'round_gol' },
      stitchingPrice: 1800,
      fabricPrice: 2200,
      advancePayment: 2000,
      expectedDeliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    };

    const newOrderRes = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload),
    }).then((r) => r.json());

    if (newOrderRes.status === 'success' && newOrderRes.data?._id) {
      testOrderId = newOrderRes.data._id;
      const o = newOrderRes.data;
      console.log(chalk.green(`  ✓ Order #${o.orderNumber} successfully booked!`));
      console.log(chalk.green(`    • Total: ${o.totalAmount} PKR | Advance: ${o.advancePayment} PKR | Balance Due: ${o.remainingAmount} PKR | Status: ${o.status}`));
    } else {
      throw new Error(`Order booking failed: ${JSON.stringify(newOrderRes)}`);
    }

    // Record balance payment
    const payRes = await fetch(`${baseUrl}/api/payments`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: testOrderId,
        amount: 2000,
        method: 'easypaisa',
        notes: 'Final balance paid via EasyPaisa',
      }),
    }).then((r) => r.json());

    if (payRes.status === 'success' && payRes.data?.order?.remainingAmount === 0) {
      console.log(chalk.green(`  ✓ Balance payment recorded: Remaining balance is now ${payRes.data.order.remainingAmount} PKR (Payment Status: ${payRes.data.order.paymentStatus})`));
    } else {
      throw new Error(`Payment recording failed: ${JSON.stringify(payRes)}`);
    }

    // Advance order workflow
    const advanceRes = await fetch(`${baseUrl}/api/orders/${testOrderId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cutting' }),
    }).then((r) => r.json());

    if (advanceRes.status === 'success' && advanceRes.data?.status === 'cutting') {
      console.log(chalk.green('  ✓ Order status advanced to CUTTING'));
    }

    // 5. Socket.IO Real-Time Connection
    console.log(chalk.yellow('\n5. Testing Real-Time Socket.IO Synchronization...'));
    await new Promise<void>((resolve, reject) => {
      const socket = ClientIO(`http://localhost:${PORT}`, {
        transports: ['websocket'],
      });

      socket.on('connect', () => {
        console.log(chalk.green(`  ✓ Socket.IO client connected with id: ${socket.id}`));
        socket.emit('ping', { test: true });
      });

      socket.on('pong', (data) => {
        console.log(chalk.green(`  ✓ Received pong event from server with timestamp: ${data.timestamp}`));
        socket.disconnect();
        resolve();
      });

      socket.on('connect_error', (err) => {
        reject(err);
      });

      setTimeout(() => reject(new Error('Socket test timeout')), 5000);
    });

    console.log(chalk.bold.green('\n======================================================'));
    console.log(chalk.bold.green('  ALL ARCHITECTURE & BUSINESS LOGIC TESTS PASSED!     '));
    console.log(chalk.bold.green('======================================================\n'));
  } finally {
    server.close();
    await disconnectDB();
  }
}

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(chalk.bold.red('\n✗ Test failed:'), err);
    process.exit(1);
  });
