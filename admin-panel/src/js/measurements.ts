import { renderNavbar, showToast } from '../ui_components/index.ts';
import '../utils/api.ts';

let customersList: any[] = [];
let profilesCache: any[] = [];

async function initMeasurementsPage(): Promise<void> {
  renderNavbar('navbarMount', {
    brandName: 'Action Tailor',
    logoIcon: '⚡',
    activeLink: 'measurements',
    showAuthButton: true,
  });

  const urlParams = new URLSearchParams(window.location.search);
  const initialCustomerId = urlParams.get('customerId') || '';

  await loadCustomers(initialCustomerId);
  setupModalHandlers();

  if (initialCustomerId) {
    await loadProfiles(initialCustomerId);
  } else {
    await loadProfiles();
  }
}

async function loadCustomers(selectedId: string = ''): Promise<void> {
  const filterSelect = document.getElementById('filterCustomerSelect') as HTMLSelectElement;
  const modalSelect = document.getElementById('measureCustomerSelect') as HTMLSelectElement;

  try {
    const res = await (window as any).ActionTailor.apiFetch('/api/customers?limit=100');
    customersList = res.data?.customers || [];

    const optionsHtml = customersList
      .map((c: any) => `<option value="${c._id}" ${c._id === selectedId ? 'selected' : ''}>${c.name} (${c.phone})</option>`)
      .join('');

    if (filterSelect) {
      filterSelect.innerHTML = '<option value="">All Customers / تمام گاہک</option>' + optionsHtml;
      filterSelect.addEventListener('change', () => {
        loadProfiles(filterSelect.value);
      });
    }

    if (modalSelect) {
      modalSelect.innerHTML = '<option value="">Select Customer / گاہک منتخب کریں</option>' + optionsHtml;
    }
  } catch (err: any) {
    console.error('Customer loading failed:', err);
  }
}

async function loadProfiles(customerId?: string): Promise<void> {
  const grid = document.getElementById('profilesGridContainer');
  if (!grid) return;

  try {
    let profiles: any[] = [];

    if (customerId) {
      const res = await (window as any).ActionTailor.apiFetch(`/api/measurements/customer/${customerId}`);
      profiles = res.data || [];
    } else if (customersList.length > 0) {
      // Aggregate profiles from the customers
      const promises = customersList.slice(0, 15).map((c) =>
        (window as any).ActionTailor.apiFetch(`/api/measurements/customer/${c._id}`).catch(() => ({ data: [] }))
      );
      const results = await Promise.all(promises);
      profiles = results.flatMap((r: any) => r.data || []);
    }

    profilesCache = profiles;

    if (profiles.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full p-8 text-center text-slate-400 text-sm bg-white rounded-2xl border border-dashed border-slate-200">
          No Measurements Found / کوئی ناپ نہیں ملا
        </div>
      `;
      return;
    }

    grid.innerHTML = profiles.map((p: any) => renderProfileCard(p)).join('');
    attachProfileActions();
  } catch (err: any) {
    grid.innerHTML = `<div class="text-rose-500 p-4 text-sm">Error: ${err.message}</div>`;
  }
}

function renderProfileCard(p: any): string {
  const q = p.measurements?.qameez || {};
  const s = p.measurements?.shalwaar || {};
  const customerName = p.customer?.name || (customersList.find((c) => c._id === p.customer)?.name) || 'Customer';

  return `
    <div class="tailor-card p-5 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3">
      <div class="flex justify-between items-start">
        <div>
          <h3 class="font-bold text-slate-900 text-base">${p.title}</h3>
          <div class="text-xs text-emerald-700 font-semibold mt-0.5">
            👤 ${customerName} • ${p.clothingCategory?.replace('_', ' ').toUpperCase() || 'SUIT'}
          </div>
        </div>
        ${
          p.isDefault
            ? '<span class="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">Default / بنیادی</span>'
            : ''
        }
      </div>

      <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
        <div class="font-bold text-slate-600 text-[11px] uppercase tracking-wider">Upper Garment / قمیض (Inches / انچ)</div>
        <div class="grid grid-cols-3 sm:grid-cols-6 gap-2 text-slate-800">
          <div><span class="text-slate-400 block text-[10px]">Length / لمبائی</span><strong>${q.length || '--'}"</strong></div>
          <div><span class="text-slate-400 block text-[10px]">Shoulder / کندھا</span><strong>${q.shoulder || '--'}"</strong></div>
          <div><span class="text-slate-400 block text-[10px]">Chest / چھاتی</span><strong>${q.chest || '--'}"</strong></div>
          <div><span class="text-slate-400 block text-[10px]">Sleeve / آستین</span><strong>${q.sleeve || '--'}"</strong></div>
          <div><span class="text-slate-400 block text-[10px]">Collar / کالر</span><strong>${q.collar || '--'}"</strong></div>
          <div><span class="text-slate-400 block text-[10px]">Daman / دامن</span><strong>${q.ghera || '--'}"</strong></div>
        </div>

        <div class="font-bold text-slate-600 text-[11px] uppercase tracking-wider pt-2 border-t border-slate-200">Lower Garment / شلوار (Inches / انچ)</div>
        <div class="grid grid-cols-3 sm:grid-cols-4 gap-2 text-slate-800">
          <div><span class="text-slate-400 block text-[10px]">Length / لمبائی</span><strong>${s.length || '--'}"</strong></div>
          <div><span class="text-slate-400 block text-[10px]">Paincha / پائنچہ</span><strong>${s.paincha || '--'}"</strong></div>
          <div><span class="text-slate-400 block text-[10px]">Aasan / آسن</span><strong>${s.aasan || '--'}"</strong></div>
          <div><span class="text-slate-400 block text-[10px]">Daman / دامن</span><strong>${s.ghera || s.waist || '--'}"</strong></div>
        </div>
      </div>

      <div class="pt-1 flex items-center justify-between">
        <button class="text-xs text-slate-500 hover:text-slate-900 font-semibold btn-edit-profile" data-id="${p._id}">
          Edit / ترمیم کریں
        </button>
        <a href="/new-order.html?customerId=${p.customer}&profileId=${p._id}" class="text-xs font-bold text-emerald-600 hover:text-emerald-800">
          New Order / نیا آرڈر ➔
        </a>
      </div>
    </div>
  `;
}

function attachProfileActions(): void {
  document.querySelectorAll('.btn-edit-profile').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const id = (e.currentTarget as HTMLElement).dataset.id;
      const profile = profilesCache.find((p) => p._id === id);
      if (profile) openProfileModal(profile);
    });
  });
}

function openProfileModal(profile?: any): void {
  const modal = document.getElementById('modalMeasureProfile');
  if (!modal) return;

  const idInput = document.getElementById('measureProfileId') as HTMLInputElement;
  const customerSelect = document.getElementById('measureCustomerSelect') as HTMLSelectElement;
  const titleInput = document.getElementById('measureTitle') as HTMLInputElement;

  if (profile) {
    // Edit mode
    idInput.value = profile._id;
    customerSelect.value = profile.customer?._id || profile.customer || '';
    customerSelect.disabled = true; // Customer cannot change on edit
    titleInput.value = profile.title || '';

    const q = profile.measurements?.qameez || {};
    const s = profile.measurements?.shalwaar || {};

    (document.getElementById('dimLength') as HTMLInputElement).value = q.length || '';
    (document.getElementById('dimShoulder') as HTMLInputElement).value = q.shoulder || '';
    (document.getElementById('dimChest') as HTMLInputElement).value = q.chest || '';
    (document.getElementById('dimSleeve') as HTMLInputElement).value = q.sleeve || '';
    (document.getElementById('dimCollar') as HTMLInputElement).value = q.collar || '';
    (document.getElementById('dimGhera') as HTMLInputElement).value = q.ghera || '';

    (document.getElementById('dimShalwaarLength') as HTMLInputElement).value = s.length || '';
    (document.getElementById('dimPaincha') as HTMLInputElement).value = s.paincha || '';
    (document.getElementById('dimAasan') as HTMLInputElement).value = s.aasan || '';
    (document.getElementById('dimShalwaarGhera') as HTMLInputElement).value = s.ghera || s.waist || '';
  } else {
    // Create mode
    idInput.value = '';
    customerSelect.disabled = false;
    const filterSelect = document.getElementById('filterCustomerSelect') as HTMLSelectElement;
    if (filterSelect && filterSelect.value) {
      customerSelect.value = filterSelect.value;
    }
    titleInput.value = 'Pakistani Suit Measurement';

    (document.getElementById('dimLength') as HTMLInputElement).value = '';
    (document.getElementById('dimShoulder') as HTMLInputElement).value = '';
    (document.getElementById('dimChest') as HTMLInputElement).value = '';
    (document.getElementById('dimSleeve') as HTMLInputElement).value = '';
    (document.getElementById('dimCollar') as HTMLInputElement).value = '';
    (document.getElementById('dimGhera') as HTMLInputElement).value = '';

    (document.getElementById('dimShalwaarLength') as HTMLInputElement).value = '';
    (document.getElementById('dimPaincha') as HTMLInputElement).value = '';
    (document.getElementById('dimAasan') as HTMLInputElement).value = '';
    (document.getElementById('dimShalwaarGhera') as HTMLInputElement).value = '';
  }

  modal.classList.remove('hidden');
}

function setupModalHandlers(): void {
  const modal = document.getElementById('modalMeasureProfile');
  const btnOpen = document.getElementById('btnOpenNewProfileModal');
  const btnClose = document.getElementById('closeMeasureModal');
  const btnCancel = document.getElementById('btnCancelMeasure');
  const btnRefresh = document.getElementById('btnRefreshMeasurements');

  btnOpen?.addEventListener('click', () => openProfileModal());
  btnClose?.addEventListener('click', () => modal?.classList.add('hidden'));
  btnCancel?.addEventListener('click', () => modal?.classList.add('hidden'));
  btnRefresh?.addEventListener('click', () => {
    const filterSelect = document.getElementById('filterCustomerSelect') as HTMLSelectElement;
    loadProfiles(filterSelect?.value);
  });

  document.getElementById('formMeasureProfile')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const profileId = (document.getElementById('measureProfileId') as HTMLInputElement).value;
    const customer = (document.getElementById('measureCustomerSelect') as HTMLSelectElement).value;
    const title = (document.getElementById('measureTitle') as HTMLInputElement).value.trim();

    const qameez = {
      length: parseFloat((document.getElementById('dimLength') as HTMLInputElement).value) || undefined,
      shoulder: parseFloat((document.getElementById('dimShoulder') as HTMLInputElement).value) || undefined,
      chest: parseFloat((document.getElementById('dimChest') as HTMLInputElement).value) || undefined,
      sleeve: parseFloat((document.getElementById('dimSleeve') as HTMLInputElement).value) || undefined,
      collar: parseFloat((document.getElementById('dimCollar') as HTMLInputElement).value) || undefined,
      ghera: parseFloat((document.getElementById('dimGhera') as HTMLInputElement).value) || undefined,
    };

    const shalwaar = {
      length: parseFloat((document.getElementById('dimShalwaarLength') as HTMLInputElement).value) || undefined,
      paincha: parseFloat((document.getElementById('dimPaincha') as HTMLInputElement).value) || undefined,
      aasan: parseFloat((document.getElementById('dimAasan') as HTMLInputElement).value) || undefined,
      ghera: parseFloat((document.getElementById('dimShalwaarGhera') as HTMLInputElement).value) || undefined,
    };

    try {
      if (profileId) {
        // Edit existing
        await (window as any).ActionTailor.apiFetch(`/api/measurements/${profileId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            title,
            measurements: { qameez, shalwaar },
          }),
        });
        showToast('Measurement profile updated successfully / ناپ اپڈیٹ ہو گیا ہے', 'success');
      } else {
        // Create new
        await (window as any).ActionTailor.apiFetch('/api/measurements', {
          method: 'POST',
          body: JSON.stringify({
            customer,
            title,
            clothingCategory: 'shalwaar_qameez',
            unit: 'inches',
            isDefault: true,
            measurements: { qameez, shalwaar },
          }),
        });
        showToast('Measurement profile saved successfully / ناپ محفوظ ہو گیا ہے', 'success');
      }

      modal?.classList.add('hidden');
      const filterSelect = document.getElementById('filterCustomerSelect') as HTMLSelectElement;
      await loadProfiles(filterSelect?.value || customer);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  });
}

initMeasurementsPage();

