import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// ================= PAGES =================
import Homepage from "./pages/HomePage";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import VerifyOtp from "./pages/VerifyOtp";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import IdeaSubmission from "./pages/IdeaSubmission";
import Feasibility from "./pages/Feasibility";
import SelectionPage from "./pages/SelectionPage";
import UploadDocument from "./pages/UploadDocument";
import Profile from "./pages/Profile";

const App = () => {
  const [isAuth, setIsAuth] = useState(null); // null = checking, true = logged in, false = logged out
  const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(`${BASE_URL}/auth/me`, { credentials: "include" });
        setIsAuth(res.ok);
      } catch (err) {
        console.error("Auth check failed:", err);
        setIsAuth(false);
      }
    };
    checkAuth();
  }, [BASE_URL]);

  if (isAuth === null) {
    return (
      <div style={{ 
        height: '100vh', 
        background: '#020617', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        color: '#3b82f6',
        fontFamily: 'Poppins, sans-serif',
        fontSize: '1.2rem'
      }}>
        <div className="loader">Initializing Analyzer...</div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* PUBLIC PAGES */}
        <Route path="/" element={<Homepage isAuth={isAuth} />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* USER FLOW PAGES */}
        <Route path="/select-idea" element={<SelectionPage />} />
        <Route path="/idea-text" element={<IdeaSubmission />} />
        <Route path="/idea-document" element={<UploadDocument />} />
        <Route path="/feasibility-result" element={<Feasibility />} />
        <Route path="/profile" element={<Profile />} />

        {/* CATCH-ALL */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
