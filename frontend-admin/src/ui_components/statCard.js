const getColorHex = (color = "primary") => {
  switch (color) {
    case "success":
      return "#10b981";
    case "warning":
      return "#f59e0b";
    case "error":
      return "#ef4444";
    case "primary":
    default:
      return "var(--primary-color, #4f46e5)";
  }
};
const createStatCard = (options) => {
  const { id, title, value, subtitle, color = "primary" } = options;
  const card = document.createElement("div");
  card.className = "card ui-stat-card";
  if (id) card.id = id;
  const colorHex = getColorHex(color);
  card.innerHTML = `
    <div style="font-size: 0.8125rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; margin-bottom: 0.5rem;">
      ${title}
    </div>
    <div class="stat-value" style="font-size: 1.875rem; font-weight: 700; color: ${colorHex}; line-height: 1.2;">
      ${value}
    </div>
    ${subtitle ? `<div class="stat-subtitle" style="font-size: 0.8125rem; color: #64748b; margin-top: 0.5rem;">${subtitle}</div>` : ""}
  `;
  return card;
};
const updateStatCard = (cardElement, value, subtitle) => {
  const el = typeof cardElement === "string" ? document.getElementById(cardElement) : cardElement;
  if (!el) return;
  const valueEl = el.querySelector(".stat-value");
  if (valueEl) valueEl.textContent = String(value);
  if (subtitle !== void 0) {
    let subEl = el.querySelector(".stat-subtitle");
    if (!subEl) {
      subEl = document.createElement("div");
      subEl.className = "stat-subtitle";
      subEl.style.cssText = "font-size: 0.8125rem; color: #64748b; margin-top: 0.5rem;";
      el.appendChild(subEl);
    }
    subEl.textContent = subtitle;
  }
};
export {
  createStatCard,
  updateStatCard
};
