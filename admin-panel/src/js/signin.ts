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
      setButtonLoading(submitBtn, true, 'Signing in... / لاگ ان ہو رہا ہے...');

      const res = await (window as any).ActionTailor.apiFetch('/api/auth/signin', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      const user = res.data?.user;

      // Role check: Only admin and staff may log into the Admin Desk
      if (user?.role === 'customer') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setButtonLoading(submitBtn, false);
        const customerPortalUrl = (import.meta as any).env?.VITE_CUSTOMER_PORTAL_URL || 'http://localhost:3002';
        showToast(
          `Access Denied / رسائی کی اجازت نہیں: Customer accounts cannot access the Master Tailor Desk. Please log in through the Customer Portal at ${customerPortalUrl}.`,
          'error',
          { title: 'Admin Access Required / مخصوص رسائی' }
        );
        return;
      }

      if (res.data && res.data.token) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
      }

      showToast(`Welcome / خوش آمدید، ${user?.name || ''}! Redirecting...`, 'success', { title: 'Welcome / خوش آمدید' });

      setTimeout(() => {
        window.location.href = '/index.html';
      }, 700);
    } catch (err: any) {
      setButtonLoading(submitBtn, false);
      showToast(err.message || 'Invalid email or password / غلط ای میل یا پاس ورڈ', 'error', { title: 'Authentication Failed / لاگ ان ناکام' });
    }
  });
}
