/**
 * Action Tailor - Reusable Navigation Bar for Customer Frontend
 * Minimal Customer Navigation: Dashboard, My Orders, My Measurements, Profile, Notifications, Logout
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
    padding: 0.75rem 1.25rem;
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
      font-size: 0.8125rem;
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
      <div style="display: flex; align-items: center; gap: 0.35rem; overflow-x: auto; -webkit-overflow-scrolling: touch;">
        <a href="/index.html" style="${getLinkStyle('dashboard')}">Dashboard / ڈیش بورڈ</a>
        <a href="/orders.html" style="${getLinkStyle('orders')}">My Orders / میرے آرڈرز</a>
        <a href="/measurements.html" style="${getLinkStyle('measurements')}">My Measurements / ناپ</a>
        <a href="/profile.html" style="${getLinkStyle('profile')}">Profile / پروفائل</a>
      </div>
    `;
  }

  nav.innerHTML = `
    <div style="display: flex; align-items: center; gap: 1.25rem; flex-wrap: wrap;">
      <a href="/index.html" style="display: flex; align-items: center; gap: 0.5rem; text-decoration: none; font-size: 1.125rem; font-weight: 800; color: #0f172a;">
        <span style="color: #059669; font-size: 1.25rem;">${logoIcon}</span>
        <span>${brandName}</span>
      </a>
      ${linksHtml}
    </div>

    <div style="display: flex; align-items: center; gap: 0.75rem; position: relative;">
      ${isAuthenticated ? `
        <!-- Notifications Bell & Dropdown -->
        <div style="position: relative;" id="navNotifWrapper">
          <button id="navNotifBtn" title="Notifications / نوٹیفکیشنز" style="
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 2.25rem;
            height: 2.25rem;
            border-radius: 9999px;
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            color: #475569;
            cursor: pointer;
            font-size: 1rem;
            transition: all 0.15s ease;
          ">
            🔔
            <span id="navNotifBadge" style="
              display: none;
              position: absolute;
              top: -3px;
              right: -3px;
              background-color: #ef4444;
              color: #ffffff;
              font-size: 0.65rem;
              font-weight: 800;
              width: 1.1rem;
              height: 1.1rem;
              border-radius: 9999px;
              align-items: center;
              justify-content: center;
              line-height: 1;
              border: 1.5px solid #ffffff;
            ">0</span>
          </button>

          <!-- Dropdown Panel -->
          <div id="navNotifDropdown" style="
            display: none;
            position: absolute;
            right: 0;
            top: 2.75rem;
            width: 20rem;
            max-width: 90vw;
            background-color: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 1rem;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
            overflow: hidden;
            z-index: 1050;
          ">
            <div style="padding: 0.75rem 1rem; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 0.8125rem; font-weight: 700; color: #0f172a;">Notifications / اطلاعات</span>
              <span id="navNotifCountLabel" style="font-size: 0.7rem; color: #059669; font-weight: 600;">0 new</span>
            </div>
            <div id="navNotifList" style="max-height: 280px; overflow-y: auto;">
              <div style="padding: 1.5rem; text-align: center; color: #94a3b8; font-size: 0.75rem;">
                Loading notifications...
              </div>
            </div>
          </div>
        </div>

        <span style="display: none; font-size: 0.75rem; background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; padding: 0.25rem 0.65rem; border-radius: 9999px; font-weight: 600;" class="sm:inline-block">
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

  // Sign out handler
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

  // Notifications dropdown and fetch
  if (isAuthenticated) {
    const notifBtn = nav.querySelector('#navNotifBtn') as HTMLButtonElement | null;
    const notifDropdown = nav.querySelector('#navNotifDropdown') as HTMLDivElement | null;
    const notifBadge = nav.querySelector('#navNotifBadge') as HTMLSpanElement | null;
    const notifCountLabel = nav.querySelector('#navNotifCountLabel') as HTMLSpanElement | null;
    const notifList = nav.querySelector('#navNotifList') as HTMLDivElement | null;

    let dropdownOpen = false;

    const toggleDropdown = (open?: boolean) => {
      dropdownOpen = open !== undefined ? open : !dropdownOpen;
      if (notifDropdown) {
        notifDropdown.style.display = dropdownOpen ? 'block' : 'none';
      }
    };

    if (notifBtn) {
      notifBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleDropdown();
      });
    }

    document.addEventListener('click', (e) => {
      if (dropdownOpen && !nav.querySelector('#navNotifWrapper')?.contains(e.target as Node)) {
        toggleDropdown(false);
      }
    });

    const loadNotifications = async () => {
      try {
        if (!(window as any).ActionTailor?.apiFetch) return;
        const res = await (window as any).ActionTailor.apiFetch('/api/notifications');
        const notifications: any[] = res.data || [];

        const unreadList = notifications.filter((n: any) => !n.isRead);
        const unreadCount = unreadList.length;

        if (notifBadge) {
          if (unreadCount > 0) {
            notifBadge.style.display = 'flex';
            notifBadge.textContent = unreadCount > 9 ? '9+' : unreadCount.toString();
          } else {
            notifBadge.style.display = 'none';
          }
        }

        if (notifCountLabel) {
          notifCountLabel.textContent = `${unreadCount} unread`;
        }

        if (notifList) {
          if (notifications.length === 0) {
            notifList.innerHTML = `
              <div style="padding: 1.5rem; text-align: center; color: #94a3b8; font-size: 0.75rem;">
                No notifications / کوئی نیا پیغام نہیں ہے
              </div>
            `;
            return;
          }

          notifList.innerHTML = notifications.slice(0, 10).map((n: any) => `
            <div class="nav-notif-item" data-id="${n._id}" data-read="${n.isRead}" style="
              padding: 0.65rem 0.85rem;
              border-bottom: 1px solid #f8fafc;
              background-color: ${n.isRead ? '#ffffff' : '#f0fdf4'};
              cursor: pointer;
              transition: background-color 0.15s;
            ">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem;">
                <span style="font-size: 0.75rem; font-weight: 700; color: #0f172a;">${n.title || 'Notification'}</span>
                <span style="font-size: 0.65rem; color: #94a3b8; white-space: nowrap;">${new Date(n.createdAt).toLocaleDateString('en-GB')}</span>
              </div>
              <p style="font-size: 0.7rem; color: #475569; margin-top: 0.25rem; line-height: 1.35;">${n.message || ''}</p>
            </div>
          `).join('');

          notifList.querySelectorAll('.nav-notif-item').forEach((item) => {
            item.addEventListener('click', async (e) => {
              const el = e.currentTarget as HTMLElement;
              const notifId = el.dataset.id;
              const isRead = el.dataset.read === 'true';

              if (!isRead && notifId) {
                try {
                  await (window as any).ActionTailor.apiFetch(`/api/notifications/${notifId}/read`, {
                    method: 'PATCH',
                  });
                  el.style.backgroundColor = '#ffffff';
                  el.dataset.read = 'true';
                  loadNotifications();
                } catch (_err) {}
              }
            });
          });
        }
      } catch (_e) {}
    };

    // Load initially and refresh on interval or socket event
    loadNotifications();

    if (typeof (window as any).io !== 'undefined') {
      try {
        const socket = (window as any).io();
        socket.on('notification:new', () => loadNotifications());
        socket.on('order:status_changed', () => loadNotifications());
        socket.on('order:ready', () => loadNotifications());
      } catch (_e) {}
    }
  }

  container.innerHTML = '';
  container.appendChild(nav);
  return nav;
};
