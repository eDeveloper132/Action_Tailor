/**
 * Action Tailor - Toast Notification UI Component
 * TypeScript client-side toast notifications
 */

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  duration?: number;
  title?: string;
}

let toastContainer: HTMLElement | null = null;

const ensureToastContainer = (): HTMLElement => {
  if (toastContainer && document.body.contains(toastContainer)) {
    return toastContainer;
  }

  toastContainer = document.createElement('div');
  toastContainer.id = 'action-tailor-toast-container';
  toastContainer.style.cssText = `
    position: fixed;
    top: 1.5rem;
    right: 1.5rem;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    max-width: 380px;
    width: 100%;
    pointer-events: none;
  `;
  document.body.appendChild(toastContainer);
  return toastContainer;
};

const getToastColors = (type: ToastType): { bg: string; border: string; text: string; icon: string } => {
  switch (type) {
    case 'success':
      return { bg: '#064e3b', border: '#059669', text: '#34d399', icon: '✓' };
    case 'error':
      return { bg: '#450a0a', border: '#dc2626', text: '#f87171', icon: '✕' };
    case 'warning':
      return { bg: '#451a03', border: '#d97706', text: '#fbbf24', icon: '⚠' };
    case 'info':
    default:
      return { bg: '#1e1b4b', border: '#4f46e5', text: '#818cf8', icon: 'ℹ' };
  }
};

/**
 * Display a modern floating toast notification
 */
export const showToast = (
  message: string,
  type: ToastType = 'info',
  options: ToastOptions = {}
): void => {
  const container = ensureToastContainer();
  const { duration = 4000, title } = options;
  const colors = getToastColors(type);

  const toast = document.createElement('div');
  toast.style.cssText = `
    pointer-events: auto;
    background-color: #1e293b;
    border: 1px solid ${colors.border};
    border-left: 4px solid ${colors.border};
    color: #f8fafc;
    padding: 0.875rem 1rem;
    border-radius: 0.5rem;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 0.875rem;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    opacity: 0;
    transform: translateX(20px);
  `;

  toast.innerHTML = `
    <div style="font-weight: 700; color: ${colors.text}; font-size: 1rem; line-height: 1;">${colors.icon}</div>
    <div style="flex: 1;">
      ${title ? `<div style="font-weight: 600; margin-bottom: 0.25rem; color: #ffffff;">${title}</div>` : ''}
      <div style="color: #cbd5e1; line-height: 1.4;">${message}</div>
    </div>
    <button style="background: none; border: none; color: #64748b; cursor: pointer; font-size: 1rem; padding: 0;" aria-label="Close">&times;</button>
  `;

  const closeBtn = toast.querySelector('button');
  const dismiss = () => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(30px)';
    setTimeout(() => {
      if (toast.parentElement) toast.parentElement.removeChild(toast);
    }, 300);
  };

  closeBtn?.addEventListener('click', dismiss);
  container.appendChild(toast);

  // Trigger enter animation
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(0)';
  });

  // Auto dismiss
  if (duration > 0) {
    setTimeout(dismiss, duration);
  }
};

