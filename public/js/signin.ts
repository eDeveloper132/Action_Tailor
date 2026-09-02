import { showToast, setButtonLoading } from '../ui_components/index.ts';

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

      if (res.data && res.data.token) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
      }

      showToast('Signed in successfully! Redirecting...', 'success', { title: 'Welcome Back' });

      const urlParams = new URLSearchParams(window.location.search);
      const redirect = urlParams.get('redirect') || '/dashboard';
      setTimeout(() => {
        window.location.href = redirect;
      }, 800);
    } catch (err: any) {
      setButtonLoading(submitBtn, false);
      showToast(err.message || 'Invalid email or password', 'error', { title: 'Authentication Failed' });
    }
  });
}
