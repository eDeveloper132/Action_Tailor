/**
 * Action Tailor - Modal Dialog UI Component
 * TypeScript client-side modal dialog
 */

export interface ModalOptions {
  title: string;
  content: string | HTMLElement;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export interface ModalInstance {
  close: () => void;
  element: HTMLElement;
}

export const showModal = (options: ModalOptions): ModalInstance => {
  const {
    title,
    content,
    confirmText = 'Confirm / تصدیق کریں',
    cancelText = 'Cancel / منسوخ کریں',
    onConfirm,
    onCancel,
  } = options;

  const overlay = document.createElement('div');
  overlay.className = 'ui-modal-overlay';
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    background-color: rgba(15, 23, 42, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9998;
    padding: 1rem;
    opacity: 0;
    transition: opacity 0.2s ease-out;
  `;

  const modal = document.createElement('div');
  modal.className = 'card ui-modal';
  modal.style.cssText = `
    max-width: 500px;
    width: 100%;
    background-color: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 1rem;
    box-shadow: 0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.05);
    transform: scale(0.95);
    transition: transform 0.2s ease-out;
  `;

  modal.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; border-bottom: 1px solid #f1f5f9; padding-bottom: 0.75rem;">
      <h2 style="font-size: 1.125rem; font-weight: 700; color: #0f172a; margin: 0;">${title}</h2>
      <button class="ui-modal-close" title="Close / بند کریں" style="background: none; border: none; color: #94a3b8; font-size: 1.25rem; cursor: pointer;">&times;</button>
    </div>
    <div class="ui-modal-body" style="color: #334155; margin-bottom: 1.5rem; line-height: 1.5; font-size: 0.875rem;"></div>
    <div style="display: flex; justify-content: flex-end; gap: 0.75rem;">
      <button class="btn btn-secondary ui-modal-cancel" style="background-color: #ffffff; border: 1px solid #cbd5e1; color: #334155;">${cancelText}</button>
      <button class="btn ui-modal-confirm">${confirmText}</button>
    </div>
  `;

  const bodyEl = modal.querySelector('.ui-modal-body');
  if (bodyEl) {
    if (typeof content === 'string') {
      bodyEl.innerHTML = content;
    } else {
      bodyEl.appendChild(content);
    }
  }

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  const close = () => {
    overlay.style.opacity = '0';
    modal.style.transform = 'scale(0.95)';
    setTimeout(() => {
      if (document.body.contains(overlay)) {
        document.body.removeChild(overlay);
      }
    }, 200);
  };

  modal.querySelector('.ui-modal-close')?.addEventListener('click', () => {
    if (onCancel) onCancel();
    close();
  });

  modal.querySelector('.ui-modal-cancel')?.addEventListener('click', () => {
    if (onCancel) onCancel();
    close();
  });

  modal.querySelector('.ui-modal-confirm')?.addEventListener('click', () => {
    if (onConfirm) onConfirm();
    close();
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      if (onCancel) onCancel();
      close();
    }
  });

  requestAnimationFrame(() => {
    overlay.style.opacity = '1';
    modal.style.transform = 'scale(1)';
  });

  return { close, element: overlay };
};

