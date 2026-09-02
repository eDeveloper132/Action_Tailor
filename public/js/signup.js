import { showToast, setButtonLoading } from "../ui_components/index.js";
const form = document.getElementById("signupForm");
const submitBtn = form?.querySelector('button[type="submit"]');
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirmPassword");
const ruleLength = document.getElementById("ruleLength");
const ruleLetter = document.getElementById("ruleLetter");
const ruleNumber = document.getElementById("ruleNumber");
const strengthBar = document.getElementById("strengthBar");
const checkPassword = (password) => {
  const hasLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  return {
    hasLength,
    hasLetter,
    hasNumber,
    isValid: hasLength && hasLetter && hasNumber
  };
};
const updateRuleUI = (element, valid) => {
  if (!element) return;
  const icon = element.querySelector(".rule-icon");
  if (valid) {
    element.className = "flex items-center gap-2 text-emerald-400 font-medium transition-colors duration-200";
    if (icon) {
      icon.className = "rule-icon w-3.5 h-3.5 rounded-full bg-emerald-500/20 border border-emerald-500 text-emerald-400 flex items-center justify-center text-[9px] font-bold";
      icon.textContent = "\u2713";
    }
  } else {
    element.className = "flex items-center gap-2 text-slate-400 transition-colors duration-200";
    if (icon) {
      icon.className = "rule-icon w-3.5 h-3.5 rounded-full border border-slate-600 flex items-center justify-center text-[9px] font-bold text-slate-500";
      icon.textContent = "\u25CB";
    }
  }
};
if (passwordInput) {
  passwordInput.addEventListener("input", () => {
    const password = passwordInput.value;
    const { hasLength, hasLetter, hasNumber } = checkPassword(password);
    updateRuleUI(ruleLength, hasLength);
    updateRuleUI(ruleLetter, hasLetter);
    updateRuleUI(ruleNumber, hasNumber);
    if (strengthBar) {
      const score = [hasLength, hasLetter, hasNumber].filter(Boolean).length;
      if (password.length === 0) {
        strengthBar.style.width = "0%";
        strengthBar.className = "h-full transition-all duration-300 rounded-full bg-slate-700";
      } else if (score === 1) {
        strengthBar.style.width = "33%";
        strengthBar.className = "h-full transition-all duration-300 rounded-full bg-rose-500";
      } else if (score === 2) {
        strengthBar.style.width = "66%";
        strengthBar.className = "h-full transition-all duration-300 rounded-full bg-amber-500";
      } else {
        strengthBar.style.width = "100%";
        strengthBar.className = "h-full transition-all duration-300 rounded-full bg-emerald-500";
      }
    }
  });
}
if (form && submitBtn) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fullnameInput = document.getElementById("fullname");
    const emailInput = document.getElementById("email");
    const fullname = fullnameInput?.value.trim() || "";
    const email = emailInput?.value.trim() || "";
    const password = passwordInput?.value || "";
    const confirmPassword = confirmPasswordInput?.value || "";
    const { isValid, hasLength, hasLetter, hasNumber } = checkPassword(password);
    if (!isValid) {
      let missing = [];
      if (!hasLength) missing.push("at least 8 characters");
      if (!hasLetter) missing.push("a letter");
      if (!hasNumber) missing.push("a number");
      showToast(
        `Password is too simple. Please include: ${missing.join(", ")}.`,
        "warning",
        { title: "Password Requirements" }
      );
      passwordInput?.focus();
      return;
    }
    if (password !== confirmPassword) {
      showToast("Passwords do not match! Please check and try again.", "warning", { title: "Validation Error" });
      confirmPasswordInput?.focus();
      return;
    }
    try {
      setButtonLoading(submitBtn, true, "Creating Account...");
      const res = await window.ActionTailor.apiFetch("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({ fullname, email, password })
      });
      if (res.data && res.data.token) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
      }
      showToast("Account created successfully! Redirecting...", "success", { title: "Welcome to Action Tailor" });
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1e3);
    } catch (err) {
      setButtonLoading(submitBtn, false);
      showToast(err.message || "Failed to create account", "error", { title: "Registration Error" });
    }
  });
}
