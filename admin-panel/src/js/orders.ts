import { renderNavbar, showToast } from '../ui_components/index.ts';
import '../utils/api.ts';

let ordersCache: any[] = [];

async function initOrdersPage(): Promise<void> {
  renderNavbar('navbarMount', {
    brandName: 'Action Tailor',
    logoIcon: '⚡',
    activeLink: 'orders',
    showAuthButton: true,
  });

  setupEventListeners();
  setupSocketIO();
  await loadOrders();
}

async function loadOrders(): Promise<void> {
  const container = document.getElementById('ordersContainer');
  if (!container) return;

  try {
    const search = (document.getElementById('orderSearchInput') as HTMLInputElement)?.value || '';
    const status = (document.getElementById('statusFilterSelect') as HTMLSelectElement)?.value || '';

    let url = '/api/orders?limit=100';
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (status) url += `&status=${encodeURIComponent(status)}`;

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

    container.innerHTML = orders.map((o: any) => renderOrderRow(o)).join('');
    attachRowActions();
  } catch (err: any) {
    container.innerHTML = `<div class="text-rose-500 p-4 text-sm">Error loading orders: ${err.message}</div>`;
  }
}

function getGarmentName(category: string): string {
  const map: Record<string, string> = {
    shalwar_qameez: 'Shalwar Qameez / شلوار قمیض',
    kurta_pajama: 'Kurta Pajama / کرتا پاجامہ',
    waistcoat: 'Waistcoat / واسکٹ',
    trouser: 'Trouser / پینٹ',
    sherwani: 'Sherwani / شیروانی',
  };
  return map[category] || `${category.replace('_', ' ').toUpperCase()}`;
}

function getStatusBadge(status: string): string {
  const labels: Record<string, { text: string; class: string }> = {
    pending: { text: 'Pending / زیر التوا', class: 'status-pending' },
    confirmed: { text: 'Confirmed / تصدیق شدہ', class: 'status-confirmed' },
    cutting: { text: 'Cutting / کٹائی', class: 'status-cutting' },
    stitching: { text: 'Stitching / سلائی', class: 'status-stitching' },
    quality_check: { text: 'Quality Check / معائنہ', class: 'status-quality_check' },
    ready: { text: 'Ready / تیار', class: 'status-ready' },
    delivered: { text: 'Delivered / حوالے کیا گیا', class: 'status-delivered' },
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

function renderOrderRow(order: any): string {
  const next = getNextStatus(order.status);
  const isPaid = order.remainingAmount === 0;
  const custName = order.customer?.name || 'Customer';
  const custPhone = order.customer?.phone || '';
  const deliveryDate = order.expectedDeliveryDate
    ? new Date(order.expectedDeliveryDate).toLocaleDateString('en-GB')
    : '--';

  return `
    <div class="tailor-card p-5 rounded-2xl border border-slate-200 bg-white shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="space-y-1">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="font-mono font-extrabold text-slate-900 text-base tracking-wider">${order.orderNumber}</span>
          ${getStatusBadge(order.status)}
          <span class="text-xs px-2 py-0.5 rounded font-semibold ${isPaid ? 'payment-paid' : 'payment-partial'}">
            ${isPaid ? 'Paid / ادا شدہ' : `Due / بقایا: ${order.remainingAmount} PKR`}
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
          <span class="font-medium text-slate-700">${getGarmentName(order.clothingCategory)}</span> •
          <span>Delivery / متوقع تاریخ: <strong class="text-slate-800">${deliveryDate}</strong></span>
          ${order.fabric?.fabricType ? ` • <span>${order.fabric.fabricType}</span>` : ''}
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <!-- Direct Status Selector -->
        <select class="row-status-select px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100" data-id="${order._id}">
          <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending / زیر التوا</option>
          <option value="cutting" ${order.status === 'cutting' ? 'selected' : ''}>Cutting / کٹائی</option>
          <option value="stitching" ${order.status === 'stitching' ? 'selected' : ''}>Stitching / سلائی</option>
          <option value="ready" ${order.status === 'ready' ? 'selected' : ''}>Ready / تیار</option>
          <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered / حوالے کیا گیا</option>
          <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled / منسوخ</option>
        </select>

        ${
          next
            ? `<button class="btn-advance-status px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs" data-id="${order._id}" data-next="${next}">
                ${next.toUpperCase()} / آگے بڑھائیں ➔
              </button>`
            : ''
        }
        ${
          !isPaid
            ? `<button class="btn-pay px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 text-xs font-semibold" data-id="${order._id}" data-num="${order.orderNumber}" data-rem="${order.remainingAmount}">
                + Payment / رقم وصولی
              </button>`
            : ''
        }
        <button class="btn-print p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs border border-slate-300 font-semibold" data-id="${order._id}">
          🖨 Slip / پرچی
        </button>
      </div>
    </div>
  `;
}

function attachRowActions(): void {
  // Move to Next Status
  document.querySelectorAll('.btn-advance-status').forEach((b) => {
    b.addEventListener('click', async (e) => {
      const el = e.currentTarget as HTMLElement;
      const orderId = el.dataset.id;
      const next = el.dataset.next;
      if (!orderId || !next) return;

      try {
        await (window as any).ActionTailor.apiFetch(`/api/orders/${orderId}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status: next }),
        });
        showToast(`Moved to ${next.toUpperCase()} / آگے بڑھا دیا گیا`, 'success');
        await loadOrders();
      } catch (err: any) {
        showToast(err.message, 'error');
      }
    });
  });

  // Direct Status Changer
  document.querySelectorAll('.row-status-select').forEach((sel) => {
    sel.addEventListener('change', async (e) => {
      const el = e.currentTarget as HTMLSelectElement;
      const orderId = el.dataset.id;
      const status = el.value;
      if (!orderId || !status) return;

      try {
        await (window as any).ActionTailor.apiFetch(`/api/orders/${orderId}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status }),
        });
        showToast(`Status updated to ${status.toUpperCase()} / آرڈر کی حالت تبدیل ہو گئی`, 'success');
        await loadOrders();
      } catch (err: any) {
        showToast(err.message, 'error');
      }
    });
  });

  document.querySelectorAll('.btn-pay').forEach((b) => {
    b.addEventListener('click', (e) => {
      const el = e.currentTarget as HTMLElement;
      openPayModal(el.dataset.id || '', el.dataset.num || '', el.dataset.rem || '0');
    });
  });

  document.querySelectorAll('.btn-print').forEach((b) => {
    b.addEventListener('click', (e) => {
      const el = e.currentTarget as HTMLElement;
      printSlip(el.dataset.id || '');
    });
  });
}

function setupEventListeners(): void {
  document.getElementById('orderSearchInput')?.addEventListener('input', debounce(loadOrders, 300));
  document.getElementById('statusFilterSelect')?.addEventListener('change', loadOrders);
  document.getElementById('btnRefreshOrders')?.addEventListener('click', loadOrders);

  // Pay Modal
  const modal = document.getElementById('modalPayment');
  document.getElementById('closePayModal')?.addEventListener('click', () => modal?.classList.add('hidden'));
  document.getElementById('btnCancelPay')?.addEventListener('click', () => modal?.classList.add('hidden'));

  document.getElementById('formPay')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const orderId = (document.getElementById('payOrderId') as HTMLInputElement).value;
    const amount = parseFloat((document.getElementById('payAmountInput') as HTMLInputElement).value);
    const method = (document.getElementById('payMethodSelect') as HTMLSelectElement).value;

    try {
      await (window as any).ActionTailor.apiFetch('/api/payments', {
        method: 'POST',
        body: JSON.stringify({ orderId, amount, method }),
      });
      showToast('Payment recorded successfully / رقم کامیابی سے محفوظ ہو گئی', 'success');
      modal?.classList.add('hidden');
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
        showToast(`New Order #${d.orderNumber} Booked! / نیا آرڈر بک ہو گیا!`, 'info');
        loadOrders();
      });
      socket.on('payment:recorded', () => {
        loadOrders();
      });
      socket.on('order:status_changed', () => {
        loadOrders();
      });
    } catch (_e) {}
  }
}

function openPayModal(orderId: string, orderNumber: string, remaining: string): void {
  const modal = document.getElementById('modalPayment');
  (document.getElementById('payOrderId') as HTMLInputElement).value = orderId;
  (document.getElementById('payOrderNum') as HTMLElement).textContent = orderNumber;
  (document.getElementById('payRemBalance') as HTMLElement).textContent = `${remaining} PKR`;
  const amtInput = document.getElementById('payAmountInput') as HTMLInputElement;
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
        <p style="margin: 2px 0;">Quality Stitching & Bespoke Pakistani Suits / معیاری سلائی</p>
        <p style="margin: 2px 0;">Phone: 0300-0000000 • Lahore</p>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <div><strong>Order # / آرڈر نمبر:</strong> ${order.orderNumber}</div>
        <div><strong>Date / تاریخ:</strong> ${new Date(order.orderDate || Date.now()).toLocaleDateString('en-GB')}</div>
      </div>
      <div style="margin-bottom: 8px;">
        <div><strong>Customer / کسٹمر:</strong> ${order.customer?.name || 'Customer'} (${order.customer?.phone || '--'})</div>
        <div><strong>Delivery / متوقع تاریخ:</strong> <span style="font-size: 15px; font-weight: bold;">${new Date(order.expectedDeliveryDate).toLocaleDateString('en-GB')}</span></div>
      </div>
      <div style="border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 6px 0; margin-bottom: 8px;">
        <div><strong>Item / لباس:</strong> ${getGarmentName(order.clothingCategory)}</div>
        <div><strong>Fabric / کپڑا:</strong> ${order.fabric?.fabricType || 'Customer Cloth'} (${order.fabric?.color || 'Standard'})</div>
      </div>
      <div style="margin-bottom: 10px;">
        <div style="font-weight: bold; margin-bottom: 4px;">MEASUREMENTS (INCHES) / ناپ (انچ):</div>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;" border="1">
          <tr style="background: #f0f0f0;">
            <th>Length / لمبائی</th><th>Shoulder / کندھا</th><th>Chest / چھاتی</th><th>Sleeve / آستین</th><th>Collar / کالر</th><th>Daman / دامن</th>
          </tr>
          <tr style="text-align: center;">
            <td>${q.length || '--'}</td><td>${q.shoulder || '--'}</td><td>${q.chest || '--'}</td><td>${q.sleeve || '--'}</td><td>${q.collar || '--'}</td><td>${q.daman || q.ghera || '--'}</td>
          </tr>
        </table>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 4px;" border="1">
          <tr style="background: #f0f0f0;">
            <th>Length / لمبائی</th><th>Paincha / پانچہ</th><th>Aasan / آسن</th><th>Ghera / گھیرا</th>
          </tr>
          <tr style="text-align: center;">
            <td>${s.length || '--'}</td><td>${s.paincha || '--'}</td><td>${s.aasan || '--'}</td><td>${s.ghera || s.waist || '--'}</td>
          </tr>
        </table>
      </div>
      <div style="border-top: 1px dashed #000; padding-top: 6px;">
        <div style="display: flex; justify-content: space-between;"><span>Total / کل رقم:</span> <strong>${order.totalAmount} PKR</strong></div>
        <div style="display: flex; justify-content: space-between;"><span>Advance / پیشگی رقم:</span> <span>${order.advancePayment || 0} PKR</span></div>
        <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: bold; border-top: 1px solid #000; margin-top: 4px;">
          <span>Remaining / بقایا رقم:</span> <span>${order.remainingAmount} PKR</span>
        </div>
      </div>
    </div>
  `;

  window.print();
}

function debounce(fn: Function, ms = 300) {
  let timer: any;
  return (...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

initOrdersPage();

