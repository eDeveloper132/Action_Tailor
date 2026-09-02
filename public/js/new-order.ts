import { renderNavbar, showToast } from '../ui_components/index.ts';

let customersList: any[] = [];
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

  await loadClothingCategories();
  await loadCustomerDropdown();
  setupCustomerChangeListener();
  setupFormSubmission();
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

async function loadCustomerDropdown(): Promise<void> {
  const select = document.getElementById('selectCustomer') as HTMLSelectElement;
  if (!select) return;

  try {
    const res = await (window as any).ActionTailor.apiFetch('/api/customers?limit=100');
    customersList = res.data?.customers || [];

    if (customersList.length === 0) {
      select.innerHTML = '<option value="">No customers found. Add a customer first.</option>';
      return;
    }

    select.innerHTML =
      '<option value="">Select customer / گاہک منتخب کریں</option>' +
      customersList
        .map((c: any) => `<option value="${c._id}">${c.name} (${c.phone} - ${c.city || 'Lahore'})</option>`)
        .join('');
  } catch (err: any) {
    select.innerHTML = `<option value="">Error loading customers</option>`;
  }
}

function setupCustomerChangeListener(): void {
  const selectCustomer = document.getElementById('selectCustomer') as HTMLSelectElement;
  const selectMeasurement = document.getElementById('selectMeasurementProfile') as HTMLSelectElement;

  selectCustomer?.addEventListener('change', async () => {
    const customerId = selectCustomer.value;
    if (!customerId) {
      selectMeasurement.innerHTML = '<option value="">Default measurements / بنیادی ناپ</option>';
      return;
    }

    try {
      const res = await (window as any).ActionTailor.apiFetch(`/api/measurements/customer/${customerId}`);
      const profiles = res.data || [];

      if (profiles.length === 0) {
        selectMeasurement.innerHTML = '<option value="">No saved profile (Standard dimensions will be used)</option>';
      } else {
        selectMeasurement.innerHTML =
          '<option value="">Use Default Profile</option>' +
          profiles
            .map((p: any) => `<option value="${p._id}">${p.title} (${p.clothingCategory.toUpperCase()})</option>`)
            .join('');
      }
    } catch (err: any) {
      console.error(err);
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
    const fabricType = (document.getElementById('fabricTypeInput') as HTMLInputElement).value;
    const color = (document.getElementById('fabricColorInput') as HTMLInputElement).value;

    const collarStyle = (document.getElementById('styleCollar') as HTMLSelectElement).value;
    const cuffStyle = (document.getElementById('styleCuff') as HTMLSelectElement).value;
    const damanStyle = (document.getElementById('styleDaman') as HTMLSelectElement).value;
    const shalwaarStyle = (document.getElementById('styleShalwaar') as HTMLSelectElement).value;
    const specialInstructions = (document.getElementById('styleNotes') as HTMLInputElement).value;

    const stitchingPrice = parseFloat((document.getElementById('priceStitching') as HTMLInputElement).value);
    const advancePayment = parseFloat((document.getElementById('priceAdvance') as HTMLInputElement).value) || 0;
    const paymentMethod = (document.getElementById('pricePaymentMethod') as HTMLSelectElement).value;

    if (!customer) {
      showToast('Please select a customer / گاہک منتخب کریں', 'warning');
      return;
    }

    try {
      const res = await (window as any).ActionTailor.apiFetch('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          customer,
          clothingCategory,
          quantity,
          measurementProfileId,
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
        window.location.href = '/orders';
      }, 1000);
    } catch (err: any) {
      showToast(err.message || 'Failed to book order', 'error');
    }
  });
}

initNewOrderStudio();

