const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const { v2: cloudinary } = require("cloudinary");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

const PORT = process.env.PORT || 3000;
const IS_PROD = process.env.NODE_ENV === "production";
const JWT_SECRET = process.env.JWT_SECRET || "change_me";
const ADMIN_USERNAME = (process.env.ADMIN_USERNAME || "admin").trim();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "topseal123";
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const allowedOrigins = (
  process.env.ALLOWED_ORIGINS ||
  "http://127.0.0.1:4173,http://localhost:4173,https://admin.vortexnodes.xyz,https://api.vortexnodes.xyz,https://api.topseal.shop,https://admin.topseal.shop,https://topseal-admin.onrender.com,https://topseal-api.onrender.com"
)
  .split(",")
  .map((item) => item.trim());

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS"));
    },
    credentials: true
  })
);
app.use(express.json({ limit: "20mb" }));
app.use(cookieParser());

if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admins (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_state (
      id INTEGER PRIMARY KEY,
      data JSONB NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);

  const existingAdmin = await pool.query("SELECT id, password_hash FROM admins WHERE username = $1", [ADMIN_USERNAME]);
  if (!existingAdmin.rowCount) {
    const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await pool.query("INSERT INTO admins(username, password_hash) VALUES($1, $2)", [ADMIN_USERNAME, hash]);
  } else {
    const matchesConfiguredPassword = await bcrypt.compare(ADMIN_PASSWORD, existingAdmin.rows[0].password_hash);
    if (!matchesConfiguredPassword) {
      const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
      await pool.query("UPDATE admins SET password_hash = $1 WHERE id = $2", [hash, existingAdmin.rows[0].id]);
    }
  }

  const existingState = await pool.query("SELECT id FROM app_state WHERE id = 1");
  if (!existingState.rowCount) {
    await pool.query("INSERT INTO app_state(id, data) VALUES(1, $1::jsonb)", [JSON.stringify({})]);
  }
}

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

function authMiddleware(req, res, next) {
  const token = req.cookies.topseal_token;
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid session" });
  }
}

app.get("/health", async (_req, res) => {
  await pool.query("SELECT 1");
  res.json({ ok: true });
});

app.post("/auth/login", async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: "Username and password are required" });

  const result = await pool.query("SELECT id, username, password_hash FROM admins WHERE username = $1", [username]);
  if (!result.rowCount) return res.status(401).json({ error: "Invalid credentials" });

  const admin = result.rows[0];
  const match = await bcrypt.compare(password, admin.password_hash);
  if (!match) return res.status(401).json({ error: "Invalid credentials" });

  const token = signToken({ sub: admin.id, username: admin.username });
  res.cookie("topseal_token", token, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: IS_PROD ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  res.json({ ok: true, username: admin.username });
});

app.post("/auth/logout", (_req, res) => {
  res.clearCookie("topseal_token", {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: IS_PROD ? "none" : "lax"
  });
  res.json({ ok: true });
});

app.get("/auth/me", authMiddleware, (req, res) => {
  res.json({ ok: true, user: { username: req.user.username } });
});

app.get("/state", async (_req, res) => {
  const result = await pool.query("SELECT data FROM app_state WHERE id = 1");
  res.set("Cache-Control", "no-store");
  res.json(result.rows[0]?.data || {});
});

app.put("/state", authMiddleware, async (req, res) => {
  const data = req.body;
  await pool.query("UPDATE app_state SET data = $1::jsonb, updated_at = NOW() WHERE id = 1", [JSON.stringify(data)]);
  res.json({ ok: true });
});

app.post("/upload", authMiddleware, upload.single("image"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Image file is required" });

  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    return res.status(500).json({ error: "Cloudinary is not configured" });
  }

  const dataUri = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
  const uploaded = await cloudinary.uploader.upload(dataUri, {
    folder: "topseal",
    resource_type: "image"
  });

  res.json({ ok: true, url: uploaded.secure_url });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || "Internal server error" });
});

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`API listening on ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize DB", err);
    process.exit(1);
  });
