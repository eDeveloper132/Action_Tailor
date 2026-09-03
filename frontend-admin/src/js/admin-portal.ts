import { renderNavbar, showToast } from '../ui_components/index.ts';
import '../utils/api.ts';

let ordersCache: any[] = [];

async function initAdminPortal(): Promise<void> {
  // Mount reusable responsive navbar
  renderNavbar('navbarMount', {
    brandName: 'Action Tailor • Admin Desk',
    logoIcon: '⚡',
    activeLink: 'dashboard',
    showAuthButton: true,
  });

  setupTabs();
  setupEventListeners();
  setupSocketIO();

  try {
    const meRes = await (window as any).ActionTailor.apiFetch('/api/auth/me');
    const user = meRes.data;

    // Check if user is customer - customer accounts cannot access admin portal
    if (!user || user.role === 'customer') {
      window.location.href = '/signin.html';
      return;
    }

    const titleEl = document.getElementById('adminDeskTitle');
    if (titleEl && user) {
      titleEl.textContent = `Master Tailor Desk • ${user.name || 'استاد جی'}`;
    }

    await loadMetrics();
    await loadOrders();
  } catch (err: any) {
    showToast('Failed to initialize admin desk', 'error');
  }
}

async function loadMetrics(): Promise<void> {
  try {
    const res = await (window as any).ActionTailor.apiFetch('/api/dashboard/admin');
    const data = res.data;

    renderMetricCards(data);
    renderDeliveries(data.upcomingDeliveries || []);
  } catch (err: any) {
    console.error(err);
  }
}

function renderMetricCards(metrics: any): void {
  const container = document.getElementById('metricsRow');
  if (!container) return;

  const cards = [
    { title: "Today's / آج کے آرڈرز", val: metrics.todayOrdersCount || 0, color: 'text-emerald-700', icon: '✂' },
    { title: 'Cutting / کٹائی پر', val: metrics.statusCounts?.cutting || 0, color: 'text-sky-700', icon: '📐' },
    { title: 'In Stitching / سلائی پر', val: metrics.statusCounts?.stitching || 0, color: 'text-purple-700', icon: '🧵' },
    { title: 'Ready / تیار سوٹ', val: metrics.statusCounts?.ready || 0, color: 'text-emerald-600', icon: '✓' },
    { title: 'Due Balance / بقایا', val: `${(metrics.totalRemainingPayments || 0).toLocaleString()} PKR`, color: 'text-amber-700', icon: '💰' },
  ];

  container.innerHTML = cards
    .map(
      (c) => `
    <div class="tailor-card p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
      <div class="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
        <span>${c.title}</span>
        <span>${c.icon}</span>
      </div>
      <div class="text-2xl font-extrabold ${c.color}">${c.val}</div>
    </div>
  `
    )
    .join('');
}

async function loadOrders(): Promise<void> {
  const container = document.getElementById('ordersListContainer');
  if (!container) return;

  try {
    const q = (document.getElementById('orderSearchInput') as HTMLInputElement)?.value || '';
    const st = (document.getElementById('statusFilterSelect') as HTMLSelectElement)?.value || '';

    let url = '/api/orders?limit=60';
    if (q) url += `&search=${encodeURIComponent(q)}`;
    if (st) url += `&status=${encodeURIComponent(st)}`;

    const res = await (window as any).ActionTailor.apiFetch(url);
    const orders = res.data?.orders || [];
    ordersCache = orders;

    if (orders.length === 0) {
      container.innerHTML = `
        <div class="p-8 text-center rounded-2xl bg-white border border-dashed border-slate-200 text-slate-400 text-sm">
          No orders found matching criteria / کوئی آرڈر نہیں ملا
        </div>
      `;
      return;
    }

    container.innerHTML = orders.map((o: any) => renderOrderCard(o)).join('');
    attachRowActions();
  } catch (err: any) {
    container.innerHTML = `<div class="text-rose-500 p-4 text-sm">Error: ${err.message}</div>`;
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
  const next = getNextStatus(order.status);
  const isPaid = order.remainingAmount === 0;
  const custName = order.customer?.name || 'Customer';
  const custPhone = order.customer?.phone || '';
  const deliveryFormatted = order.expectedDeliveryDate
    ? new Date(order.expectedDeliveryDate).toLocaleDateString('en-GB')
    : '--';

  return `
    <div class="tailor-card p-4 rounded-xl border border-slate-200 bg-white shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="space-y-1">
        <div class="flex items-center gap-2">
          <span class="font-mono font-extrabold text-slate-900 text-base tracking-wider">${order.orderNumber}</span>
          ${getStatusBadge(order.status)}
          <span class="text-xs px-2 py-0.5 rounded font-semibold ${isPaid ? 'payment-paid' : 'payment-partial'}">
            ${isPaid ? 'Paid / ادا شدہ' : `Due: ${order.remainingAmount} PKR`}
          </span>
        </div>
        <div class="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-2">
          <span>${custName}</span>
          ${
            custPhone
              ? `<a href="https://wa.me/92${custPhone.replace(/\D/g, '').replace(/^0/, '')}" target="_blank" class="text-emerald-600 hover:underline flex items-center gap-1 text-xs font-semibold">
                  <span>💬</span> <span>${custPhone}</span>
                </a>`
              : ''
          }
        </div>
        <div class="text-xs text-slate-500">
          <span class="font-medium text-slate-700">${order.clothingCategory.replace('_', ' ').toUpperCase()}</span> •
          <span>Delivery: <strong class="text-slate-800">${deliveryFormatted}</strong></span>
          ${order.fabric?.fabricType ? ` • <span>${order.fabric.fabricType}</span>` : ''}
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        ${
          next
            ? `<button class="btn-advance-status px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs" data-id="${order._id}" data-next="${next}">
                Move to ${next.toUpperCase()} ➔
              </button>`
            : ''
        }
        ${
          !isPaid
            ? `<button class="btn-quick-pay px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 text-xs font-semibold" data-id="${order._id}" data-num="${order.orderNumber}" data-rem="${order.remainingAmount}">
                + Payment / وصولی
              </button>`
            : ''
        }
        <button class="btn-print-slip p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs border border-slate-300 font-semibold" data-id="${order._id}">
          🖨 Slip
        </button>
      </div>
    </div>
  `;
}

function attachRowActions(): void {
  document.querySelectorAll('.btn-advance-status').forEach((b) => {
    b.addEventListener('click', async (e) => {
      const target = e.currentTarget as HTMLElement;
      const orderId = target.dataset.id;
      const next = target.dataset.next;
      if (!orderId || !next) return;

      try {
        await (window as any).ActionTailor.apiFetch(`/api/orders/${orderId}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status: next }),
        });
        showToast(`Moved order to ${next.toUpperCase()}`, 'success');
        await loadMetrics();
        await loadOrders();
      } catch (err: any) {
        showToast(err.message, 'error');
      }
    });
  });

  document.querySelectorAll('.btn-quick-pay').forEach((b) => {
    b.addEventListener('click', (e) => {
      const target = e.currentTarget as HTMLElement;
      openPaymentModal(target.dataset.id || '', target.dataset.num || '', target.dataset.rem || '0');
    });
  });

  document.querySelectorAll('.btn-print-slip').forEach((b) => {
    b.addEventListener('click', (e) => {
      const orderId = (e.currentTarget as HTMLElement).dataset.id;
      if (orderId) printSlip(orderId);
    });
  });
}

function renderDeliveries(deliveries: any[]): void {
  const container = document.getElementById('upcomingDeliveriesContainer');
  if (!container) return;

  if (deliveries.length === 0) {
    container.innerHTML = `<div class="p-6 text-center text-slate-400 text-xs bg-white rounded-xl border border-dashed border-slate-200">No immediate deliveries scheduled in next 3 days.</div>`;
    return;
  }

  container.innerHTML = deliveries
    .map(
      (o: any) => `
    <div class="p-3.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs sm:text-sm shadow-2xs">
      <div>
        <span class="font-mono font-bold text-slate-900">${o.orderNumber}</span>
        <span class="text-slate-700 font-bold ml-2">${o.customer?.name || 'Customer'}</span>
        <span class="text-slate-400 ml-2">(${o.customer?.phone || ''})</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-amber-700 font-semibold">Due: ${new Date(o.expectedDeliveryDate).toLocaleDateString()}</span>
        ${getStatusBadge(o.status)}
      </div>
    </div>
  `
    )
    .join('');
}

function openPaymentModal(id: string, num: string, remaining: string): void {
  const modal = document.getElementById('modalRecordPayment');
  (document.getElementById('payOrderId') as HTMLInputElement).value = id;
  (document.getElementById('payOrderNumberDisplay') as HTMLElement).textContent = num;
  (document.getElementById('payRemainingDisplay') as HTMLElement).textContent = `${remaining} PKR`;
  const amtInput = document.getElementById('payAmount') as HTMLInputElement;
  amtInput.value = remaining;
  amtInput.max = remaining;
  modal?.classList.remove('hidden');
}

function printSlip(orderId: string): void {
  const order = ordersCache.find((o) => o._id === orderId);
  if (!order) return;

  const slip = document.getElementById('printSlipContent');
  if (!slip) return;

  const q = order.measurementSnapshot?.qameez || {};
  const s = order.measurementSnapshot?.shalwaar || {};

  slip.innerHTML = `
    <div style="font-family: monospace; font-size: 13px; line-height: 1.4; color: #000; padding: 10px;">
      <div style="text-align: center; border-bottom: 2px dashed #000; padding-bottom: 8px; margin-bottom: 10px;">
        <h2 style="font-size: 18px; margin: 0; font-weight: bold;">ACTION TAILOR / ایکشن ٹیلرز</h2>
        <p style="margin: 2px 0;">Quality Stitching & Bespoke Pakistani Suits</p>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <div><strong>Order #:</strong> ${order.orderNumber}</div>
        <div><strong>Due Date:</strong> ${new Date(order.expectedDeliveryDate).toLocaleDateString('en-GB')}</div>
      </div>
      <div style="margin-bottom: 8px;">
        <div><strong>Customer:</strong> ${order.customer?.name || 'Customer'} (${order.customer?.phone || '--'})</div>
      </div>
      <div style="margin-bottom: 10px;">
        <div style="font-weight: bold; margin-bottom: 4px;">MEASUREMENTS (INCHES):</div>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;" border="1">
          <tr style="background: #f0f0f0;"><th>Lambai</th><th>Teera</th><th>Chhati</th><th>Bazu</th><th>Collar</th><th>Ghera</th></tr>
          <tr style="text-align: center;"><td>${q.length || '--'}</td><td>${q.shoulder || '--'}</td><td>${q.chest || '--'}</td><td>${q.sleeve || '--'}</td><td>${q.collar || '--'}</td><td>${q.ghera || '--'}</td></tr>
        </table>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 4px;" border="1">
          <tr style="background: #f0f0f0;"><th>Shalwaar</th><th>Paincha</th><th>Aasan</th></tr>
          <tr style="text-align: center;"><td>${s.length || '--'}</td><td>${s.paincha || '--'}</td><td>${s.aasan || '--'}</td></tr>
        </table>
      </div>
      <div style="border-top: 1px dashed #000; padding-top: 6px;">
        <div style="display: flex; justify-content: space-between;"><span>Total:</span> <strong>${order.totalAmount} PKR</strong></div>
        <div style="display: flex; justify-content: space-between;"><span>Remaining:</span> <strong>${order.remainingAmount} PKR</strong></div>
      </div>
    </div>
  `;

  window.print();
}

function setupTabs(): void {
  const tabs = [
    { btn: 'tabOrdersBtn', content: 'tabOrders' },
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

function setupEventListeners(): void {
  document.getElementById('orderSearchInput')?.addEventListener('input', debounce(loadOrders, 300));
  document.getElementById('statusFilterSelect')?.addEventListener('change', loadOrders);
  document.getElementById('btnRefreshOrders')?.addEventListener('click', () => {
    loadMetrics();
    loadOrders();
  });

  const modalPay = document.getElementById('modalRecordPayment');
  document.getElementById('closePaymentModal')?.addEventListener('click', () => modalPay?.classList.add('hidden'));
  document.getElementById('btnCancelPaymentModal')?.addEventListener('click', () => modalPay?.classList.add('hidden'));

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
      showToast('Payment recorded successfully', 'success');
      modalPay?.classList.add('hidden');
      await loadMetrics();
      await loadOrders();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  });
}

function setupSocketIO(): void {
  if (typeof (window as any).io !== 'undefined') {
    try {
      const socket = (window as any).io();
      socket.on('order:created', (d: any) => {
        showToast(`New Order #${d.orderNumber} Booked!`, 'info');
        loadMetrics();
        loadOrders();
      });
      socket.on('payment:recorded', () => {
        loadMetrics();
        loadOrders();
      });
      socket.on('order:status_changed', () => {
        loadMetrics();
        loadOrders();
      });
    } catch (_e) {}
  }
}

function debounce(fn: Function, ms = 300) {
  let timer: any;
  return (...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

initAdminPortal();

