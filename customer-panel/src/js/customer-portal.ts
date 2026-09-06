import { renderNavbar, showToast } from '../ui_components/index.ts';
import '../utils/api.ts';

let portalData: any = null;
let activeOrdersList: any[] = [];

async function initCustomerPortal(): Promise<void> {
  // Render customer-centric Navbar
  renderNavbar('navbarMount', {
    brandName: 'Action Tailor • Customer Portal',
    logoIcon: '✂',
    activeLink: 'dashboard',
    showAuthButton: true,
  });

  setupSocketIO();
  await loadCustomerData();
}

async function loadCustomerData(): Promise<void> {
  try {
    const res = await (window as any).ActionTailor.apiFetch('/api/dashboard/customer');
    portalData = res.data;

    const { customerProfile, activeOrders, completedOrders, measurementProfiles } = portalData;
    activeOrdersList = activeOrders || [];

    // Header & Welcome
    const custNameEl = document.getElementById('custWelcomeName');
    const phoneEl = document.getElementById('customerPhoneDisplay');
    if (custNameEl && customerProfile) {
      custNameEl.textContent = `خوش آمدید، ${customerProfile.name || 'Customer'}`;
    }
    if (phoneEl && customerProfile) {
      phoneEl.textContent = `📞 ${customerProfile.phone} • ${customerProfile.city || 'Lahore'}`;
    }

    // Compute Stats
    const activeCount = activeOrders.length;
    const readyOrders = activeOrders.filter((o: any) => o.status === 'ready');
    const totalRemaining = activeOrders.reduce((acc: number, o: any) => acc + (o.remainingAmount || 0), 0);

    const statActive = document.getElementById('statActiveSuits');
    const statReady = document.getElementById('statReadySuits');
    const statDue = document.getElementById('statDueBalance');
    const statCompleted = document.getElementById('statCompletedSuits');

    if (statActive) statActive.textContent = activeCount.toString();
    if (statReady) statReady.textContent = readyOrders.length.toString();
    if (statDue) statDue.textContent = `${totalRemaining.toLocaleString()} PKR`;
    if (statCompleted) statCompleted.textContent = (completedOrders || []).length.toString();

    // Ready for pickup celebratory alert
    const readyAlert = document.getElementById('readyPickupAlert');
    if (readyAlert) {
      if (readyOrders.length > 0) {
        readyAlert.classList.remove('hidden');
      } else {
        readyAlert.classList.add('hidden');
      }
    }

    renderActiveSuits(activeOrders);
    renderMeasurementProfiles(measurementProfiles || []);
    renderCompletedHistory(completedOrders || []);
  } catch (err: any) {
    console.error('Portal load error:', err);
    showToast('Failed to load customer portal data', 'error');
  }
}

function renderActiveSuits(orders: any[]): void {
  const container = document.getElementById('activeSuitsContainer');
  if (!container) return;

  if (orders.length === 0) {
    container.innerHTML = `
      <div class="p-8 text-center text-slate-400 text-sm bg-white rounded-2xl border border-dashed border-slate-200">
        You currently have no active suits in stitching / آپ کا کوئی سوٹ زیرِ عمل نہیں ہے۔
      </div>
    `;
    return;
  }

  container.innerHTML = orders.map((o: any) => renderCustomerSuitCard(o)).join('');
  attachPrintButtons();
}

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

function renderCustomerSuitCard(order: any): string {
  const steps = [
    { key: 'pending', label: 'Pending / زیر التوا' },
    { key: 'cutting', label: 'Cutting / کٹائی' },
    { key: 'stitching', label: 'Stitching / سلائی' },
    { key: 'ready', label: 'Ready / تیار' },
  ];

  const currentIdx = steps.findIndex((s) => s.key === order.status);
  const deliveryFormatted = order.expectedDeliveryDate
    ? new Date(order.expectedDeliveryDate).toLocaleDateString('en-GB')
    : '--';
  const isPaid = order.remainingAmount === 0;

  return `
    <div class="tailor-card p-5 sm:p-6 rounded-2xl space-y-4 border border-slate-200 bg-white shadow-xs">
      <!-- Top Line: Order Number & Garment & Financials -->
      <div class="flex justify-between items-start flex-wrap gap-2">
        <div>
          <div class="font-mono text-lg sm:text-xl font-extrabold text-slate-900">Order # / آرڈر نمبر: ${order.orderNumber}</div>
          <div class="text-xs sm:text-sm font-semibold text-emerald-700 mt-0.5">
            ${getGarmentName(order.clothingCategory)}
          </div>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs px-2.5 py-0.5 rounded font-semibold ${isPaid ? 'payment-paid' : 'payment-partial'}">
            ${isPaid ? 'Paid / ادا شدہ' : `Due / بقایا: ${order.remainingAmount} PKR`}
          </span>
          <button class="btn-print-slip px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs border border-slate-300 font-semibold" data-id="${order._id}">
            🖨 Slip / پرچی
          </button>
        </div>
      </div>

      <!-- Current Status & Expected Date Box -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 gap-2 text-xs sm:text-sm">
        <div class="flex items-center gap-2">
          <span class="text-slate-500 font-medium">Status / حالت:</span>
          <span class="font-bold px-2.5 py-0.5 rounded-md ${getStatusBadgeClass(order.status)}">${getStatusLabel(order.status)}</span>
        </div>
        <div>
          <span class="text-slate-500 font-medium">Expected Date / متوقع تاریخ:</span>
          <strong class="text-slate-900 ml-1 font-mono">${deliveryFormatted}</strong>
        </div>
      </div>

      <!-- Live Stepper Progress -->
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

      <!-- Suit Specifications Details -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs text-slate-600">
        <div>
          <div><strong>Fabric / کپڑا:</strong> ${order.fabric?.fabricType || 'Standard'} (${order.fabric?.color || 'White'})</div>
        </div>
        <div class="sm:text-right">
          <div>Total / کل رقم: <strong class="text-slate-900">${order.totalAmount} PKR</strong> (Advance / پیشگی رقم: ${order.advancePayment || 0} PKR)</div>
          ${order.remainingAmount > 0 ? `<div class="text-amber-700 font-semibold">Remaining / بقایا رقم: ${order.remainingAmount} PKR</div>` : ''}
        </div>
      </div>
    </div>
  `;
}

function renderMeasurementProfiles(profiles: any[]): void {
  const container = document.getElementById('customerMeasurementsGrid');
  if (!container) return;

  if (profiles.length === 0) {
    container.innerHTML = `
      <div class="col-span-full p-6 text-center text-slate-500 text-xs bg-white rounded-2xl border border-dashed border-slate-200">
        No measurements on file yet. Your tailor will record them on your next visit.
      </div>
    `;
    return;
  }

  container.innerHTML = profiles
    .map((p: any) => {
      const q = p.measurements?.qameez || {};
      const s = p.measurements?.shalwaar || {};
      return `
      <div class="tailor-card p-4 rounded-xl space-y-3 text-xs border border-slate-200 bg-white shadow-xs">
        <div class="flex justify-between items-center">
          <strong class="text-slate-900 text-sm font-bold">${p.title}</strong>
          <span class="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-emerald-700 font-semibold border border-slate-200">${p.unit || 'inches / انچ'}</span>
        </div>
        
        <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
          <div class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Upper Body / قمیض</div>
          <div class="grid grid-cols-3 gap-1.5 text-slate-800">
            <div><span class="text-slate-400">Length / لمبائی:</span> <strong>${q.length || '--'}</strong></div>
            <div><span class="text-slate-400">Shoulder / کندھا:</span> <strong>${q.shoulder || '--'}</strong></div>
            <div><span class="text-slate-400">Chest / چھاتی:</span> <strong>${q.chest || '--'}</strong></div>
            <div><span class="text-slate-400">Sleeve / آستین:</span> <strong>${q.sleeve || '--'}</strong></div>
            <div><span class="text-slate-400">Collar / کالر:</span> <strong>${q.collar || '--'}</strong></div>
            <div><span class="text-slate-400">Daman / دامن:</span> <strong>${q.daman || q.ghera || '--'}</strong></div>
          </div>

          <div class="text-[11px] font-bold text-slate-500 uppercase tracking-wider pt-2 border-t border-slate-200">Lower Body / شلوار</div>
          <div class="grid grid-cols-3 gap-1.5 text-slate-800">
            <div><span class="text-slate-400">Length / لمبائی:</span> <strong>${s.length || '--'}</strong></div>
            <div><span class="text-slate-400">Paincha / پانچہ:</span> <strong>${s.paincha || '--'}</strong></div>
            <div><span class="text-slate-400">Aasan / آسن:</span> <strong>${s.aasan || '--'}</strong></div>
          </div>
        </div>
      </div>
    `;
    })
    .join('');
}

function renderCompletedHistory(orders: any[]): void {
  const container = document.getElementById('completedOrdersContainer');
  if (!container) return;

  if (orders.length === 0) {
    container.innerHTML = `
      <div class="p-4 text-center text-slate-500 text-xs bg-white rounded-xl border border-dashed border-slate-200">
        No delivered orders history yet / کوئی ریکارڈ نہیں ہے
      </div>
    `;
    return;
  }

  container.innerHTML = orders
    .map(
      (o: any) => `
    <div class="p-3.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs shadow-2xs flex-wrap gap-2">
      <div>
        <span class="font-mono font-bold text-slate-900">Order # / آرڈر نمبر: ${o.orderNumber}</span>
        <span class="text-emerald-700 ml-2 font-semibold">${getGarmentName(o.clothingCategory)}</span>
        <span class="text-slate-400 ml-2">• Delivered / تاریخ: ${new Date(o.actualDeliveredDate || o.updatedAt).toLocaleDateString('en-GB')}</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-slate-800 font-bold">${o.totalAmount} PKR</span>
        <span class="status-badge status-delivered">Delivered / حوالے کیا گیا</span>
      </div>
    </div>
  `
    )
    .join('');
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
  const order = activeOrdersList.find((o) => o._id === orderId);
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
        <div><strong>Delivery / متوقع تاریخ:</strong> ${new Date(order.expectedDeliveryDate).toLocaleDateString('en-GB')}</div>
      </div>
      <div style="margin-bottom: 8px;">
        <div><strong>Item / لباس:</strong> ${getGarmentName(order.clothingCategory)}</div>
        <div><strong>Fabric / کپڑا:</strong> ${order.fabric?.fabricType || 'Standard'} (${order.fabric?.color || 'Standard'})</div>
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

function setupSocketIO(): void {
  if (typeof (window as any).io !== 'undefined') {
    try {
      const socket = (window as any).io();
      socket.on('order:status_changed', () => {
        showToast('Your suit status was updated / آپ کے سوٹ کی حالت تبدیل ہوئی ہے', 'info');
        loadCustomerData();
      });
      socket.on('order:ready', () => {
        showToast('Your suit is ready for pickup! / آپ کا سوٹ تیار ہے!', 'success', { duration: 8000 });
        loadCustomerData();
      });
    } catch (_e) {}
  }
}

document.getElementById('btnDismissReady')?.addEventListener('click', () => {
  document.getElementById('readyPickupAlert')?.classList.add('hidden');
});

initCustomerPortal();

