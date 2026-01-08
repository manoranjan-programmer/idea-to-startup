const crypto = require("crypto");
const nodemailer = require("nodemailer");
const User = require("../models/User");

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    // Security: do NOT reveal if email exists
    if (!user) {
      return res.status(200).json({
        message: "If the email exists, reset link has been sent",
      });
    }

    // Generate reset token (plain) and hash for DB
    const token = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Save hashed token + expiry in DB
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 min
    await user.save();

    // Reset link (frontend URL) with token in URL param
    const resetLink = `${process.env.GOOGLE_CLIENT_URL}/reset-password/${token}`;

    // Setup email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      to: user.email,
      subject: "Reset Your Password",
      html: `
        <p>You requested a password reset</p>
        <p><a href="${resetLink}">Click here to reset your password</a></p>
        <p>This link expires in 15 minutes</p>
      `,
    });

    res.status(200).json({
      message: "Reset password link sent to email",
    });
  } catch (err) {
    console.error("Forgot Password Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
