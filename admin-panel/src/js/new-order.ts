import { renderNavbar, showToast } from '../ui_components/index.ts';
import '../utils/api.ts';

let customersList: any[] = [];
let customerProfilesMap: Record<string, any[]> = {};
let selectedCategory = 'shalwaar_qameez';

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
  const targetProfileId = urlParams.get('profileId') || '';

  await loadClothingCategories();
  await loadCustomers(targetCustomerId);
  setupSearchFilter();
  setupQuickAddCustomerModal();
  setupCustomerChangeListener();
  setupProfileChangeListener();
  setupFormSubmission();

  if (targetCustomerId) {
    const selectCustomer = document.getElementById('selectCustomer') as HTMLSelectElement;
    if (selectCustomer) {
      selectCustomer.value = targetCustomerId;
      await onCustomerSelected(targetCustomerId, targetProfileId);
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
      card.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        selectedCategory = target.dataset.key || 'shalwaar_qameez';
        (document.getElementById('selectedCategoryInput') as HTMLInputElement).value = selectedCategory;

        grid.querySelectorAll('.cat-card').forEach((c) => {
          c.className =
            'cat-card p-3 rounded-xl border cursor-pointer transition-all bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-100';
        });

        target.className =
          'cat-card p-3 rounded-xl border cursor-pointer transition-all bg-emerald-50 border-emerald-600 text-emerald-900 shadow-xs ring-1 ring-emerald-600';
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
    }
  });
}

async function onCustomerSelected(customerId: string, preferredProfileId: string = ''): Promise<void> {
  const customer = customersList.find((c) => c._id === customerId);
  updateCustomerPreview(customer);

  const selectMeasurement = document.getElementById('selectMeasurementProfile') as HTMLSelectElement;

  try {
    const res = await (window as any).ActionTailor.apiFetch(`/api/measurements/customer/${customerId}`);
    const profiles = res.data || [];
    customerProfilesMap[customerId] = profiles;

    if (profiles.length === 0) {
      selectMeasurement.innerHTML = '<option value="">No saved profile (Enter custom measurements below)</option>';
      clearMeasurements();
    } else {
      selectMeasurement.innerHTML =
        '<option value="">Select Measurement Profile...</option>' +
        profiles
          .map(
            (p: any) =>
              `<option value="${p._id}" ${p.isDefault || p._id === preferredProfileId ? 'selected' : ''}>${p.title} (${p.clothingCategory?.toUpperCase() || 'SUIT'})</option>`
          )
          .join('');

      // Auto-load preferred profile or default or first profile
      const activeProfile =
        (preferredProfileId ? profiles.find((p: any) => p._id === preferredProfileId) : null) ||
        profiles.find((p: any) => p.isDefault) ||
        profiles[0];

      if (activeProfile) {
        selectMeasurement.value = activeProfile._id;
        populateMeasurements(activeProfile);
      }
    }
  } catch (err: any) {
    console.error('Error fetching measurements for customer:', err);
    selectMeasurement.innerHTML = '<option value="">Failed to load measurements</option>';
  }
}

function setupProfileChangeListener(): void {
  const selectCustomer = document.getElementById('selectCustomer') as HTMLSelectElement;
  const selectMeasurement = document.getElementById('selectMeasurementProfile') as HTMLSelectElement;

  selectMeasurement?.addEventListener('change', () => {
    const customerId = selectCustomer.value;
    const profileId = selectMeasurement.value;

    if (!profileId) {
      clearMeasurements();
      return;
    }

    const profiles = customerProfilesMap[customerId] || [];
    const profile = profiles.find((p: any) => p._id === profileId);
    if (profile) {
      populateMeasurements(profile);
    }
  });
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
  (document.getElementById('previewCustAddress') as HTMLElement).textContent = customer.address ? `📍 ${customer.address}` : '';
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
    const measurementProfileId =
      (document.getElementById('selectMeasurementProfile') as HTMLSelectElement).value || undefined;
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
          measurementProfileId,
          customMeasurements,
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

