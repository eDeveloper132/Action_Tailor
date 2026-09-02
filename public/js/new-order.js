import { renderNavbar, showToast } from "../ui_components/index.js";
let customersList = [];
let selectedCategory = "shalwaar_qameez";
async function initNewOrderStudio() {
  renderNavbar("navbarMount", {
    brandName: "Action Tailor",
    logoIcon: "\u26A1",
    activeLink: "new-order",
    showAuthButton: true
  });
  const defaultDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0];
  const dateInput = document.getElementById("orderDeliveryDateInput");
  if (dateInput) dateInput.value = defaultDate;
  await loadClothingCategories();
  await loadCustomerDropdown();
  setupCustomerChangeListener();
  setupFormSubmission();
}
async function loadClothingCategories() {
  const grid = document.getElementById("clothingCategoriesGrid");
  if (!grid) return;
  try {
    const res = await window.ActionTailor.apiFetch("/api/dashboard/clothing-types");
    const categories = res.data || [];
    grid.innerHTML = categories.map(
      (cat) => `
      <div class="cat-card p-3 rounded-xl border cursor-pointer transition-all ${cat.key === selectedCategory ? "bg-brand-600/20 border-brand-500 text-white shadow-md" : "bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600"}" data-key="${cat.key}">
        <div class="font-bold text-xs sm:text-sm">${cat.nameEn}</div>
        <div class="text-xs text-brand-400/90 font-medium">${cat.nameUr}</div>
      </div>
    `
    ).join("");
    grid.querySelectorAll(".cat-card").forEach((card) => {
      card.addEventListener("click", (e) => {
        const target = e.currentTarget;
        selectedCategory = target.dataset.key || "shalwaar_qameez";
        document.getElementById("selectedCategoryInput").value = selectedCategory;
        grid.querySelectorAll(".cat-card").forEach((c) => {
          c.className = "cat-card p-3 rounded-xl border cursor-pointer transition-all bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600";
        });
        target.className = "cat-card p-3 rounded-xl border cursor-pointer transition-all bg-brand-600/20 border-brand-500 text-white shadow-md";
      });
    });
  } catch (err) {
    console.error("Error loading clothing types:", err);
  }
}
async function loadCustomerDropdown() {
  const select = document.getElementById("selectCustomer");
  if (!select) return;
  try {
    const res = await window.ActionTailor.apiFetch("/api/customers?limit=100");
    customersList = res.data?.customers || [];
    if (customersList.length === 0) {
      select.innerHTML = '<option value="">No customers found. Add a customer first.</option>';
      return;
    }
    select.innerHTML = '<option value="">Select customer / \u06AF\u0627\u06C1\u06A9 \u0645\u0646\u062A\u062E\u0628 \u06A9\u0631\u06CC\u06BA</option>' + customersList.map((c) => `<option value="${c._id}">${c.name} (${c.phone} - ${c.city || "Lahore"})</option>`).join("");
  } catch (err) {
    select.innerHTML = `<option value="">Error loading customers</option>`;
  }
}
function setupCustomerChangeListener() {
  const selectCustomer = document.getElementById("selectCustomer");
  const selectMeasurement = document.getElementById("selectMeasurementProfile");
  selectCustomer?.addEventListener("change", async () => {
    const customerId = selectCustomer.value;
    if (!customerId) {
      selectMeasurement.innerHTML = '<option value="">Default measurements / \u0628\u0646\u06CC\u0627\u062F\u06CC \u0646\u0627\u067E</option>';
      return;
    }
    try {
      const res = await window.ActionTailor.apiFetch(`/api/measurements/customer/${customerId}`);
      const profiles = res.data || [];
      if (profiles.length === 0) {
        selectMeasurement.innerHTML = '<option value="">No saved profile (Standard dimensions will be used)</option>';
      } else {
        selectMeasurement.innerHTML = '<option value="">Use Default Profile</option>' + profiles.map((p) => `<option value="${p._id}">${p.title} (${p.clothingCategory.toUpperCase()})</option>`).join("");
      }
    } catch (err) {
      console.error(err);
    }
  });
}
function setupFormSubmission() {
  const form = document.getElementById("formNewOrderStudio");
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const customer = document.getElementById("selectCustomer").value;
    const measurementProfileId = document.getElementById("selectMeasurementProfile").value || void 0;
    const clothingCategory = document.getElementById("selectedCategoryInput").value;
    const quantity = parseInt(document.getElementById("orderQtyInput").value, 10);
    const expectedDeliveryDate = document.getElementById("orderDeliveryDateInput").value;
    const providedBy = document.getElementById("fabricProvidedByInput").value;
    const fabricType = document.getElementById("fabricTypeInput").value;
    const color = document.getElementById("fabricColorInput").value;
    const collarStyle = document.getElementById("styleCollar").value;
    const cuffStyle = document.getElementById("styleCuff").value;
    const damanStyle = document.getElementById("styleDaman").value;
    const shalwaarStyle = document.getElementById("styleShalwaar").value;
    const specialInstructions = document.getElementById("styleNotes").value;
    const stitchingPrice = parseFloat(document.getElementById("priceStitching").value);
    const advancePayment = parseFloat(document.getElementById("priceAdvance").value) || 0;
    const paymentMethod = document.getElementById("pricePaymentMethod").value;
    if (!customer) {
      showToast("Please select a customer / \u06AF\u0627\u06C1\u06A9 \u0645\u0646\u062A\u062E\u0628 \u06A9\u0631\u06CC\u06BA", "warning");
      return;
    }
    try {
      const res = await window.ActionTailor.apiFetch("/api/orders", {
        method: "POST",
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
          expectedDeliveryDate
        })
      });
      showToast(`Order #${res.data.orderNumber} successfully booked!`, "success");
      setTimeout(() => {
        window.location.href = "/orders";
      }, 1e3);
    } catch (err) {
      showToast(err.message || "Failed to book order", "error");
    }
  });
}
initNewOrderStudio();
