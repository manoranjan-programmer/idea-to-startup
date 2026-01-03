const express = require("express");
const bcrypt = require("bcryptjs");
const passport = require("passport");
const router = express.Router();
const User = require("../models/User");

const frontend_url = process.env.GOOGLE_CLIENT_URL;

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
      isVerified: false, // must verify email
    });

    // 🔔 Later you can add nodemailer here
    return res.status(201).json({
      message: "Signup successful. Please verify your email before login.",
    });
  } catch (err) {
    // FINAL DUPLICATE SAFETY
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

    // If Google-only account
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
=========================== */
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

/* ===========================
   GOOGLE OAUTH CALLBACK
=========================== */
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${frontend_url}/login`,
    session: true,
  }),
  async (req, res) => {
    try {
      // Google users are always verified
      if (!req.user.isVerified) {
        req.user.isVerified = true;
        await req.user.save();
      }

      // First-time Google signup → login page
      if (req.user.isNewSignup) {
        delete req.user.isNewSignup;
        return res.redirect(`${frontend_url}/login`);
      }

      // Existing user → dashboard
      return res.redirect(`${frontend_url}`);
    } catch (err) {
      console.error("Google callback error:", err);
      return res.redirect(`${frontend_url}/login`);
    }
  }
);

module.exports = router;
