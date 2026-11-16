require("dotenv").config();

const express = require("express");
const session = require("express-session");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const Database = require("better-sqlite3");
const path = require("path");
const crypto = require("crypto");
const fs = require("fs");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === "production";

const required = ["SESSION_SECRET", "ADMIN_USERNAME", "ADMIN_PASSWORD", "UPI_ID"];
for (const key of required) {
  if (!process.env[key] || process.env[key].startsWith("replace-") ||
      process.env[key].startsWith("ChangeThis")) {
    console.error(`Please configure ${key} in your .env file before starting.`);
    process.exit(1);
  }
}

const dataDir = path.join(__dirname, "data");
fs.mkdirSync(dataDir, { recursive: true });
const db = new Database(path.join(dataDir, "orders.sqlite"));
db.pragma("journal_mode = WAL");
db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_code TEXT NOT NULL UNIQUE,
    customer_name TEXT NOT NULL,
    mobile TEXT NOT NULL,
    address TEXT NOT NULL,
    items_json TEXT NOT NULL,
    total INTEGER NOT NULL,
    payment_method TEXT NOT NULL,
    payment_status TEXT NOT NULL DEFAULT 'pending',
    order_status TEXT NOT NULL DEFAULT 'new',
    created_at TEXT NOT NULL
  );
`);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://cdnjs.cloudflare.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https://images.unsplash.com"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: isProduction ? [] : null
    }
  }
}));
app.use(express.json({ limit: "30kb" }));
app.use(session({
  name: "shree_owner_session",
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    maxAge: 8 * 60 * 60 * 1000
  }
}));

const orderLimiter = rateLimit({ windowMs: 15 *  60 * 1000, limit: 30 });
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 8 });

function requireOwner(req, res, next) {
  if (req.session && req.session.owner === true) return next();
  return res.status(401).json({ error: "Owner login required." });
}
function safeEqual(a, b) {
  const aa = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
}
function cleanText(value, max) {
  return String(value ?? "").trim().slice(0, max);
}
function makeOrderCode() {
  return "SFC-" + Date.now().toString().slice(-8) + "-" +
    crypto.randomBytes(2).toString("hex").toUpperCase();
}

app.use(express.static(path.join(__dirname, "public")));

app.get("/api/config", (req, res) => {
  res.json({
    restaurantName: process.env.RESTAURANT_NAME || "Shree Food Court",
    phone: process.env.RESTAURANT_PHONE || "918824180056",
    upiId: process.env.UPI_ID
  });
});

app.post("/api/orders", orderLimiter, (req, res) => {
  const name = cleanText(req.body.name, 80);
  const mobile = cleanText(req.body.mobile, 10);
  const address = cleanText(req.body.address, 300);
  const paymentMethod = req.body.paymentMethod === "COD" ? "COD" : "UPI";
  const incoming = Array.isArray(req.body.items) ? req.body.items : [];

  if (!name || !/^[6-9]\d{9}$/.test(mobile) || !address || incoming.length < 1 || incoming.length > 50) {
    return res.status(400).json({ error: "Please enter valid details and add food to your cart." });
  }

  // Prices are always recalculated on the server; never trust browser totals.
  const menu = require("./public/menu-data.js");
  const menuById = new Map(menu.map(item => [Number(item.id), item]));
  const cleanItems = [];
  let total = 0;

  for (const row of incoming) {
    const item = menuById.get(Number(row.id));
    const quantity = Math.max(0, Math.min(20, Number.parseInt(row.quantity, 10) || 0));
    if (!item || quantity < 1) continue;
    total += item.price * quantity;
    cleanItems.push({ id: item.id, name: item.name, price: item.price, quantity });
  }

  if (!cleanItems.length || total < 1 || total > 100000) {
    return res.status(400).json({ error: "Your cart is invalid. Please refresh and try again." });
  }

  const orderCode = makeOrderCode();
  const createdAt = new Date().toISOString();
  const result = db.prepare(`
    INSERT INTO orders
      (order_code, customer_name, mobile, address, items_json, total, payment_method, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(orderCode, name, mobile, address, JSON.stringify(cleanItems), total, paymentMethod, createdAt);

  res.status(201).json({
    id: result.lastInsertRowid,
    orderCode,
    total,
    upiId: process.env.UPI_ID,
    restaurantName: process.env.RESTAURANT_NAME || "Shree Food Court",
    paymentMethod
  });
});

app.post("/api/owner/login", loginLimiter, (req, res) => {
  const username = String(req.body.username || "");
  const password = String(req.body.password || "");
  if (!safeEqual(username, process.env.ADMIN_USERNAME) ||
      !safeEqual(password, process.env.ADMIN_PASSWORD)) {
    return res.status(401).json({ error: "Incorrect username or password." });
  }
  req.session.regenerate(err => {
    if (err) return res.status(500).json({ error: "Could not start owner session." });
    req.session.owner = true;
    res.json({ ok: true });
  });
});

app.post("/api/owner/logout", requireOwner, (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get("/api/owner/me", (req, res) => {
  res.json({ loggedIn: !!(req.session && req.session.owner === true) });
});

app.get("/api/owner/orders", requireOwner, (req, res) => {
  const month = String(req.query.month || "");
  if (!/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ error: "Month must be YYYY-MM." });
  }
  const rows = db.prepare(`
    SELECT * FROM orders
    WHERE substr(created_at, 1, 7) = ?
    ORDER BY created_at DESC
  `).all(month).map(row => ({
    ...row,
    items: JSON.parse(row.items_json)
  }));
  const summary = {
    count: rows.length,
    sales: rows.reduce((sum, row) => sum + row.total, 0),
    paid: rows.filter(row => row.payment_status === "paid").reduce((sum, row) => sum + row.total, 0),
    pending: rows.filter(row => row.payment_status !== "paid").length
  };
  res.json({ month, summary, orders: rows });
});

app.patch("/api/owner/orders/:id", requireOwner, (req, res) => {
  const paymentStatus = ["pending", "paid", "refunded"].includes(req.body.paymentStatus)
    ? req.body.paymentStatus : null;
  const orderStatus = ["new", "accepted", "preparing", "ready", "completed", "cancelled"].includes(req.body.orderStatus)
    ? req.body.orderStatus : null;
  if (!paymentStatus && !orderStatus) {
    return res.status(400).json({ error: "No valid status provided." });
  }
  const existing = db.prepare("SELECT id FROM orders WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Order not found." });

  if (paymentStatus && orderStatus) {
    db.prepare("UPDATE orders SET payment_status = ?, order_status = ? WHERE id = ?")
      .run(paymentStatus, orderStatus, req.params.id);
  } else if (paymentStatus) {
    db.prepare("UPDATE orders SET payment_status = ? WHERE id = ?").run(paymentStatus, req.params.id);
  } else {
    db.prepare("UPDATE orders SET order_status = ? WHERE id = ?").run(orderStatus, req.params.id);
  }
  res.json({ ok: true });
});

app.get("/owner", (req, res) => res.sendFile(path.join(__dirname, "public", "owner.html")));

app.listen(PORT, () => {
  console.log(`Shree Food Court running at http://localhost:${PORT}`);
  console.log(`Owner dashboard: http://localhost:${PORT}/owner`);
});
