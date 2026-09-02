import { renderNavbar, showToast } from "../ui_components/index.js";
let customersList = [];
async function initMeasurementsPage() {
  renderNavbar("navbarMount", {
    brandName: "Action Tailor",
    logoIcon: "\u26A1",
    activeLink: "measurements",
    showAuthButton: true
  });
  await loadCustomers();
  setupModalHandlers();
  await loadProfiles();
}
async function loadCustomers() {
  const filterSelect = document.getElementById("measCustomerFilter");
  const modalSelect = document.getElementById("profileCustomerSelect");
  try {
    const res = await window.ActionTailor.apiFetch("/api/customers?limit=100");
    customersList = res.data?.customers || [];
    const options = customersList.map((c) => `<option value="${c._id}">${c.name} (${c.phone})</option>`).join("");
    if (filterSelect) {
      filterSelect.innerHTML = '<option value="">All Customers / \u062A\u0645\u0627\u0645 \u06AF\u0627\u06C1\u06A9</option>' + options;
      filterSelect.addEventListener("change", () => loadProfiles(filterSelect.value));
    }
    if (modalSelect) {
      modalSelect.innerHTML = '<option value="">Select customer / \u06AF\u0627\u06C1\u06A9 \u0645\u0646\u062A\u062E\u0628 \u06A9\u0631\u06CC\u06BA</option>' + options;
    }
  } catch (err) {
    console.error("Customer loading failed:", err);
  }
}
async function loadProfiles(customerId) {
  const grid = document.getElementById("profilesGrid");
  if (!grid) return;
  try {
    let profiles = [];
    if (customerId) {
      const res = await window.ActionTailor.apiFetch(`/api/measurements/customer/${customerId}`);
      profiles = res.data || [];
    } else if (customersList.length > 0) {
      const promises = customersList.slice(0, 10).map(
        (c) => window.ActionTailor.apiFetch(`/api/measurements/customer/${c._id}`).catch(() => ({ data: [] }))
      );
      const results = await Promise.all(promises);
      profiles = results.flatMap((r) => r.data || []);
    }
    if (profiles.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full p-8 text-center text-slate-500 text-sm bg-slate-900/40 rounded-2xl border border-dashed border-slate-800">
          No measurement profiles on record. Click "+ Record New Profile" above to save one.
        </div>
      `;
      return;
    }
    grid.innerHTML = profiles.map((p) => renderProfileCard(p)).join("");
  } catch (err) {
    grid.innerHTML = `<div class="text-rose-400 p-4 text-sm">Error: ${err.message}</div>`;
  }
}
function renderProfileCard(p) {
  const q = p.measurements?.qameez || {};
  const s = p.measurements?.shalwaar || {};
  return `
    <div class="tailor-card p-5 rounded-xl border border-slate-200 bg-white shadow-xs space-y-3">
      <div class="flex justify-between items-start">
        <div>
          <h3 class="font-bold text-slate-900 text-base">${p.title}</h3>
          <div class="text-xs text-emerald-700 font-semibold mt-0.5">${p.clothingCategory.toUpperCase()} \u2022 ${p.unit}</div>
        </div>
        ${p.isDefault ? '<span class="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">DEFAULT</span>' : ""}
      </div>

      <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
        <div class="font-bold text-slate-500 text-[11px] uppercase tracking-wider">Upper / \u0642\u0645\u06CC\u0636</div>
        <div class="grid grid-cols-3 gap-1.5 text-slate-800">
          <div><span class="text-slate-400">Lambai:</span> <strong>${q.length || "--"}</strong></div>
          <div><span class="text-slate-400">Teera:</span> <strong>${q.shoulder || "--"}</strong></div>
          <div><span class="text-slate-400">Chhati:</span> <strong>${q.chest || "--"}</strong></div>
          <div><span class="text-slate-400">Bazu:</span> <strong>${q.sleeve || "--"}</strong></div>
          <div><span class="text-slate-400">Collar:</span> <strong>${q.collar || "--"}</strong></div>
          <div><span class="text-slate-400">Ghera:</span> <strong>${q.ghera || "--"}</strong></div>
        </div>

        <div class="font-bold text-slate-500 text-[11px] uppercase tracking-wider pt-2 border-t border-slate-200">Lower / \u0634\u0644\u0648\u0627\u0631</div>
        <div class="grid grid-cols-3 gap-1.5 text-slate-800">
          <div><span class="text-slate-400">Lambai:</span> <strong>${s.length || "--"}</strong></div>
          <div><span class="text-slate-400">Paincha:</span> <strong>${s.paincha || "--"}</strong></div>
          <div><span class="text-slate-400">Aasan:</span> <strong>${s.aasan || "--"}</strong></div>
        </div>
      </div>

      <div class="pt-1 flex justify-end">
        <a href="/orders/new?customerId=${p.customer}&profileId=${p._id}" class="text-xs font-bold text-slate-700 hover:text-emerald-700">
          Use for New Order \u2794
        </a>
      </div>
    </div>
  `;
}
function setupModalHandlers() {
  const modal = document.getElementById("modalNewProfile");
  const btnOpen = document.getElementById("btnOpenNewProfileModal");
  const btnClose = document.getElementById("closeProfileModal");
  const btnCancel = document.getElementById("btnCancelProfile");
  btnOpen?.addEventListener("click", () => modal?.classList.remove("hidden"));
  btnClose?.addEventListener("click", () => modal?.classList.add("hidden"));
  btnCancel?.addEventListener("click", () => modal?.classList.add("hidden"));
  document.getElementById("formNewProfile")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const customer = document.getElementById("profileCustomerSelect").value;
    const title = document.getElementById("profileTitle").value;
    const clothingCategory = document.getElementById("profileGarment").value;
    const unit = document.getElementById("profileUnit").value;
    const isDefault = document.getElementById("profileIsDefault").checked;
    const qameez = {
      length: parseFloat(document.getElementById("m_q_length").value) || void 0,
      shoulder: parseFloat(document.getElementById("m_q_shoulder").value) || void 0,
      chest: parseFloat(document.getElementById("m_q_chest").value) || void 0,
      waist: parseFloat(document.getElementById("m_q_waist").value) || void 0,
      sleeve: parseFloat(document.getElementById("m_q_sleeve").value) || void 0,
      collar: parseFloat(document.getElementById("m_q_collar").value) || void 0,
      cuff: parseFloat(document.getElementById("m_q_cuff").value) || void 0,
      ghera: parseFloat(document.getElementById("m_q_ghera").value) || void 0
    };
    const shalwaar = {
      length: parseFloat(document.getElementById("m_s_length").value) || void 0,
      paincha: parseFloat(document.getElementById("m_s_paincha").value) || void 0,
      aasan: parseFloat(document.getElementById("m_s_aasan").value) || void 0,
      waist: parseFloat(document.getElementById("m_s_waist").value) || void 0
    };
    try {
      await window.ActionTailor.apiFetch("/api/measurements", {
        method: "POST",
        body: JSON.stringify({
          customer,
          title,
          clothingCategory,
          unit,
          isDefault,
          measurements: { qameez, shalwaar }
        })
      });
      showToast("Measurement profile saved successfully!", "success");
      modal?.classList.add("hidden");
      e.target.reset();
      await loadProfiles(customer);
    } catch (err) {
      showToast(err.message, "error");
    }
  });
}
initMeasurementsPage();
