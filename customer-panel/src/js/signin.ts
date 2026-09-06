import { showToast, setButtonLoading } from '../ui_components/index.ts';
import '../utils/api.ts';

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
      setButtonLoading(submitBtn, true, 'Signing in...');

      const res = await (window as any).ActionTailor.apiFetch('/api/auth/signin', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      const user = res.data?.user;

      if (res.data && res.data.token) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
      }

      if (user?.role === 'admin' || user?.role === 'staff') {
        const adminPortalUrl = (import.meta as any).env?.VITE_ADMIN_PORTAL_URL || 'http://localhost:3001';
        showToast('Shop Staff account detected. Redirecting to Master Tailor Desk...', 'info', { title: 'Staff Access' });
        setTimeout(() => {
          window.location.href = adminPortalUrl;
        }, 800);
        return;
      }

      showToast('Signed in successfully! Redirecting to Customer Portal...', 'success', { title: 'Welcome Back' });

      const urlParams = new URLSearchParams(window.location.search);
      const redirect = urlParams.get('redirect') || '/index.html';
      setTimeout(() => {
        window.location.href = redirect;
      }, 700);
    } catch (err: any) {
      setButtonLoading(submitBtn, false);
      showToast(err.message || 'Invalid email or password', 'error', { title: 'Authentication Failed' });
    }
  });
}
