import { showToast, setButtonLoading } from "../ui_components/index.js";
const form = document.getElementById("signinForm");
const submitBtn = form?.querySelector('button[type="submit"]');
if (form && submitBtn) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const email = emailInput?.value || "";
    const password = passwordInput?.value || "";
    try {
      setButtonLoading(submitBtn, true, "Signing in...");
      const res = await window.ActionTailor.apiFetch("/api/auth/signin", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      if (res.data && res.data.token) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
      }
      showToast("Signed in successfully! Redirecting...", "success", { title: "Welcome Back" });
      const urlParams = new URLSearchParams(window.location.search);
      const redirect = urlParams.get("redirect") || "/dashboard";
      setTimeout(() => {
        window.location.href = redirect;
      }, 800);
    } catch (err) {
      setButtonLoading(submitBtn, false);
      showToast(err.message || "Invalid email or password", "error", { title: "Authentication Failed" });
    }
  });
}
