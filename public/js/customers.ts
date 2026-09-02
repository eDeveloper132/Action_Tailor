import { renderNavbar, showToast } from '../ui_components/index.ts';

let customers: any[] = [];

async function initCustomersPage(): Promise<void> {
  renderNavbar('navbarMount', {
    brandName: 'Action Tailor',
    logoIcon: '⚡',
    activeLink: 'customers',
    showAuthButton: true,
  });

  setupModalHandlers();
  document.getElementById('custSearchInput')?.addEventListener('input', debounce(loadCustomers, 300));
  await loadCustomers();
}

async function loadCustomers(): Promise<void> {
  const container = document.getElementById('customersGrid');
  if (!container) return;

  const q = (document.getElementById('custSearchInput') as HTMLInputElement)?.value || '';

  try {
    const url = q ? `/api/customers/search?q=${encodeURIComponent(q)}` : '/api/customers?limit=60';
    const res = await (window as any).ActionTailor.apiFetch(url);
    customers = Array.isArray(res.data) ? res.data : res.data?.customers || [];

    if (customers.length === 0) {
      container.innerHTML = `
        <div class="col-span-full p-8 text-center text-slate-500 text-sm bg-slate-900/40 rounded-2xl border border-dashed border-slate-800">
          No customers found / کوئی گاہک نہیں ملا
        </div>
      `;
      return;
    }

    container.innerHTML = customers
      .map(
        (c: any) => `
      <div class="tailor-card p-4 rounded-2xl space-y-2.5">
        <div class="flex justify-between items-start">
          <div>
            <h3 class="font-bold text-white text-base">${c.name}</h3>
            <div class="text-xs text-slate-400 mt-0.5">📞 ${c.phone} ${c.city ? `• ${c.city}` : ''}</div>
          </div>
          <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-brand-400 border border-slate-700">
            ${c.totalOrders || 0} Suits
          </span>
        </div>

        ${c.address ? `<div class="text-xs text-slate-300 truncate">📍 ${c.address}</div>` : ''}
        ${c.notes ? `<div class="text-xs text-slate-400 italic truncate">${c.notes}</div>` : ''}

        <div class="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
          <a href="https://wa.me/92${c.phone.replace(/\D/g, '').replace(/^0/, '')}" target="_blank" class="text-emerald-400 hover:underline flex items-center gap-1 font-medium">
            <span>💬</span> <span>WhatsApp Chat</span>
          </a>
          <a href="/orders/new?customerId=${c._id}" class="text-brand-400 hover:text-brand-300 font-semibold">
            + Book Suit ➔
          </a>
        </div>
      </div>
    `
      )
      .join('');
  } catch (err: any) {
    container.innerHTML = `<div class="text-rose-400 p-4 text-sm">Error: ${err.message}</div>`;
  }
}

function setupModalHandlers(): void {
  const modal = document.getElementById('modalAddCust');
  const btnOpen = document.getElementById('btnOpenAddCustomerModal');
  const btnClose = document.getElementById('closeAddCustModal');
  const btnCancel = document.getElementById('btnCancelAddCust');

  btnOpen?.addEventListener('click', () => modal?.classList.remove('hidden'));
  btnClose?.addEventListener('click', () => modal?.classList.add('hidden'));
  btnCancel?.addEventListener('click', () => modal?.classList.add('hidden'));

  document.getElementById('formAddCust')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = (document.getElementById('addCustName') as HTMLInputElement).value;
    const phone = (document.getElementById('addCustPhone') as HTMLInputElement).value;
    const city = (document.getElementById('addCustCity') as HTMLInputElement).value;
    const address = (document.getElementById('addCustAddress') as HTMLInputElement).value;
    const notes = (document.getElementById('addCustNotes') as HTMLInputElement).value;

    try {
      await (window as any).ActionTailor.apiFetch('/api/customers', {
        method: 'POST',
        body: JSON.stringify({ name, phone, city, address, notes }),
      });
      showToast('Customer saved successfully!', 'success');
      modal?.classList.add('hidden');
      (e.target as HTMLFormElement).reset();
      await loadCustomers();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  });
}

function debounce(fn: Function, ms = 300) {
  let timer: any;
  return (...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

initCustomersPage();

