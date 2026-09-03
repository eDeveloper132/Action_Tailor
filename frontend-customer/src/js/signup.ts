import { showToast, setButtonLoading } from '../ui_components/index.ts';
import '../utils/api.ts';

const form = document.getElementById('signupForm') as HTMLFormElement | null;
const submitBtn = form?.querySelector('button[type="submit"]') as HTMLButtonElement | null;
const passwordInput = document.getElementById('password') as HTMLInputElement | null;
const confirmPasswordInput = document.getElementById('confirmPassword') as HTMLInputElement | null;

// UI Requirement indicator elements
const ruleLength = document.getElementById('ruleLength');
const ruleLengthText = document.getElementById('ruleLengthText');
const ruleLetter = document.getElementById('ruleLetter');
const ruleNumber = document.getElementById('ruleNumber');
const strengthBar = document.getElementById('strengthBar');
const strengthLabel = document.getElementById('strengthLabel');

// Password match indicator elements
const matchIndicator = document.getElementById('matchIndicator');
const matchIcon = document.getElementById('matchIcon');
const matchText = document.getElementById('matchText');

interface PasswordValidity {
  hasLength: boolean;
  hasLetter: boolean;
  hasNumber: boolean;
  isValid: boolean;
  count: number;
}

const evaluatePassword = (password: string): PasswordValidity => {
  const hasLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const count = [hasLength, hasLetter, hasNumber].filter(Boolean).length;

  return {
    hasLength,
    hasLetter,
    hasNumber,
    isValid: count === 3,
    count,
  };
};

const updateRuleChip = (element: HTMLElement | null, valid: boolean): void => {
  if (!element) return;
  const icon = element.querySelector('.rule-icon');

  if (valid) {
    element.className = 'rule-item valid p-2 rounded-lg bg-emerald-950/40 border border-emerald-600/50';
    if (icon) {
      icon.className = 'rule-icon w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-500 text-emerald-400 flex items-center justify-center text-[9px] font-bold';
      icon.textContent = '✓';
    }
  } else {
    element.className = 'rule-item invalid p-2 rounded-lg bg-slate-900/60 border border-slate-800';
    if (icon) {
      icon.className = 'rule-icon w-4 h-4 rounded-full border border-slate-600 flex items-center justify-center text-[9px] font-bold text-slate-500';
      icon.textContent = '○';
    }
  }
};

const updateConfirmPasswordMatch = (): void => {
  if (!confirmPasswordInput || !matchIndicator || !matchIcon || !matchText) return;

  const password = passwordInput?.value || '';
  const confirmPassword = confirmPasswordInput.value;

  if (!confirmPassword) {
    matchIndicator.classList.add('hidden');
    confirmPasswordInput.classList.remove('input-valid', 'input-invalid');
    return;
  }

  matchIndicator.classList.remove('hidden');

  if (password && password === confirmPassword) {
    matchIndicator.className = 'mt-2 text-xs flex items-center gap-1.5 text-emerald-400 font-medium';
    matchIcon.textContent = '✓';
    matchText.textContent = 'Passwords match';
    confirmPasswordInput.classList.add('input-valid');
    confirmPasswordInput.classList.remove('input-invalid');
  } else {
    matchIndicator.className = 'mt-2 text-xs flex items-center gap-1.5 text-rose-400 font-medium';
    matchIcon.textContent = '✕';
    matchText.textContent = 'Passwords do not match';
    confirmPasswordInput.classList.add('input-invalid');
    confirmPasswordInput.classList.remove('input-valid');
  }
};

// Real-time password evaluation
const handlePasswordInput = (): void => {
  if (!passwordInput) return;
  const password = passwordInput.value;
  const { hasLength, hasLetter, hasNumber, isValid, count } = evaluatePassword(password);

  // 1. Update individual rule chips in real-time
  updateRuleChip(ruleLetter, hasLetter);
  updateRuleChip(ruleNumber, hasNumber);
  updateRuleChip(ruleLength, hasLength);

  if (ruleLengthText) {
    ruleLengthText.textContent = hasLength ? '8+ Chars (✓)' : `8+ Chars (${password.length}/8)`;
  }

  // 2. Update Strength Bar and Label
  if (strengthBar && strengthLabel) {
    if (password.length === 0) {
      strengthBar.style.width = '0%';
      strengthBar.className = 'h-full transition-all duration-300 rounded-full bg-slate-700';
      strengthLabel.textContent = 'Not entered';
      strengthLabel.className = 'font-semibold text-slate-500';
      passwordInput.classList.remove('input-valid', 'input-invalid');
    } else if (count === 1) {
      strengthBar.style.width = '33%';
      strengthBar.className = 'h-full transition-all duration-300 rounded-full bg-rose-500';
      strengthLabel.textContent = 'Weak (Needs 3 rules)';
      strengthLabel.className = 'font-semibold text-rose-400';
      passwordInput.classList.add('input-invalid');
      passwordInput.classList.remove('input-valid');
    } else if (count === 2) {
      strengthBar.style.width = '66%';
      strengthBar.className = 'h-full transition-all duration-300 rounded-full bg-amber-500';
      strengthLabel.textContent = 'Fair (Almost ready)';
      strengthLabel.className = 'font-semibold text-amber-400';
      passwordInput.classList.add('input-invalid');
      passwordInput.classList.remove('input-valid');
    } else {
      strengthBar.style.width = '100%';
      strengthBar.className = 'h-full transition-all duration-300 rounded-full bg-emerald-500';
      strengthLabel.textContent = 'Strong & Ready';
      strengthLabel.className = 'font-semibold text-emerald-400';
      passwordInput.classList.add('input-valid');
      passwordInput.classList.remove('input-invalid');
    }
  }

  // Also verify confirm password against updated password
  updateConfirmPasswordMatch();
};

// Bind real-time event listeners on password input
if (passwordInput) {
  ['input', 'keyup', 'paste', 'change'].forEach((eventName) => {
    passwordInput.addEventListener(eventName, handlePasswordInput);
  });
}

// Bind real-time event listeners on confirm password input
if (confirmPasswordInput) {
  ['input', 'keyup', 'paste', 'change'].forEach((eventName) => {
    confirmPasswordInput.addEventListener(eventName, updateConfirmPasswordMatch);
  });
}

// Form Submission Handler
if (form && submitBtn) {
  form.addEventListener('submit', async (e: Event) => {
    e.preventDefault();

    const fullnameInput = document.getElementById('fullname') as HTMLInputElement | null;
    const emailInput = document.getElementById('email') as HTMLInputElement | null;

    const fullname = fullnameInput?.value.trim() || '';
    const email = emailInput?.value.trim() || '';
    const password = passwordInput?.value || '';
    const confirmPassword = confirmPasswordInput?.value || '';

    const { isValid, hasLength, hasLetter, hasNumber } = evaluatePassword(password);

    if (!isValid) {
      const missing: string[] = [];
      if (!hasLetter) missing.push('at least 1 letter');
      if (!hasNumber) missing.push('at least 1 number');
      if (!hasLength) missing.push('8+ characters');

      showToast(`Password requires: ${missing.join(', ')}.`, 'warning', { title: 'Password Incomplete' });
      passwordInput?.focus();
      return;
    }

    if (password !== confirmPassword) {
      showToast('Passwords do not match! Please check and try again.', 'warning', { title: 'Validation Error' });
      confirmPasswordInput?.focus();
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

      showToast('Account created successfully! Redirecting to your Customer Portal...', 'success', { title: 'Welcome to Action Tailor' });
      setTimeout(() => {
        window.location.href = '/index.html';
      }, 1000);
    } catch (err: any) {
      setButtonLoading(submitBtn, false);
      showToast(err.message || 'Failed to create account', 'error', { title: 'Registration Error' });
    }
  });
}

// Run initial evaluation in case browser pre-fills fields
handlePasswordInput();
