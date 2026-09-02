import { renderNavbar, showToast } from '../ui_components/index.ts';

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
      <div class="p-8 text-center text-slate-500 text-sm bg-slate-900/40 rounded-2xl border border-dashed border-slate-800">
        You currently have no active suits in stitching / آپ کا کوئی سوٹ زیرِ عمل نہیں ہے۔
      </div>
    `;
    return;
  }

  container.innerHTML = orders.map((o: any) => renderCustomerSuitCard(o)).join('');
  attachPrintButtons();
}

function renderCustomerSuitCard(order: any): string {
  const steps = [
    { key: 'pending', label: 'Booked / بک ہوا' },
    { key: 'cutting', label: 'Cutting / کٹائی' },
    { key: 'stitching', label: 'Stitching / سلائی' },
    { key: 'ready', label: 'Ready / تیار ہے' },
  ];

  const currentIdx = steps.findIndex((s) => s.key === order.status);
  const deliveryFormatted = order.expectedDeliveryDate
    ? new Date(order.expectedDeliveryDate).toLocaleDateString('en-GB')
    : '--';
  const isPaid = order.remainingAmount === 0;

  return `
    <div class="tailor-card p-5 sm:p-6 rounded-2xl space-y-4 border border-slate-200 bg-white shadow-xs">
      <!-- Top Line: Order Number & Status -->
      <div class="flex justify-between items-center flex-wrap gap-2">
        <div class="flex items-center gap-2">
          <span class="font-mono text-lg sm:text-xl font-extrabold text-slate-900">${order.orderNumber}</span>
          <span class="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            ${order.clothingCategory.replace('_', ' ').toUpperCase()}
          </span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs px-2.5 py-0.5 rounded font-semibold ${isPaid ? 'payment-paid' : 'payment-partial'}">
            ${isPaid ? 'Paid in Full / مکمل ادا' : `Balance Due: ${order.remainingAmount} PKR`}
          </span>
          <button class="btn-print-slip px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs border border-slate-300 font-semibold" data-id="${order._id}">
            🖨 Slip
          </button>
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

      <!-- Suit Specifications & Financials Details -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs text-slate-600">
        <div>
          <div><strong>Fabric / کپڑا:</strong> ${order.fabric?.fabricType || 'Standard'} (${order.fabric?.color || 'White'})</div>
          <div><strong>Style:</strong> Collar: ${order.designOptions?.collarStyle || 'Ban'} | Cuff: ${order.designOptions?.cuffStyle || 'Single'}</div>
        </div>
        <div class="sm:text-right">
          <div>Promised Delivery: <strong class="text-slate-900 text-sm">${deliveryFormatted}</strong></div>
          <div>Total Price: <strong class="text-slate-900">${order.totalAmount} PKR</strong> (Advance: ${order.advancePayment || 0} PKR)</div>
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
          <span class="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-emerald-700 font-semibold border border-slate-200">${p.unit}</span>
        </div>
        
        <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
          <div class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Upper / قمیض</div>
          <div class="grid grid-cols-3 gap-1.5 text-slate-800">
            <div><span class="text-slate-400">Lambai:</span> <strong>${q.length || '--'}</strong></div>
            <div><span class="text-slate-400">Teera:</span> <strong>${q.shoulder || '--'}</strong></div>
            <div><span class="text-slate-400">Chhati:</span> <strong>${q.chest || '--'}</strong></div>
            <div><span class="text-slate-400">Bazu:</span> <strong>${q.sleeve || '--'}</strong></div>
            <div><span class="text-slate-400">Collar:</span> <strong>${q.collar || '--'}</strong></div>
            <div><span class="text-slate-400">Ghera:</span> <strong>${q.ghera || '--'}</strong></div>
          </div>

          <div class="text-[11px] font-bold text-slate-500 uppercase tracking-wider pt-2 border-t border-slate-200">Lower / شلوار</div>
          <div class="grid grid-cols-3 gap-1.5 text-slate-800">
            <div><span class="text-slate-400">Lambai:</span> <strong>${s.length || '--'}</strong></div>
            <div><span class="text-slate-400">Paincha:</span> <strong>${s.paincha || '--'}</strong></div>
            <div><span class="text-slate-400">Aasan:</span> <strong>${s.aasan || '--'}</strong></div>
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
        No delivered suits history yet.
      </div>
    `;
    return;
  }

  container.innerHTML = orders
    .map(
      (o: any) => `
    <div class="p-3.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs shadow-2xs">
      <div>
        <span class="font-mono font-bold text-slate-900">${o.orderNumber}</span>
        <span class="text-slate-500 ml-2 font-medium">${o.clothingCategory.toUpperCase()}</span>
        <span class="text-slate-400 ml-2">• Delivered: ${new Date(o.actualDeliveredDate || o.updatedAt).toLocaleDateString()}</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-emerald-700 font-bold">${o.totalAmount} PKR</span>
        <span class="status-badge status-delivered">Delivered / دیا گیا</span>
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

  const q = order.measurementSnapshot?.qameez || {};
  const s = order.measurementSnapshot?.shalwaar || {};

  slip.innerHTML = `
    <div style="font-family: monospace; font-size: 13px; line-height: 1.4; color: #000; padding: 10px;">
      <div style="text-align: center; border-bottom: 2px dashed #000; padding-bottom: 8px; margin-bottom: 10px;">
        <h2 style="font-size: 18px; margin: 0; font-weight: bold;">ACTION TAILOR / ایکشن ٹیلرز</h2>
        <p style="margin: 2px 0;">Customer Copy • Bespoke Pakistani Tailoring</p>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <div><strong>Order #:</strong> ${order.orderNumber}</div>
        <div><strong>Due:</strong> ${new Date(order.expectedDeliveryDate).toLocaleDateString('en-GB')}</div>
      </div>
      <div style="margin-bottom: 8px;">
        <div><strong>Item:</strong> ${order.clothingCategory.toUpperCase()}</div>
        <div><strong>Fabric:</strong> ${order.fabric?.fabricType || 'Standard'} (${order.fabric?.color || 'Standard'})</div>
      </div>
      <div style="border-top: 1px dashed #000; padding-top: 6px;">
        <div style="display: flex; justify-content: space-between;"><span>Total:</span> <strong>${order.totalAmount} PKR</strong></div>
        <div style="display: flex; justify-content: space-between;"><span>Advance Paid:</span> <span>${order.advancePayment || 0} PKR</span></div>
        <div style="display: flex; justify-content: space-between; font-weight: bold; border-top: 1px solid #000; margin-top: 4px;">
          <span>Remaining Balance:</span> <span>${order.remainingAmount} PKR</span>
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
        showToast('Your suit status was just updated by the tailor!', 'info');
        loadCustomerData();
      });
      socket.on('order:ready', () => {
        showToast('Your suit is READY FOR PICKUP! / تیار ہے', 'success', { duration: 8000 });
        loadCustomerData();
      });
    } catch (_e) {}
  }
}

document.getElementById('btnDismissReady')?.addEventListener('click', () => {
  document.getElementById('readyPickupAlert')?.classList.add('hidden');
});

initCustomerPortal();

