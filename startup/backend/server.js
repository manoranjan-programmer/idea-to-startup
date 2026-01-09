const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("./config/passport");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();

/* ===================== TRUST PROXY ===================== */
// REQUIRED for Render / HTTPS cookies
app.set("trust proxy", 1);

/* ===================== BODY PARSERS ===================== */
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

/* ===================== CORS CONFIG ===================== */
/**
 * IMPORTANT:
 * - Netlify frontend sends cookies
 * - Render backend uses HTTPS
 * - sameSite = none requires secure = true
 */
const allowedOrigins = [
  process.env.GOOGLE_CLIENT_URL, // Netlify URL
  "http://localhost:5173",
  "http://localhost:3000",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Handle preflight properly
app.options(/.*/, cors());

/* ===================== SESSION CONFIG ===================== */
app.use(
  session({
    name: "startup.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    proxy: true,
    cookie: {
      secure: process.env.NODE_ENV === "production", // MUST be true on Render
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  })
);

/* ===================== PASSPORT ===================== */
app.use(passport.initialize());
app.use(passport.session());

/* ===================== STATIC FILES ===================== */
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ===================== ROUTES ===================== */
app.use("/auth", require("./routes/auth"));
app.use("/api/feasibility", require("./routes/feasibility"));
app.use("/api/upload", require("./routes/uploadRoutes"));

/* ===================== HEALTH CHECK ===================== */
app.get("/", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "🚀 Backend running",
    loggedIn: !!req.user,
    environment: process.env.NODE_ENV || "development",
  });
});

/* ===================== GLOBAL ERROR HANDLER ===================== */
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.stack || err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

/* ===================== MONGODB CONNECTION ===================== */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err.message);
    process.exit(1);
  });

/* ===================== START SERVER ===================== */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
