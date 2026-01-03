import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "./Login.css";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation(); // to get current route
  const BASE_URL = import.meta.env.VITE_API_BASE_URL;

  /* =========================
     MANUAL LOGIN HANDLER
  ========================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    const email = e.target.email.value;
    const password = e.target.password.value;

    try {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // important for session
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // ✅ Redirect to Selection Page or previous page if stored
        const redirectTo = location.state?.from || "/select-idea";
        navigate(redirectTo);
      } else {
        alert(data.message || "Login failed");
      }
    } catch (err) {
      console.error("Login error:", err);
      alert("Server error. Please try again later.");
    }
  };

  /* =========================
     GOOGLE LOGIN HANDLER
  ========================= */
  const handleGoogleLogin = () => {
    // Preserve current route
    const currentPath = location.pathname; // e.g., /select-idea
    window.location.href = `${BASE_URL}/auth/google?redirect=${encodeURIComponent(
      currentPath
    )}`;
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">Welcome Back</h2>
        <p className="login-subtitle">
          Sign in to your Idea-to-Startup dashboard
        </p>

        {/* ================= LOGIN FORM ================= */}
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-field">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@company.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="login-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          <div className="login-extra">
            <label className="remember">
              <input type="checkbox" />
              Remember me
            </label>
            <a href="#" className="reset-link">
              Forgot password?
            </a>
          </div>

          <button type="submit" className="login-button">
            Log In
          </button>
        </form>

        {/* ================= DIVIDER ================= */}
        <div className="login-divider">or</div>

        {/* ================= GOOGLE LOGIN ================= */}
        <button
          type="button"
          className="google-button"
          onClick={handleGoogleLogin}
        >
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="Google"
          />
          Continue with Google
        </button>

        {/* ================= FOOTER ================= */}
        <p className="login-footer">
          Don’t have an account? <Link to="/signup">Create one</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
