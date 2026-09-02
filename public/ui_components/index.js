export * from "./toast.js";
export * from "./navbar.js";
export * from "./statCard.js";
export * from "./modal.js";
export * from "./button.js";
import { showToast } from "./toast.js";
import { renderNavbar } from "./navbar.js";
import { createStatCard, updateStatCard } from "./statCard.js";
import { showModal } from "./modal.js";
import { createButton, setButtonLoading } from "./button.js";
if (typeof window !== "undefined") {
  window.ActionTailorUI = {
    showToast,
    renderNavbar,
    createStatCard,
    updateStatCard,
    showModal,
    createButton,
    setButtonLoading
  };
}
