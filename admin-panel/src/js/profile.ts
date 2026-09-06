import { renderNavbar, showToast } from '../ui_components/index.ts';
import '../utils/api.ts';

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
    window.location.href = '/signin.html';
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
      roleBadge.textContent = user.role === 'admin' ? 'Admin / ایڈمن' : user.role === 'manager' ? 'Manager / مینیجر' : user.role === 'staff' ? 'Staff / کاریگر' : 'Customer / کسٹمر';
    }

    if (permsEl) {
      if (user.role === 'admin') {
        permsEl.textContent = 'Admin / ایڈمن: Full Access';
      } else if (user.role === 'staff') {
        permsEl.textContent = 'Staff / کاریگر: Tailoring Access';
      } else {
        permsEl.textContent = 'Customer / کسٹمر: Personal Access';
      }
    }
  } catch (err: any) {
    showToast('Failed to load profile / پروفائل لوڈ کرنے میں خرابی', 'error');
  }
}

initProfilePage();

