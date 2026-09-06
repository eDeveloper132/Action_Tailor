import { renderNavbar, showToast } from '../ui_components/index.ts';
import '../utils/api.ts';

let customersList: any[] = [];
let selectedCategory = 'shalwaar_qameez';
let currentGarmentProfile: any = null;
let isEditingMeasurement: boolean = false;

const GARMENT_NAMES: Record<string, string> = {
  shalwaar_qameez: 'Shalwar Qameez / شلوار قمیض',
  kurta_pajama: 'Kurta Pajama / کرتہ پاجامہ',
  waistcoat: 'Waistcoat / واسکٹ',
  trouser_shirt: 'Trouser & Shirt / پینٹ شرٹ',
  sherwani: 'Sherwani / شیروانی',
  safari_suit: 'Safari Suit / سفاری سوٹ',
  custom: 'Custom Garment / کسٹم لباس',
};

function getGarmentDisplay(cat: string): string {
  return GARMENT_NAMES[cat] || cat.replace('_', ' ').toUpperCase();
}

async function initNewOrderStudio(): Promise<void> {
  renderNavbar('navbarMount', {
    brandName: 'Action Tailor',
    logoIcon: '⚡',
    activeLink: 'new-order',
    showAuthButton: true,
  });

  // Set default delivery date to 7 days from today
  const defaultDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const dateInput = document.getElementById('orderDeliveryDateInput') as HTMLInputElement;
  if (dateInput) dateInput.value = defaultDate;

  const urlParams = new URLSearchParams(window.location.search);
  const targetCustomerId = urlParams.get('customerId') || '';

  await loadClothingCategories();
  await loadCustomers(targetCustomerId);
  setupSearchFilter();
  setupQuickAddCustomerModal();
  setupCustomerChangeListener();
  setupFormSubmission();

  if (targetCustomerId) {
    const selectCustomer = document.getElementById('selectCustomer') as HTMLSelectElement;
    if (selectCustomer) {
      selectCustomer.value = targetCustomerId;
      await onCustomerSelected(targetCustomerId);
    }
  }
}

async function loadClothingCategories(): Promise<void> {
  const grid = document.getElementById('clothingCategoriesGrid');
  if (!grid) return;

  try {
    const res = await (window as any).ActionTailor.apiFetch('/api/dashboard/clothing-types');
    const categories = res.data || [];

    grid.innerHTML = categories
      .map(
        (cat: any) => `
      <div class="cat-card p-3 rounded-xl border cursor-pointer transition-all ${
        cat.key === selectedCategory
          ? 'bg-emerald-50 border-emerald-600 text-emerald-900 shadow-xs ring-1 ring-emerald-600'
          : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-100'
      }" data-key="${cat.key}">
        <div class="font-bold text-xs sm:text-sm">${cat.nameEn}</div>
        <div class="text-xs text-emerald-700 font-medium">${cat.nameUr}</div>
      </div>
    `
      )
      .join('');

    grid.querySelectorAll('.cat-card').forEach((card) => {
      card.addEventListener('click', async (e) => {
        const target = e.currentTarget as HTMLElement;
        selectedCategory = target.dataset.key || 'shalwaar_qameez';
        (document.getElementById('selectedCategoryInput') as HTMLInputElement).value = selectedCategory;

        grid.querySelectorAll('.cat-card').forEach((c) => {
          c.className =
            'cat-card p-3 rounded-xl border cursor-pointer transition-all bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-100';
        });

        target.className =
          'cat-card p-3 rounded-xl border cursor-pointer transition-all bg-emerald-50 border-emerald-600 text-emerald-900 shadow-xs ring-1 ring-emerald-600';

        // When category changes, auto-load garment-specific measurement for selected customer
        const customerId = (document.getElementById('selectCustomer') as HTMLSelectElement)?.value;
        if (customerId) {
          await checkAndLoadGarmentMeasurement(customerId, selectedCategory);
        }
      });
    });
  } catch (err: any) {
    console.error('Error loading clothing types:', err);
  }
}

async function loadCustomers(selectedId: string = ''): Promise<void> {
  const select = document.getElementById('selectCustomer') as HTMLSelectElement;
  if (!select) return;

  try {
    const res = await (window as any).ActionTailor.apiFetch('/api/customers?limit=100');
    customersList = res.data?.customers || [];

    renderCustomerOptions(customersList, selectedId);
  } catch (err: any) {
    select.innerHTML = `<option value="">Error loading customers: ${err.message}</option>`;
  }
}

function renderCustomerOptions(list: any[], selectedId: string = ''): void {
  const select = document.getElementById('selectCustomer') as HTMLSelectElement;
  if (!select) return;

  if (list.length === 0) {
    select.innerHTML = '<option value="">No customers found</option>';
    return;
  }

  select.innerHTML =
    '<option value="">Select customer / گاہک منتخب کریں</option>' +
    list
      .map(
        (c: any) =>
          `<option value="${c._id}" ${c._id === selectedId ? 'selected' : ''}>${c.name} (${c.phone} ${c.address ? `- ${c.address}` : ''})</option>`
      )
      .join('');
}

function setupSearchFilter(): void {
  const searchInput = document.getElementById('inputSearchCust') as HTMLInputElement;
  const select = document.getElementById('selectCustomer') as HTMLSelectElement;

  searchInput?.addEventListener('input', () => {
    const q = searchInput.value.trim().toLowerCase();
    if (!q) {
      renderCustomerOptions(customersList, select.value);
      return;
    }

    const filtered = customersList.filter(
      (c) =>
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q)) ||
        (c.address && c.address.toLowerCase().includes(q))
    );

    renderCustomerOptions(filtered, select.value);

    // If exact or single match, select it
    if (filtered.length === 1) {
      select.value = filtered[0]._id;
      onCustomerSelected(filtered[0]._id);
    }
  });
}

function setupCustomerChangeListener(): void {
  const selectCustomer = document.getElementById('selectCustomer') as HTMLSelectElement;
  selectCustomer?.addEventListener('change', () => {
    const customerId = selectCustomer.value;
    if (customerId) {
      onCustomerSelected(customerId);
    } else {
      clearCustomerPreview();
      clearMeasurements();
      resetMeasurementStatusBanner();
    }
  });
}

async function onCustomerSelected(customerId: string): Promise<void> {
  const customer = customersList.find((c) => c._id === customerId);
  updateCustomerPreview(customer);
  await checkAndLoadGarmentMeasurement(customerId, selectedCategory);
}

/**
 * Core Workflow: Garment-Specific Measurement Resolution
 * Checks if measurement exists for Customer + Garment Type
 * Shows "Previous Measurement Found" vs "No Previous Measurement"
 */
async function checkAndLoadGarmentMeasurement(customerId: string, category: string): Promise<void> {
  const banner = document.getElementById('measurementStatusBanner');
  const iconEl = document.getElementById('measStatusIcon');
  const titleEl = document.getElementById('measStatusTitle');
  const subEl = document.getElementById('measStatusSubtitle');
  const btnContainer = document.getElementById('measActionButtons');
  const updateChk = document.getElementById('chkUpdateGarmentProfile') as HTMLInputElement | null;

  if (!customerId) {
    resetMeasurementStatusBanner();
    clearMeasurements();
    currentGarmentProfile = null;
    return;
  }

  try {
    const res = await (window as any).ActionTailor.apiFetch(
      `/api/measurements/customer/${customerId}/garment/${category}`
    );
    const profile = res.data;
    currentGarmentProfile = profile;
    isEditingMeasurement = false;

    if (profile && profile.measurements) {
      // PREVIOUS MEASUREMENT FOUND / پچھلا ناپ موجود ہے
      if (banner) {
        banner.className =
          'p-3.5 rounded-xl border border-emerald-300 bg-emerald-50/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all';
      }
      if (iconEl) iconEl.textContent = '✓';
      if (titleEl) {
        titleEl.className = 'text-xs sm:text-sm font-extrabold text-emerald-950';
        titleEl.textContent = 'Previous Measurement Found / پچھلا ناپ موجود ہے';
      }
      const updatedDate = profile.updatedAt
        ? new Date(profile.updatedAt).toLocaleDateString('en-GB')
        : '';
      if (subEl) {
        subEl.className = 'text-[11px] text-emerald-800 font-medium';
        subEl.textContent = `${getGarmentDisplay(category)} • Last updated: ${updatedDate || 'On file'}`;
      }

      if (btnContainer) {
        btnContainer.innerHTML = `
          <button type="button" id="btnUseExisting" class="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-700 text-white shadow-xs hover:bg-emerald-800 transition-all flex items-center gap-1">
            <span>✓</span> <span>Use Existing / پرانا ناپ استعمال کریں</span>
          </button>
          <button type="button" id="btnEditMeasurement" class="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white text-emerald-800 border border-emerald-300 hover:bg-emerald-100 transition-all flex items-center gap-1">
            <span>✏️</span> <span>Edit Measurement / ناپ میں ترمیم کریں</span>
          </button>
        `;

        document.getElementById('btnUseExisting')?.addEventListener('click', () => {
          populateMeasurements(profile);
          isEditingMeasurement = false;
          highlightButtons('existing');
          showToast('Loaded existing measurement / محفوظ شدہ ناپ لاگو ہو گیا', 'info');
        });

        document.getElementById('btnEditMeasurement')?.addEventListener('click', () => {
          isEditingMeasurement = true;
          highlightButtons('editing');
          if (updateChk) updateChk.checked = true;
          showToast('Editing measurement. Changes will update the latest profile.', 'info');
          (document.getElementById('ordDimLength') as HTMLInputElement)?.focus();
        });
      }

      // Automatically load the existing measurements into the inputs
      populateMeasurements(profile);
      if (updateChk) updateChk.checked = false; // Unchecked by default for clean existing usage
    } else {
      // NO PREVIOUS MEASUREMENT / پچھلا ناپ موجود نہیں
      if (banner) {
        banner.className =
          'p-3.5 rounded-xl border border-amber-300 bg-amber-50/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all';
      }
      if (iconEl) iconEl.textContent = '⚠';
      if (titleEl) {
        titleEl.className = 'text-xs sm:text-sm font-extrabold text-amber-950';
        titleEl.textContent = 'No Previous Measurement / پچھلا ناپ موجود نہیں';
      }
      if (subEl) {
        subEl.className = 'text-[11px] text-amber-800 font-medium';
        subEl.textContent = `No recorded measurement for ${getGarmentDisplay(category)}. Enter new measurements below.`;
      }

      if (btnContainer) {
        btnContainer.innerHTML = `
          <span class="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-600 text-white shadow-xs">
            + Create New Measurement / نیا ناپ بنائیں
          </span>
        `;
      }

      clearMeasurements();
      isEditingMeasurement = true;
      if (updateChk) updateChk.checked = true;
    }
  } catch (err: any) {
    console.error('Failed to load garment measurement:', err);
  }
}

function highlightButtons(mode: 'existing' | 'editing'): void {
  const btnUse = document.getElementById('btnUseExisting');
  const btnEdit = document.getElementById('btnEditMeasurement');
  const updateChk = document.getElementById('chkUpdateGarmentProfile') as HTMLInputElement | null;

  if (mode === 'existing') {
    btnUse?.classList.remove('bg-white', 'text-emerald-800', 'border');
    btnUse?.classList.add('bg-emerald-700', 'text-white');

    btnEdit?.classList.remove('bg-emerald-700', 'text-white');
    btnEdit?.classList.add('bg-white', 'text-emerald-800', 'border');

    if (updateChk) updateChk.checked = false;
  } else {
    btnEdit?.classList.remove('bg-white', 'text-emerald-800', 'border');
    btnEdit?.classList.add('bg-emerald-700', 'text-white');

    btnUse?.classList.remove('bg-emerald-700', 'text-white');
    btnUse?.classList.add('bg-white', 'text-emerald-800', 'border');

    if (updateChk) updateChk.checked = true;
  }
}

function resetMeasurementStatusBanner(): void {
  const banner = document.getElementById('measurementStatusBanner');
  const iconEl = document.getElementById('measStatusIcon');
  const titleEl = document.getElementById('measStatusTitle');
  const subEl = document.getElementById('measStatusSubtitle');
  const btnContainer = document.getElementById('measActionButtons');

  if (banner) {
    banner.className =
      'p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all';
  }
  if (iconEl) iconEl.textContent = 'ℹ️';
  if (titleEl) {
    titleEl.className = 'text-xs sm:text-sm font-bold text-slate-800';
    titleEl.textContent = 'Select a customer to load garment measurements';
  }
  if (subEl) {
    subEl.className = 'text-[11px] text-slate-500';
    subEl.textContent = 'Please select customer and garment type above';
  }
  if (btnContainer) btnContainer.innerHTML = '';
}

function populateMeasurements(profile: any): void {
  const q = profile.measurements?.qameez || {};
  const s = profile.measurements?.shalwaar || {};

  (document.getElementById('ordDimLength') as HTMLInputElement).value = q.length || '';
  (document.getElementById('ordDimShoulder') as HTMLInputElement).value = q.shoulder || '';
  (document.getElementById('ordDimChest') as HTMLInputElement).value = q.chest || '';
  (document.getElementById('ordDimSleeve') as HTMLInputElement).value = q.sleeve || '';
  (document.getElementById('ordDimCollar') as HTMLInputElement).value = q.collar || '';
  (document.getElementById('ordDimGhera') as HTMLInputElement).value = q.ghera || '';

  (document.getElementById('ordDimShalwaarLength') as HTMLInputElement).value = s.length || '';
  (document.getElementById('ordDimPaincha') as HTMLInputElement).value = s.paincha || '';
  (document.getElementById('ordDimAasan') as HTMLInputElement).value = s.aasan || '';
  (document.getElementById('ordDimShalwaarGhera') as HTMLInputElement).value = s.ghera || s.waist || '';
}

function clearMeasurements(): void {
  (document.getElementById('ordDimLength') as HTMLInputElement).value = '';
  (document.getElementById('ordDimShoulder') as HTMLInputElement).value = '';
  (document.getElementById('ordDimChest') as HTMLInputElement).value = '';
  (document.getElementById('ordDimSleeve') as HTMLInputElement).value = '';
  (document.getElementById('ordDimCollar') as HTMLInputElement).value = '';
  (document.getElementById('ordDimGhera') as HTMLInputElement).value = '';

  (document.getElementById('ordDimShalwaarLength') as HTMLInputElement).value = '';
  (document.getElementById('ordDimPaincha') as HTMLInputElement).value = '';
  (document.getElementById('ordDimAasan') as HTMLInputElement).value = '';
  (document.getElementById('ordDimShalwaarGhera') as HTMLInputElement).value = '';
}

function updateCustomerPreview(customer: any): void {
  const previewBox = document.getElementById('customerInfoPreview');
  if (!previewBox) return;

  if (!customer) {
    clearCustomerPreview();
    return;
  }

  (document.getElementById('previewCustName') as HTMLElement).textContent = customer.name;
  (document.getElementById('previewCustPhone') as HTMLElement).textContent = `📞 ${customer.phone}`;
  (document.getElementById('previewCustAddress') as HTMLElement).textContent = customer.address
    ? `📍 ${customer.address}`
    : '';
  (document.getElementById('previewCustOrders') as HTMLElement).textContent = `${customer.totalOrders || 0} Previous Suits`;

  previewBox.classList.remove('hidden');
}

function clearCustomerPreview(): void {
  const previewBox = document.getElementById('customerInfoPreview');
  if (previewBox) previewBox.classList.add('hidden');
}

function setupQuickAddCustomerModal(): void {
  const modal = document.getElementById('modalQuickAddCustomer');
  const btnOpen = document.getElementById('btnOpenQuickAddCust');
  const btnClose = document.getElementById('closeQuickCustModal');
  const btnCancel = document.getElementById('btnCancelQuickCust');

  btnOpen?.addEventListener('click', () => modal?.classList.remove('hidden'));
  btnClose?.addEventListener('click', () => modal?.classList.add('hidden'));
  btnCancel?.addEventListener('click', () => modal?.classList.add('hidden'));

  document.getElementById('formQuickAddCustomer')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = (document.getElementById('quickCustName') as HTMLInputElement).value.trim();
    const phone = (document.getElementById('quickCustPhone') as HTMLInputElement).value.trim();
    const address = (document.getElementById('quickCustAddress') as HTMLInputElement).value.trim();
    const email = (document.getElementById('quickCustEmail') as HTMLInputElement).value.trim() || undefined;

    if (!name || !phone) {
      showToast('Name and phone are required', 'warning');
      return;
    }

    try {
      const res = await (window as any).ActionTailor.apiFetch('/api/customers', {
        method: 'POST',
        body: JSON.stringify({ name, phone, address, email }),
      });

      const newCustomer = res.data;
      showToast(`Customer "${newCustomer.name}" registered!`, 'success');
      modal?.classList.add('hidden');
      (e.target as HTMLFormElement).reset();

      // Add to memory and select
      customersList.unshift(newCustomer);
      renderCustomerOptions(customersList, newCustomer._id);
      (document.getElementById('selectCustomer') as HTMLSelectElement).value = newCustomer._id;
      await onCustomerSelected(newCustomer._id);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  });
}

function setupFormSubmission(): void {
  const form = document.getElementById('formNewOrderStudio');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const customer = (document.getElementById('selectCustomer') as HTMLSelectElement).value;
    const clothingCategory = (document.getElementById('selectedCategoryInput') as HTMLInputElement).value;
    const quantity = parseInt((document.getElementById('orderQtyInput') as HTMLInputElement).value, 10);
    const expectedDeliveryDate = (document.getElementById('orderDeliveryDateInput') as HTMLInputElement).value;

    const providedBy = (document.getElementById('fabricProvidedByInput') as HTMLSelectElement).value;
    const fabricType = (document.getElementById('fabricTypeInput') as HTMLInputElement).value.trim();
    const color = (document.getElementById('fabricColorInput') as HTMLInputElement).value.trim();

    const collarStyle = (document.getElementById('styleCollar') as HTMLSelectElement).value;
    const cuffStyle = (document.getElementById('styleCuff') as HTMLSelectElement).value;
    const damanStyle = (document.getElementById('styleDaman') as HTMLSelectElement).value;
    const shalwaarStyle = (document.getElementById('styleShalwaar') as HTMLSelectElement).value;
    const specialInstructions = (document.getElementById('styleNotes') as HTMLInputElement).value.trim();

    const stitchingPrice = parseFloat((document.getElementById('priceStitching') as HTMLInputElement).value);
    const advancePayment = parseFloat((document.getElementById('priceAdvance') as HTMLInputElement).value) || 0;
    const paymentMethod = (document.getElementById('pricePaymentMethod') as HTMLSelectElement).value;

    const saveMeasurementProfile =
      (document.getElementById('chkUpdateGarmentProfile') as HTMLInputElement)?.checked ?? true;

    if (!customer) {
      showToast('Please select a customer / گاہک منتخب کریں', 'warning');
      return;
    }

    // Capture the custom measurements snapshot from the editable inputs
    const customMeasurements = {
      qameez: {
        length: parseFloat((document.getElementById('ordDimLength') as HTMLInputElement).value) || undefined,
        shoulder: parseFloat((document.getElementById('ordDimShoulder') as HTMLInputElement).value) || undefined,
        chest: parseFloat((document.getElementById('ordDimChest') as HTMLInputElement).value) || undefined,
        sleeve: parseFloat((document.getElementById('ordDimSleeve') as HTMLInputElement).value) || undefined,
        collar: parseFloat((document.getElementById('ordDimCollar') as HTMLInputElement).value) || undefined,
        ghera: parseFloat((document.getElementById('ordDimGhera') as HTMLInputElement).value) || undefined,
      },
      shalwaar: {
        length: parseFloat((document.getElementById('ordDimShalwaarLength') as HTMLInputElement).value) || undefined,
        paincha: parseFloat((document.getElementById('ordDimPaincha') as HTMLInputElement).value) || undefined,
        aasan: parseFloat((document.getElementById('ordDimAasan') as HTMLInputElement).value) || undefined,
        ghera: parseFloat((document.getElementById('ordDimShalwaarGhera') as HTMLInputElement).value) || undefined,
      },
    };

    try {
      const res = await (window as any).ActionTailor.apiFetch('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          customer,
          clothingCategory,
          quantity,
          measurementProfileId: currentGarmentProfile?._id,
          customMeasurements,
          saveMeasurementProfile,
          fabric: { providedBy, fabricType, color },
          designOptions: { collarStyle, cuffStyle, damanStyle, shalwaarStyle, specialInstructions },
          stitchingPrice,
          advancePayment,
          paymentMethod,
          expectedDeliveryDate,
        }),
      });

      showToast(`Order #${res.data.orderNumber} successfully booked!`, 'success');
      setTimeout(() => {
        window.location.href = '/orders.html';
      }, 900);
    } catch (err: any) {
      showToast(err.message || 'Failed to book order', 'error');
    }
  });
}

initNewOrderStudio();
