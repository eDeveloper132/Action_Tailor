/**
 * Action Tailor - Reusable Navigation Bar for Customer Frontend
 * Bright Modern Design System (White Background, Emerald Accents)
 */

export interface NavbarOptions {
  brandName?: string;
  logoIcon?: string;
  showAuthButton?: boolean;
  activeLink?: 'dashboard' | 'orders' | 'measurements' | 'profile' | 'signin' | 'signup';
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

  const {
    brandName = 'Action Tailor / کسٹمر پورٹل',
    logoIcon = '✂',
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
        <a href="/signin.html" style="${getLinkStyle('signin')}">Sign In / لاگ ان</a>
        <a href="/signup.html" style="${getLinkStyle('signup')}">Sign Up / رجسٹریشن</a>
      </div>
    `;
  } else {
    linksHtml = `
      <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.8125rem; overflow-x: auto;">
        <a href="/index.html" style="${getLinkStyle('dashboard')}">Home / ہوم</a>
        <a href="/index.html#active-suits" style="${getLinkStyle('orders')}">My Suits / میرے سوٹ</a>
        <a href="/index.html#measurements" style="${getLinkStyle('measurements')}">My Measurements / ناپ</a>
        <a href="/profile.html" style="${getLinkStyle('profile')}">Profile / پروفائل</a>
      </div>
    `;
  }

  nav.innerHTML = `
    <div style="display: flex; align-items: center; gap: 1.5rem; flex-wrap: wrap;">
      <a href="/index.html" style="display: flex; align-items: center; gap: 0.5rem; text-decoration: none; font-size: 1.15rem; font-weight: 800; color: #0f172a;">
        <span style="color: #059669; font-size: 1.25rem;">${logoIcon}</span>
        <span>${brandName}</span>
      </a>
      ${linksHtml}
    </div>

    <div style="display: flex; align-items: center; gap: 0.75rem;">
      ${isAuthenticated ? `
        <span style="font-size: 0.75rem; background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; padding: 0.25rem 0.65rem; border-radius: 9999px; font-weight: 600;">
          ${user?.name || 'Customer'}
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
        window.location.href = '/signin.html';
      } else {
        window.location.href = '/signin.html';
      }
    });
  }

  container.innerHTML = '';
  container.appendChild(nav);
  return nav;
};
