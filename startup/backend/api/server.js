const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("../config/passport");
const cors = require("cors");
const path = require("path");
const MongoStore = require("connect-mongo");
require("dotenv").config();

const app = express();

/* ===================== DB CONNECTION (CACHED FOR VERCEL) ===================== */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(process.env.MONGO_URI)
      .then(async (m) => {
        console.log("✅ MongoDB connected");

        try {
          const User = m.model("User");

          // Cleanup null values
          await User.updateMany(
            { supabaseUserId: null },
            { $unset: { supabaseUserId: "" } }
          );

          // Drop old index if exists
          await User.collection.dropIndex("supabaseUserId_1").catch(() => {
            console.log("ℹ️ Index already clean");
          });

          // Sync new partial indexes
          await User.syncIndexes();
          console.log("✅ Indexes synced");
        } catch (err) {
          console.log("⚠️ Index sync skipped:", err.message);
        }

        return m;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

/* ===================== MIDDLEWARE ===================== */
app.set("trust proxy", 1);

app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

/* ===================== CORS ===================== */
const allowedOrigins = [
  process.env.GOOGLE_CLIENT_URL,
  "http://localhost:5173",
  "http://localhost:3000",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

/* ===================== SESSION ===================== */
app.use(async (req, res, next) => {
  await connectDB();

  return session({
    name: "startup.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: "sessions",
      ttl: 14 * 24 * 60 * 60,
    }),
    cookie: {
      httpOnly: true,
      secure: true, // REQUIRED on Vercel
      sameSite: "none",
      maxAge: 1000 * 60 * 60 * 24,
    },
  })(req, res, next);
});

/* ===================== PASSPORT ===================== */
app.use(passport.initialize());
app.use(passport.session());

/* ===================== STATIC FILES ===================== */
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

/* ===================== ROUTES ===================== */
app.use("/auth", require("../routes/auth"));
app.use("/api/feasibility", require("../routes/feasibility"));
app.use("/api/upload", require("../routes/uploadRoutes"));

/* ===================== HEALTH CHECK ===================== */
app.get("/", async (req, res) => {
  await connectDB();

  res.status(200).json({
    status: "OK",
    message: "🚀 Backend running on Vercel",
    loggedIn: !!req.user,
    environment: process.env.NODE_ENV || "development",
  });
});

/* ===================== ERROR HANDLER ===================== */
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.message);
  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

/* ===================== EXPORT (NO app.listen) ===================== */
module.exports = app;
