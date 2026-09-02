import { showToast, setButtonLoading } from '../ui_components/index.ts';

const form = document.getElementById('signupForm') as HTMLFormElement | null;
const submitBtn = form?.querySelector('button[type="submit"]') as HTMLButtonElement | null;

if (form && submitBtn) {
  form.addEventListener('submit', async (e: Event) => {
    e.preventDefault();
    const fullnameInput = document.getElementById('fullname') as HTMLInputElement | null;
    const emailInput = document.getElementById('email') as HTMLInputElement | null;
    const passwordInput = document.getElementById('password') as HTMLInputElement | null;
    const confirmPasswordInput = document.getElementById('confirmPassword') as HTMLInputElement | null;

    const fullname = fullnameInput?.value || '';
    const email = emailInput?.value || '';
    const password = passwordInput?.value || '';
    const confirmPassword = confirmPasswordInput?.value || '';

    if (password !== confirmPassword) {
      showToast('Passwords do not match! Please check and try again.', 'warning', { title: 'Validation Error' });
      return;
    }

    try {
      setButtonLoading(submitBtn, true, 'Creating Account...');

      const res = await (window as any).ActionTailor.apiFetch('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ fullname, email, password }),
      });

      if (res.data && res.data.token) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
      }

      showToast('Account created successfully! Redirecting...', 'success', { title: 'Welcome to Action Tailor' });
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000);
    } catch (err: any) {
      setButtonLoading(submitBtn, false);
      showToast(err.message || 'Failed to create account', 'error', { title: 'Registration Error' });
    }
  });
}
