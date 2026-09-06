import { renderNavbar, showToast } from '../ui_components/index.ts';
import '../utils/api.ts';

interface OrderItem {
  _id: string;
  orderNumber: string;
  clothingCategory: string;
  status: string;
  totalAmount: number;
  advancePayment: number;
  remainingAmount: number;
  expectedDeliveryDate?: string;
  actualDeliveredDate?: string;
  fabric?: {
    fabricType?: string;
    color?: string;
  };
  designOptions?: {
    collarStyle?: string;
    cuffStyle?: string;
    pocketStyle?: string;
  };
  measurementSnapshot?: any;
  createdAt: string;
}

let allOrders: OrderItem[] = [];
let currentFilter: string = 'all';
let searchQuery: string = '';

const GARMENT_LABELS: Record<string, string> = {
  shalwar_qameez: 'Shalwar Qameez / شلوار قمیض',
  kurta_pajama: 'Kurta Pajama / کرتا پاجامہ',
  waistcoat: 'Waistcoat / واسکٹ',
  sherwani: 'Sherwani / شیروانی',
  pant_shirt: 'Trouser & Shirt / پینٹ شرٹ',
  coat: 'Coat / کوٹ',
  other: 'Custom Garment / کسٹم لباس',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending / زیر التوا',
  confirmed: 'Confirmed / تصدیق شدہ',
  cutting: 'Cutting / کٹائی',
  stitching: 'Stitching / سلائی',
  quality_check: 'Quality Check / معائنہ',
  ready: 'Ready / تیار',
  delivered: 'Delivered / حوالے کیا گیا',
  cancelled: 'Cancelled / منسوخ',
};

const STATUS_CLASSES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-800 border border-amber-200',
  confirmed: 'bg-blue-50 text-blue-800 border border-blue-200',
  cutting: 'bg-sky-50 text-sky-800 border border-sky-200',
  stitching: 'bg-purple-50 text-purple-800 border border-purple-200',
  quality_check: 'bg-pink-50 text-pink-800 border border-pink-200',
  ready: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
  delivered: 'bg-slate-100 text-slate-700 border border-slate-200',
  cancelled: 'bg-rose-50 text-rose-700 border border-rose-200',
};

function getGarmentName(category: string): string {
  return GARMENT_LABELS[category] || category.replace('_', ' ').toUpperCase();
}

function getStatusLabel(status: string): string {
  return STATUS_LABELS[status] || status;
}

function getStatusBadgeClass(status: string): string {
  return STATUS_CLASSES[status] || 'bg-slate-100 text-slate-700 border border-slate-200';
}

async function initOrdersPage(): Promise<void> {
  renderNavbar('navbarMount', {
    brandName: 'Action Tailor • Customer Portal',
    logoIcon: '✂',
    activeLink: 'orders',
    showAuthButton: true,
  });

  setupEventListeners();
  setupSocketIO();
  await loadOrders();
}

async function loadOrders(): Promise<void> {
  const container = document.getElementById('ordersContainer');
  try {
    const res = await (window as any).ActionTailor.apiFetch('/api/orders?limit=100');
    allOrders = res.data?.orders || [];

    updateCounts();
    renderOrders();
  } catch (err: any) {
    if (container) {
      container.innerHTML = `
        <div class="p-8 text-center text-rose-500 text-sm bg-white rounded-2xl border border-rose-200">
          Failed to load orders / آرڈرز لوڈ کرنے میں مسئلہ پیش آیا
        </div>
      `;
    }
    showToast('Failed to load orders', 'error');
  }
}

function updateCounts(): void {
  const countAll = allOrders.length;
  const countActive = allOrders.filter(
    (o) => o.status !== 'delivered' && o.status !== 'ready' && o.status !== 'cancelled'
  ).length;
  const countReady = allOrders.filter((o) => o.status === 'ready').length;
  const countDelivered = allOrders.filter((o) => o.status === 'delivered').length;

  const elAll = document.getElementById('countAll');
  const elActive = document.getElementById('countActive');
  const elReady = document.getElementById('countReady');
  const elDelivered = document.getElementById('countDelivered');

  if (elAll) elAll.textContent = countAll.toString();
  if (elActive) elActive.textContent = countActive.toString();
  if (elReady) elReady.textContent = countReady.toString();
  if (elDelivered) elDelivered.textContent = countDelivered.toString();
}

function renderOrders(): void {
  const container = document.getElementById('ordersContainer');
  if (!container) return;

  const filtered = allOrders.filter((order) => {
    // Status Filter
    if (currentFilter === 'active') {
      if (order.status === 'delivered' || order.status === 'ready' || order.status === 'cancelled') {
        return false;
      }
    } else if (currentFilter === 'ready') {
      if (order.status !== 'ready') return false;
    } else if (currentFilter === 'delivered') {
      if (order.status !== 'delivered') return false;
    }

    // Search Query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const numMatch = order.orderNumber.toLowerCase().includes(q);
      const catMatch = order.clothingCategory.toLowerCase().includes(q);
      const fabricMatch = (order.fabric?.fabricType || '').toLowerCase().includes(q);
      if (!numMatch && !catMatch && !fabricMatch) return false;
    }

    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="p-12 text-center text-slate-400 text-sm bg-white rounded-2xl border border-dashed border-slate-200">
        No orders found matching your criteria / کوئی آرڈر موجود نہیں ہے
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map((order) => renderOrderCard(order)).join('');
  attachPrintButtons();
}

function renderOrderCard(order: OrderItem): string {
  const steps = [
    { key: 'pending', label: 'Pending / زیر التوا' },
    { key: 'cutting', label: 'Cutting / کٹائی' },
    { key: 'stitching', label: 'Stitching / سلائی' },
    { key: 'ready', label: 'Ready / تیار' },
    { key: 'delivered', label: 'Delivered / حوالے کیا گیا' },
  ];

  let currentIdx = steps.findIndex((s) => s.key === order.status);
  if (order.status === 'confirmed') currentIdx = 0;
  if (order.status === 'quality_check') currentIdx = 2;

  const isDelivered = order.status === 'delivered';
  const deliveryFormatted = order.expectedDeliveryDate
    ? new Date(order.expectedDeliveryDate).toLocaleDateString('en-GB')
    : '--';
  const deliveredFormatted = order.actualDeliveredDate
    ? new Date(order.actualDeliveredDate).toLocaleDateString('en-GB')
    : '--';
  const isPaid = order.remainingAmount === 0;

  return `
    <div class="tailor-card p-5 sm:p-6 rounded-2xl space-y-4 border border-slate-200 bg-white shadow-xs">
      <!-- Top Line: Order Number, Garment, and Financials -->
      <div class="flex justify-between items-start flex-wrap gap-3">
        <div>
          <div class="flex items-center gap-2">
            <span class="font-mono text-lg sm:text-xl font-extrabold text-slate-900">Order # / آرڈر نمبر: ${order.orderNumber}</span>
            <span class="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              ${getGarmentName(order.clothingCategory)}
            </span>
          </div>
          <div class="text-xs text-slate-400 mt-1">
            Booked / تاریخ: ${new Date(order.createdAt).toLocaleDateString('en-GB')}
          </div>
        </div>

        <div class="flex items-center gap-2">
          <span class="text-xs px-3 py-1 rounded-full font-bold ${isPaid ? 'payment-paid' : 'payment-partial'}">
            ${isPaid ? 'Paid / ادا شدہ' : `Due / بقایا: ${order.remainingAmount} PKR`}
          </span>
          <button class="btn-print-slip px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs border border-slate-300 font-semibold" data-id="${order._id}">
            🖨 Slip / پرچی
          </button>
        </div>
      </div>

      <!-- Current Status & Expected Completion Date Banner -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 gap-2 text-xs sm:text-sm">
        <div class="flex items-center gap-2">
          <span class="text-slate-500 font-medium">Status / حالت:</span>
          <span class="font-bold px-2.5 py-0.5 rounded-md ${getStatusBadgeClass(order.status)}">${getStatusLabel(order.status)}</span>
        </div>
        <div>
          <span class="text-slate-500 font-medium">${isDelivered ? 'Delivered / حوالے کیا گیا:' : 'Expected Date / متوقع تاریخ:'}</span>
          <strong class="text-slate-900 ml-1 font-mono">${isDelivered ? deliveredFormatted : deliveryFormatted}</strong>
        </div>
      </div>

      <!-- 5-Stage Stepper Progress -->
      <div class="workflow-stepper py-3">
        ${steps
          .map((step, idx) => {
            const isCompleted = currentIdx > idx || (isDelivered && idx <= 4);
            const isActive = currentIdx === idx && !isDelivered;
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

      <!-- Garment Tailoring Specifications Details -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs text-slate-600">
        <div>
          <div><strong>Fabric / کپڑا:</strong> ${order.fabric?.fabricType || 'Standard'} (${order.fabric?.color || 'White'})</div>
        </div>
        <div class="sm:text-right">
          <div>Total / کل رقم: <strong class="text-slate-900">${order.totalAmount} PKR</strong></div>
          <div>Advance / پیشگی رقم: <strong class="text-slate-900">${order.advancePayment || 0} PKR</strong></div>
          ${order.remainingAmount > 0 ? `<div class="text-amber-700 font-bold">Remaining / بقایا رقم: ${order.remainingAmount} PKR</div>` : ''}
        </div>
      </div>
    </div>
  `;
}

function attachPrintButtons(): void {
  document.querySelectorAll('.btn-print-slip').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const orderId = (e.currentTarget as HTMLElement).dataset.id;
      if (orderId) printReceipt(orderId);
    });
  });
}

function printReceipt(orderId: string): void {
  const order = allOrders.find((o) => o._id === orderId);
  if (!order) return;

  const slip = document.getElementById('printSlipContent');
  if (!slip) return;

  slip.innerHTML = `
    <div style="font-family: monospace; font-size: 13px; line-height: 1.4; color: #000; padding: 10px;">
      <div style="text-align: center; border-bottom: 2px dashed #000; padding-bottom: 8px; margin-bottom: 10px;">
        <h2 style="font-size: 18px; margin: 0; font-weight: bold;">ACTION TAILOR / ایکشن ٹیلرز</h2>
        <p style="margin: 2px 0;">Customer Copy / کسٹمر کاپی</p>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <div><strong>Order # / آرڈر نمبر:</strong> ${order.orderNumber}</div>
        <div><strong>Expected / متوقع تاریخ:</strong> ${order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate).toLocaleDateString('en-GB') : '--'}</div>
      </div>
      <div style="margin-bottom: 8px;">
        <div><strong>Item / لباس:</strong> ${getGarmentName(order.clothingCategory)}</div>
        <div><strong>Fabric / کپڑا:</strong> ${order.fabric?.fabricType || 'Standard'} (${order.fabric?.color || 'Standard'})</div>
        <div><strong>Status / حالت:</strong> ${getStatusLabel(order.status)}</div>
      </div>
      <div style="border-top: 1px dashed #000; padding-top: 6px;">
        <div style="display: flex; justify-content: space-between;"><span>Total / کل رقم:</span> <strong>${order.totalAmount} PKR</strong></div>
        <div style="display: flex; justify-content: space-between;"><span>Advance / پیشگی رقم:</span> <span>${order.advancePayment || 0} PKR</span></div>
        <div style="display: flex; justify-content: space-between; font-weight: bold; border-top: 1px solid #000; margin-top: 4px;">
          <span>Remaining / بقایا رقم:</span> <span>${order.remainingAmount} PKR</span>
        </div>
      </div>
    </div>
  `;

  window.print();
}

function setupEventListeners(): void {
  // Tabs filter
  const tabs = document.querySelectorAll('.filter-tab');
  tabs.forEach((tab) => {
    tab.addEventListener('click', (e) => {
      tabs.forEach((t) => {
        t.classList.remove('bg-emerald-600', 'text-white');
        t.classList.add('bg-slate-100', 'text-slate-600');
      });

      const clicked = e.currentTarget as HTMLElement;
      clicked.classList.remove('bg-slate-100', 'text-slate-600');
      clicked.classList.add('bg-emerald-600', 'text-white');

      currentFilter = clicked.dataset.filter || 'all';
      renderOrders();
    });
  });

  // Search input
  const searchInput = document.getElementById('searchOrdersInput') as HTMLInputElement | null;
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = (e.target as HTMLInputElement).value.trim();
      renderOrders();
    });
  }
}

function setupSocketIO(): void {
  if (typeof (window as any).io !== 'undefined') {
    try {
      const socket = (window as any).io();
      socket.on('order:status_changed', () => {
        showToast('Your order status was updated / آپ کے آرڈر کی حالت اپڈیٹ ہو گئی', 'info');
        loadOrders();
      });
      socket.on('order:ready', () => {
        showToast('Your suit is ready for pickup! / آپ کا سوٹ تیار ہے!', 'success', { duration: 8000 });
        loadOrders();
      });
    } catch (_e) {}
  }
}

initOrdersPage();

