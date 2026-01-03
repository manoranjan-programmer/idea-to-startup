const express = require("express");
const bcrypt = require("bcryptjs");
const passport = require("passport");
const router = express.Router();
const User = require("../models/User");

const FRONTEND_URL = process.env.GOOGLE_CLIENT_URL;

/* ===========================
   EMAIL / PASSWORD SIGNUP
=========================== */
router.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        message: "Email already exists. Please login.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await User.create({
      name,
      email,
      password: hashedPassword,
      provider: "local",
      isVerified: false,
    });

    return res.status(201).json({
      message: "Signup successful. Please verify your email before login.",
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        message: "Email already exists. Please login.",
      });
    }

    console.error("Signup error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/* ===========================
   CHECK IF EMAIL EXISTS
=========================== */
router.post("/check-email", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const user = await User.findOne({ email });
    return res.status(200).json({ exists: !!user });
  } catch (err) {
    console.error("Check email error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/* ===========================
   EMAIL / PASSWORD LOGIN
=========================== */
router.post("/login", async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    if (!user.password) {
      return res.status(400).json({
        message: "Please login using Google",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect password" });
    }

    req.login(user, (err) => {
      if (err) return next(err);
      return res.status(200).json({
        message: "Login successful",
        user,
      });
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/* ===========================
   GOOGLE OAUTH START
   ✅ SAVE REDIRECT PATH
=========================== */
router.get(
  "/google",
  (req, res, next) => {
    // Save redirect path (default → /select-idea)
    req.session.redirectTo = req.query.redirect || "/select-idea";
    next();
  },
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

/* ===========================
   GOOGLE OAUTH CALLBACK
   ✅ REDIRECT BACK CORRECTLY
=========================== */
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${FRONTEND_URL}/login`,
    session: true,
  }),
  async (req, res) => {
    try {
      // Google users are always verified
      if (!req.user.isVerified) {
        req.user.isVerified = true;
        await req.user.save();
      }

      // Get saved redirect or fallback
      const redirectPath = req.session.redirectTo || "/select-idea";

      // Clear session value
      req.session.redirectTo = null;

      // ✅ Redirect to correct frontend page
      return res.redirect(`${FRONTEND_URL}${redirectPath}`);
    } catch (err) {
      console.error("Google callback error:", err);
      return res.redirect(`${FRONTEND_URL}/login`);
    }
  }
);

module.exports = router;
