// server.js
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("./config/passport");
require("dotenv").config();

const app = express();
const cors = require("cors");

/* ===================== ROUTES ===================== */
const feasibilityRoutes = require("./routes/feasibility");
const uploadRoutes = require("./routes/uploadRoutes");
const authRoutes = require("./routes/auth");

/* ===================== TRUST PROXY ===================== */
app.set("trust proxy", 1);

/* ===================== BODY PARSERS ===================== */
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true }));

/* ===================== CORS CONFIG (PRODUCTION SAFE) ===================== */
const allowedOrigins = [
  process.env.GOOGLE_CLIENT_URL, // Render frontend
  "http://localhost:5173",       // local dev
];

app.use(
  cors({
    origin: (origin, callback) => {
      // allow server-to-server / Postman requests (no origin)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) return callback(null, true);

      // reject unknown origins safely
      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

/* ===================== SESSION ===================== */
app.use(
  session({
    name: "startup.sid",
    secret: process.env.SESSION_SECRET || "default_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

/* ===================== PASSPORT ===================== */
app.use(passport.initialize());
app.use(passport.session());

/* ===================== ROUTES ===================== */
app.use("/auth", authRoutes);
app.use("/api/feasibility", feasibilityRoutes);
app.use("/api/upload", uploadRoutes);

/* ===================== HEALTH CHECK ===================== */
app.get("/", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "🚀 Backend is running successfully",
    services: {
      feasibility: true,
      upload: true,
      auth: true,
      database: mongoose.connection.readyState === 1,
    },
  });
});

/* ===================== 404 HANDLER ===================== */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
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
mongoose.set("strictQuery", true);
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
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log("🔑 Gemini Key Loaded:", !!process.env.GEMINI_API_KEY);
});
