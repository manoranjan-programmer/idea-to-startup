const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

/**
 * Reset Password Controller
 * Endpoint: POST /api/auth/resetpassword/:token
 */
exports.resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    // 1. Hash the token from the URL to compare with the one in DB
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // 2. Find user with valid token AND ensure it's not expired
    // FIXED: Changed resetPasswordExpire -> resetPasswordExpiry to match your User.js
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpiry: { $gt: Date.now() }, 
    });

    // If no user is found, the token is either wrong or expired
    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    // 3. Password strength validation
    const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
    if (!strongPassword.test(password)) {
      return res.status(400).json({
        message: "Password must be 8+ chars with uppercase, lowercase, number, and special char",
      });
    }

    // 4. Hash the new password and save
    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(password, salt);

    // 5. Clear the reset fields so the token can't be used again
    user.resetPasswordToken = null; // or undefined
    user.resetPasswordExpiry = null; // or undefined

    await user.save();

    res.status(200).json({ 
      success: true, 
      message: "Password reset successful. You can now login." 
    });
  } catch (err) {
    console.error("Reset Password Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};