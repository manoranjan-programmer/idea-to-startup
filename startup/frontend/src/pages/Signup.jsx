import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./Login.css";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [emailExists, setEmailExists] = useState(false);

  const BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // This function checks email existence in real-time
  const checkEmailExists = async (value) => {
    if (!value) return setEmailExists(false);

    try {
      const res = await fetch(`${BASE_URL}/auth/check-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value }),
      });
      const data = await res.json();
      setEmailExists(data.exists);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    checkEmailExists(e.target.value);
  };

  // ✅ Add your updated handleSubmit here
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (emailExists) {
      alert("Email already exists! Please login or use another email.");
      return;
    }

    const name = e.target.name.value;
    const password = e.target.password.value;
    const confirmPassword = e.target["confirm-password"].value;

    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/auth/signup`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (res.status === 201) {
        alert("Signup successful! Please login.");
        window.location.href = "/login"; // redirect after signup
      } else {
        alert(data.message || "Signup failed");
      }
    } catch (err) {
      console.error("Signup error:", err);
      alert("Server error. Please try again later.");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">Create Account</h2>
        <p className="login-subtitle">Sign up to your Idea-to-Startup dashboard</p>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-field">
            <label htmlFor="name">Full Name</label>
            <input id="name" type="text" placeholder="Your full name" required />
          </div>

          <div className="login-field">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="you@company.com"
              autoComplete="email"
              required
              value={email}
              onChange={handleEmailChange}
            />
            {emailExists && (
              <span style={{ color: "red", fontSize: "0.9rem" }}>
                Email already exists
              </span>
            )}
          </div>

          <div className="login-field">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" placeholder="••••••••" required />
          </div>

          <div className="login-field">
            <label htmlFor="confirm-password">Confirm Password</label>
            <input id="confirm-password" type="password" placeholder="••••••••" required />
          </div>

          <button type="submit" className="login-button">
            Sign Up
          </button>
        </form>

        <div className="login-divider">or</div>

        <button
          type="button"
          className="google-button"
          onClick={() => {
            window.location.href = `${BASE_URL}/auth/google`;
          }}
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
          Signup with Google
        </button>

        <p className="login-footer">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
