import { renderNavbar, showToast } from '../ui_components/index.ts';
import '../utils/api.ts';

async function initProfilePage(): Promise<void> {
  renderNavbar('navbarMount', {
    brandName: 'Action Tailor / کسٹمر پورٹل',
    logoIcon: '✂',
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
    const [authRes, dashboardRes] = await Promise.all([
      (window as any).ActionTailor.apiFetch('/api/auth/me'),
      (window as any).ActionTailor.apiFetch('/api/dashboard/customer').catch(() => ({ data: {} })),
    ]);

    const user = authRes.data;
    const customer = dashboardRes.data?.customerProfile || {};

    const nameEl = document.getElementById('profileName');
    const emailEl = document.getElementById('profileEmail');
    const emailDetailEl = document.getElementById('profileEmailDetail');
    const phoneEl = document.getElementById('profilePhone');
    const addressEl = document.getElementById('profileAddress');
    const avatar = document.getElementById('avatarLetter');

    const displayName = customer.name || user.name || 'Customer';
    const displayPhone = customer.phone || '--';
    const displayAddress = customer.address || customer.city || 'Lahore, Pakistan';
    const displayEmail = customer.email || user.email || 'Not provided / درج نہیں ہے';

    if (nameEl) nameEl.textContent = displayName;
    if (emailEl) emailEl.textContent = displayEmail;
    if (emailDetailEl) emailDetailEl.textContent = displayEmail;
    if (phoneEl) phoneEl.textContent = displayPhone;
    if (addressEl) addressEl.textContent = displayAddress;
    if (avatar && displayName) avatar.textContent = displayName.charAt(0).toUpperCase();
  } catch (err: any) {
    showToast('Failed to load profile / پروفائل لوڈ کرنے میں خرابی', 'error');
  }
}

initProfilePage();

