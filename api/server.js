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

const {
  TAX_MODEL,
  REFUND_APPROVAL_MODEL,
  INVOICE_PREFIX,
  CHALAN_PREFIX,
  assertNonEmpty,
  assertPositiveInt,
  assertNonNegative,
  monthStamp
} = require("./inventory-rules");
const PORT = process.env.PORT || 3000;
const IS_PROD = process.env.NODE_ENV === "production";
const JWT_SECRET = process.env.JWT_SECRET || "change_me";
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
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
  "http://127.0.0.1:4173,http://localhost:4173,https://admin.vortexnodes.xyz,https://api.vortexnodes.xyz,https://api.topseal.shop,https://admin.topseal.shop"
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

async function nextDocumentNo(client, type) {
  const prefix = type === "CHALAN" ? CHALAN_PREFIX : INVOICE_PREFIX;
  const ym = monthStamp();
  const key = `${type}-${ym}`;
  const result = await client.query(
    `INSERT INTO inventory_counters(counter_key, current_value)
     VALUES($1, 1)
     ON CONFLICT(counter_key) DO UPDATE SET current_value = inventory_counters.current_value + 1
     RETURNING current_value`,
    [key]
  );
  const seq = String(result.rows[0].current_value).padStart(4, "0");
  return `${prefix}-${ym}-${seq}`;
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

  await pool.query(`
    CREATE TABLE IF NOT EXISTS inventory_categories (
      id BIGSERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS inventory_items (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      sku TEXT UNIQUE,
      category_id BIGINT REFERENCES inventory_categories(id) ON DELETE SET NULL,
      regular_price NUMERIC(12,2) NOT NULL DEFAULT 0,
      minimum_price NUMERIC(12,2) NOT NULL DEFAULT 0,
      description TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS inventory_godowns (
      id BIGSERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS inventory_customers (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT DEFAULT '',
      note TEXT DEFAULT '',
      last_purchase_at DATE,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS inventory_stock_movements (
      id BIGSERIAL PRIMARY KEY,
      type TEXT NOT NULL CHECK (type IN ('IN','OUT')),
      item_id BIGINT NOT NULL REFERENCES inventory_items(id),
      godown_id BIGINT NOT NULL REFERENCES inventory_godowns(id),
      qty INTEGER NOT NULL CHECK (qty > 0),
      note TEXT DEFAULT '',
      ref_type TEXT DEFAULT 'manual',
      ref_id TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS inventory_counters (
      counter_key TEXT PRIMARY KEY,
      current_value INTEGER NOT NULL DEFAULT 0,
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS inventory_invoices (
      id BIGSERIAL PRIMARY KEY,
      invoice_no TEXT UNIQUE NOT NULL,
      chalan_no TEXT UNIQUE NOT NULL,
      customer_id BIGINT REFERENCES inventory_customers(id),
      godown_id BIGINT REFERENCES inventory_godowns(id),
      payment_method TEXT NOT NULL DEFAULT 'Cash',
      status TEXT NOT NULL DEFAULT 'Created',
      tax_percent NUMERIC(6,2) NOT NULL DEFAULT 0,
      tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
      subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
      grand_total NUMERIC(12,2) NOT NULL DEFAULT 0,
      reversed_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS inventory_invoice_lines (
      id BIGSERIAL PRIMARY KEY,
      invoice_id BIGINT NOT NULL REFERENCES inventory_invoices(id) ON DELETE CASCADE,
      item_id BIGINT NOT NULL REFERENCES inventory_items(id),
      qty INTEGER NOT NULL CHECK (qty > 0),
      refunded_qty INTEGER NOT NULL DEFAULT 0,
      rate NUMERIC(12,2) NOT NULL,
      line_total NUMERIC(12,2) NOT NULL,
      description TEXT DEFAULT ''
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS inventory_refunds (
      id BIGSERIAL PRIMARY KEY,
      invoice_id BIGINT NOT NULL REFERENCES inventory_invoices(id) ON DELETE CASCADE,
      line_id BIGINT NOT NULL REFERENCES inventory_invoice_lines(id) ON DELETE CASCADE,
      qty INTEGER NOT NULL CHECK (qty > 0),
      amount NUMERIC(12,2) NOT NULL,
      approval_status TEXT NOT NULL DEFAULT 'approved',
      approved_by TEXT NOT NULL DEFAULT 'system',
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  const existingAdmin = await pool.query("SELECT id FROM admins WHERE username = $1", [ADMIN_USERNAME]);
  if (!existingAdmin.rowCount) {
    const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await pool.query("INSERT INTO admins(username, password_hash) VALUES($1, $2)", [ADMIN_USERNAME, hash]);
  }

  const existingState = await pool.query("SELECT id FROM app_state WHERE id = 1");
  if (!existingState.rowCount) {
    await pool.query("INSERT INTO app_state(id, data) VALUES(1, $1::jsonb)", [JSON.stringify({})]);
  }

  const defaultGodown = await pool.query("SELECT id FROM inventory_godowns LIMIT 1");
  if (!defaultGodown.rowCount) {
    await pool.query("INSERT INTO inventory_godowns(name) VALUES($1)", ["Main Godown"]);
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

async function stockBalance(client, itemId, godownId) {
  const result = await client.query(
    `SELECT COALESCE(SUM(CASE WHEN type = 'IN' THEN qty ELSE -qty END), 0) AS balance
     FROM inventory_stock_movements
     WHERE item_id = $1 AND godown_id = $2`,
    [itemId, godownId]
  );
  return Number(result.rows[0].balance || 0);
}

app.get("/health", async (_req, res) => {
  await pool.query("SELECT 1");
  res.json({ ok: true, taxModel: TAX_MODEL, refundApprovalModel: REFUND_APPROVAL_MODEL });
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
  res.json(result.rows[0]?.data || {});
});

app.put("/state", authMiddleware, async (req, res) => {
  const data = req.body;
  await pool.query("UPDATE app_state SET data = $1::jsonb, updated_at = NOW() WHERE id = 1", [JSON.stringify(data)]);
  res.json({ ok: true });
});

// Inventory categories
app.get("/api/inventory/categories", authMiddleware, async (_req, res) => {
  const result = await pool.query("SELECT * FROM inventory_categories ORDER BY name ASC");
  res.json({ items: result.rows });
});

app.post("/api/inventory/categories", authMiddleware, async (req, res) => {
  const { name } = req.body || {};
  assertNonEmpty(name, "Category name");
  const result = await pool.query("INSERT INTO inventory_categories(name) VALUES($1) RETURNING *", [String(name).trim()]);
  res.status(201).json(result.rows[0]);
});

app.put("/api/inventory/categories/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { name } = req.body || {};
  assertNonEmpty(name, "Category name");
  const result = await pool.query("UPDATE inventory_categories SET name = $1 WHERE id = $2 RETURNING *", [String(name).trim(), id]);
  if (!result.rowCount) return res.status(404).json({ error: "Category not found" });
  res.json(result.rows[0]);
});

app.delete("/api/inventory/categories/:id", authMiddleware, async (req, res) => {
  const result = await pool.query("DELETE FROM inventory_categories WHERE id = $1", [req.params.id]);
  if (!result.rowCount) return res.status(404).json({ error: "Category not found" });
  res.json({ ok: true });
});

// Items
app.get("/api/inventory/items", authMiddleware, async (_req, res) => {
  const result = await pool.query(`
    SELECT i.*, c.name AS category_name
    FROM inventory_items i
    LEFT JOIN inventory_categories c ON c.id = i.category_id
    ORDER BY i.created_at DESC`);
  res.json({ items: result.rows });
});

app.post("/api/inventory/items", authMiddleware, async (req, res) => {
  const { name, sku, categoryId, regularPrice = 0, minimumPrice = 0, description = "" } = req.body || {};
  assertNonEmpty(name, "Item name");
  const regPrice = assertNonNegative(regularPrice, "regularPrice");
  const minPrice = assertNonNegative(minimumPrice, "minimumPrice");
  if (minPrice > regPrice) {
    return res.status(400).json({ error: "minimumPrice cannot exceed regularPrice" });
  }

  const result = await pool.query(
    `INSERT INTO inventory_items(name, sku, category_id, regular_price, minimum_price, description)
     VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,
    [String(name).trim(), sku || null, categoryId || null, regPrice, minPrice, description || ""]
  );
  res.status(201).json(result.rows[0]);
});

app.put("/api/inventory/items/:id", authMiddleware, async (req, res) => {
  const { name, sku, categoryId, regularPrice = 0, minimumPrice = 0, description = "" } = req.body || {};
  assertNonEmpty(name, "Item name");
  const regPrice = assertNonNegative(regularPrice, "regularPrice");
  const minPrice = assertNonNegative(minimumPrice, "minimumPrice");
  if (minPrice > regPrice) return res.status(400).json({ error: "minimumPrice cannot exceed regularPrice" });

  const result = await pool.query(
    `UPDATE inventory_items
     SET name=$1, sku=$2, category_id=$3, regular_price=$4, minimum_price=$5, description=$6
     WHERE id=$7 RETURNING *`,
    [String(name).trim(), sku || null, categoryId || null, regPrice, minPrice, description || "", req.params.id]
  );
  if (!result.rowCount) return res.status(404).json({ error: "Item not found" });
  res.json(result.rows[0]);
});

app.delete("/api/inventory/items/:id", authMiddleware, async (req, res) => {
  const result = await pool.query("DELETE FROM inventory_items WHERE id = $1", [req.params.id]);
  if (!result.rowCount) return res.status(404).json({ error: "Item not found" });
  res.json({ ok: true });
});

// Customers
app.get("/api/customers", authMiddleware, async (_req, res) => {
  const result = await pool.query("SELECT * FROM inventory_customers ORDER BY created_at DESC");
  res.json({ items: result.rows });
});

app.post("/api/customers", authMiddleware, async (req, res) => {
  const { name, phone, address = "", note = "", lastPurchaseAt = null } = req.body || {};
  assertNonEmpty(name, "Customer name");
  assertNonEmpty(phone, "Customer phone");
  const result = await pool.query(
    `INSERT INTO inventory_customers(name, phone, address, note, last_purchase_at)
     VALUES($1,$2,$3,$4,$5) RETURNING *`,
    [String(name).trim(), String(phone).trim(), address || "", note || "", lastPurchaseAt || null]
  );
  res.status(201).json(result.rows[0]);
});

app.put("/api/customers/:id", authMiddleware, async (req, res) => {
  const { name, phone, address = "", note = "", lastPurchaseAt = null } = req.body || {};
  assertNonEmpty(name, "Customer name");
  assertNonEmpty(phone, "Customer phone");
  const result = await pool.query(
    `UPDATE inventory_customers
     SET name=$1, phone=$2, address=$3, note=$4, last_purchase_at=$5
     WHERE id=$6 RETURNING *`,
    [String(name).trim(), String(phone).trim(), address || "", note || "", lastPurchaseAt || null, req.params.id]
  );
  if (!result.rowCount) return res.status(404).json({ error: "Customer not found" });
  res.json(result.rows[0]);
});

app.delete("/api/customers/:id", authMiddleware, async (req, res) => {
  const result = await pool.query("DELETE FROM inventory_customers WHERE id = $1", [req.params.id]);
  if (!result.rowCount) return res.status(404).json({ error: "Customer not found" });
  res.json({ ok: true });
});

// Godowns
app.get("/api/inventory/godowns", authMiddleware, async (_req, res) => {
  const result = await pool.query("SELECT * FROM inventory_godowns ORDER BY created_at ASC");
  res.json({ items: result.rows });
});

app.post("/api/inventory/godowns", authMiddleware, async (req, res) => {
  const { name } = req.body || {};
  assertNonEmpty(name, "Godown name");
  const result = await pool.query("INSERT INTO inventory_godowns(name) VALUES($1) RETURNING *", [String(name).trim()]);
  res.status(201).json(result.rows[0]);
});

// Stock movements + balances
app.get("/api/inventory/stock/movements", authMiddleware, async (_req, res) => {
  const result = await pool.query(`
    SELECT m.*, i.name AS item_name, g.name AS godown_name
    FROM inventory_stock_movements m
    JOIN inventory_items i ON i.id = m.item_id
    JOIN inventory_godowns g ON g.id = m.godown_id
    ORDER BY m.created_at DESC
    LIMIT 500
  `);
  res.json({ items: result.rows });
});

app.get("/api/inventory/stock/balances", authMiddleware, async (_req, res) => {
  const result = await pool.query(`
    SELECT item_id, godown_id,
      SUM(CASE WHEN type='IN' THEN qty ELSE -qty END)::INTEGER AS balance
    FROM inventory_stock_movements
    GROUP BY item_id, godown_id
    ORDER BY item_id, godown_id
  `);
  res.json({ items: result.rows });
});

app.post("/api/inventory/stock/movements", authMiddleware, async (req, res) => {
  const { type, itemId, godownId, qty, note = "", refType = "manual", refId = "" } = req.body || {};
  if (!["IN", "OUT"].includes(type)) return res.status(400).json({ error: "type must be IN or OUT" });
  const quantity = assertPositiveInt(qty, "qty");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    if (type === "OUT") {
      const current = await stockBalance(client, itemId, godownId);
      if (current < quantity) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "Insufficient stock" });
      }
    }

    const result = await client.query(
      `INSERT INTO inventory_stock_movements(type,item_id,godown_id,qty,note,ref_type,ref_id)
       VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [type, itemId, godownId, quantity, note || "", refType || "manual", refId || ""]
    );

    await client.query("COMMIT");
    res.status(201).json(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
});

// Sales + invoice flow
app.post("/api/sales", authMiddleware, async (req, res) => {
  const { customerId = null, godownId, paymentMethod = "Cash", lines = [], taxPercent = 0 } = req.body || {};
  const taxPct = assertNonNegative(taxPercent, "taxPercent");
  if (!Array.isArray(lines) || !lines.length) return res.status(400).json({ error: "At least one line is required" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const resolvedGodownId = godownId || (await client.query("SELECT id FROM inventory_godowns ORDER BY id ASC LIMIT 1")).rows[0]?.id;
    if (!resolvedGodownId) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "No godown configured" });
    }

    let subtotal = 0;
    const normalized = [];
    for (const raw of lines) {
      const itemId = raw.itemId;
      const qty = assertPositiveInt(raw.qty, "line qty");
      const rate = assertNonNegative(raw.rate, "line rate");

      const itemResult = await client.query("SELECT * FROM inventory_items WHERE id = $1", [itemId]);
      if (!itemResult.rowCount) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: `Item ${itemId} not found` });
      }
      const item = itemResult.rows[0];
      if (Number(item.minimum_price) > rate) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: `${item.name} rate cannot be below minimum price` });
      }
      const available = await stockBalance(client, itemId, resolvedGodownId);
      if (available < qty) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: `Insufficient stock for ${item.name}` });
      }
      const lineTotal = Number((qty * rate).toFixed(2));
      subtotal += lineTotal;
      normalized.push({ itemId, qty, rate, lineTotal, description: raw.description || item.description || "" });
    }

    const taxAmount = Number(((subtotal * taxPct) / 100).toFixed(2));
    const grandTotal = Number((subtotal + taxAmount).toFixed(2));
    const invoiceNo = await nextDocumentNo(client, "INVOICE");
    const chalanNo = await nextDocumentNo(client, "CHALAN");

    const invoiceResult = await client.query(
      `INSERT INTO inventory_invoices(invoice_no, chalan_no, customer_id, godown_id, payment_method, status, tax_percent, tax_amount, subtotal, grand_total)
       VALUES($1,$2,$3,$4,$5,'Created',$6,$7,$8,$9) RETURNING *`,
      [invoiceNo, chalanNo, customerId, resolvedGodownId, paymentMethod, taxPct, taxAmount, subtotal, grandTotal]
    );
    const invoice = invoiceResult.rows[0];

    for (const line of normalized) {
      await client.query(
        `INSERT INTO inventory_invoice_lines(invoice_id, item_id, qty, rate, line_total, description)
         VALUES($1,$2,$3,$4,$5,$6)`,
        [invoice.id, line.itemId, line.qty, line.rate, line.lineTotal, line.description]
      );
      await client.query(
        `INSERT INTO inventory_stock_movements(type,item_id,godown_id,qty,note,ref_type,ref_id)
         VALUES('OUT',$1,$2,$3,$4,'invoice',$5)`,
        [line.itemId, resolvedGodownId, line.qty, `Sold via ${invoiceNo}`, invoiceNo]
      );
    }

    if (customerId) {
      await client.query("UPDATE inventory_customers SET last_purchase_at = CURRENT_DATE WHERE id = $1", [customerId]);
    }

    await client.query("COMMIT");
    res.status(201).json({ ...invoice, lines: normalized, numbering: { invoiceNo, chalanNo }, taxModel: TAX_MODEL });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
});

app.get("/api/invoices", authMiddleware, async (_req, res) => {
  const result = await pool.query("SELECT * FROM inventory_invoices ORDER BY created_at DESC");
  res.json({ items: result.rows, numberingFormat: `${INVOICE_PREFIX}-YYYYMM-####`, chalanFormat: `${CHALAN_PREFIX}-YYYYMM-####` });
});

app.get("/api/invoices/:id", authMiddleware, async (req, res) => {
  const invoiceResult = await pool.query("SELECT * FROM inventory_invoices WHERE id = $1", [req.params.id]);
  if (!invoiceResult.rowCount) return res.status(404).json({ error: "Invoice not found" });
  const lineResult = await pool.query("SELECT * FROM inventory_invoice_lines WHERE invoice_id = $1 ORDER BY id ASC", [req.params.id]);
  const refundResult = await pool.query("SELECT * FROM inventory_refunds WHERE invoice_id = $1 ORDER BY created_at DESC", [req.params.id]);
  res.json({ ...invoiceResult.rows[0], lines: lineResult.rows, refunds: refundResult.rows });
});

app.post("/api/invoices/:id/reverse", authMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const invResult = await client.query("SELECT * FROM inventory_invoices WHERE id = $1 FOR UPDATE", [req.params.id]);
    if (!invResult.rowCount) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Invoice not found" });
    }
    const inv = invResult.rows[0];
    if (inv.status === "Reversed") {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Invoice already reversed" });
    }

    const lineResult = await client.query("SELECT * FROM inventory_invoice_lines WHERE invoice_id = $1", [req.params.id]);
    const hasRefund = lineResult.rows.some((line) => Number(line.refunded_qty || 0) > 0);
    if (hasRefund) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Cannot reverse invoice with refunds" });
    }

    for (const line of lineResult.rows) {
      await client.query(
        `INSERT INTO inventory_stock_movements(type,item_id,godown_id,qty,note,ref_type,ref_id)
         VALUES('IN',$1,$2,$3,$4,'reverse',$5)`,
        [line.item_id, inv.godown_id, line.qty, `Reverse ${inv.invoice_no}`, inv.invoice_no]
      );
    }

    await client.query("UPDATE inventory_invoices SET status = 'Reversed', reversed_at = NOW() WHERE id = $1", [req.params.id]);
    await client.query("COMMIT");
    res.json({ ok: true, status: "Reversed" });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
});

app.post("/api/invoices/:id/refunds", authMiddleware, async (req, res) => {
  const { lineId, qty, amount } = req.body || {};
  const refundQty = assertPositiveInt(qty, "qty");
  const refundAmount = assertNonNegative(amount, "amount");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const invResult = await client.query("SELECT * FROM inventory_invoices WHERE id = $1 FOR UPDATE", [req.params.id]);
    if (!invResult.rowCount) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Invoice not found" });
    }
    const inv = invResult.rows[0];
    if (inv.status === "Reversed") {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Cannot refund reversed invoice" });
    }

    const lineResult = await client.query("SELECT * FROM inventory_invoice_lines WHERE id = $1 AND invoice_id = $2 FOR UPDATE", [lineId, req.params.id]);
    if (!lineResult.rowCount) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Invoice line not found" });
    }

    const line = lineResult.rows[0];
    const remaining = Number(line.qty) - Number(line.refunded_qty || 0);
    if (refundQty > remaining) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Refund qty exceeds remaining qty" });
    }

    await client.query("UPDATE inventory_invoice_lines SET refunded_qty = refunded_qty + $1 WHERE id = $2", [refundQty, line.id]);
    const refundResult = await client.query(
      `INSERT INTO inventory_refunds(invoice_id, line_id, qty, amount, approval_status, approved_by)
       VALUES($1,$2,$3,$4,'approved',$5) RETURNING *`,
      [req.params.id, line.id, refundQty, refundAmount, req.user.username || "admin"]
    );

    await client.query(
      `INSERT INTO inventory_stock_movements(type,item_id,godown_id,qty,note,ref_type,ref_id)
       VALUES('IN',$1,$2,$3,$4,'refund',$5)`,
      [line.item_id, inv.godown_id, refundQty, `Refund ${inv.invoice_no}`, inv.invoice_no]
    );

    const checkLines = await client.query("SELECT qty, refunded_qty FROM inventory_invoice_lines WHERE invoice_id = $1", [req.params.id]);
    const fullyRefunded = checkLines.rows.every((r) => Number(r.refunded_qty) >= Number(r.qty));
    await client.query("UPDATE inventory_invoices SET status = $2 WHERE id = $1", [req.params.id, fullyRefunded ? "Refunded" : "Partially Refunded"]);

    await client.query("COMMIT");
    res.status(201).json({ ...refundResult.rows[0], approvalModel: REFUND_APPROVAL_MODEL });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
});

app.get("/api/refunds", authMiddleware, async (_req, res) => {
  const result = await pool.query("SELECT * FROM inventory_refunds ORDER BY created_at DESC LIMIT 500");
  res.json({ items: result.rows, approvalModel: REFUND_APPROVAL_MODEL });
});

app.get("/api/inventory/config", authMiddleware, (_req, res) => {
  res.json({
    numbering: {
      invoiceFormat: `${INVOICE_PREFIX}-YYYYMM-####`,
      chalanFormat: `${CHALAN_PREFIX}-YYYYMM-####`
    },
    taxModel: TAX_MODEL,
    refundApproval: REFUND_APPROVAL_MODEL,
    godownFallback: "First created godown is used when sale godown is not selected"
  });
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
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

if (process.env.NODE_ENV !== "test") {
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
}

module.exports = { app, initDb };
