/**
 * Action Tailor - Centralized UI Components Module
 * Exports all TypeScript UI components
 */

export * from './toast.ts';
export * from './navbar.ts';
export * from './statCard.ts';
export * from './modal.ts';
export * from './button.ts';

import { showToast } from './toast.ts';
import { renderNavbar } from './navbar.ts';
import { createStatCard, updateStatCard } from './statCard.ts';
import { showModal } from './modal.ts';
import { createButton, setButtonLoading } from './button.ts';

// Expose on global window object for universal usage across HTML script tags
declare global {
  interface Window {
    ActionTailorUI: {
      showToast: typeof showToast;
      renderNavbar: typeof renderNavbar;
      createStatCard: typeof createStatCard;
      updateStatCard: typeof updateStatCard;
      showModal: typeof showModal;
      createButton: typeof createButton;
      setButtonLoading: typeof setButtonLoading;
    };
  }
}

if (typeof window !== 'undefined') {
  window.ActionTailorUI = {
    showToast,
    renderNavbar,
    createStatCard,
    updateStatCard,
    showModal,
    createButton,
    setButtonLoading,
  };
}
