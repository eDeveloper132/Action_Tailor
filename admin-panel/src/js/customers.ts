import { renderNavbar, showToast } from '../ui_components/index.ts';
import '../utils/api.ts';

let customersCache: any[] = [];
let currentViewingCustomer: any = null;

async function initCustomersPage(): Promise<void> {
  renderNavbar('navbarMount', {
    brandName: 'Action Tailor',
    logoIcon: '⚡',
    activeLink: 'customers',
    showAuthButton: true,
  });

  setupModalHandlers();
  setupSearchListener();
  await loadCustomers();
}

async function loadCustomers(q: string = ''): Promise<void> {
  const container = document.getElementById('customersGridContainer');
  if (!container) return;

  try {
    const url = q.trim()
      ? `/api/customers/search?q=${encodeURIComponent(q.trim())}`
      : '/api/customers?limit=100';
    const res = await (window as any).ActionTailor.apiFetch(url);
    customersCache = Array.isArray(res.data) ? res.data : res.data?.customers || [];

    if (customersCache.length === 0) {
      container.innerHTML = `
        <div class="col-span-full p-8 text-center text-slate-400 text-sm bg-white rounded-2xl border border-dashed border-slate-200">
          No Customers Found / کوئی کسٹمر نہیں ملا
        </div>
      `;
      return;
    }

    container.innerHTML = customersCache.map((c: any) => renderCustomerCard(c)).join('');
    attachCardListeners();
  } catch (err: any) {
    container.innerHTML = `<div class="text-rose-500 p-4 text-sm">Error: ${err.message}</div>`;
  }
}

function renderCustomerCard(c: any): string {
  const cleanPhone = (c.phone || '').replace(/\D/g, '').replace(/^0/, '');
  return `
    <div class="tailor-card p-5 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3 hover:border-emerald-300 transition-all">
      <div class="flex justify-between items-start">
        <div>
          <h3 class="font-bold text-slate-900 text-base flex items-center gap-1.5 cursor-pointer hover:text-emerald-700 btn-view-cust" data-id="${c._id}">
            <span>${c.name}</span>
            <span class="text-xs text-slate-400 font-normal">🔍</span>
          </h3>
          <div class="text-xs text-slate-500 mt-0.5">📞 ${c.phone}</div>
        </div>
        <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          ${c.totalOrders || 0} Suits / سوٹ
        </span>
      </div>

      ${c.address ? `<div class="text-xs text-slate-600 truncate">📍 ${c.address}</div>` : '<div class="text-xs text-slate-400 italic">No Address / پتہ درج نہیں</div>'}
      ${c.email ? `<div class="text-xs text-slate-500 truncate">✉️ ${c.email}</div>` : ''}

      <div class="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
        <div class="flex items-center gap-3">
          <button class="text-slate-600 hover:text-emerald-700 font-semibold btn-view-cust" data-id="${c._id}">
            View / دیکھیں
          </button>
          <button class="text-slate-500 hover:text-slate-900 font-medium btn-edit-cust" data-id="${c._id}">
            Edit / ترمیم کریں
          </button>
        </div>
        <div class="flex items-center gap-2">
          ${
            cleanPhone
              ? `<a href="https://wa.me/92${cleanPhone}" target="_blank" class="text-emerald-600 hover:text-emerald-800 font-bold" title="WhatsApp">
                  💬
                </a>`
              : ''
          }
          <a href="/new-order.html?customerId=${c._id}" class="text-xs px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors">
            New Order / نیا آرڈر
          </a>
        </div>
      </div>
    </div>
  `;
}

function attachCardListeners(): void {
  document.querySelectorAll('.btn-view-cust').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const id = (e.currentTarget as HTMLElement).dataset.id;
      if (id) openViewCustomerModal(id);
    });
  });

  document.querySelectorAll('.btn-edit-cust').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const id = (e.currentTarget as HTMLElement).dataset.id;
      const customer = customersCache.find((c) => c._id === id);
      if (customer) openEditCustomerModal(customer);
    });
  });
}

async function openViewCustomerModal(customerId: string): Promise<void> {
  const modal = document.getElementById('modalViewCustomer');
  if (!modal) return;

  try {
    const res = await (window as any).ActionTailor.apiFetch(`/api/customers/${customerId}`);
    const { customer, measurementProfiles = [], recentOrders = [] } = res.data || {};
    currentViewingCustomer = customer;

    // Header
    const nameEl = document.getElementById('viewCustName');
    const phoneEl = document.getElementById('viewCustPhone');
    const addressEl = document.getElementById('viewCustAddress');
    const emailEl = document.getElementById('viewCustEmail');
    const bookBtn = document.getElementById('btnCustBookSuit') as HTMLAnchorElement;
    const waBtn = document.getElementById('btnCustWhatsApp') as HTMLAnchorElement;

    if (nameEl) nameEl.textContent = customer.name || 'Customer';
    if (phoneEl) phoneEl.textContent = `📞 ${customer.phone || '--'}`;
    if (addressEl) addressEl.textContent = `📍 ${customer.address || 'No address'}`;
    if (emailEl) emailEl.textContent = customer.email ? `✉️ ${customer.email}` : '';
    if (bookBtn) bookBtn.href = `/new-order.html?customerId=${customer._id}`;

    const cleanPhone = (customer.phone || '').replace(/\D/g, '').replace(/^0/, '');
    if (waBtn) {
      waBtn.href = cleanPhone ? `https://wa.me/92${cleanPhone}` : '#';
      waBtn.style.display = cleanPhone ? 'inline-flex' : 'none';
    }

    const linkRecord = document.getElementById('linkRecordMeasurement') as HTMLAnchorElement;
    if (linkRecord) linkRecord.href = `/measurements.html?customerId=${customer._id}`;

    // Measurements list
    const measListEl = document.getElementById('viewCustMeasurementsList');
    if (measListEl) {
      if (measurementProfiles.length === 0) {
        measListEl.innerHTML = `
          <div class="text-xs text-slate-400 p-3 bg-slate-50 rounded-xl text-center">
            No Measurements Recorded / کوئی ناپ محفوظ نہیں ہے
          </div>
        `;
      } else {
        measListEl.innerHTML = measurementProfiles
          .map((m: any) => {
            const q = m.measurements?.qameez || {};
            const s = m.measurements?.shalwaar || {};
            return `
              <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                <div class="flex justify-between items-center font-bold text-slate-800">
                  <span>${m.title} (${m.clothingCategory.toUpperCase()})</span>
                  <a href="/new-order.html?customerId=${customer._id}&profileId=${m._id}" class="text-emerald-600 hover:underline font-semibold">
                    New Order / نیا آرڈر ➔
                  </a>
                </div>
                <div class="text-slate-600">
                  Qameez / قمیض: Length / لمبائی ${q.length || '--'}" • Shoulder / کندھا ${q.shoulder || '--'}" • Chest / چھاتی ${q.chest || '--'}" • Sleeve / آستین ${q.sleeve || '--'}" • Collar / کالر ${q.collar || '--'}"
                </div>
                <div class="text-slate-600">
                  Shalwar / شلوار: Length / لمبائی ${s.length || '--'}" • Paincha / پائنچہ ${s.paincha || '--'}" • Aasan / آسن ${s.aasan || '--'}"
                </div>
              </div>
            `;
          })
          .join('');
      }
    }

    // Orders list
    const ordersListEl = document.getElementById('viewCustOrdersList');
    if (ordersListEl) {
      if (recentOrders.length === 0) {
        ordersListEl.innerHTML = `
          <div class="text-xs text-slate-400 p-3 bg-slate-50 rounded-xl text-center">
            No Orders Found / کوئی آرڈر موجود نہیں ہے
          </div>
        `;
      } else {
        ordersListEl.innerHTML = recentOrders
          .map((o: any) => {
            const isPaid = o.remainingAmount === 0;
            return `
              <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex justify-between items-center">
                <div>
                  <div class="font-mono font-bold text-slate-900">${o.orderNumber} <span class="capitalize text-slate-500 font-sans font-normal">• ${o.clothingCategory}</span></div>
                  <div class="text-slate-500 text-[11px]">Due / متوقع تاریخ: ${o.expectedDeliveryDate ? new Date(o.expectedDeliveryDate).toLocaleDateString() : '--'}</div>
                </div>
                <div class="text-right">
                  <div class="font-bold text-slate-800">${o.totalAmount} PKR <span class="text-[10px] px-2 py-0.5 rounded font-semibold ${isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">${isPaid ? 'Paid / ادا شدہ' : `Due: ${o.remainingAmount}`}</span></div>
                  <div class="capitalize text-emerald-700 font-semibold text-[11px]">${o.status}</div>
                </div>
              </div>
            `;
          })
          .join('');
      }
    }

    modal.classList.remove('hidden');
  } catch (err: any) {
    showToast(err.message || 'Failed to fetch customer profile', 'error');
  }
}

function openEditCustomerModal(customer: any): void {
  const modal = document.getElementById('modalEditCustomer');
  if (!modal) return;

  (document.getElementById('editCustId') as HTMLInputElement).value = customer._id;
  (document.getElementById('editCustName') as HTMLInputElement).value = customer.name || '';
  (document.getElementById('editCustPhone') as HTMLInputElement).value = customer.phone || '';
  (document.getElementById('editCustAddress') as HTMLInputElement).value = customer.address || '';
  (document.getElementById('editCustEmail') as HTMLInputElement).value = customer.email || '';

  modal.classList.remove('hidden');
}

function setupModalHandlers(): void {
  // Add Customer Modal
  const modalAdd = document.getElementById('modalAddCustomer');
  const btnOpenAdd = document.getElementById('btnOpenAddCustomerModal');
  const btnCloseAdd = document.getElementById('closeAddCustModal');
  const btnCancelAdd = document.getElementById('btnCancelAddCust');

  btnOpenAdd?.addEventListener('click', () => modalAdd?.classList.remove('hidden'));
  btnCloseAdd?.addEventListener('click', () => modalAdd?.classList.add('hidden'));
  btnCancelAdd?.addEventListener('click', () => modalAdd?.classList.add('hidden'));

  document.getElementById('formAddCustomer')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = (document.getElementById('newCustName') as HTMLInputElement).value.trim();
    const phone = (document.getElementById('newCustPhone') as HTMLInputElement).value.trim();
    const address = (document.getElementById('newCustAddress') as HTMLInputElement).value.trim();
    const email = (document.getElementById('newCustEmail') as HTMLInputElement).value.trim() || undefined;

    if (!name || !phone) {
      showToast('Customer Name and Phone Number are required / کسٹمر کا نام اور فون نمبر ضروری ہیں', 'warning');
      return;
    }

    try {
      await (window as any).ActionTailor.apiFetch('/api/customers', {
        method: 'POST',
        body: JSON.stringify({ name, phone, address, email }),
      });
      showToast('Customer registered successfully / کسٹمر محفوظ ہو گیا ہے', 'success');
      modalAdd?.classList.add('hidden');
      (e.target as HTMLFormElement).reset();
      await loadCustomers();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  });

  // Edit Customer Modal
  const modalEdit = document.getElementById('modalEditCustomer');
  const btnCloseEdit = document.getElementById('closeEditCustModal');
  const btnCancelEdit = document.getElementById('btnCancelEditCust');

  btnCloseEdit?.addEventListener('click', () => modalEdit?.classList.add('hidden'));
  btnCancelEdit?.addEventListener('click', () => modalEdit?.classList.add('hidden'));

  document.getElementById('formEditCustomer')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = (document.getElementById('editCustId') as HTMLInputElement).value;
    const name = (document.getElementById('editCustName') as HTMLInputElement).value.trim();
    const phone = (document.getElementById('editCustPhone') as HTMLInputElement).value.trim();
    const address = (document.getElementById('editCustAddress') as HTMLInputElement).value.trim();
    const email = (document.getElementById('editCustEmail') as HTMLInputElement).value.trim();

    try {
      await (window as any).ActionTailor.apiFetch(`/api/customers/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name, phone, address, email }),
      });
      showToast('Customer updated successfully / کسٹمر کی معلومات اپڈیٹ ہو گئی ہیں', 'success');
      modalEdit?.classList.add('hidden');
      await loadCustomers();
      if (currentViewingCustomer && currentViewingCustomer._id === id) {
        await openViewCustomerModal(id);
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  });

  // View Customer Modal
  const modalView = document.getElementById('modalViewCustomer');
  const btnCloseView = document.getElementById('closeViewCustModal');
  const btnCloseViewBottom = document.getElementById('btnCloseViewCust');
  const btnEditFromView = document.getElementById('btnCustEditFromView');

  btnCloseView?.addEventListener('click', () => modalView?.classList.add('hidden'));
  btnCloseViewBottom?.addEventListener('click', () => modalView?.classList.add('hidden'));

  btnEditFromView?.addEventListener('click', () => {
    if (currentViewingCustomer) {
      modalView?.classList.add('hidden');
      openEditCustomerModal(currentViewingCustomer);
    }
  });
}

function setupSearchListener(): void {
  const searchInput = document.getElementById('customerSearchInput') as HTMLInputElement;
  if (!searchInput) return;

  searchInput.addEventListener(
    'input',
    debounce(() => {
      loadCustomers(searchInput.value);
    }, 300)
  );
}

function debounce(fn: Function, ms = 300) {
  let timer: any;
  return (...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

initCustomersPage();

