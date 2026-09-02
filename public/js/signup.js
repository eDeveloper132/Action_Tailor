import { showToast, setButtonLoading } from "../ui_components/index.js";
const form = document.getElementById("signupForm");
const submitBtn = form?.querySelector('button[type="submit"]');
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirmPassword");
const ruleLength = document.getElementById("ruleLength");
const ruleLengthText = document.getElementById("ruleLengthText");
const ruleLetter = document.getElementById("ruleLetter");
const ruleNumber = document.getElementById("ruleNumber");
const strengthBar = document.getElementById("strengthBar");
const strengthLabel = document.getElementById("strengthLabel");
const matchIndicator = document.getElementById("matchIndicator");
const matchIcon = document.getElementById("matchIcon");
const matchText = document.getElementById("matchText");
const evaluatePassword = (password) => {
  const hasLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const count = [hasLength, hasLetter, hasNumber].filter(Boolean).length;
  return {
    hasLength,
    hasLetter,
    hasNumber,
    isValid: count === 3,
    count
  };
};
const updateRuleChip = (element, valid) => {
  if (!element) return;
  const icon = element.querySelector(".rule-icon");
  if (valid) {
    element.className = "rule-item valid p-2 rounded-lg bg-emerald-950/40 border border-emerald-600/50";
    if (icon) {
      icon.className = "rule-icon w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-500 text-emerald-400 flex items-center justify-center text-[9px] font-bold";
      icon.textContent = "\u2713";
    }
  } else {
    element.className = "rule-item invalid p-2 rounded-lg bg-slate-900/60 border border-slate-800";
    if (icon) {
      icon.className = "rule-icon w-4 h-4 rounded-full border border-slate-600 flex items-center justify-center text-[9px] font-bold text-slate-500";
      icon.textContent = "\u25CB";
    }
  }
};
const updateConfirmPasswordMatch = () => {
  if (!confirmPasswordInput || !matchIndicator || !matchIcon || !matchText) return;
  const password = passwordInput?.value || "";
  const confirmPassword = confirmPasswordInput.value;
  if (!confirmPassword) {
    matchIndicator.classList.add("hidden");
    confirmPasswordInput.classList.remove("input-valid", "input-invalid");
    return;
  }
  matchIndicator.classList.remove("hidden");
  if (password && password === confirmPassword) {
    matchIndicator.className = "mt-2 text-xs flex items-center gap-1.5 text-emerald-400 font-medium";
    matchIcon.textContent = "\u2713";
    matchText.textContent = "Passwords match";
    confirmPasswordInput.classList.add("input-valid");
    confirmPasswordInput.classList.remove("input-invalid");
  } else {
    matchIndicator.className = "mt-2 text-xs flex items-center gap-1.5 text-rose-400 font-medium";
    matchIcon.textContent = "\u2715";
    matchText.textContent = "Passwords do not match";
    confirmPasswordInput.classList.add("input-invalid");
    confirmPasswordInput.classList.remove("input-valid");
  }
};
const handlePasswordInput = () => {
  if (!passwordInput) return;
  const password = passwordInput.value;
  const { hasLength, hasLetter, hasNumber, isValid, count } = evaluatePassword(password);
  updateRuleChip(ruleLetter, hasLetter);
  updateRuleChip(ruleNumber, hasNumber);
  updateRuleChip(ruleLength, hasLength);
  if (ruleLengthText) {
    ruleLengthText.textContent = hasLength ? "8+ Chars (\u2713)" : `8+ Chars (${password.length}/8)`;
  }
  if (strengthBar && strengthLabel) {
    if (password.length === 0) {
      strengthBar.style.width = "0%";
      strengthBar.className = "h-full transition-all duration-300 rounded-full bg-slate-700";
      strengthLabel.textContent = "Not entered";
      strengthLabel.className = "font-semibold text-slate-500";
      passwordInput.classList.remove("input-valid", "input-invalid");
    } else if (count === 1) {
      strengthBar.style.width = "33%";
      strengthBar.className = "h-full transition-all duration-300 rounded-full bg-rose-500";
      strengthLabel.textContent = "Weak (Needs 3 rules)";
      strengthLabel.className = "font-semibold text-rose-400";
      passwordInput.classList.add("input-invalid");
      passwordInput.classList.remove("input-valid");
    } else if (count === 2) {
      strengthBar.style.width = "66%";
      strengthBar.className = "h-full transition-all duration-300 rounded-full bg-amber-500";
      strengthLabel.textContent = "Fair (Almost ready)";
      strengthLabel.className = "font-semibold text-amber-400";
      passwordInput.classList.add("input-invalid");
      passwordInput.classList.remove("input-valid");
    } else {
      strengthBar.style.width = "100%";
      strengthBar.className = "h-full transition-all duration-300 rounded-full bg-emerald-500";
      strengthLabel.textContent = "Strong & Ready";
      strengthLabel.className = "font-semibold text-emerald-400";
      passwordInput.classList.add("input-valid");
      passwordInput.classList.remove("input-invalid");
    }
  }
  updateConfirmPasswordMatch();
};
if (passwordInput) {
  ["input", "keyup", "paste", "change"].forEach((eventName) => {
    passwordInput.addEventListener(eventName, handlePasswordInput);
  });
}
if (confirmPasswordInput) {
  ["input", "keyup", "paste", "change"].forEach((eventName) => {
    confirmPasswordInput.addEventListener(eventName, updateConfirmPasswordMatch);
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
    const { isValid, hasLength, hasLetter, hasNumber } = evaluatePassword(password);
    if (!isValid) {
      const missing = [];
      if (!hasLetter) missing.push("at least 1 letter");
      if (!hasNumber) missing.push("at least 1 number");
      if (!hasLength) missing.push("8+ characters");
      showToast(`Password requires: ${missing.join(", ")}.`, "warning", { title: "Password Incomplete" });
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
handlePasswordInput();
