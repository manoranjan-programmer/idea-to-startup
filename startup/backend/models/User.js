const mongoose = require("mongoose");
const crypto = require("crypto");

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
    },
    provider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    /* ================= EMAIL OTP ================= */
    otp: {
      type: String,
      default: null,
    },
    otpExpiry: {
      type: Date,
      default: null,
    },
    /* ================= RESET PASSWORD ================= */
    resetPasswordToken: {
      type: String,
      default: null,
    },
    resetPasswordExpiry: { // Checked: Your controller must use this exact name
      type: Date,
      default: null,
    },
    avatar: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

/**
 * Method to generate and hash password token
 * This ensures the logic for creating the token is tied to the model
 */
UserSchema.methods.getResetPasswordToken = function () {
  // Create raw token
  const resetToken = crypto.randomBytes(20).toString("hex");

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Set expiry (e.g., 10 minutes)
  this.resetPasswordExpiry = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

module.exports = mongoose.model("User", UserSchema);