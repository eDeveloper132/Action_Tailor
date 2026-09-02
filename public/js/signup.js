import { showToast, setButtonLoading } from "../ui_components/index.js";
const form = document.getElementById("signupForm");
const submitBtn = form?.querySelector('button[type="submit"]');
if (form && submitBtn) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fullnameInput = document.getElementById("fullname");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const confirmPasswordInput = document.getElementById("confirmPassword");
    const fullname = fullnameInput?.value || "";
    const email = emailInput?.value || "";
    const password = passwordInput?.value || "";
    const confirmPassword = confirmPasswordInput?.value || "";
    if (password !== confirmPassword) {
      showToast("Passwords do not match! Please check and try again.", "warning", { title: "Validation Error" });
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
