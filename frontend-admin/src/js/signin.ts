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

      // Role check: Only admin and staff may log into the Admin Desk
      if (user?.role === 'customer') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setButtonLoading(submitBtn, false);
        showToast(
          'Access Denied: Customer accounts cannot access the Master Tailor Desk. Please log in through the Customer Portal at http://localhost:3002.',
          'error',
          { title: 'Admin Access Required' }
        );
        return;
      }

      if (res.data && res.data.token) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
      }

      showToast(`Welcome Master Tailor, ${user?.name || ''}! Redirecting...`, 'success', { title: 'Welcome Back' });

      setTimeout(() => {
        window.location.href = '/index.html';
      }, 700);
    } catch (err: any) {
      setButtonLoading(submitBtn, false);
      showToast(err.message || 'Invalid email or password', 'error', { title: 'Authentication Failed' });
    }
  });
}
