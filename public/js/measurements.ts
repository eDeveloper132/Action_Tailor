import { renderNavbar, showToast } from '../ui_components/index.ts';

let customersList: any[] = [];

async function initMeasurementsPage(): Promise<void> {
  renderNavbar('navbarMount', {
    brandName: 'Action Tailor',
    logoIcon: '⚡',
    activeLink: 'measurements',
    showAuthButton: true,
  });

  await loadCustomers();
  setupModalHandlers();
  await loadProfiles();
}

async function loadCustomers(): Promise<void> {
  const filterSelect = document.getElementById('measCustomerFilter') as HTMLSelectElement;
  const modalSelect = document.getElementById('profileCustomerSelect') as HTMLSelectElement;

  try {
    const res = await (window as any).ActionTailor.apiFetch('/api/customers?limit=100');
    customersList = res.data?.customers || [];

    const options = customersList
      .map((c: any) => `<option value="${c._id}">${c.name} (${c.phone})</option>`)
      .join('');

    if (filterSelect) {
      filterSelect.innerHTML = '<option value="">All Customers / تمام گاہک</option>' + options;
      filterSelect.addEventListener('change', () => loadProfiles(filterSelect.value));
    }

    if (modalSelect) {
      modalSelect.innerHTML = '<option value="">Select customer / گاہک منتخب کریں</option>' + options;
    }
  } catch (err: any) {
    console.error('Customer loading failed:', err);
  }
}

async function loadProfiles(customerId?: string): Promise<void> {
  const grid = document.getElementById('profilesGrid');
  if (!grid) return;

  try {
    // If customer selected, fetch customer profiles; otherwise, fetch for all customers
    let profiles: any[] = [];
    if (customerId) {
      const res = await (window as any).ActionTailor.apiFetch(`/api/measurements/customer/${customerId}`);
      profiles = res.data || [];
    } else if (customersList.length > 0) {
      // Aggregate profiles from first batch of customers
      const promises = customersList.slice(0, 10).map((c) =>
        (window as any).ActionTailor.apiFetch(`/api/measurements/customer/${c._id}`).catch(() => ({ data: [] }))
      );
      const results = await Promise.all(promises);
      profiles = results.flatMap((r: any) => r.data || []);
    }

    if (profiles.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full p-8 text-center text-slate-500 text-sm bg-slate-900/40 rounded-2xl border border-dashed border-slate-800">
          No measurement profiles on record. Click "+ Record New Profile" above to save one.
        </div>
      `;
      return;
    }

    grid.innerHTML = profiles.map((p: any) => renderProfileCard(p)).join('');
  } catch (err: any) {
    grid.innerHTML = `<div class="text-rose-400 p-4 text-sm">Error: ${err.message}</div>`;
  }
}

function renderProfileCard(p: any): string {
  const q = p.measurements?.qameez || {};
  const s = p.measurements?.shalwaar || {};

  return `
    <div class="tailor-card p-5 rounded-2xl space-y-3">
      <div class="flex justify-between items-start">
        <div>
          <h3 class="font-bold text-white text-base">${p.title}</h3>
          <div class="text-xs text-brand-400 font-medium mt-0.5">${p.clothingCategory.toUpperCase()} • ${p.unit}</div>
        </div>
        ${
          p.isDefault
            ? '<span class="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold">DEFAULT</span>'
            : ''
        }
      </div>

      <div class="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
        <div class="font-semibold text-slate-400 text-[11px] uppercase tracking-wider">Upper / قمیض</div>
        <div class="grid grid-cols-3 gap-1.5 text-slate-300">
          <div><span class="text-slate-500">Lambai:</span> ${q.length || '--'}</div>
          <div><span class="text-slate-500">Teera:</span> ${q.shoulder || '--'}</div>
          <div><span class="text-slate-500">Chhati:</span> ${q.chest || '--'}</div>
          <div><span class="text-slate-500">Bazu:</span> ${q.sleeve || '--'}</div>
          <div><span class="text-slate-500">Collar:</span> ${q.collar || '--'}</div>
          <div><span class="text-slate-500">Ghera:</span> ${q.ghera || '--'}</div>
        </div>

        <div class="font-semibold text-slate-400 text-[11px] uppercase tracking-wider pt-2 border-t border-slate-800/60">Lower / شلوار</div>
        <div class="grid grid-cols-3 gap-1.5 text-slate-300">
          <div><span class="text-slate-500">Lambai:</span> ${s.length || '--'}</div>
          <div><span class="text-slate-500">Paincha:</span> ${s.paincha || '--'}</div>
          <div><span class="text-slate-500">Aasan:</span> ${s.aasan || '--'}</div>
        </div>
      </div>

      <div class="pt-1 flex justify-end">
        <a href="/orders/new?customerId=${p.customer}&profileId=${p._id}" class="text-xs font-semibold text-brand-400 hover:text-brand-300">
          Use For New Suit ➔
        </a>
      </div>
    </div>
  `;
}

function setupModalHandlers(): void {
  const modal = document.getElementById('modalNewProfile');
  const btnOpen = document.getElementById('btnOpenNewProfileModal');
  const btnClose = document.getElementById('closeProfileModal');
  const btnCancel = document.getElementById('btnCancelProfile');

  btnOpen?.addEventListener('click', () => modal?.classList.remove('hidden'));
  btnClose?.addEventListener('click', () => modal?.classList.add('hidden'));
  btnCancel?.addEventListener('click', () => modal?.classList.add('hidden'));

  document.getElementById('formNewProfile')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const customer = (document.getElementById('profileCustomerSelect') as HTMLSelectElement).value;
    const title = (document.getElementById('profileTitle') as HTMLInputElement).value;
    const clothingCategory = (document.getElementById('profileGarment') as HTMLSelectElement).value;
    const unit = (document.getElementById('profileUnit') as HTMLSelectElement).value;
    const isDefault = (document.getElementById('profileIsDefault') as HTMLInputElement).checked;

    const qameez = {
      length: parseFloat((document.getElementById('m_q_length') as HTMLInputElement).value) || undefined,
      shoulder: parseFloat((document.getElementById('m_q_shoulder') as HTMLInputElement).value) || undefined,
      chest: parseFloat((document.getElementById('m_q_chest') as HTMLInputElement).value) || undefined,
      waist: parseFloat((document.getElementById('m_q_waist') as HTMLInputElement).value) || undefined,
      sleeve: parseFloat((document.getElementById('m_q_sleeve') as HTMLInputElement).value) || undefined,
      collar: parseFloat((document.getElementById('m_q_collar') as HTMLInputElement).value) || undefined,
      cuff: parseFloat((document.getElementById('m_q_cuff') as HTMLInputElement).value) || undefined,
      ghera: parseFloat((document.getElementById('m_q_ghera') as HTMLInputElement).value) || undefined,
    };

    const shalwaar = {
      length: parseFloat((document.getElementById('m_s_length') as HTMLInputElement).value) || undefined,
      paincha: parseFloat((document.getElementById('m_s_paincha') as HTMLInputElement).value) || undefined,
      aasan: parseFloat((document.getElementById('m_s_aasan') as HTMLInputElement).value) || undefined,
      waist: parseFloat((document.getElementById('m_s_waist') as HTMLInputElement).value) || undefined,
    };

    try {
      await (window as any).ActionTailor.apiFetch('/api/measurements', {
        method: 'POST',
        body: JSON.stringify({
          customer,
          title,
          clothingCategory,
          unit,
          isDefault,
          measurements: { qameez, shalwaar },
        }),
      });

      showToast('Measurement profile saved successfully!', 'success');
      modal?.classList.add('hidden');
      (e.target as HTMLFormElement).reset();
      await loadProfiles(customer);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  });
}

initMeasurementsPage();

