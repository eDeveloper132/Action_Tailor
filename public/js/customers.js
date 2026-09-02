import { renderNavbar, showToast } from "../ui_components/index.js";
let customers = [];
async function initCustomersPage() {
  renderNavbar("navbarMount", {
    brandName: "Action Tailor",
    logoIcon: "\u26A1",
    activeLink: "customers",
    showAuthButton: true
  });
  setupModalHandlers();
  document.getElementById("custSearchInput")?.addEventListener("input", debounce(loadCustomers, 300));
  await loadCustomers();
}
async function loadCustomers() {
  const container = document.getElementById("customersGrid");
  if (!container) return;
  const q = document.getElementById("custSearchInput")?.value || "";
  try {
    const url = q ? `/api/customers/search?q=${encodeURIComponent(q)}` : "/api/customers?limit=60";
    const res = await window.ActionTailor.apiFetch(url);
    customers = Array.isArray(res.data) ? res.data : res.data?.customers || [];
    if (customers.length === 0) {
      container.innerHTML = `
        <div class="col-span-full p-8 text-center text-slate-500 text-sm bg-slate-900/40 rounded-2xl border border-dashed border-slate-800">
          No customers found / \u06A9\u0648\u0626\u06CC \u06AF\u0627\u06C1\u06A9 \u0646\u06C1\u06CC\u06BA \u0645\u0644\u0627
        </div>
      `;
      return;
    }
    container.innerHTML = customers.map(
      (c) => `
      <div class="tailor-card p-4 rounded-2xl space-y-2.5">
        <div class="flex justify-between items-start">
          <div>
            <h3 class="font-bold text-white text-base">${c.name}</h3>
            <div class="text-xs text-slate-400 mt-0.5">\u{1F4DE} ${c.phone} ${c.city ? `\u2022 ${c.city}` : ""}</div>
          </div>
          <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-brand-400 border border-slate-700">
            ${c.totalOrders || 0} Suits
          </span>
        </div>

        ${c.address ? `<div class="text-xs text-slate-300 truncate">\u{1F4CD} ${c.address}</div>` : ""}
        ${c.notes ? `<div class="text-xs text-slate-400 italic truncate">${c.notes}</div>` : ""}

        <div class="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
          <a href="https://wa.me/92${c.phone.replace(/\D/g, "").replace(/^0/, "")}" target="_blank" class="text-emerald-400 hover:underline flex items-center gap-1 font-medium">
            <span>\u{1F4AC}</span> <span>WhatsApp Chat</span>
          </a>
          <a href="/orders/new?customerId=${c._id}" class="text-brand-400 hover:text-brand-300 font-semibold">
            + Book Suit \u2794
          </a>
        </div>
      </div>
    `
    ).join("");
  } catch (err) {
    container.innerHTML = `<div class="text-rose-400 p-4 text-sm">Error: ${err.message}</div>`;
  }
}
function setupModalHandlers() {
  const modal = document.getElementById("modalAddCust");
  const btnOpen = document.getElementById("btnOpenAddCustomerModal");
  const btnClose = document.getElementById("closeAddCustModal");
  const btnCancel = document.getElementById("btnCancelAddCust");
  btnOpen?.addEventListener("click", () => modal?.classList.remove("hidden"));
  btnClose?.addEventListener("click", () => modal?.classList.add("hidden"));
  btnCancel?.addEventListener("click", () => modal?.classList.add("hidden"));
  document.getElementById("formAddCust")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("addCustName").value;
    const phone = document.getElementById("addCustPhone").value;
    const city = document.getElementById("addCustCity").value;
    const address = document.getElementById("addCustAddress").value;
    const notes = document.getElementById("addCustNotes").value;
    try {
      await window.ActionTailor.apiFetch("/api/customers", {
        method: "POST",
        body: JSON.stringify({ name, phone, city, address, notes })
      });
      showToast("Customer saved successfully!", "success");
      modal?.classList.add("hidden");
      e.target.reset();
      await loadCustomers();
    } catch (err) {
      showToast(err.message, "error");
    }
  });
}
function debounce(fn, ms = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}
initCustomersPage();
