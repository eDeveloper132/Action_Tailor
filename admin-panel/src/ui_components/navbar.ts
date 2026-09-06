/**
 * Action Tailor - Reusable Navigation Bar for Admin + Staff Frontend
 * Bright Modern Design System (White Background, Emerald Accents)
 * Includes Notifications Bell & Dropdown Feed
 */

export interface NavbarOptions {
  brandName?: string;
  logoIcon?: string;
  showAuthButton?: boolean;
  activeLink?: 'dashboard' | 'orders' | 'new-order' | 'customers' | 'measurements' | 'profile' | 'signin';
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
    brandName = 'Action Tailor • Admin Desk',
    logoIcon = '⚡',
    showAuthButton = true,
    activeLink = 'dashboard',
  } = options;

  const nav = document.createElement('nav');
  nav.className = 'ui-navbar no-print relative';
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
      white-space: nowrap;
    `;
  };

  let linksHtml = '';

  if (!isAuthenticated) {
    linksHtml = `
      <div style="display: flex; gap: 0.75rem; font-size: 0.875rem;">
        <a href="/signin.html" style="${getLinkStyle('signin')}">Sign In / لاگ ان</a>
      </div>
    `;
  } else {
    linksHtml = `
      <div style="display: flex; align-items: center; gap: 0.35rem; font-size: 0.8125rem; overflow-x: auto; max-width: 100%;">
        <a href="/index.html" style="${getLinkStyle('dashboard')}">Dashboard / ڈیش بورڈ</a>
        <a href="/orders.html" style="${getLinkStyle('orders')}">Orders / آرڈرز</a>
        <a href="/new-order.html" style="${getLinkStyle('new-order')}">+ Book Suit / نیا سوٹ</a>
        <a href="/customers.html" style="${getLinkStyle('customers')}">Customers / گاہک</a>
        <a href="/measurements.html" style="${getLinkStyle('measurements')}">Measurements / ناپ</a>
        <a href="/profile.html" style="${getLinkStyle('profile')}">Profile / پروفائل</a>
      </div>
    `;
  }

  nav.innerHTML = `
    <div style="display: flex; align-items: center; gap: 1.25rem; flex-wrap: wrap;">
      <a href="/index.html" style="display: flex; align-items: center; gap: 0.5rem; text-decoration: none; font-size: 1.15rem; font-weight: 800; color: #0f172a;">
        <span style="color: #059669; font-size: 1.25rem;">${logoIcon}</span>
        <span>${brandName}</span>
      </a>
      ${linksHtml}
    </div>

    <div style="display: flex; align-items: center; gap: 0.65rem;">
      ${isAuthenticated ? `
        <!-- Notifications Bell -->
        <div class="relative" style="position: relative;">
          <button id="uiNavNotificationBtn" style="padding: 0.4rem 0.6rem; border-radius: 0.5rem; background: #f8fafc; border: 1px solid #e2e8f0; cursor: pointer; display: flex; align-items: center; gap: 0.25rem; font-size: 0.875rem; position: relative;" title="Notifications">
            <span>🔔</span>
            <span id="uiNavNotificationBadge" style="display: none; background: #ef4444; color: #ffffff; font-size: 0.65rem; font-weight: 700; border-radius: 9999px; padding: 0.1rem 0.35rem; line-height: 1;">0</span>
          </button>
          
          <!-- Dropdown Panel -->
          <div id="uiNavNotificationDropdown" style="display: none; position: absolute; right: 0; top: 115%; width: 320px; max-height: 380px; overflow-y: auto; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 0.75rem; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); z-index: 1050; padding: 0.75rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 0.5rem; margin-bottom: 0.5rem;">
              <span style="font-size: 0.75rem; font-weight: 700; color: #0f172a; text-transform: uppercase;">Notifications / اطلاعات</span>
              <span id="uiNavNotificationRefresh" style="font-size: 0.7rem; color: #059669; cursor: pointer; font-weight: 600;">Refresh 🔄</span>
            </div>
            <div id="uiNavNotificationList" style="display: flex; flex-direction: column; gap: 0.5rem;">
              <div style="text-align: center; color: #94a3b8; font-size: 0.75rem; padding: 1rem 0;">Loading notifications...</div>
            </div>
          </div>
        </div>

        <span style="font-size: 0.75rem; background: #f0fdf4; color: #047857; border: 1px solid #a7f3d0; padding: 0.25rem 0.65rem; border-radius: 9999px; font-weight: 600;">
          ${user?.name || 'Staff'} (${user?.role || 'staff'})
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

  if (isAuthenticated) {
    setupNotificationBell(nav);
  }

  container.innerHTML = '';
  container.appendChild(nav);
  return nav;
};

async function setupNotificationBell(nav: HTMLElement): Promise<void> {
  const notifBtn = nav.querySelector('#uiNavNotificationBtn') as HTMLElement | null;
  const notifBadge = nav.querySelector('#uiNavNotificationBadge') as HTMLElement | null;
  const dropdown = nav.querySelector('#uiNavNotificationDropdown') as HTMLElement | null;
  const notifList = nav.querySelector('#uiNavNotificationList') as HTMLElement | null;
  const refreshBtn = nav.querySelector('#uiNavNotificationRefresh') as HTMLElement | null;

  if (!notifBtn || !dropdown || !notifList) return;

  const fetchNotifications = async () => {
    try {
      const res = await (window as any).ActionTailor?.apiFetch('/api/notifications');
      const items = res?.data || [];
      const unreadCount = items.filter((n: any) => !n.isRead).length;

      if (notifBadge) {
        if (unreadCount > 0) {
          notifBadge.textContent = unreadCount > 99 ? '99+' : `${unreadCount}`;
          notifBadge.style.display = 'inline-block';
        } else {
          notifBadge.style.display = 'none';
        }
      }

      if (items.length === 0) {
        notifList.innerHTML = `
          <div style="text-align: center; color: #94a3b8; font-size: 0.75rem; padding: 1.5rem 0;">
            No notifications yet / کوئی اطلاع نہیں
          </div>
        `;
        return;
      }

      notifList.innerHTML = items.slice(0, 15).map((n: any) => `
        <div style="padding: 0.5rem; border-radius: 0.5rem; background: ${n.isRead ? '#f8fafc' : '#f0fdf4'}; border: 1px solid ${n.isRead ? '#e2e8f0' : '#bbf7d0'}; font-size: 0.75rem; cursor: pointer;" class="nav-notif-item" data-id="${n._id}">
          <div style="font-weight: 700; color: #0f172a; display: flex; justify-content: space-between;">
            <span>${n.title}</span>
            <span style="font-size: 0.65rem; color: #64748b;">${new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div style="color: #475569; margin-top: 0.2rem; font-size: 0.7rem;">${n.message}</div>
        </div>
      `).join('');

      notifList.querySelectorAll('.nav-notif-item').forEach((item) => {
        item.addEventListener('click', async (e) => {
          const id = (e.currentTarget as HTMLElement).dataset.id;
          if (!id) return;
          try {
            await (window as any).ActionTailor?.apiFetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
            fetchNotifications();
          } catch (_e) {}
        });
      });
    } catch (_err) {
      notifList.innerHTML = `<div style="color: #f87171; font-size: 0.75rem; padding: 0.5rem;">Could not load alerts</div>`;
    }
  };

  notifBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isHidden = dropdown.style.display === 'none';
    dropdown.style.display = isHidden ? 'block' : 'none';
    if (isHidden) {
      fetchNotifications();
    }
  });

  refreshBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    fetchNotifications();
  });

  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target as Node) && !notifBtn.contains(e.target as Node)) {
      dropdown.style.display = 'none';
    }
  });

  fetchNotifications();
}
