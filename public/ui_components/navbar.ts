/**
 * Action Tailor - Reusable Navigation Bar UI Component
 * Strictly Separated Customer Navigation & Admin/Staff Navigation
 * Bright Modern Design System (White Background, Emerald Accents)
 */

export interface NavbarOptions {
  brandName?: string;
  logoIcon?: string;
  showAuthButton?: boolean;
  portalType?: 'customer' | 'admin';
  activeLink?: 'dashboard' | 'orders' | 'new-order' | 'customers' | 'measurements' | 'profile' | 'signin' | 'signup';
}

export const renderNavbar = (containerElement: HTMLElement | string, options: NavbarOptions = {}): HTMLElement => {
  const container = typeof containerElement === 'string'
    ? document.getElementById(containerElement)
    : containerElement;

  if (!container) {
    throw new Error('Navbar container element not found');
  }

  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isAuthenticated = !!token;
  const isCustomer = user?.role === 'customer';
  const isStaffOrAdmin = user && (user.role === 'admin' || user.role === 'staff');

  const resolvedPortal = options.portalType || (isCustomer ? 'customer' : 'admin');

  const {
    brandName = resolvedPortal === 'customer' ? 'Action Tailor / کسٹمر پورٹل' : 'Action Tailor • Admin Desk',
    logoIcon = resolvedPortal === 'customer' ? '✂' : '⚡',
    showAuthButton = true,
    activeLink = 'dashboard',
  } = options;

  const nav = document.createElement('nav');
  nav.className = 'ui-navbar no-print';
  nav.style.cssText = `
    background-color: #ffffff;
    border-bottom: 1px solid #e2e8f0;
    padding: 0.75rem 1.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: sticky;
    top: 0;
    z-index: 1000;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.04);
  `;

  const getLinkStyle = (linkName: string): string => {
    const isActive = activeLink === linkName;
    return `
      color: ${isActive ? '#059669' : '#475569'};
      font-weight: ${isActive ? '700' : '500'};
      text-decoration: none;
      padding: 0.35rem 0.65rem;
      border-radius: 0.5rem;
      background-color: ${isActive ? '#ecfdf5' : 'transparent'};
      transition: all 0.15s ease;
    `;
  };

  let linksHtml = '';

  if (!isAuthenticated) {
    linksHtml = `
      <div style="display: flex; gap: 0.75rem; font-size: 0.875rem;">
        <a href="/signin" style="${getLinkStyle('signin')}">Sign In / لاگ ان</a>
        <a href="/signup" style="${getLinkStyle('signup')}">Sign Up / رجسٹریشن</a>
      </div>
    `;
  } else if (resolvedPortal === 'customer') {
    // ----------------------------------------------------
    // STRICT CUSTOMER NAVIGATION (Minimal, friendly)
    // ----------------------------------------------------
    linksHtml = `
      <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.8125rem; overflow-x: auto;">
        <a href="/portal" style="${getLinkStyle('dashboard')}">Home / ہوم</a>
        <a href="/portal#active-suits" style="${getLinkStyle('orders')}">My Suits / میرے سوٹ</a>
        <a href="/portal#measurements" style="${getLinkStyle('measurements')}">My Measurements / ناپ</a>
        <a href="/profile" style="${getLinkStyle('profile')}">Profile / پروفائل</a>
      </div>
    `;
  } else {
    // ----------------------------------------------------
    // STRICT ADMIN/STAFF NAVIGATION (Operational, shop desk)
    // ----------------------------------------------------
    linksHtml = `
      <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.8125rem; overflow-x: auto;">
        <a href="/admin" style="${getLinkStyle('dashboard')}">Dashboard / ڈیش بورڈ</a>
        <a href="/orders" style="${getLinkStyle('orders')}">Orders / آرڈرز</a>
        <a href="/orders/new" style="${getLinkStyle('new-order')}">+ Book Suit / نیا سوٹ</a>
        <a href="/customers" style="${getLinkStyle('customers')}">Customers / گاہک</a>
        <a href="/measurements" style="${getLinkStyle('measurements')}">Measurements / ناپ</a>
        <a href="/profile" style="${getLinkStyle('profile')}">Profile / پروفائل</a>
      </div>
    `;
  }

  const brandHref = resolvedPortal === 'customer' ? '/portal' : '/admin';

  nav.innerHTML = `
    <div style="display: flex; align-items: center; gap: 1.5rem; flex-wrap: wrap;">
      <a href="${brandHref}" style="display: flex; align-items: center; gap: 0.5rem; text-decoration: none; font-size: 1.15rem; font-weight: 800; color: #0f172a;">
        <span style="color: #059669; font-size: 1.25rem;">${logoIcon}</span>
        <span>${brandName}</span>
      </a>
      ${linksHtml}
    </div>

    <div style="display: flex; align-items: center; gap: 0.75rem;">
      ${isAuthenticated ? `
        <span style="font-size: 0.75rem; background: ${isCustomer ? '#ecfdf5' : '#f0fdf4'}; color: #047857; border: 1px solid #a7f3d0; padding: 0.25rem 0.65rem; border-radius: 9999px; font-weight: 600;">
          ${user?.name || (isCustomer ? 'Customer' : 'Staff')}
        </span>
      ` : ''}
      ${showAuthButton ? `
        <button id="uiNavAuthBtn" style="padding: 0.35rem 0.75rem; font-size: 0.75rem; font-weight: 600; border-radius: 0.5rem; background-color: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; cursor: pointer; transition: all 0.15s ease;">
          ${isAuthenticated ? 'Sign Out / لاگ آؤٹ' : 'Sign In'}
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
