const express = require("express");
const bcrypt = require("bcryptjs");
const passport = require("passport");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const User = require("../models/User");
const transporter = require("../config/emailConfig");
const generateOtp = require("../utils/generateOtp");

const router = express.Router();

/* ===========================
   AUTH MIDDLEWARE
=========================== */
const isAuthenticated = (req, res, next) => {
  if (req.user) return next();
  return res.status(401).json({ message: "Not authenticated" });
};

/* ===========================
   MULTER CONFIG (AVATARS)
=========================== */
const uploadDir = path.join(__dirname, "..", "uploads", "avatars");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    cb(
      null,
      `avatar_${req.user._id}_${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/.test(file.mimetype);
    cb(allowed ? null : new Error("Only images allowed"), allowed);
  },
});

/* ===========================
   HELPER
=========================== */
const getAvatarUrl = (avatarPath) => {
  if (!avatarPath) return null;
  return `${process.env.GOOGLE_CALLBACK_URL}${avatarPath}`;
};

/* ===========================
   SIGNUP
=========================== */
router.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ message: "All fields are required" });

  const strongPassword =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

  if (!strongPassword.test(password)) {
    return res.status(400).json({
      message:
        "Password must be 8+ chars, include uppercase, lowercase, number & special char",
    });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(409).json({ message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 12);
    const otp = generateOtp();
    const hashedOtp = await bcrypt.hash(otp.toString(), 10);

    await User.create({
      name,
      email,
      password: hashedPassword,
      provider: "local",
      isVerified: false,
      otp: hashedOtp,
      otpExpiry: Date.now() + 5 * 60 * 1000, // 5 mins
    });

    await transporter.sendMail({
      from: `"Idea to Startup" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verify your email",
      html: `
        <h2>Email Verification</h2>
        <p>Your OTP is:</p>
        <h3>${otp}</h3>
        <p>This OTP is valid for 5 minutes.</p>
      `,
    });

    res.status(201).json({ message: "OTP sent successfully" });
  } catch (err) {
    console.error("Signup / OTP Error:", err);
    res.status(500).json({ message: "Failed to send OTP" });
  }
});

/* ===========================
   VERIFY OTP (BUG FIXED)
=========================== */
router.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.otp || !user.otpExpiry)
      return res.status(400).json({ message: "OTP not found" });

    if (user.otpExpiry < Date.now())
      return res.status(400).json({ message: "OTP expired" });

    const valid = await bcrypt.compare(otp.toString(), user.otp);
    if (!valid) return res.status(400).json({ message: "Invalid OTP" });

    user.isVerified = true;
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    res.json({ message: "Email verified successfully" });
  } catch (err) {
    console.error("Verify OTP Error:", err);
    res.status(500).json({ message: "OTP verification failed" });
  }
});

/* ===========================
   LOGIN
=========================== */
router.post("/login", async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });
    if (!user.isVerified)
      return res.status(400).json({ message: "Verify email first" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Incorrect password" });

    req.login(user, (err) => {
      if (err) return next(err);
      res.json({ message: "Login successful" });
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ===========================
   FORGOT PASSWORD
=========================== */
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email, provider: "local" });
    if (!user) return res.json({ message: "If email exists, reset link sent" });

    const token = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");
    user.resetPasswordExpiry = Date.now() + 15 * 60 * 1000;
    await user.save();

    const resetLink = `${process.env.GOOGLE_CLIENT_URL}/reset-password/${token}`;

    await transporter.sendMail({
      from: `"Idea to Startup" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Reset Password",
      html: `<p>Click to reset password:</p><a href="${resetLink}">${resetLink}</a>`,
    });

    res.json({ message: "Reset link sent" });
  } catch (err) {
    console.error("Forgot Password Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/reset-password/:token", async (req, res) => {
  const { password } = req.body;
  const { token } = req.params;

  try {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    // 🔥 NEW: Check if the new password matches the old password
    const isSamePassword = await bcrypt.compare(password, user.password);
    if (isSamePassword) {
      return res.status(400).json({ 
        message: "New password cannot be the same as your old password. Please enter a different password." 
      });
    }

    const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
    if (!strongPassword.test(password)) {
      return res.status(400).json({
        message: "Password must be 8+ chars, include uppercase, lowercase, number & special char",
      });
    }

    user.password = await bcrypt.hash(password, 12);
    user.resetPasswordToken = null;
    user.resetPasswordExpiry = null;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Reset Password Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ===========================
   GOOGLE AUTH
=========================== */
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  async (req, res) => {
    req.user.isVerified = true;
    await req.user.save();
    res.redirect(`${process.env.GOOGLE_CLIENT_URL}/select-idea`);
  }
);

/* ===========================
   UPDATE PROFILE
=========================== */
router.post("/update-profile", isAuthenticated, upload.single("avatar"), async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (req.body.name?.trim()) user.name = req.body.name.trim();

    if (req.file) {
      if (user.avatar) {
        const oldPath = path.join(__dirname, "..", user.avatar);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      user.avatar = `/uploads/avatars/${req.file.filename}`;
    }

    await user.save();
    res.json({
      message: "Profile updated",
      user: { name: user.name, email: user.email, avatar: getAvatarUrl(user.avatar) },
    });
  } catch (err) {
    console.error("Update Profile Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/remove-avatar", async (req, res) => {
  try {
    // Example: you are using sessions
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    req.user.avatar = ""; // remove avatar
    await req.user.save();
    res.json({ message: "Avatar removed successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to remove avatar" });
  }
});

/* ===========================
   GET CURRENT USER
=========================== */
router.get("/me", isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ name: user.name, email: user.email, avatar: getAvatarUrl(user.avatar) });
  } catch (err) {
    console.error("Get Me Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ===========================
   LOGOUT
=========================== */
router.post("/logout", (req, res) => {
  req.logout(() => {
    req.session.destroy(() => {
      res.clearCookie("startup.sid");
      res.json({ message: "Logged out" });
    });
  });
});

module.exports = router;
