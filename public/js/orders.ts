import { renderNavbar, showToast } from '../ui_components/index.ts';

let ordersCache: any[] = [];

async function initOrdersPage(): Promise<void> {
  renderNavbar('navbarMount', {
    brandName: 'Action Tailor',
    logoIcon: '⚡',
    activeLink: 'orders',
    showAuthButton: true,
  });

  setupEventListeners();
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
        <div class="p-8 text-center rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 text-slate-500 text-sm">
          No orders found matching criteria / کوئی آرڈر نہیں ملا
        </div>
      `;
      return;
    }

    container.innerHTML = orders.map((o: any) => renderOrderRow(o)).join('');
    attachRowActions();
  } catch (err: any) {
    container.innerHTML = `<div class="text-rose-400 p-4 text-sm">Error loading orders: ${err.message}</div>`;
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

function renderOrderRow(order: any): string {
  const next = getNextStatus(order.status);
  const isPaid = order.remainingAmount === 0;
  const custName = order.customer?.name || 'Customer';
  const custPhone = order.customer?.phone || '';
  const deliveryDate = order.expectedDeliveryDate
    ? new Date(order.expectedDeliveryDate).toLocaleDateString('en-GB')
    : '--';

  return `
    <div class="tailor-card p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="space-y-1">
        <div class="flex items-center gap-2">
          <span class="font-mono font-extrabold text-white text-base tracking-wider">${order.orderNumber}</span>
          ${getStatusBadge(order.status)}
          <span class="text-xs px-2 py-0.5 rounded ${isPaid ? 'payment-paid' : 'payment-partial'}">
            ${isPaid ? 'Paid / ادا شدہ' : `Due: ${order.remainingAmount} PKR`}
          </span>
        </div>
        <div class="text-xs sm:text-sm font-semibold text-slate-200 flex items-center gap-2">
          <span>${custName}</span>
          ${
            custPhone
              ? `<a href="https://wa.me/92${custPhone.replace(/\D/g, '').replace(/^0/, '')}" target="_blank" class="text-emerald-400 hover:underline flex items-center gap-1 text-xs">
                  <span>💬</span> <span>${custPhone}</span>
                </a>`
              : ''
          }
        </div>
        <div class="text-xs text-slate-400">
          <span>${order.clothingCategory.replace('_', ' ').toUpperCase()}</span> •
          <span>Delivery: <strong class="text-slate-300">${deliveryDate}</strong></span>
          ${order.fabric?.fabricType ? ` • <span>${order.fabric.fabricType}</span>` : ''}
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        ${
          next
            ? `<button class="btn-advance-status px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold" data-id="${order._id}" data-next="${next}">
                Move to ${next.toUpperCase()} ➔
              </button>`
            : ''
        }
        ${
          !isPaid
            ? `<button class="btn-pay px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold" data-id="${order._id}" data-num="${order.orderNumber}" data-rem="${order.remainingAmount}">
                + Payment
              </button>`
            : ''
        }
        <button class="btn-print p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700" data-id="${order._id}">
          🖨 Slip
        </button>
      </div>
    </div>
  `;
}

function attachRowActions(): void {
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
        showToast(`Moved to ${next.toUpperCase()}`, 'success');
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
      showToast('Payment recorded successfully', 'success');
      modal?.classList.add('hidden');
      await loadOrders();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  });
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
        <p style="margin: 2px 0;">Quality Stitching & Bespoke Pakistani Suits</p>
        <p style="margin: 2px 0;">Phone: 0300-0000000 • Lahore</p>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <div><strong>Order #:</strong> ${order.orderNumber}</div>
        <div><strong>Date:</strong> ${new Date(order.orderDate || Date.now()).toLocaleDateString('en-GB')}</div>
      </div>
      <div style="margin-bottom: 8px;">
        <div><strong>Customer:</strong> ${order.customer?.name || 'Customer'} (${order.customer?.phone || '--'})</div>
        <div><strong>Delivery:</strong> <span style="font-size: 15px; font-weight: bold;">${new Date(order.expectedDeliveryDate).toLocaleDateString('en-GB')}</span></div>
      </div>
      <div style="border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 6px 0; margin-bottom: 8px;">
        <div><strong>Item:</strong> ${order.clothingCategory.toUpperCase()}</div>
        <div><strong>Fabric:</strong> ${order.fabric?.fabricType || 'Customer Cloth'} (${order.fabric?.color || 'Standard'})</div>
      </div>
      <div style="margin-bottom: 10px;">
        <div style="font-weight: bold; margin-bottom: 4px;">MEASUREMENTS (INCHES):</div>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;" border="1">
          <tr style="background: #f0f0f0;">
            <th>Lambai</th><th>Teera</th><th>Chhati</th><th>Bazu</th><th>Collar</th><th>Ghera</th>
          </tr>
          <tr style="text-align: center;">
            <td>${q.length || '--'}</td><td>${q.shoulder || '--'}</td><td>${q.chest || '--'}</td><td>${q.sleeve || '--'}</td><td>${q.collar || '--'}</td><td>${q.ghera || '--'}</td>
          </tr>
        </table>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 4px;" border="1">
          <tr style="background: #f0f0f0;">
            <th>Shalwaar</th><th>Paincha</th><th>Aasan</th><th>Kamar</th>
          </tr>
          <tr style="text-align: center;">
            <td>${s.length || '--'}</td><td>${s.paincha || '--'}</td><td>${s.aasan || '--'}</td><td>${s.waist || '--'}</td>
          </tr>
        </table>
      </div>
      <div style="border-top: 1px dashed #000; padding-top: 6px;">
        <div style="display: flex; justify-content: space-between;"><span>Total:</span> <strong>${order.totalAmount} PKR</strong></div>
        <div style="display: flex; justify-content: space-between;"><span>Advance:</span> <span>${order.advancePayment || 0} PKR</span></div>
        <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: bold; border-top: 1px solid #000; margin-top: 4px;">
          <span>Remaining:</span> <span>${order.remainingAmount} PKR</span>
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
