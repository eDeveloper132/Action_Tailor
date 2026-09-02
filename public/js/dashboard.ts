import { renderNavbar, showToast, showModal } from '../ui_components/index.ts';

// Global state
let currentUser: any = null;
let currentCustomers: any[] = [];
let allOrdersCache: any[] = [];
let socket: any = null;

// ==========================================
// 1. Initial Page Boot & Navbar
// ==========================================
async function initDashboard(): Promise<void> {
  // Mount reusable responsive navbar
  renderNavbar('navbarMount', {
    brandName: 'Action Tailor',
    logoIcon: '⚡',
    activeLink: 'dashboard',
    showAuthButton: true,
  });

  setupTabSwitching();
  setupModalHandlers();
  setupSocketIO();

  try {
    const meRes = await (window as any).ActionTailor.apiFetch('/api/auth/me');
    currentUser = meRes.data;

    const greetingEl = document.getElementById('userGreeting');
    const subEl = document.getElementById('userSub');
    const roleBadge = document.getElementById('roleBadge');

    if (greetingEl && currentUser) {
      greetingEl.textContent = `Action Tailor • ${currentUser.name || 'Master Tailor'}`;
    }

    if (roleBadge && currentUser) {
      const isStaffOrAdmin = currentUser.role === 'admin' || currentUser.role === 'staff';
      roleBadge.textContent = isStaffOrAdmin ? 'Tailor Shop Desk / ماسٹر درزی' : 'Customer Portal / کسٹمر پورٹل';
      roleBadge.className = isStaffOrAdmin
        ? 'px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-600/20 text-brand-400 border border-brand-500/30'
        : 'px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
    }

    // Load initial data based on role
    if (currentUser.role === 'admin' || currentUser.role === 'staff') {
      await loadAdminDashboard();
      await loadCustomersList();
    } else {
      await loadCustomerPortal();
    }
  } catch (err: any) {
    console.error('Initialization error:', err);
    showToast('Failed to load user profile', 'error');
  }
}

// ==========================================
// 2. Admin / Shop Operations Loader
// ==========================================
async function loadAdminDashboard(): Promise<void> {
  try {
    const res = await (window as any).ActionTailor.apiFetch('/api/dashboard/admin');
    const data = res.data;

    renderMetricCards(data);
    renderUpcomingDeliveries(data.upcomingDeliveries || []);
    await loadOrdersList();
  } catch (err: any) {
    showToast('Failed to load shop metrics', 'error');
  }
}

function renderMetricCards(metrics: any): void {
  const container = document.getElementById('metricsRow');
  if (!container) return;

  const cards = [
    {
      title: "Today's Orders / آج کے",
      value: metrics.todayOrdersCount || 0,
      color: 'text-brand-400',
      border: 'border-brand-500/20',
      icon: '✂',
    },
    {
      title: 'Cutting / کٹائی پر',
      value: metrics.statusCounts?.cutting || 0,
      color: 'text-sky-400',
      border: 'border-sky-500/20',
      icon: '📐',
    },
    {
      title: 'In Stitching / سلائی پر',
      value: metrics.statusCounts?.stitching || 0,
      color: 'text-purple-400',
      border: 'border-purple-500/20',
      icon: '🧵',
    },
    {
      title: 'Ready / تیار سوٹ',
      value: metrics.statusCounts?.ready || 0,
      color: 'text-emerald-400',
      border: 'border-emerald-500/20',
      icon: '✓',
    },
    {
      title: 'Unpaid Balance / بقایا',
      value: `${(metrics.totalRemainingPayments || 0).toLocaleString()} PKR`,
      color: 'text-amber-400',
      border: 'border-amber-500/20',
      icon: '💰',
    },
  ];

  container.innerHTML = cards
    .map(
      (c) => `
    <div class="tailor-card p-3.5 sm:p-4 rounded-2xl border ${c.border}">
      <div class="flex items-center justify-between text-xs text-slate-400 mb-1">
        <span>${c.title}</span>
        <span>${c.icon}</span>
      </div>
      <div class="text-xl sm:text-2xl font-bold ${c.color} tracking-tight">${c.value}</div>
    </div>
  `
    )
    .join('');
}

// ==========================================
// 3. Orders List & Workflow Actions
// ==========================================
async function loadOrdersList(): Promise<void> {
  const container = document.getElementById('ordersListContainer');
  if (!container) return;

  try {
    const searchInput = (document.getElementById('orderSearchInput') as HTMLInputElement)?.value || '';
    const statusSelect = (document.getElementById('statusFilterSelect') as HTMLSelectElement)?.value || '';

    let url = '/api/orders?limit=50';
    if (searchInput) url += `&search=${encodeURIComponent(searchInput)}`;
    if (statusSelect) url += `&status=${encodeURIComponent(statusSelect)}`;

    const res = await (window as any).ActionTailor.apiFetch(url);
    const orders = res.data?.orders || [];
    allOrdersCache = orders;

    if (orders.length === 0) {
      container.innerHTML = `
        <div class="p-8 text-center rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 text-slate-500 text-sm">
          No orders found matching criteria / کوئی آرڈر نہیں ملا
        </div>
      `;
      return;
    }

    container.innerHTML = orders.map((order: any) => renderOrderCard(order)).join('');
    attachOrderEventListeners();
  } catch (err: any) {
    container.innerHTML = `<div class="text-rose-400 text-sm p-4">Error loading orders: ${err.message}</div>`;
  }
}

function getStatusBadge(status: string): string {
  const labels: Record<string, { text: string; class: string }> = {
    pending: { text: 'Pending / زیرِ التوا', class: 'status-pending' },
    confirmed: { text: 'Confirmed / تصدیق', class: 'status-confirmed' },
    cutting: { text: 'Cutting / کٹائی', class: 'status-cutting' },
    stitching: { text: 'Stitching / سلائی', class: 'status-stitching' },
    quality_check: { text: 'Checking / معائنہ', class: 'status-quality_check' },
    ready: { text: 'Ready / تیار ہے', class: 'status-ready' },
    delivered: { text: 'Delivered / دیا گیا', class: 'status-delivered' },
    cancelled: { text: 'Cancelled / منسوخ', class: 'status-cancelled' },
  };

  const item = labels[status] || { text: status, class: 'status-pending' };
  return `<span class="status-badge ${item.class}">${item.text}</span>`;
}

function getNextStatus(current: string): string | null {
  const flow: Record<string, string> = {
    pending: 'cutting',
    confirmed: 'cutting',
    cutting: 'stitching',
    stitching: 'ready',
    ready: 'delivered',
  };
  return flow[current] || null;
}

function renderOrderCard(order: any): string {
  const nextStatus = getNextStatus(order.status);
  const isPaid = order.remainingAmount === 0;
  const customerName = order.customer?.name || 'Customer';
  const customerPhone = order.customer?.phone || '';
  const deliveryFormatted = order.expectedDeliveryDate
    ? new Date(order.expectedDeliveryDate).toLocaleDateString('en-GB')
    : '--';

  return `
    <div class="tailor-card p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4" data-order-id="${order._id}">
      <!-- Left: Order Code & Customer -->
      <div class="space-y-1">
        <div class="flex items-center gap-2">
          <span class="font-mono font-extrabold text-white text-base tracking-wider">${order.orderNumber}</span>
          ${getStatusBadge(order.status)}
          <span class="text-xs px-2 py-0.5 rounded ${isPaid ? 'payment-paid' : 'payment-partial'}">
            ${isPaid ? 'Paid / ادا شدہ' : `Due: ${order.remainingAmount} PKR`}
          </span>
        </div>
        <div class="text-xs sm:text-sm font-semibold text-slate-200 flex items-center gap-2">
          <span>${customerName}</span>
          ${
            customerPhone
              ? `<a href="https://wa.me/92${customerPhone.replace(/\D/g, '').replace(/^0/, '')}" target="_blank" class="text-emerald-400 hover:underline flex items-center gap-1 text-xs">
                  <span>💬</span> <span>${customerPhone}</span>
                </a>`
              : ''
          }
        </div>
        <div class="text-xs text-slate-400">
          <span>${order.clothingCategory.replace('_', ' ').toUpperCase()}</span> •
          <span>Delivery: <strong class="text-slate-300">${deliveryFormatted}</strong></span>
          ${order.fabric?.fabricType ? ` • <span>${order.fabric.fabricType}</span>` : ''}
        </div>
      </div>

      <!-- Right: Action Buttons -->
      <div class="flex flex-wrap items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
        ${
          nextStatus
            ? `<button class="btn-advance-status px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold flex items-center gap-1" data-id="${order._id}" data-next="${nextStatus}">
                <span>Move to ${nextStatus.toUpperCase()} ➔</span>
              </button>`
            : ''
        }
        
        ${
          !isPaid
            ? `<button class="btn-quick-pay px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold" data-id="${order._id}" data-num="${order.orderNumber}" data-rem="${order.remainingAmount}">
                + Payment / وصولی
              </button>`
            : ''
        }

        <button class="btn-print-slip p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700" title="Print Slip / پرچی" data-id="${order._id}">
          🖨 Slip
        </button>
      </div>
    </div>
  `;
}

function attachOrderEventListeners(): void {
  // Advance Status Click
  document.querySelectorAll('.btn-advance-status').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const target = e.currentTarget as HTMLElement;
      const orderId = target.dataset.id;
      const nextStatus = target.dataset.next;
      if (!orderId || !nextStatus) return;

      try {
        target.textContent = 'Updating...';
        await (window as any).ActionTailor.apiFetch(`/api/orders/${orderId}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status: nextStatus }),
        });
        showToast(`Order status moved to ${nextStatus.toUpperCase()}`, 'success');
        await loadAdminDashboard();
      } catch (err: any) {
        showToast(err.message, 'error');
      }
    });
  });

  // Quick Payment Click
  document.querySelectorAll('.btn-quick-pay').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const target = e.currentTarget as HTMLElement;
      const orderId = target.dataset.id;
      const orderNum = target.dataset.num;
      const remaining = target.dataset.rem;

      openPaymentModal(orderId || '', orderNum || '', remaining || '0');
    });
  });

  // Print Slip Click
  document.querySelectorAll('.btn-print-slip').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const target = e.currentTarget as HTMLElement;
      const orderId = target.dataset.id;
      if (orderId) printOrderSlip(orderId);
    });
  });
}

// ==========================================
// 4. Upcoming Deliveries Loader
// ==========================================
function renderUpcomingDeliveries(deliveries: any[]): void {
  const container = document.getElementById('upcomingDeliveriesContainer');
  if (!container) return;

  if (deliveries.length === 0) {
    container.innerHTML = `
      <div class="p-6 text-center text-slate-500 text-xs sm:text-sm bg-slate-900/40 rounded-xl border border-slate-800">
        No immediate deliveries scheduled in next 3 days / اگلے تین دن میں کوئی ڈیلیوری نہیں ہے
      </div>
    `;
    return;
  }

  container.innerHTML = deliveries
    .map(
      (order: any) => `
    <div class="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
      <div>
        <span class="font-mono font-bold text-white text-xs sm:text-sm">${order.orderNumber}</span>
        <span class="text-xs text-slate-300 font-semibold ml-2">${order.customer?.name || 'Customer'}</span>
        <span class="text-xs text-slate-400 ml-2">(${order.customer?.phone || ''})</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-xs text-amber-400 font-medium">Due: ${new Date(order.expectedDeliveryDate).toLocaleDateString()}</span>
        ${getStatusBadge(order.status)}
      </div>
    </div>
  `
    )
    .join('');
}

// ==========================================
// 5. Customers List & Booking Selector Loader
// ==========================================
async function loadCustomersList(): Promise<void> {
  try {
    const res = await (window as any).ActionTailor.apiFetch('/api/customers?limit=100');
    currentCustomers = res.data?.customers || [];

    // Populate Booking Modal Customer Select
    const customerSelect = document.getElementById('orderCustomerSelect') as HTMLSelectElement | null;
    if (customerSelect) {
      customerSelect.innerHTML =
        '<option value="">Select customer / گاہک منتخب کریں</option>' +
        currentCustomers
          .map((c) => `<option value="${c._id}">${c.name} (${c.phone} - ${c.city || 'Lahore'})</option>`)
          .join('');
    }

    renderCustomersDirectory(currentCustomers);
  } catch (err: any) {
    console.error('Customer load error:', err);
  }
}

function renderCustomersDirectory(customers: any[]): void {
  const container = document.getElementById('customersListContainer');
  if (!container) return;

  if (customers.length === 0) {
    container.innerHTML = '<div class="text-slate-500 text-xs sm:text-sm">No customers registered yet.</div>';
    return;
  }

  container.innerHTML = customers
    .map(
      (c) => `
    <div class="tailor-card p-4 rounded-2xl space-y-2">
      <div class="flex justify-between items-start">
        <h3 class="font-bold text-white text-sm sm:text-base">${c.name}</h3>
        <span class="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">${c.totalOrders || 0} Orders</span>
      </div>
      <div class="text-xs text-slate-300 flex items-center gap-2">
        <span>📞 ${c.phone}</span>
        ${c.city ? `<span>• ${c.city}</span>` : ''}
      </div>
      ${c.address ? `<div class="text-xs text-slate-400 truncate">📍 ${c.address}</div>` : ''}
      ${c.notes ? `<div class="text-xs text-brand-400/90 italic truncate">${c.notes}</div>` : ''}
    </div>
  `
    )
    .join('');
}

// ==========================================
// 6. Customer Portal (When Customer Signs In)
// ==========================================
async function loadCustomerPortal(): Promise<void> {
  const ordersQueueTab = document.getElementById('tabOrders');
  const quickActions = document.getElementById('adminQuickActions');
  if (quickActions) quickActions.classList.add('hidden');

  try {
    const res = await (window as any).ActionTailor.apiFetch('/api/dashboard/customer');
    const { activeOrders, completedOrders, measurementProfiles } = res.data;

    if (ordersQueueTab) {
      ordersQueueTab.innerHTML = `
        <div class="space-y-6">
          <div class="p-4 rounded-2xl bg-brand-600/10 border border-brand-500/20 text-slate-200">
            <h2 class="text-lg font-bold text-white mb-1">Your Active Stitching Orders / آپ کے زیرِ عمل آرڈرز</h2>
            <p class="text-xs text-slate-400">Track real-time cutting and stitching progress of your suits.</p>
          </div>

          <!-- Active Orders with Milestone Stepper -->
          <div class="space-y-4">
            ${
              activeOrders.length === 0
                ? '<div class="p-6 text-center text-slate-500 text-sm bg-slate-900/40 rounded-xl">No active suits in tailoring right now.</div>'
                : activeOrders.map((o: any) => renderCustomerActiveOrderCard(o)).join('')
            }
          </div>

          <!-- Saved Measurement Profiles -->
          <div class="mt-8">
            <h3 class="text-base font-bold text-white mb-3">Your Saved Measurements / آپ کے محفوظ شدہ ناپ</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              ${
                measurementProfiles.length === 0
                  ? '<div class="text-slate-500 text-xs">No measurement profile on record. Tailor will record on next visit.</div>'
                  : measurementProfiles.map((m: any) => renderMeasurementCard(m)).join('')
              }
            </div>
          </div>
        </div>
      `;
    }
  } catch (err: any) {
    showToast('Failed to load customer orders', 'error');
  }
}

function renderCustomerActiveOrderCard(order: any): string {
  const steps = [
    { key: 'pending', label: 'Booked / بک ہوا' },
    { key: 'cutting', label: 'Cutting / کٹائی' },
    { key: 'stitching', label: 'Stitching / سلائی' },
    { key: 'ready', label: 'Ready / تیار ہے' },
  ];

  const currentIdx = steps.findIndex((s) => s.key === order.status);

  return `
    <div class="tailor-card p-5 rounded-2xl space-y-4">
      <div class="flex justify-between items-center flex-wrap gap-2">
        <div>
          <span class="font-mono text-lg font-bold text-white">${order.orderNumber}</span>
          <span class="text-xs text-slate-400 ml-2">${order.clothingCategory.toUpperCase()}</span>
        </div>
        <div>${getStatusBadge(order.status)}</div>
      </div>

      <!-- Stepper -->
      <div class="workflow-stepper py-3">
        ${steps
          .map((step, idx) => {
            const isCompleted = currentIdx > idx;
            const isActive = currentIdx === idx;
            const stateClass = isCompleted ? 'completed' : isActive ? 'active' : '';
            return `
            <div class="step-node ${stateClass}">
              <div class="step-circle">${isCompleted ? '✓' : idx + 1}</div>
              <div class="step-label">${step.label}</div>
            </div>
          `;
          })
          .join('')}
      </div>

      <div class="flex justify-between items-center text-xs text-slate-400 pt-2 border-t border-slate-800">
        <span>Delivery: <strong class="text-slate-200">${new Date(order.expectedDeliveryDate).toLocaleDateString()}</strong></span>
        <span>Balance: <strong class="${order.remainingAmount === 0 ? 'text-emerald-400' : 'text-amber-400'}">${order.remainingAmount} PKR</strong></span>
      </div>
    </div>
  `;
}

function renderMeasurementCard(m: any): string {
  const q = m.measurements?.qameez || {};
  const s = m.measurements?.shalwaar || {};
  return `
    <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
      <div class="flex justify-between items-center">
        <strong class="text-white text-sm">${m.title}</strong>
        <span class="text-[11px] text-slate-400">${m.unit}</span>
      </div>
      <div class="grid grid-cols-2 gap-2 text-slate-300">
        <div><strong>Lambai:</strong> ${q.length || '--'}</div>
        <div><strong>Teera:</strong> ${q.shoulder || '--'}</div>
        <div><strong>Chhati:</strong> ${q.chest || '--'}</div>
        <div><strong>Bazu:</strong> ${q.sleeve || '--'}</div>
        <div><strong>Collar:</strong> ${q.collar || '--'}</div>
        <div><strong>Ghera:</strong> ${q.ghera || '--'}</div>
        <div><strong>Paincha:</strong> ${s.paincha || '--'}</div>
        <div><strong>Shalwaar:</strong> ${s.length || '--'}</div>
      </div>
    </div>
  `;
}

// ==========================================
// 7. Modals & Action Event Handlers
// ==========================================
function setupModalHandlers(): void {
  // New Order Booking Modal
  const modalOrder = document.getElementById('modalOrderBooking');
  const btnNewOrder = document.getElementById('btnNewOrder');
  const closeOrder = document.getElementById('closeOrderModal');
  const cancelOrder = document.getElementById('btnCancelOrderModal');

  const openOrderModal = () => modalOrder?.classList.remove('hidden');
  const closeOrderModal = () => modalOrder?.classList.add('hidden');

  btnNewOrder?.addEventListener('click', openOrderModal);
  closeOrder?.addEventListener('click', closeOrderModal);
  cancelOrder?.addEventListener('click', closeOrderModal);

  // New Customer Modal
  const modalCustomer = document.getElementById('modalNewCustomer');
  const btnNewCust = document.getElementById('btnNewCustomer');
  const btnNewCustTab = document.getElementById('btnRegisterCustomerFromTab');
  const closeCust = document.getElementById('closeCustomerModal');
  const cancelCust = document.getElementById('btnCancelCustomerModal');

  const openCustModal = () => modalCustomer?.classList.remove('hidden');
  const closeCustModal = () => modalCustomer?.classList.add('hidden');

  btnNewCust?.addEventListener('click', openCustModal);
  btnNewCustTab?.addEventListener('click', openCustModal);
  closeCust?.addEventListener('click', closeCustModal);
  cancelCust?.addEventListener('click', closeCustModal);

  // Payment Modal
  const modalPay = document.getElementById('modalRecordPayment');
  const closePay = document.getElementById('closePaymentModal');
  const cancelPay = document.getElementById('btnCancelPaymentModal');

  closePay?.addEventListener('click', () => modalPay?.classList.add('hidden'));
  cancelPay?.addEventListener('click', () => modalPay?.classList.add('hidden'));

  // Submit New Customer Form
  document.getElementById('formNewCustomer')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = (document.getElementById('custName') as HTMLInputElement).value;
    const phone = (document.getElementById('custPhone') as HTMLInputElement).value;
    const city = (document.getElementById('custCity') as HTMLInputElement).value;
    const address = (document.getElementById('custAddress') as HTMLInputElement).value;

    try {
      const res = await (window as any).ActionTailor.apiFetch('/api/customers', {
        method: 'POST',
        body: JSON.stringify({ name, phone, city, address }),
      });
      showToast('Customer saved successfully!', 'success');
      closeCustModal();
      (e.target as HTMLFormElement).reset();
      await loadCustomersList();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  });

  // Submit New Order Form
  document.getElementById('formBookOrder')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const customer = (document.getElementById('orderCustomerSelect') as HTMLSelectElement).value;
    const clothingCategory = (document.getElementById('orderCategorySelect') as HTMLSelectElement).value;
    const quantity = parseInt((document.getElementById('orderQuantity') as HTMLInputElement).value, 10);
    const measurementProfileId = (document.getElementById('orderMeasurementProfileSelect') as HTMLSelectElement).value || undefined;
    const fabricProvidedBy = (document.getElementById('orderFabricProvidedBy') as HTMLSelectElement).value;
    const fabricType = (document.getElementById('orderFabricType') as HTMLInputElement).value;
    const color = (document.getElementById('orderFabricColor') as HTMLInputElement).value;

    const collarStyle = (document.getElementById('orderCollarStyle') as HTMLSelectElement).value;
    const cuffStyle = (document.getElementById('orderCuffStyle') as HTMLSelectElement).value;
    const damanStyle = (document.getElementById('orderDamanStyle') as HTMLSelectElement).value;
    const shalwaarStyle = (document.getElementById('orderShalwaarStyle') as HTMLSelectElement).value;

    const stitchingPrice = parseFloat((document.getElementById('orderStitchingPrice') as HTMLInputElement).value);
    const advancePayment = parseFloat((document.getElementById('orderAdvancePayment') as HTMLInputElement).value) || 0;
    const expectedDeliveryDate = (document.getElementById('orderDeliveryDate') as HTMLInputElement).value;
    const notes = (document.getElementById('orderNotes') as HTMLInputElement).value;

    try {
      const res = await (window as any).ActionTailor.apiFetch('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          customer,
          clothingCategory,
          quantity,
          measurementProfileId,
          fabric: { providedBy: fabricProvidedBy, fabricType, color },
          designOptions: { collarStyle, cuffStyle, damanStyle, shalwaarStyle },
          stitchingPrice,
          advancePayment,
          expectedDeliveryDate,
          notes,
        }),
      });

      showToast(`Order #${res.data.orderNumber} booked successfully!`, 'success');
      closeOrderModal();
      (e.target as HTMLFormElement).reset();
      await loadAdminDashboard();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  });

  // Submit Payment Form
  document.getElementById('formRecordPayment')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const orderId = (document.getElementById('payOrderId') as HTMLInputElement).value;
    const amount = parseFloat((document.getElementById('payAmount') as HTMLInputElement).value);
    const method = (document.getElementById('payMethod') as HTMLSelectElement).value;

    try {
      await (window as any).ActionTailor.apiFetch('/api/payments', {
        method: 'POST',
        body: JSON.stringify({ orderId, amount, method }),
      });
      showToast('Payment recorded successfully!', 'success');
      modalPay?.classList.add('hidden');
      await loadAdminDashboard();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  });

  // Filter & Search Input Listeners
  document.getElementById('orderSearchInput')?.addEventListener('input', debounce(loadOrdersList, 300));
  document.getElementById('statusFilterSelect')?.addEventListener('change', loadOrdersList);
  document.getElementById('btnRefreshOrders')?.addEventListener('click', loadAdminDashboard);
}

function openPaymentModal(orderId: string, orderNumber: string, remaining: string): void {
  const modal = document.getElementById('modalRecordPayment');
  const idInput = document.getElementById('payOrderId') as HTMLInputElement;
  const numDisplay = document.getElementById('payOrderNumberDisplay');
  const remDisplay = document.getElementById('payRemainingDisplay');
  const amountInput = document.getElementById('payAmount') as HTMLInputElement;

  if (idInput) idInput.value = orderId;
  if (numDisplay) numDisplay.textContent = orderNumber;
  if (remDisplay) remDisplay.textContent = `${remaining} PKR`;
  if (amountInput) {
    amountInput.value = remaining;
    amountInput.max = remaining;
  }

  modal?.classList.remove('hidden');
}

// ==========================================
// 8. Printable Tailoring Receipt Slip
// ==========================================
async function printOrderSlip(orderId: string): Promise<void> {
  const order = allOrdersCache.find((o) => o._id === orderId) || (await (window as any).ActionTailor.apiFetch(`/api/orders/${orderId}`)).data;
  if (!order) return;

  const slipContainer = document.getElementById('printSlipContent');
  if (!slipContainer) return;

  const q = order.measurementSnapshot?.qameez || {};
  const s = order.measurementSnapshot?.shalwaar || {};

  slipContainer.innerHTML = `
    <div style="font-family: monospace; font-size: 13px; line-height: 1.4; color: #000; padding: 10px;">
      <div style="text-align: center; border-bottom: 2px dashed #000; padding-bottom: 8px; margin-bottom: 10px;">
        <h2 style="font-size: 18px; margin: 0; font-weight: bold;">ACTION TAILOR / ایکشن ٹیلرز</h2>
        <p style="margin: 2px 0;">Quality Stitching & Bespoke Pakistani Suits</p>
        <p style="margin: 2px 0;">Phone: 0300-0000000 • Lahore</p>
      </div>

      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <div><strong>Order #:</strong> ${order.orderNumber}</div>
        <div><strong>Date:</strong> ${new Date(order.orderDate || Date.now()).toLocaleDateString('en-GB')}</div>
      </div>

      <div style="margin-bottom: 8px;">
        <div><strong>Customer / گاہک:</strong> ${order.customer?.name || 'Customer'}</div>
        <div><strong>Phone / فون:</strong> ${order.customer?.phone || '--'}</div>
        <div><strong>Delivery Date / ڈیلیوری:</strong> <span style="font-size: 15px; font-weight: bold;">${new Date(order.expectedDeliveryDate).toLocaleDateString('en-GB')}</span></div>
      </div>

      <div style="border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 6px 0; margin-bottom: 8px;">
        <div><strong>Item:</strong> ${order.clothingCategory.toUpperCase()} (Qty: ${order.quantity || 1})</div>
        <div><strong>Fabric:</strong> ${order.fabric?.fabricType || 'Customer Cloth'} (${order.fabric?.color || 'Standard'})</div>
        <div><strong>Styles:</strong> Collar: ${order.designOptions?.collarStyle || 'Ban'} | Cuff: ${order.designOptions?.cuffStyle || 'Single'} | Daman: ${order.designOptions?.damanStyle || 'Gol'}</div>
      </div>

      <!-- Measurements Table -->
      <div style="margin-bottom: 10px;">
        <div style="font-weight: bold; margin-bottom: 4px;">MEASUREMENTS / ناپ (INCHES):</div>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;" border="1">
          <tr style="background: #f0f0f0;">
            <th style="padding: 3px;">Lambai</th>
            <th style="padding: 3px;">Teera</th>
            <th style="padding: 3px;">Chhati</th>
            <th style="padding: 3px;">Bazu</th>
            <th style="padding: 3px;">Collar</th>
            <th style="padding: 3px;">Ghera</th>
          </tr>
          <tr style="text-align: center;">
            <td style="padding: 3px;">${q.length || '--'}</td>
            <td style="padding: 3px;">${q.shoulder || '--'}</td>
            <td style="padding: 3px;">${q.chest || '--'}</td>
            <td style="padding: 3px;">${q.sleeve || '--'}</td>
            <td style="padding: 3px;">${q.collar || '--'}</td>
            <td style="padding: 3px;">${q.ghera || '--'}</td>
          </tr>
        </table>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 4px;" border="1">
          <tr style="background: #f0f0f0;">
            <th style="padding: 3px;">Shalwaar Lambai</th>
            <th style="padding: 3px;">Paincha</th>
            <th style="padding: 3px;">Aasan</th>
            <th style="padding: 3px;">Kamar</th>
          </tr>
          <tr style="text-align: center;">
            <td style="padding: 3px;">${s.length || '--'}</td>
            <td style="padding: 3px;">${s.paincha || '--'}</td>
            <td style="padding: 3px;">${s.aasan || '--'}</td>
            <td style="padding: 3px;">${s.waist || '--'}</td>
          </tr>
        </table>
      </div>

      <!-- Financials -->
      <div style="border-top: 1px dashed #000; padding-top: 6px; margin-bottom: 15px;">
        <div style="display: flex; justify-content: space-between;"><span>Total Amount / کل رقم:</span> <strong>${order.totalAmount} PKR</strong></div>
        <div style="display: flex; justify-content: space-between;"><span>Advance Paid / ایڈوانس:</span> <span>${order.advancePayment || 0} PKR</span></div>
        <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: bold; border-top: 1px solid #000; margin-top: 4px; padding-top: 4px;">
          <span>Remaining Balance / بقایا رقم:</span>
          <span>${order.remainingAmount} PKR</span>
        </div>
      </div>

      <div style="text-align: center; font-size: 11px; margin-top: 20px;">
        <p style="margin: 2px 0;">براہِ کرم ڈیلیوری کے وقت یہ پرچی ہمراہ لائیں شکریہ۔</p>
        <p style="margin: 2px 0;">Please bring this slip upon suit pickup. Thank you!</p>
      </div>
    </div>
  `;

  window.print();
}

// ==========================================
// 9. Socket.IO Real-Time Tailoring Events
// ==========================================
function setupSocketIO(): void {
  if (typeof (window as any).io !== 'undefined') {
    try {
      socket = (window as any).io();

      socket.on('order:created', (data: any) => {
        showToast(`New Order #${data.orderNumber} Booked!`, 'info', { title: 'Tailor Shop Alert' });
        loadAdminDashboard();
      });

      socket.on('order:status_changed', (data: any) => {
        showToast(`Order #${data.orderNumber} is now ${data.newStatus.toUpperCase()}`, 'info');
        loadOrdersList();
      });

      socket.on('order:ready', (data: any) => {
        showToast(`Order #${data.orderNumber} is READY FOR PICKUP! / تیار ہے`, 'success', { duration: 6000 });
      });

      socket.on('payment:recorded', (data: any) => {
        showToast(`Payment of ${data.amount} PKR recorded for Order #${data.orderNumber}`, 'success');
        loadAdminDashboard();
      });
    } catch (_err) {
      console.log('Socket.IO connection skipped (serverless environment)');
    }
  }
}

// ==========================================
// 10. Tabs & Helpers
// ==========================================
function setupTabSwitching(): void {
  const tabs = [
    { btn: 'tabOrdersBtn', content: 'tabOrders' },
    { btn: 'tabCustomersBtn', content: 'tabCustomers' },
    { btn: 'tabDeliveriesBtn', content: 'tabDeliveries' },
    { btn: 'tabTelemetryBtn', content: 'tabTelemetry' },
  ];

  tabs.forEach((tab) => {
    document.getElementById(tab.btn)?.addEventListener('click', () => {
      tabs.forEach((t) => {
        const btnEl = document.getElementById(t.btn);
        const contentEl = document.getElementById(t.content);
        if (t.btn === tab.btn) {
          btnEl?.classList.add('active', 'bg-brand-600', 'text-white');
          btnEl?.classList.remove('text-slate-400');
          contentEl?.classList.remove('hidden');
        } else {
          btnEl?.classList.remove('active', 'bg-brand-600', 'text-white');
          btnEl?.classList.add('text-slate-400');
          contentEl?.classList.add('hidden');
        }
      });
    });
  });
}

function debounce(func: Function, wait = 300) {
  let timeout: any;
  return function (...args: any[]) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Boot application
initDashboard();
