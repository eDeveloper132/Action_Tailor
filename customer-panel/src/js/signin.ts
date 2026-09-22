import { showToast, setButtonLoading } from '../ui_components/index.ts';
import { getSafeRedirectUrl } from '../utils/redirect.ts';
import '../utils/api.ts';

export const getAdminPortalUrl = (): string => {
  if ((import.meta as any).env?.VITE_ADMIN_PORTAL_URL) {
    return (import.meta as any).env.VITE_ADMIN_PORTAL_URL;
  }
  if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
    return 'https://action-tailor-f8mx.vercel.app/';
  }
  return 'http://localhost:3001/';
};

const adminPortalLink = document.getElementById('adminPortalLink') as HTMLAnchorElement | null;
if (adminPortalLink) {
  adminPortalLink.href = getAdminPortalUrl();
}

// If already authenticated as customer, redirect immediately
(async () => {
  try {
    const user = await (window as any).ActionTailor?.getCurrentUser();
    if (user && user.role === 'customer') {
      const urlParams = new URLSearchParams(window.location.search);
      const redirectTarget = getSafeRedirectUrl(urlParams.get('redirect'), '/index.html');
      window.location.href = redirectTarget;
    }
  } catch (_err) {}
})();

const form = document.getElementById('signinForm') as HTMLFormElement | null;
const submitBtn = form?.querySelector('button[type="submit"]') as HTMLButtonElement | null;

if (form && submitBtn) {
  form.addEventListener('submit', async (e: Event) => {
    e.preventDefault();
    const emailInput = document.getElementById('email') as HTMLInputElement | null;
    const passwordInput = document.getElementById('password') as HTMLInputElement | null;

    const email = emailInput?.value || '';
    const password = passwordInput?.value || '';

    try {
      setButtonLoading(submitBtn, true, 'Signing in... / لاگ ان ہو رہا ہے...');

      const res = await (window as any).ActionTailor.apiFetch('/api/auth/signin', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      const user = res.data?.user;

      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
      }

      if (user?.role === 'admin' || user?.role === 'staff' || user?.role === 'manager') {
        const adminPortalUrl = getAdminPortalUrl();
        showToast('Staff account detected / سٹاف اکاؤنٹ شناخت ہو گیا', 'info');
        setTimeout(() => {
          window.location.href = adminPortalUrl;
        }, 800);
        return;
      }

      showToast('Signed in successfully! / لاگ ان کامیاب!', 'success');

      const urlParams = new URLSearchParams(window.location.search);
      const redirectTarget = getSafeRedirectUrl(urlParams.get('redirect'), '/index.html');
      setTimeout(() => {
        window.location.href = redirectTarget;
      }, 700);
    } catch (err: any) {
      setButtonLoading(submitBtn, false);
      showToast(err.message || 'Invalid email or password / غلط ای میل یا پاس ورڈ', 'error');
    }
  });
}
