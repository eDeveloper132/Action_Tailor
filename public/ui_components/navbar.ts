/**
 * Action Tailor - Reusable Navigation Bar UI Component
 * TypeScript client-side navigation bar
 */

export interface NavbarOptions {
  brandName?: string;
  logoIcon?: string;
  showAuthButton?: boolean;
  activeLink?: 'dashboard' | 'signin' | 'signup';
}

export const renderNavbar = (containerElement: HTMLElement | string, options: NavbarOptions = {}): HTMLElement => {
  const container = typeof containerElement === 'string'
    ? document.getElementById(containerElement)
    : containerElement;

  if (!container) {
    throw new Error('Navbar container element not found');
  }

  const {
    brandName = 'Action Tailor',
    logoIcon = '⚡',
    showAuthButton = true,
    activeLink = 'dashboard',
  } = options;

  const token = localStorage.getItem('token');
  const isAuthenticated = !!token;

  const nav = document.createElement('nav');
  nav.className = 'ui-navbar';
  nav.style.cssText = `
    background-color: var(--surface-color, #1e293b);
    border-bottom: 1px solid var(--border-color, #334155);
    padding: 0.875rem 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: sticky;
    top: 0;
    z-index: 1000;
  `;

  nav.innerHTML = `
    <div style="display: flex; align-items: center; gap: 2rem;">
      <a href="/" style="display: flex; align-items: center; gap: 0.5rem; text-decoration: none; font-size: 1.25rem; font-weight: 700; color: #f8fafc;">
        <span style="color: var(--primary-color, #4f46e5);">${logoIcon}</span>
        <span>${brandName}</span>
      </a>
      <div style="display: flex; gap: 1rem; font-size: 0.875rem;">
        <a href="/dashboard" style="color: ${activeLink === 'dashboard' ? 'var(--primary-color, #4f46e5)' : '#94a3b8'}; text-decoration: none; font-weight: 500;">Dashboard</a>
        ${!isAuthenticated ? `
          <a href="/signin" style="color: ${activeLink === 'signin' ? 'var(--primary-color, #4f46e5)' : '#94a3b8'}; text-decoration: none; font-weight: 500;">Sign In</a>
          <a href="/signup" style="color: ${activeLink === 'signup' ? 'var(--primary-color, #4f46e5)' : '#94a3b8'}; text-decoration: none; font-weight: 500;">Sign Up</a>
        ` : ''}
      </div>
    </div>
    <div style="display: flex; align-items: center; gap: 1rem;">
      ${isAuthenticated ? `
        <span style="font-size: 0.75rem; background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); padding: 0.25rem 0.625rem; border-radius: 9999px; font-weight: 600;">Active Session</span>
      ` : ''}
      ${showAuthButton ? `
        <button id="uiNavAuthBtn" class="btn" style="padding: 0.4rem 0.875rem; font-size: 0.8125rem;">
          ${isAuthenticated ? 'Sign Out' : 'Sign In'}
        </button>
      ` : ''}
    </div>
  `;

  const authBtn = nav.querySelector('#uiNavAuthBtn') as HTMLButtonElement | null;
  if (authBtn) {
    authBtn.addEventListener('click', async () => {
      if (isAuthenticated) {
        try {
          if ((window as any).ActionTailor?.apiFetch) {
            await (window as any).ActionTailor.apiFetch('/api/auth/signout', { method: 'POST' });
          }
        } catch (_e) {}
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/signin';
      } else {
        window.location.href = '/signin';
      }
    });
  }

  container.innerHTML = '';
  container.appendChild(nav);
  return nav;
};

