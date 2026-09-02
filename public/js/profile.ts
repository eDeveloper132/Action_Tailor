import { renderNavbar, showToast } from '../ui_components/index.ts';

async function initProfilePage(): Promise<void> {
  renderNavbar('navbarMount', {
    brandName: 'Action Tailor',
    logoIcon: '⚡',
    activeLink: 'profile',
    showAuthButton: true,
  });

  document.getElementById('btnSignOutProfile')?.addEventListener('click', async () => {
    try {
      await (window as any).ActionTailor.apiFetch('/api/auth/signout', { method: 'POST' });
    } catch (_e) {}
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/signin';
  });

  try {
    const res = await (window as any).ActionTailor.apiFetch('/api/auth/me');
    const user = res.data;

    const nameEl = document.getElementById('profileName');
    const emailEl = document.getElementById('profileEmail');
    const roleBadge = document.getElementById('profileRoleBadge');
    const roleText = document.getElementById('profileRoleText');
    const userIdEl = document.getElementById('profileUserId');
    const avatar = document.getElementById('avatarLetter');
    const permsEl = document.getElementById('profilePermsDescription');

    if (nameEl) nameEl.textContent = user.name || 'Tailor User';
    if (emailEl) emailEl.textContent = user.email || '--';
    if (avatar && user.name) avatar.textContent = user.name.charAt(0).toUpperCase();
    if (userIdEl) userIdEl.textContent = user._id || user.userId || '--';
    if (roleText) roleText.textContent = user.role || 'customer';

    if (roleBadge) {
      roleBadge.textContent = user.role === 'admin' ? 'Master Tailor (Admin)' : user.role === 'staff' ? 'Karigar / Staff' : 'Customer';
    }

    if (permsEl) {
      if (user.role === 'admin') {
        permsEl.textContent = 'Full Master Access: You can create & delete customers, book suits, advance order workflows, record payments, and view shop operational metrics.';
      } else if (user.role === 'staff') {
        permsEl.textContent = 'Staff Access: You can book suits, record measurements, update order cutting/stitching statuses, and record advance/balance payments.';
      } else {
        permsEl.textContent = 'Customer Access: You can track your suit progress, view your saved measurements, and inspect your order receipts.';
      }
    }
  } catch (err: any) {
    showToast('Failed to load profile details', 'error');
  }
}

initProfilePage();
