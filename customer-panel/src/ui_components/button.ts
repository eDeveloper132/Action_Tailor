/**
 * Action Tailor - Interactive Button UI Component
 * TypeScript client-side button component with loading state
 */

export interface ButtonOptions {
  text: string;
  variant?: 'primary' | 'secondary' | 'danger';
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  onClick?: (e: MouseEvent) => void;
}

export const createButton = (options: ButtonOptions): HTMLButtonElement => {
  const { text, variant = 'primary', type = 'button', className = '', onClick } = options;
  const btn = document.createElement('button');
  btn.type = type;
  btn.className = `btn btn-${variant} ${className}`.trim();
  btn.textContent = text;

  if (variant === 'secondary') {
    btn.style.cssText = 'background: transparent; border: 1px solid #334155; color: #cbd5e1;';
  } else if (variant === 'danger') {
    btn.style.cssText = 'background-color: #dc2626; color: #ffffff;';
  }

  if (onClick) {
    btn.addEventListener('click', onClick);
  }

  return btn;
};

export const setButtonLoading = (button: HTMLButtonElement, loading: boolean, loadingText = 'Please wait...'): void => {
  if (loading) {
    button.disabled = true;
    button.dataset.originalText = button.textContent || '';
    button.innerHTML = `
      <span style="display: inline-block; width: 0.875rem; height: 0.875rem; border: 2px solid rgba(255,255,255,0.3); border-radius: 50%; border-top-color: #fff; animation: spin 0.6s linear infinite; margin-right: 0.5rem; vertical-align: middle;"></span>
      <span>${loadingText}</span>
    `;
  } else {
    button.disabled = false;
    button.textContent = button.dataset.originalText || button.textContent;
  }
};

