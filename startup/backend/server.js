// server.js
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("./config/passport");
const cors = require("cors");
require("dotenv").config();

const app = express();

/* ===================== TRUST PROXY ===================== */
app.set("trust proxy", 1);

/* ===================== BODY PARSERS ===================== */
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true }));

/* ===================== CORS CONFIG ===================== */
const allowedOrigins = [
  process.env.GOOGLE_CLIENT_URL, // frontend Render URL
  "http://localhost:5173",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

/* ===================== SESSION (🔥 CRITICAL FIX) ===================== */
app.use(
  session({
    name: "startup.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true,          // REQUIRED on Render
      httpOnly: true,
      sameSite: "none",      // 🔥 REQUIRED for Google OAuth
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

/* ===================== PASSPORT ===================== */
app.use(passport.initialize());
app.use(passport.session());

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
  });
});

/* ===================== ERROR HANDLER ===================== */
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.message);
  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

/* ===================== DB ===================== */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => {
    console.error("❌ MongoDB Error:", err.message);
    process.exit(1);
  });

/* ===================== START ===================== */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: production`);
});
