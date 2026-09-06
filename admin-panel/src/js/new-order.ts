import { renderNavbar, showToast } from '../ui_components/index.ts';
import '../utils/api.ts';

let selectedCategory = 'shalwaar_qameez';
let selectedCustomer: any = null;
let customerMeasurementsCache: any[] = [];
let currentGarmentProfile: any = null;
let searchDebounceTimer: any = null;

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
  setDatePreset(7);
  setupDatePresets();

  const urlParams = new URLSearchParams(window.location.search);
  const targetCustomerId = urlParams.get('customerId') || '';

  await loadClothingCategories();
  setupFastCustomerSearch();
  setupQuickAddCustomerModal();
  setupFormSubmission();

  if (targetCustomerId) {
    try {
      const res = await (window as any).ActionTailor.apiFetch(`/api/customers/${targetCustomerId}`);
      if (res.data) {
        selectCustomerAndLoad(res.data);
      }
    } catch (_e) {}
  }
}

function setDatePreset(days: number): void {
  const target = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  const formatted = target.toISOString().split('T')[0];
  const dateInput = document.getElementById('orderDeliveryDateInput') as HTMLInputElement;
  if (dateInput) dateInput.value = formatted;
}

function setupDatePresets(): void {
  document.querySelectorAll('.btn-preset-days').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const days = parseInt((e.currentTarget as HTMLElement).dataset.days || '7', 10);
      setDatePreset(days);
      document.querySelectorAll('.btn-preset-days').forEach((b) => {
        b.classList.remove('bg-emerald-100', 'text-emerald-800', 'font-bold');
        b.classList.add('bg-slate-100', 'text-slate-700', 'font-semibold');
      });
      (e.currentTarget as HTMLElement).classList.remove('bg-slate-100', 'text-slate-700', 'font-semibold');
      (e.currentTarget as HTMLElement).classList.add('bg-emerald-100', 'text-emerald-800', 'font-bold');
    });
  });
}

/**
 * Step 1: Fast Customer Search by Phone or Name
 * Real-time instant lookup with auto-dropdown
 */
function setupFastCustomerSearch(): void {
  const searchInput = document.getElementById('inputSearchCust') as HTMLInputElement;
  const resultsDropdown = document.getElementById('customerSearchResults') as HTMLDivElement;
  const previewBox = document.getElementById('customerInfoPreview');
  const btnChange = document.getElementById('btnChangeCustomer');

  btnChange?.addEventListener('click', () => {
    selectedCustomer = null;
    currentGarmentProfile = null;
    customerMeasurementsCache = [];
    (document.getElementById('selectCustomer') as HTMLSelectElement).value = '';

    if (previewBox) previewBox.classList.add('hidden');
    searchInput.value = '';
    searchInput.classList.remove('hidden');
    searchInput.focus();
    updateCategoryCardsMeasurementBadges([]);
    resetMeasurementStatusBanner();
    clearMeasurements();
  });

  searchInput?.addEventListener('input', () => {
    clearTimeout(searchDebounceTimer);
    const query = searchInput.value.trim();

    if (!query) {
      resultsDropdown.classList.add('hidden');
      resultsDropdown.innerHTML = '';
      return;
    }

    searchDebounceTimer = setTimeout(async () => {
      try {
        const res = await (window as any).ActionTailor.apiFetch(
          `/api/customers?search=${encodeURIComponent(query)}&limit=10`
        );
        const list: any[] = res.data?.customers || [];
        renderSearchResults(list, query);
      } catch (err: any) {
        console.error('Search error:', err);
      }
    }, 150); // Fast 150ms debounce
  });

  searchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const firstResult = resultsDropdown.querySelector('.cust-search-row') as HTMLElement;
      if (firstResult) {
        firstResult.click();
      }
    }
  });

  document.addEventListener('click', (e) => {
    if (!resultsDropdown.contains(e.target as Node) && e.target !== searchInput) {
      resultsDropdown.classList.add('hidden');
    }
  });
}

function renderSearchResults(list: any[], query: string): void {
  const resultsDropdown = document.getElementById('customerSearchResults') as HTMLDivElement;
  if (!resultsDropdown) return;

  if (list.length === 0) {
    resultsDropdown.innerHTML = `
      <div class="p-3 text-xs text-slate-500 flex items-center justify-between">
        <span>No customer found with "<strong>${query}</strong>"</span>
        <button type="button" id="btnQuickAddFromSearch" class="text-xs font-bold text-emerald-700 hover:underline">
          + Quick Register / نیا گاہک درج کریں
        </button>
      </div>
    `;
    resultsDropdown.classList.remove('hidden');

    document.getElementById('btnQuickAddFromSearch')?.addEventListener('click', () => {
      resultsDropdown.classList.add('hidden');
      openQuickAddModalWithPrefill(query);
    });
    return;
  }

  resultsDropdown.innerHTML = list
    .map(
      (c: any) => `
    <div class="cust-search-row p-3 hover:bg-emerald-50 cursor-pointer flex justify-between items-center text-xs transition-colors" data-id="${c._id}">
      <div>
        <div class="font-extrabold text-slate-900 text-sm flex items-center gap-2">
          <span>${c.name}</span>
          <span class="font-mono text-emerald-700 font-bold text-xs">📞 ${c.phone}</span>
        </div>
        <div class="text-[11px] text-slate-500 mt-0.5">${c.address || c.city || 'Lahore'}</div>
      </div>
      <div class="text-right shrink-0">
        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
          ${c.totalOrders || 0} Suits
        </span>
      </div>
    </div>
  `
    )
    .join('');

  resultsDropdown.classList.remove('hidden');

  resultsDropdown.querySelectorAll('.cust-search-row').forEach((row) => {
    row.addEventListener('click', () => {
      const customerId = (row as HTMLElement).dataset.id;
      const found = list.find((c) => c._id === customerId);
      if (found) {
        selectCustomerAndLoad(found);
      }
    });
  });
}

async function selectCustomerAndLoad(customer: any): Promise<void> {
  selectedCustomer = customer;
  const searchInput = document.getElementById('inputSearchCust') as HTMLInputElement;
  const resultsDropdown = document.getElementById('customerSearchResults') as HTMLDivElement;
  const previewBox = document.getElementById('customerInfoPreview');
  const selectCustomer = document.getElementById('selectCustomer') as HTMLSelectElement;

  if (resultsDropdown) resultsDropdown.classList.add('hidden');
  if (searchInput) searchInput.value = '';

  // Synchronize hidden select
  if (selectCustomer) {
    selectCustomer.innerHTML = `<option value="${customer._id}" selected>${customer.name}</option>`;
    selectCustomer.value = customer._id;
  }

  // Display Customer Card Preview
  if (previewBox) {
    (document.getElementById('previewCustName') as HTMLElement).textContent = customer.name;
    (document.getElementById('previewCustPhone') as HTMLElement).textContent = `📞 ${customer.phone}`;
    (document.getElementById('previewCustAddress') as HTMLElement).textContent = customer.address
      ? `📍 ${customer.address}`
      : `📍 ${customer.city || 'Lahore'}`;
    (document.getElementById('previewCustOrders') as HTMLElement).textContent = `${customer.totalOrders || 0} Previous Suits`;
    previewBox.classList.remove('hidden');
  }

  // Immediately fetch all saved measurements for this customer to highlight garment cards
  try {
    const res = await (window as any).ActionTailor.apiFetch(`/api/measurements/customer/${customer._id}`);
    customerMeasurementsCache = res.data || [];
    updateCategoryCardsMeasurementBadges(customerMeasurementsCache);
  } catch (_e) {
    customerMeasurementsCache = [];
  }

  // Immediately load measurement for current garment
  await checkAndLoadGarmentMeasurement(customer._id, selectedCategory);
}

/**
 * Step 2: Clothing Categories Grid
 * Shows badges indicating which garments have saved measurements
 */
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
        <div class="flex justify-between items-start gap-1">
          <div>
            <div class="font-bold text-xs sm:text-sm">${cat.nameEn}</div>
            <div class="text-xs text-emerald-700 font-medium">${cat.nameUr}</div>
          </div>
          <span class="cat-meas-badge text-[10px] px-1.5 py-0.5 rounded font-bold hidden" id="badge-${cat.key}"></span>
        </div>
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

        // Auto-load garment-specific measurement for selected customer
        if (selectedCustomer?._id) {
          await checkAndLoadGarmentMeasurement(selectedCustomer._id, selectedCategory);
        }
      });
    });
  } catch (err: any) {
    console.error('Error loading clothing types:', err);
  }
}

function updateCategoryCardsMeasurementBadges(profiles: any[]): void {
  document.querySelectorAll('.cat-meas-badge').forEach((badge) => {
    badge.classList.add('hidden');
  });

  for (const p of profiles) {
    const key = p.clothingCategory;
    const badgeEl = document.getElementById(`badge-${key}`);
    if (badgeEl) {
      badgeEl.textContent = '✓ Saved / ناپ محفوظ';
      badgeEl.className = 'cat-meas-badge text-[10px] px-1.5 py-0.5 rounded font-bold bg-emerald-100 text-emerald-800';
      badgeEl.classList.remove('hidden');
    }
  }
}

/**
 * Step 3: Garment-Specific Measurement Resolution
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
          highlightButtons('existing');
          showToast('Loaded existing measurement / محفوظ شدہ ناپ لاگو ہو گیا', 'info');
        });

        document.getElementById('btnEditMeasurement')?.addEventListener('click', () => {
          highlightButtons('editing');
          if (updateChk) updateChk.checked = true;
          showToast('Editing measurement. Changes will update the latest profile.', 'info');
          (document.getElementById('ordDimLength') as HTMLInputElement)?.focus();
        });
      }

      // Automatically populate existing measurements
      populateMeasurements(profile);
      if (updateChk) updateChk.checked = false;
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

function openQuickAddModalWithPrefill(query: string): void {
  const modal = document.getElementById('modalQuickAddCustomer');
  const nameInput = document.getElementById('quickCustName') as HTMLInputElement;
  const phoneInput = document.getElementById('quickCustPhone') as HTMLInputElement;

  // If query is numbers, put in phone, else in name
  const digits = query.replace(/\D/g, '');
  if (digits.length >= 7) {
    if (phoneInput) phoneInput.value = query;
    if (nameInput) {
      nameInput.value = '';
      nameInput.focus();
    }
  } else {
    if (nameInput) nameInput.value = query;
    if (phoneInput) {
      phoneInput.value = '';
      phoneInput.focus();
    }
  }

  modal?.classList.remove('hidden');
}

function setupQuickAddCustomerModal(): void {
  const modal = document.getElementById('modalQuickAddCustomer');
  const btnOpen = document.getElementById('btnOpenQuickAddCust');
  const btnClose = document.getElementById('closeQuickCustModal');
  const btnCancel = document.getElementById('btnCancelQuickCust');

  btnOpen?.addEventListener('click', () => {
    (document.getElementById('formQuickAddCustomer') as HTMLFormElement)?.reset();
    modal?.classList.remove('hidden');
    (document.getElementById('quickCustName') as HTMLInputElement)?.focus();
  });
  btnClose?.addEventListener('click', () => modal?.classList.add('hidden'));
  btnCancel?.addEventListener('click', () => modal?.classList.add('hidden'));

  document.getElementById('formQuickAddCustomer')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = (document.getElementById('quickCustName') as HTMLInputElement).value.trim();
    const phone = (document.getElementById('quickCustPhone') as HTMLInputElement).value.trim();
    const address = (document.getElementById('quickCustAddress') as HTMLInputElement).value.trim();
    const email = (document.getElementById('quickCustEmail') as HTMLInputElement).value.trim() || undefined;

    if (!name || !phone) {
      showToast('Name and phone are required / نام اور فون نمبر ضروری ہیں', 'warning');
      return;
    }

    try {
      const res = await (window as any).ActionTailor.apiFetch('/api/customers', {
        method: 'POST',
        body: JSON.stringify({ name, phone, address, email }),
      });

      const newCustomer = res.data;
      showToast(`Customer "${newCustomer.name}" registered! / گاہک درج ہو گیا`, 'success');
      modal?.classList.add('hidden');
      (e.target as HTMLFormElement).reset();

      // Immediately select new customer and proceed with order flow
      await selectCustomerAndLoad(newCustomer);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  });
}

function setupFormSubmission(): void {
  const form = document.getElementById('formNewOrderStudio');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const customerId = selectedCustomer?._id;
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

    if (!customerId) {
      showToast('Please search and select a customer / گاہک منتخب کریں', 'warning');
      (document.getElementById('inputSearchCust') as HTMLInputElement)?.focus();
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
          customer: customerId,
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

      showToast(`Order #${res.data.orderNumber} successfully booked! / آرڈر کامیابی سے بک ہو گیا`, 'success');
      setTimeout(() => {
        window.location.href = '/orders.html';
      }, 850);
    } catch (err: any) {
      showToast(err.message || 'Failed to book order', 'error');
    }
  });
}

initNewOrderStudio();
