/**
 * Action Tailor - Reusable Navigation Bar UI Component
 * TypeScript client-side navigation bar with bilingual links
 */

export interface NavbarOptions {
  brandName?: string;
  logoIcon?: string;
  showAuthButton?: boolean;
  activeLink?: 'dashboard' | 'orders' | 'new-order' | 'customers' | 'measurements' | 'profile' | 'signin' | 'signup';
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
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isAuthenticated = !!token;
  const isStaffOrAdmin = user && (user.role === 'admin' || user.role === 'staff');

  const nav = document.createElement('nav');
  nav.className = 'ui-navbar no-print';
  nav.style.cssText = `
    background-color: var(--surface-color, #1e293b);
    border-bottom: 1px solid var(--border-color, #334155);
    padding: 0.75rem 1.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: sticky;
    top: 0;
    z-index: 1000;
  `;

  const getLinkColor = (linkName: string): string => {
    return activeLink === linkName ? 'var(--primary-color, #6366f1)' : '#94a3b8';
  };

  nav.innerHTML = `
    <div style="display: flex; align-items: center; gap: 1.5rem; flex-wrap: wrap;">
      <a href="/dashboard" style="display: flex; align-items: center; gap: 0.5rem; text-decoration: none; font-size: 1.15rem; font-weight: 800; color: #f8fafc;">
        <span style="color: var(--primary-color, #6366f1); font-size: 1.3rem;">${logoIcon}</span>
        <span>${brandName}</span>
      </a>

      ${isAuthenticated ? `
        <div style="display: flex; gap: 1rem; font-size: 0.8125rem; font-weight: 500; overflow-x: auto; padding: 0.25rem 0;">
          <a href="/dashboard" style="color: ${getLinkColor('dashboard')}; text-decoration: none;">Dashboard / ڈیش بورڈ</a>
          <a href="/orders" style="color: ${getLinkColor('orders')}; text-decoration: none;">Orders / آرڈرز</a>
          <a href="/orders/new" style="color: ${getLinkColor('new-order')}; text-decoration: none; font-weight: 600;">+ Book Suit / نیا سوٹ</a>
          <a href="/customers" style="color: ${getLinkColor('customers')}; text-decoration: none;">Customers / گاہک</a>
          <a href="/measurements" style="color: ${getLinkColor('measurements')}; text-decoration: none;">Measurements / ناپ</a>
          <a href="/profile" style="color: ${getLinkColor('profile')}; text-decoration: none;">Profile / پروفائل</a>
        </div>
      ` : `
        <div style="display: flex; gap: 1rem; font-size: 0.875rem;">
          <a href="/signin" style="color: ${getLinkColor('signin')}; text-decoration: none; font-weight: 500;">Sign In</a>
          <a href="/signup" style="color: ${getLinkColor('signup')}; text-decoration: none; font-weight: 500;">Sign Up</a>
        </div>
      `}
    </div>

    <div style="display: flex; align-items: center; gap: 0.75rem;">
      ${isAuthenticated ? `
        <span style="font-size: 0.7rem; background: rgba(99, 102, 241, 0.15); color: #818cf8; border: 1px solid rgba(99, 102, 241, 0.3); padding: 0.2rem 0.5rem; border-radius: 9999px; font-weight: 600;">
          ${user?.name || (isStaffOrAdmin ? 'Staff' : 'Customer')}
        </span>
      ` : ''}
      ${showAuthButton ? `
        <button id="uiNavAuthBtn" class="btn" style="padding: 0.35rem 0.75rem; font-size: 0.75rem;">
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
