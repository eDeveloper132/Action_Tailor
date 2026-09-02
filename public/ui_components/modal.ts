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
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onConfirm,
    onCancel,
  } = options;

  const overlay = document.createElement('div');
  overlay.className = 'ui-modal-overlay';
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    background-color: rgba(15, 23, 42, 0.75);
    backdrop-filter: blur(4px);
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
    transform: scale(0.95);
    transition: transform 0.2s ease-out;
  `;

  modal.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
      <h2 style="font-size: 1.25rem; font-weight: 700; color: #f8fafc; margin: 0;">${title}</h2>
      <button class="ui-modal-close" style="background: none; border: none; color: #64748b; font-size: 1.25rem; cursor: pointer;">&times;</button>
    </div>
    <div class="ui-modal-body" style="color: #cbd5e1; margin-bottom: 1.5rem; line-height: 1.5;"></div>
    <div style="display: flex; justify-content: flex-end; gap: 0.75rem;">
      <button class="btn ui-modal-cancel" style="background: transparent; border: 1px solid #334155; color: #cbd5e1;">${cancelText}</button>
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
