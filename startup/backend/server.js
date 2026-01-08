const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("./config/passport");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();

/* ===================== TRUST PROXY ===================== */
// Needed for secure cookies on Render/Heroku/Railway when using HTTPS
app.set("trust proxy", 1); 

/* ===================== BODY PARSERS ===================== */
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

/* ===================== CORS CONFIG ===================== */
const allowedOrigins = [
  process.env.GOOGLE_CLIENT_URL, // React frontend prod URL
  "http://localhost:5173",       
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true, // Required for sessions/cookies
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

/* ===================== SESSION CONFIG ===================== */
app.use(
  session({
    name: "startup.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production", // true on prod (requires HTTPS)
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
/** * FIXED: Use path.join to create an absolute path to the uploads folder.
 * This ensures images are accessible regardless of the process launch directory.
 */
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ===================== ROUTES ===================== */
/**
 * Note: Since we integrated "update-profile" into auth.js in the previous step,
 * you usually only need the auth router. If they are separate files, 
 * the order below works correctly.
 */
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
  console.log(`🌍 URL: http://localhost:${PORT}`);
});