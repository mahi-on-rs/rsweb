const INVENTORY_DATA_KEY = "topseal_inventory_workspace_v1";
const INVENTORY_ROLE_KEY = "topseal_inventory_role_v1";
const INVENTORY_OWNER_PIN_KEY = "topseal_inventory_owner_pin_v1";

const ROLE_PERMISSIONS = {
  owner: { reverseInvoice: true, refundSale: true, transferStock: true, batchAdjust: true, discountBelowMin: true },
  manager: { reverseInvoice: true, refundSale: true, transferStock: true, batchAdjust: true, discountBelowMin: true },
  sales: { reverseInvoice: false, refundSale: true, transferStock: false, batchAdjust: false, discountBelowMin: false },
  storekeeper: { reverseInvoice: false, refundSale: false, transferStock: true, batchAdjust: true, discountBelowMin: false }
};

const ROLE_LABELS = {
  owner: "Owner",
  manager: "Manager",
  sales: "Sales",
  storekeeper: "Storekeeper"
};

const MODULE_CONTENT = {
  dashboard: {
    title: "Dashboard",
    eyebrow: "Overview",
    points: [
      "Recent sales, monthly totals, and recent invoices.",
      "Animated charts bound to real API data.",
      "Search shortcut for item and customer lookup."
    ],
    note: "Dashboard widgets are scaffolded and ready for API integration.",
    renderWorkspace: renderDashboardWorkspace
  },
  sales: {
    title: "Sales & Invoices",
    eyebrow: "Implemented step 3",
    points: [
      "Create sale using pre-added customers and items.",
      "Add multiple sale lines with quantity and editable rate.",
      "Generate local invoices and deduct stock from selected/default godown."
    ],
    note: "Sales now validates stock quantities before invoice creation.",
    renderWorkspace: renderSalesWorkspace
  },
  items: {
    title: "Items & Categories",
    eyebrow: "Implemented step 2",
    points: [
      "Create and manage item categories.",
      "Create items with regular price, minimum price, SKU, and description.",
      "Search items by name, SKU, and category."
    ],
    note: "Item/category master data is persisted and reusable across modules.",
    renderWorkspace: renderItemsWorkspace
  },
  stock: {
    title: "Stock & Godowns",
    eyebrow: "Implemented step 4",
    points: [
      "Create godowns (storages).",
      "Add stock in/out movements per item and godown.",
      "View current balances and movement ledger."
    ],
    note: "Stock module is now active and integrated with sale deduction.",
    renderWorkspace: renderStockWorkspace
  },
  customers: {
    title: "Customers",
    eyebrow: "Implemented step 1",
    points: [
      "Create customers with name, phone, address, and note.",
      "Search customers by name, phone, and address.",
      "Automatic activeness badge (Active / Not very active / Inactive)."
    ],
    note: "Customer CRUD is live with local persistence.",
    renderWorkspace: renderCustomersWorkspace
  },
  reports: {
    title: "Reports",
    eyebrow: "Implemented step 6",
    points: [
      "Sales summary and refund totals.",
      "Top selling items from invoice lines.",
      "Customer due and activity snapshots."
    ],
    note: "Reports now summarize real local sales/refund and customer insights.",
    renderWorkspace: renderReportsWorkspace
  }
};

let inventoryState = {
  customers: [],
  categories: [],
  items: [],
  invoices: [],
  godowns: [],
  stockMovements: [],
  auditLogs: []
};

let currentRole = "owner";
let brandingSettings = {};

function loadInventoryRole() {
  const role = localStorage.getItem(INVENTORY_ROLE_KEY);
  return role && ROLE_PERMISSIONS[role] ? role : "owner";
}

function saveInventoryRole(role) {
  if (!ROLE_PERMISSIONS[role]) return;
  currentRole = role;
  localStorage.setItem(INVENTORY_ROLE_KEY, role);
}

function hasPermission(permissionKey) {
  const grants = ROLE_PERMISSIONS[currentRole] || ROLE_PERMISSIONS.owner;
  return Boolean(grants?.[permissionKey]);
}

function roleGateMessage(permissionKey) {
  const map = {
    reverseInvoice: "Only Owner or Manager can reverse invoices.",
    refundSale: "Only Owner, Manager, or Sales can refund sales.",
    transferStock: "Only Owner, Manager, or Storekeeper can transfer stock.",
    batchAdjust: "Only Owner, Manager, or Storekeeper can apply batch adjustment.",
    discountBelowMin: "This role cannot set rate below minimum price."
  };
  return map[permissionKey] || "This action is not allowed for the selected role.";
}

function requestOwnerOverride(permissionKey, contextLabel = "") {
  if (hasPermission(permissionKey)) return true;
  const pin = window.prompt(`Override required. Enter Owner PIN to continue${contextLabel ? ` (${contextLabel})` : ""}:`);
  if (!pin) {
    appendAuditLog("override.denied", `${permissionKey} | ${contextLabel || "No context"}`);
    return false;
  }
  const expectedPin = localStorage.getItem(INVENTORY_OWNER_PIN_KEY) || "1234";
  if (pin !== expectedPin) {
    appendAuditLog("override.denied", `${permissionKey} | Invalid PIN | ${contextLabel || "No context"}`);
    return false;
  }
  appendAuditLog("override.granted", `${permissionKey} | ${contextLabel || "No context"}`);
  return true;
}

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

let apiSyncEnabled = true;

function loadInventoryState() {
  try {
    const raw = localStorage.getItem(INVENTORY_DATA_KEY);
    if (!raw) return { customers: [], categories: [], items: [], invoices: [], godowns: [], stockMovements: [], auditLogs: [] };
    const parsed = JSON.parse(raw);
    return {
      customers: Array.isArray(parsed.customers) ? parsed.customers : [],
      categories: Array.isArray(parsed.categories) ? parsed.categories : [],
      items: Array.isArray(parsed.items) ? parsed.items : [],
      invoices: Array.isArray(parsed.invoices) ? parsed.invoices : [],
      godowns: Array.isArray(parsed.godowns) ? parsed.godowns : [],
      stockMovements: Array.isArray(parsed.stockMovements) ? parsed.stockMovements : [],
      auditLogs: Array.isArray(parsed.auditLogs) ? parsed.auditLogs : []
    };
  } catch {
    return { customers: [], categories: [], items: [], invoices: [], godowns: [], stockMovements: [], auditLogs: [] };
  }
}

function saveInventoryState() {
  localStorage.setItem(INVENTORY_DATA_KEY, JSON.stringify(inventoryState));
}

async function apiRequest(path, options = {}) {
  const base = typeof TOPSEAL_API_BASE === "string" ? TOPSEAL_API_BASE : "";
  const response = await fetch(`${base}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || `Request failed: ${response.status}`);
  return body;
}

function normalizeCategory(row) {
  return { id: String(row.id), name: row.name, createdAt: row.created_at || row.createdAt || "" };
}

function normalizeItem(row) {
  return {
    id: String(row.id),
    name: row.name,
    sku: row.sku || "",
    categoryId: row.category_id ? String(row.category_id) : row.categoryId ? String(row.categoryId) : "",
    regularPrice: Number(row.regular_price ?? row.regularPrice ?? 0),
    minimumPrice: Number(row.minimum_price ?? row.minimumPrice ?? 0),
    description: row.description || "",
    createdAt: row.created_at || row.createdAt || ""
  };
}

function normalizeCustomer(row) {
  return {
    id: String(row.id),
    name: row.name,
    phone: row.phone,
    address: row.address || "",
    note: row.note || "",
    lastPurchaseAt: row.last_purchase_at || row.lastPurchaseAt || "",
    createdAt: row.created_at || row.createdAt || ""
  };
}

function normalizeGodown(row) {
  return { id: String(row.id), name: row.name, createdAt: row.created_at || row.createdAt || "" };
}

function normalizeStockMovement(row) {
  return {
    id: String(row.id),
    type: row.type,
    itemId: String(row.item_id ?? row.itemId),
    godownId: String(row.godown_id ?? row.godownId),
    qty: Number(row.qty || 0),
    note: row.note || "",
    refType: row.ref_type || row.refType || "manual",
    refId: row.ref_id || row.refId || "",
    createdAt: row.created_at || row.createdAt || ""
  };
}

async function hydrateInventoryStateFromApi() {
  try {
    const [customersRes, categoriesRes, itemsRes, godownsRes, stockRes, invoicesRes, refundsRes] = await Promise.all([
      apiRequest('/api/customers'),
      apiRequest('/api/inventory/categories'),
      apiRequest('/api/inventory/items'),
      apiRequest('/api/inventory/godowns'),
      apiRequest('/api/inventory/stock/movements'),
      apiRequest('/api/invoices'),
      apiRequest('/api/refunds')
    ]);

    const invoicesDetailed = await Promise.all((invoicesRes.items || []).map(async (inv) => {
      try {
        return await apiRequest(`/api/invoices/${inv.id}`);
      } catch {
        return inv;
      }
    }));

    const refundsByInvoice = new Map();
    (refundsRes.items || []).forEach((r) => {
      const key = String(r.invoice_id || r.invoiceId);
      if (!refundsByInvoice.has(key)) refundsByInvoice.set(key, []);
      refundsByInvoice.get(key).push({
        id: String(r.id),
        lineId: String(r.line_id || r.lineId),
        qty: Number(r.qty || 0),
        amount: Number(r.amount || 0),
        createdAt: r.created_at || r.createdAt || ""
      });
    });

    inventoryState = {
      customers: (customersRes.items || []).map(normalizeCustomer),
      categories: (categoriesRes.items || []).map(normalizeCategory),
      items: (itemsRes.items || []).map(normalizeItem),
      godowns: (godownsRes.items || []).map(normalizeGodown),
      stockMovements: (stockRes.items || []).map(normalizeStockMovement),
      invoices: invoicesDetailed.map((inv) => ({
        id: String(inv.id),
        invoiceNo: inv.invoice_no || inv.invoiceNo,
        chalanNo: inv.chalan_no || inv.chalanNo || "",
        customerId: inv.customer_id ? String(inv.customer_id) : inv.customerId ? String(inv.customerId) : "",
        godownId: inv.godown_id ? String(inv.godown_id) : inv.godownId ? String(inv.godownId) : "",
        paymentMethod: inv.payment_method || inv.paymentMethod || "Cash",
        status: inv.status || "Created",
        taxPercent: Number(inv.tax_percent ?? inv.taxPercent ?? 0),
        taxAmount: Number(inv.tax_amount ?? inv.taxAmount ?? 0),
        subtotal: Number(inv.subtotal || 0),
        grandTotal: Number(inv.grand_total ?? inv.grandTotal ?? 0),
        reversedAt: inv.reversed_at || inv.reversedAt || "",
        createdAt: inv.created_at || inv.createdAt || "",
        lines: (inv.lines || []).map((line) => ({
          id: String(line.id),
          itemId: String(line.item_id ?? line.itemId),
          qty: Number(line.qty || 0),
          refundedQty: Number(line.refunded_qty ?? line.refundedQty ?? 0),
          rate: Number(line.rate || 0),
          lineTotal: Number(line.line_total ?? line.lineTotal ?? 0),
          description: line.description || ""
        })),
        refunds: refundsByInvoice.get(String(inv.id)) || []
      })),
      auditLogs: Array.isArray(inventoryState.auditLogs) ? inventoryState.auditLogs : []
    };

    saveInventoryState();
    apiSyncEnabled = true;
  } catch (error) {
    console.warn('Inventory API sync failed; using local data.', error);
    apiSyncEnabled = false;
    inventoryState = loadInventoryState();
  }
}

function toDaysSince(dateLike) {
  if (!dateLike) return Number.POSITIVE_INFINITY;
  const time = Date.parse(dateLike);
  if (Number.isNaN(time)) return Number.POSITIVE_INFINITY;
  return Math.floor((Date.now() - time) / (1000 * 60 * 60 * 24));
}

function customerActivity(customer) {
  const days = toDaysSince(customer.lastPurchaseAt);
  if (days <= 30) return { label: "Active", tone: "green" };
  if (days <= 90) return { label: "Not very active", tone: "yellow" };
  return { label: "Inactive", tone: "red" };
}

function categoryNameById(categoryId) {
  return inventoryState.categories.find((category) => String(category.id) === String(categoryId))?.name || "Uncategorized";
}

function customerById(customerId) {
  return inventoryState.customers.find((customer) => String(customer.id) === String(customerId)) || null;
}

function itemById(itemId) {
  return inventoryState.items.find((item) => String(item.id) === String(itemId)) || null;
}

function godownById(godownId) {
  return inventoryState.godowns.find((godown) => String(godown.id) === String(godownId)) || null;
}

function stockKey(itemId, godownId) {
  return `${itemId}__${godownId}`;
}

function stockBalanceMap() {
  const balances = new Map();
  inventoryState.stockMovements.forEach((entry) => {
    const key = stockKey(entry.itemId, entry.godownId);
    const current = balances.get(key) || 0;
    const delta = entry.type === "IN" ? Number(entry.qty) : -Number(entry.qty);
    balances.set(key, current + delta);
  });
  return balances;
}

function getStockBalance(itemId, godownId) {
  const balances = stockBalanceMap();
  return balances.get(stockKey(itemId, godownId)) || 0;
}

function totalStockForItem(itemId) {
  const balances = stockBalanceMap();
  let total = 0;
  for (const [key, qty] of balances.entries()) {
    if (key.startsWith(`${itemId}__`)) total += qty;
  }
  return total;
}

function ensureDefaultGodown() {
  if (inventoryState.godowns.length) return inventoryState.godowns[0].id;
  const defaultGodown = {
    id: uid("godown"),
    name: "Main Godown",
    createdAt: new Date().toISOString()
  };
  inventoryState.godowns.push(defaultGodown);
  saveInventoryState();
  return defaultGodown.id;
}

function appendStockMovement({ type, itemId, godownId, qty, note, refType, refId }) {
  inventoryState.stockMovements.unshift({
    id: uid("stock-move"),
    type,
    itemId,
    godownId,
    qty: Number(qty),
    note: note || "",
    refType: refType || "manual",
    refId: refId || "",
    createdAt: new Date().toISOString()
  });
}

function appendAuditLog(action, details = "") {
  inventoryState.auditLogs = Array.isArray(inventoryState.auditLogs) ? inventoryState.auditLogs : [];
  inventoryState.auditLogs.unshift({
    id: uid("audit"),
    role: currentRole,
    action,
    details,
    createdAt: new Date().toISOString()
  });
  if (inventoryState.auditLogs.length > 300) {
    inventoryState.auditLogs = inventoryState.auditLogs.slice(0, 300);
  }
}

function formatMoney(amount) {
  return Number(amount || 0).toFixed(2);
}

function inDateRange(dateIso, fromDate, toDate) {
  const datePart = (dateIso || "").slice(0, 10);
  if (!datePart) return false;
  if (fromDate && datePart < fromDate) return false;
  if (toDate && datePart > toDate) return false;
  return true;
}

function downloadCsv(filename, headers, rows) {
  const escape = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const csv = [headers.map(escape).join(","), ...rows.map((row) => row.map(escape).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}
function buildInvoicePrintMarkup(invoice, { chalan = false } = {}) {
  const customer = customerById(invoice.customerId);
  const godown = godownById(invoice.godownId);

  const brandName = brandingSettings.brandName || "TOP SEAL";
  const primaryColor = brandingSettings.primaryColor || "#2563eb";
  const secondaryColor = brandingSettings.secondaryColor || "#0f172a";
  const surfaceColor = brandingSettings.surfaceColor || "#f8fafc";
  const textColor = brandingSettings.textColor || "#0f172a";
  const brandLogo = brandingSettings.brandLogoImage || "";
  const brandAddress = brandingSettings.contactAddress || "";
  const brandPhone = brandingSettings.whatsappNumber || "";

  const itemRows = invoice.lines.map((line, idx) => {
    const item = itemById(line.itemId);
    const itemDesc = line.description || item?.description || "";
    if (chalan) {
      return `<tr><td>${idx + 1}</td><td>${escapeHtml(item?.name || "Unknown")}</td><td>${line.qty}</td><td>${escapeHtml(itemDesc || "-")}</td></tr>`;
    }
    return `<tr><td>${idx + 1}</td><td>${escapeHtml(item?.name || "Unknown")}</td><td>${line.qty}</td><td>${formatMoney(line.rate)}</td><td>${formatMoney(line.lineTotal)}</td><td>${escapeHtml(itemDesc || "-")}</td></tr>`;
  }).join('');

  const heading = chalan ? "CHALAN" : "INVOICE";
  const caption = chalan ? "Goods dispatch note (no pricing)" : "Tax Invoice";

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${heading} ${invoice.invoiceNo}</title>
  <style>
    *{box-sizing:border-box}
    body{font-family:Inter,Segoe UI,Arial,sans-serif;margin:0;padding:18px;color:${textColor};background:#ffffff}
    .sheet{border:1px solid #dbe3ef;border-radius:12px;overflow:hidden}
    .top-band{background:linear-gradient(120deg, ${primaryColor}, ${secondaryColor});height:10px}
    .header{display:flex;justify-content:space-between;gap:16px;padding:18px 20px;background:${surfaceColor}}
    .brand{display:flex;align-items:center;gap:12px}
    .logo{width:58px;height:58px;border-radius:10px;object-fit:cover;border:1px solid #d7deea;background:#fff}
    .brand h1{margin:0;font-size:1.15rem}
    .muted{margin:2px 0;color:#475569;font-size:12px}
    .doc{ text-align:right }
    .doc h2{margin:0;color:${secondaryColor};letter-spacing:1.2px}
    .doc p{margin:4px 0 0;color:#334155;font-size:12px}
    .meta-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;padding:14px 20px;border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;background:#fff}
    .meta-card{padding:8px 10px;border:1px solid #e2e8f0;border-radius:8px;background:#fff}
    .meta-card b{display:block;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.4px;margin-bottom:4px}
    .table-wrap{padding:14px 20px}
    table{width:100%;border-collapse:collapse}
    th,td{border:1px solid #dbe3ef;padding:8px 9px;font-size:12px;vertical-align:top}
    th{background:${surfaceColor};text-transform:uppercase;font-size:11px;letter-spacing:.3px}
    tfoot td{font-weight:700;background:#f8fafc}
    .summary{display:flex;justify-content:flex-end;padding:0 20px 14px}
    .summary table{max-width:320px}
    .footer{display:flex;justify-content:space-between;gap:24px;padding:18px 20px;border-top:1px dashed #cbd5e1}
    .sign{flex:1;text-align:center;padding-top:28px;border-top:1px solid #94a3b8;font-size:11px;color:#475569}
    .caption{margin:0;padding:0 20px 12px;color:#64748b;font-size:11px}
    @media print { body{padding:0}.sheet{border:none;border-radius:0} }
  </style>
</head>
<body>
  <section class="sheet">
    <div class="top-band"></div>
    <header class="header">
      <div class="brand">
        ${brandLogo ? `<img class="logo" src="${brandLogo}" alt="Brand logo"/>` : ""}
        <div>
          <h1>${escapeHtml(brandName)}</h1>
          ${brandAddress ? `<p class="muted">${escapeHtml(brandAddress)}</p>` : ""}
          ${brandPhone ? `<p class="muted">Phone/WhatsApp: ${escapeHtml(brandPhone)}</p>` : ""}
        </div>
      </div>
      <div class="doc">
        <h2>${heading}</h2>
        <p>No: ${escapeHtml(invoice.invoiceNo)}</p>
        <p>Date: ${escapeHtml((invoice.createdAt || "").slice(0, 10))}</p>
      </div>
    </header>

    <div class="meta-grid">
      <div class="meta-card"><b>Customer</b>${escapeHtml(customer?.name || "Walk-in Customer")}</div>
      <div class="meta-card"><b>Godown</b>${escapeHtml(godown?.name || "Default")}</div>
      <div class="meta-card"><b>Phone</b>${escapeHtml(customer?.phone || "-")}</div>
      <div class="meta-card"><b>Address</b>${escapeHtml(customer?.address || "-")}</div>
    </div>

    <div class="table-wrap">
      <table>
        <thead>${chalan
          ? '<tr><th>#</th><th>Item</th><th>Qty</th><th>Description</th></tr>'
          : '<tr><th>#</th><th>Item</th><th>Qty</th><th>Rate</th><th>Total</th><th>Description</th></tr>'}</thead>
        <tbody>${itemRows}</tbody>
      </table>
    </div>

    ${chalan
      ? ''
      : `<div class="summary"><table><tbody>
          <tr><td>Grand Total</td><td>${formatMoney(invoice.grandTotal)}</td></tr>
          <tr><td>Payment Method</td><td>${escapeHtml(invoice.paymentMethod || "-")}</td></tr>
        </tbody></table></div>`}

    <p class="caption">${caption}</p>
    <footer class="footer">
      <div class="sign">Received by</div>
      <div class="sign">Prepared by</div>
      <div class="sign">Authorized signature</div>
    </footer>
  </section>
</body>
</html>`;
}

function openPrintWindow(invoice, { chalan = false } = {}) {
  const popup = window.open('', '_blank', 'width=980,height=760');
  if (!popup) return;
  popup.document.open();
  popup.document.write(buildInvoicePrintMarkup(invoice, { chalan }));
  popup.document.close();
  popup.focus();
  popup.print();
}

function setModuleView(moduleKey) {
  const module = MODULE_CONTENT[moduleKey] || MODULE_CONTENT.dashboard;
  const titleEl = document.getElementById("inventory-module-title");
  const eyebrowEl = document.getElementById("inventory-module-eyebrow");
  const focusTitle = document.getElementById("module-focus-title");
  const focusList = document.getElementById("module-focus-list");
  const noteEl = document.getElementById("inventory-module-note");
  const workspace = document.getElementById("inventory-module-workspace");

  titleEl.textContent = module.title;
  eyebrowEl.textContent = module.eyebrow;
  focusTitle.textContent = `${module.title} — build scope`;
  noteEl.textContent = module.note;

  focusList.innerHTML = "";
  module.points.forEach((point) => {
    const li = document.createElement("li");
    li.textContent = point;
    focusList.appendChild(li);
  });

  document.querySelectorAll(".inventory-nav-item").forEach((button) => {
    button.classList.toggle("active", button.dataset.module === moduleKey);
  });

  module.renderWorkspace(workspace);
}

function setupModuleNavigation() {
  const nav = document.getElementById("inventory-nav");
  nav.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target.closest(".inventory-nav-item") : null;
    if (!target) return;
    setModuleView(target.dataset.module);
  });
}

function seedKpis(data) {
  const products = Array.isArray(data?.products) ? data.products : [];
  const customerCount = inventoryState.customers.length;
  const salesTotal = inventoryState.invoices.reduce((sum, inv) => sum + Number(inv.grandTotal || 0), 0);
  const lowStockCount = inventoryState.items.filter((item) => totalStockForItem(item.id) > 0 && totalStockForItem(item.id) < 5).length;

  document.getElementById("kpi-sales").textContent = formatMoney(salesTotal);
  document.getElementById("kpi-invoices").textContent = String(inventoryState.invoices.length);
  document.getElementById("kpi-customers").textContent = String(customerCount);
  document.getElementById("kpi-stock").textContent = String(Math.max(lowStockCount, Math.max(products.length - 10, 0)));
}

function setBranding(data) {
  const settings = data.settings || {};
  brandingSettings = { ...settings };
  applyStoreTheme(settings);

  const brand = settings.brandName || "TOP SEAL";
  document.title = `${brand} Inventory Workspace`;
  document.getElementById("inventory-brand-name").textContent = brand;

  const logo = settings.brandLogoImage;
  const logoEl = document.getElementById("inventory-brand-logo");
  if (logo) logoEl.src = logo;

  const favicon = settings.faviconImage;
  if (favicon) {
    const faviconEl = document.getElementById("dynamic-favicon");
    faviconEl.href = favicon;
  }
}


function computeDashboardData({ fromDate = "", toDate = "" } = {}) {
  const invoices = inventoryState.invoices || [];
  const validInvoices = invoices
    .filter((invoice) => invoice.status !== "Reversed")
    .filter((invoice) => {
      if (!fromDate && !toDate) return true;
      return inDateRange(invoice.createdAt, fromDate, toDate);
    });

  const revenue = validInvoices.reduce((sum, invoice) => sum + Number(invoice.grandTotal || 0), 0);
  const refunds = validInvoices.reduce((sum, invoice) => sum + (invoice.refunds || []).reduce((s, r) => s + Number(r.amount || 0), 0), 0);
  const netRevenue = revenue - refunds;
  const today = new Date().toISOString().slice(0, 10);
  const todaySales = validInvoices
    .filter((invoice) => (invoice.createdAt || "").slice(0, 10) === today)
    .reduce((sum, invoice) => sum + Number(invoice.grandTotal || 0), 0);

  const lineAgg = new Map();
  validInvoices.forEach((invoice) => {
    invoice.lines.forEach((line) => {
      const prev = lineAgg.get(line.itemId) || { qty: 0, amount: 0 };
      prev.qty += Number(line.qty || 0);
      prev.amount += Number(line.lineTotal || 0);
      lineAgg.set(line.itemId, prev);
    });
  });

  const topItems = [...lineAgg.entries()]
    .map(([itemId, stat]) => ({ itemId, ...stat }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 6);

  const customerDue = (inventoryState.customers || []).map((customer) => {
    const customerInvoices = validInvoices.filter((inv) => inv.customerId === customer.id);
    const total = customerInvoices.reduce((sum, inv) => sum + Number(inv.grandTotal || 0), 0);
    const paid = customerInvoices.filter((inv) => inv.paymentMethod !== "Credit").reduce((sum, inv) => sum + Number(inv.grandTotal || 0), 0);
    const due = Math.max(total - paid, 0);
    return { customer, due };
  }).sort((a, b) => b.due - a.due);

  return {
    revenue,
    refunds,
    netRevenue,
    todaySales,
    invoicesCount: validInvoices.length,
    topItems,
    customerDue,
    filteredInvoices: validInvoices
  };
}


function renderDashboardWorkspace(container) {
  container.innerHTML = `
    <div class="workspace-head">
      <h3>Dashboard Analytics</h3>
      <p class="module-note">Live view from sales, refunds, customers, and stock activity.</p>
    </div>

    <form id="dashboard-filter-form" class="report-toolbar card-muted">
      <label>From<input id="dashboard-from" type="date" /></label>
      <label>To<input id="dashboard-to" type="date" /></label>
      <div class="form-actions"><button type="submit">Apply Range</button><button id="dashboard-clear" type="button">Clear</button></div>
    </form>

    <section id="dashboard-body"></section>
  `;

  const fromInput = document.getElementById("dashboard-from");
  const toInput = document.getElementById("dashboard-to");
  const body = document.getElementById("dashboard-body");

  const draw = () => {
    const stats = computeDashboardData({ fromDate: fromInput.value, toDate: toInput.value });
    body.innerHTML = `
      <div class="mini-kpi-grid">
        <article class="card-muted"><p>Total Revenue</p><h4>${formatMoney(stats.revenue)}</h4></article>
        <article class="card-muted"><p>Total Refund</p><h4>${formatMoney(stats.refunds)}</h4></article>
        <article class="card-muted"><p>Net Revenue</p><h4>${formatMoney(stats.netRevenue)}</h4></article>
        <article class="card-muted"><p>Today Sales</p><h4>${formatMoney(stats.todaySales)}</h4></article>
        <article class="card-muted"><p>Invoices</p><h4>${stats.invoicesCount}</h4></article>
        <article class="card-muted"><p>Customers</p><h4>${inventoryState.customers.length}</h4></article>
      </div>

      <div class="split-grid">
        <article class="card-muted">
          <h4>Top Selling Items</h4>
          <div class="bar-list">
            ${stats.topItems.length ? stats.topItems.map((entry) => {
              const item = itemById(entry.itemId);
              const width = Math.max(8, Math.min(100, entry.qty * 6));
              return `<div class="bar-row"><span>${escapeHtml(item?.name || 'Unknown')}</span><div class="bar-track"><i style="width:${width}%"></i></div><b>${entry.qty}</b></div>`;
            }).join('') : '<p class="module-note">No sales yet.</p>'}
          </div>
        </article>
        <article class="card-muted">
          <h4>Stock Summary</h4>
          <table class="inventory-table compact-table"><tbody>
            <tr><td>Total Items</td><td>${inventoryState.items.length}</td></tr>
            <tr><td>Total Godowns</td><td>${inventoryState.godowns.length}</td></tr>
            <tr><td>Stock Movements</td><td>${inventoryState.stockMovements.length}</td></tr>
            <tr><td>Low Stock (&lt;5)</td><td>${inventoryState.items.filter((it) => totalStockForItem(it.id) > 0 && totalStockForItem(it.id) < 5).length}</td></tr>
          </tbody></table>
        </article>
      </div>

      <article class="card-muted">
        <h4>Role Permission Snapshot</h4>
        <p class="module-note">Active role: <strong>${escapeHtml(ROLE_LABELS[currentRole] || 'Owner')}</strong></p>
        <table class="inventory-table compact-table">
          <thead><tr><th>Action</th><th>Access</th></tr></thead>
          <tbody>
            <tr><td>Reverse invoice</td><td>${hasPermission("reverseInvoice") ? "Allowed" : "Blocked (Override)"}</td></tr>
            <tr><td>Refund sale</td><td>${hasPermission("refundSale") ? "Allowed" : "Blocked (Override)"}</td></tr>
            <tr><td>Transfer stock</td><td>${hasPermission("transferStock") ? "Allowed" : "Blocked (Override)"}</td></tr>
            <tr><td>Batch stock adjustment</td><td>${hasPermission("batchAdjust") ? "Allowed" : "Blocked (Override)"}</td></tr>
            <tr><td>Sell below minimum price</td><td>${hasPermission("discountBelowMin") ? "Allowed" : "Blocked (Override)"}</td></tr>
          </tbody>
        </table>
      </article>


      <article class="card-muted">
        <h4>Recent Audit Activity</h4>
        <div class="table-wrap">
          <table class="inventory-table compact-table">
            <thead><tr><th>Time</th><th>Role</th><th>Action</th><th>Details</th></tr></thead>
            <tbody>
              ${inventoryState.auditLogs?.length ? inventoryState.auditLogs.slice(0, 6).map((log) => `<tr><td>${escapeHtml((log.createdAt || '').replace('T', ' ').slice(0, 16))}</td><td>${escapeHtml(ROLE_LABELS[log.role] || log.role || '-')}</td><td>${escapeHtml(log.action || '-')}</td><td>${escapeHtml(log.details || '-')}</td></tr>`).join('') : `<tr><td colspan="4" class="empty-cell">No audit entries yet.</td></tr>`}
            </tbody>
          </table>
        </div>
      </article>
    `;
  };

  document.getElementById("dashboard-filter-form").addEventListener("submit", (event) => {
    event.preventDefault();
    draw();
  });

  document.getElementById("dashboard-clear").addEventListener("click", () => {
    fromInput.value = "";
    toInput.value = "";
    draw();
  });

  draw();
}


function renderReportsWorkspace(container) {
  container.innerHTML = `
    <div class="workspace-head">
      <h3>Reports</h3>
      <p class="module-note">Sales, refunds, due snapshots and exports from current workspace data.</p>
    </div>

    <form id="report-filter-form" class="report-toolbar card-muted">
      <label>From<input id="report-from" type="date" /></label>
      <label>To<input id="report-to" type="date" /></label>
      <div class="form-actions">
        <button type="submit">Apply Range</button>
        <button id="report-clear" type="button">Clear</button>
      </div>
      <div class="form-actions">
        <button id="export-invoices" type="button">Export Invoices CSV</button>
        <button id="export-due" type="button">Export Due CSV</button>
        <button id="export-stock-moves" type="button">Export Stock CSV</button>
        <button id="export-audit-log" type="button">Export Audit CSV</button>
      </div>
    </form>

    <section id="reports-body"></section>
  `;

  const fromInput = document.getElementById("report-from");
  const toInput = document.getElementById("report-to");
  const reportsBody = document.getElementById("reports-body");

  const draw = () => {
    const stats = computeDashboardData({ fromDate: fromInput.value, toDate: toInput.value });
    reportsBody.innerHTML = `
      <div class="split-grid">
        <article class="card-muted">
          <h4>Financial Summary</h4>
          <table class="inventory-table compact-table"><tbody>
            <tr><td>Gross Sales</td><td>${formatMoney(stats.revenue)}</td></tr>
            <tr><td>Refunded Amount</td><td>${formatMoney(stats.refunds)}</td></tr>
            <tr><td>Net Sales</td><td>${formatMoney(stats.netRevenue)}</td></tr>
          </tbody></table>
        </article>
        <article class="card-muted">
          <h4>Top Customer Due</h4>
          <table class="inventory-table compact-table"><thead><tr><th>Customer</th><th>Due</th></tr></thead><tbody>
            ${stats.customerDue.slice(0, 8).map((entry) => `<tr><td>${escapeHtml(entry.customer.name)}</td><td>${formatMoney(entry.due)}</td></tr>`).join('') || '<tr><td colspan="2" class="empty-cell">No due records.</td></tr>'}
          </tbody></table>
        </article>
      </div>

      <article class="card-muted">
        <h4>Recent Invoices</h4>
        <div class="table-wrap">
          <table class="inventory-table compact-table"><thead><tr><th>Invoice</th><th>Customer</th><th>Status</th><th>Total</th></tr></thead><tbody>
            ${stats.filteredInvoices.slice(0, 12).map((invoice) => {
              const customer = customerById(invoice.customerId);
              return `<tr><td>${escapeHtml(invoice.invoiceNo)}</td><td>${escapeHtml(customer?.name || 'Unknown')}</td><td>${escapeHtml(invoice.status || 'Created')}</td><td>${formatMoney(invoice.grandTotal)}</td></tr>`;
            }).join('') || '<tr><td colspan="4" class="empty-cell">No invoices yet.</td></tr>'}
          </tbody></table>
        </div>
      </article>
    `;
  };

  document.getElementById("report-filter-form").addEventListener("submit", (event) => {
    event.preventDefault();
    draw();
  });

  document.getElementById("report-clear").addEventListener("click", () => {
    fromInput.value = "";
    toInput.value = "";
    draw();
  });

  document.getElementById("export-invoices").addEventListener("click", () => {
    const stats = computeDashboardData({ fromDate: fromInput.value, toDate: toInput.value });
    const rows = stats.filteredInvoices.map((invoice) => {
      const customer = customerById(invoice.customerId);
      return [invoice.invoiceNo, (invoice.createdAt || "").slice(0, 10), customer?.name || "Unknown", invoice.status || "Created", formatMoney(invoice.grandTotal)];
    });
    downloadCsv("invoices-report.csv", ["Invoice", "Date", "Customer", "Status", "Total"], rows);
  });

  document.getElementById("export-due").addEventListener("click", () => {
    const stats = computeDashboardData({ fromDate: fromInput.value, toDate: toInput.value });
    const rows = stats.customerDue.map((entry) => [entry.customer.name, entry.customer.phone || "", formatMoney(entry.due)]);
    downloadCsv("customer-due-report.csv", ["Customer", "Phone", "Due"], rows);
  });

  document.getElementById("export-stock-moves").addEventListener("click", () => {
    const rows = (inventoryState.stockMovements || []).map((move) => {
      const item = itemById(move.itemId);
      const godown = godownById(move.godownId);
      return [(move.createdAt || "").slice(0, 10), move.type, item?.name || "Unknown", godown?.name || "Unknown", move.qty, move.note || ""];
    });
    downloadCsv("stock-movements.csv", ["Date", "Type", "Item", "Godown", "Qty", "Note"], rows);
  });

  document.getElementById("export-audit-log").addEventListener("click", () => {
    const rows = (inventoryState.auditLogs || []).map((entry) => [
      (entry.createdAt || "").replace("T", " ").slice(0, 19),
      ROLE_LABELS[entry.role] || entry.role || "-",
      entry.action || "-",
      entry.details || ""
    ]);
    downloadCsv("audit-log.csv", ["Time", "Role", "Action", "Details"], rows);
  });

  draw();
}


function renderComingSoon(container) {
  container.innerHTML = `
    <h3>Module implementation in progress</h3>
    <p class="module-note">This module will be built in upcoming steps.</p>
  `;
}

function renderSalesWorkspace(container) {
  container.innerHTML = `
    <div class="workspace-head">
      <h3>Create New Sale</h3>
      <p class="module-note">Create invoice with stock deduction from selected godown or default godown. Current role: <strong id="sales-role-label"></strong>.</p>
    </div>

    <form id="sale-form" class="card-muted sales-form-grid">
      <label>
        Customer *
        <select id="sale-customer" required></select>
      </label>
      <label>
        Payment Method
        <select id="sale-payment-method">
          <option value="Cash">Cash</option>
          <option value="Credit">Credit</option>
          <option value="Bank">Bank</option>
        </select>
      </label>
      <label class="full-row">
        Godown (optional)
        <select id="sale-godown"></select>
      </label>

      <div class="full-row sales-items-head">
        <h4>Sale Items</h4>
        <button id="add-sale-line" type="button">+ Add Item Line</button>
      </div>

      <div class="full-row" id="sale-lines"></div>

      <div class="full-row sales-total-row">
        <p>Grand Total: <strong id="sale-grand-total">0.00</strong></p>
      </div>

      <div class="full-row form-actions">
        <button type="submit">Create Invoice</button>
        <p id="sale-notice" class="module-note"></p>
      </div>
    </form>

    <section id="invoice-detail-panel" class="card-muted hidden"></section>

    <div class="customer-table-head">
      <h4>Recent Invoices</h4>
      <input id="invoice-search" type="search" placeholder="Search invoice no, customer" />
    </div>

    <div class="table-wrap">
      <table class="inventory-table">
        <thead>
          <tr>
            <th>Invoice No</th>
            <th>Date</th>
            <th>Customer</th>
            <th>Godown</th>
            <th>Items</th>
            <th>Status</th>
            <th>Grand Total</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody id="invoice-table-body"></tbody>
      </table>
    </div>
  `;

  const customerSelect = document.getElementById("sale-customer");
  const godownSelect = document.getElementById("sale-godown");
  const linesWrap = document.getElementById("sale-lines");
  const grandTotalEl = document.getElementById("sale-grand-total");
  const saleNotice = document.getElementById("sale-notice");
  const invoiceSearchInput = document.getElementById("invoice-search");
  const detailPanel = document.getElementById("invoice-detail-panel");
  const saleForm = document.getElementById("sale-form");
  const salesRoleLabel = document.getElementById("sales-role-label");
  if (salesRoleLabel) salesRoleLabel.textContent = ROLE_LABELS[currentRole] || "Owner";

  const drawCustomerOptions = () => {
    customerSelect.innerHTML = "<option value=''>Select customer</option>";
    inventoryState.customers.forEach((customer) => {
      const option = document.createElement("option");
      option.value = customer.id;
      option.textContent = `${customer.name} (${customer.phone})`;
      customerSelect.appendChild(option);
    });
  };

  const drawGodownOptions = () => {
    if (!inventoryState.godowns.length) ensureDefaultGodown();
    godownSelect.innerHTML = "<option value=''>Auto (default godown)</option>";
    inventoryState.godowns.forEach((godown) => {
      const option = document.createElement("option");
      option.value = godown.id;
      option.textContent = godown.name;
      godownSelect.appendChild(option);
    });
  };

  const saleLineTemplate = (lineId) => {
    const itemOptions = [`<option value=''>Select item</option>`]
      .concat(inventoryState.items.map((item) => `<option value='${item.id}'>${escapeHtml(item.name)} (${escapeHtml(item.sku || "No SKU")})</option>`))
      .join("");

    return `
      <div class="sale-line" data-line-id="${lineId}">
        <select class="sale-line-item">${itemOptions}</select>
        <input class="sale-line-qty" type="number" min="1" step="1" value="1" />
        <input class="sale-line-rate" type="number" min="0" step="0.01" value="0" />
        <input class="sale-line-total" type="text" value="0.00" readonly />
        <button type="button" class="sale-line-remove">Remove</button>
      </div>
    `;
  };

  const recalcSaleTotals = () => {
    let total = 0;
    linesWrap.querySelectorAll(".sale-line").forEach((line) => {
      const qty = Number(line.querySelector(".sale-line-qty").value || 0);
      const rate = Number(line.querySelector(".sale-line-rate").value || 0);
      const lineTotal = Math.max(qty, 0) * Math.max(rate, 0);
      line.querySelector(".sale-line-total").value = formatMoney(lineTotal);
      total += lineTotal;
    });
    grandTotalEl.textContent = formatMoney(total);
    return total;
  };

  const addSaleLine = () => {
    const lineId = uid("sale-line");
    const wrapper = document.createElement("div");
    wrapper.innerHTML = saleLineTemplate(lineId).trim();
    linesWrap.appendChild(wrapper.firstElementChild);
  };

  const renderInvoiceDetail = (invoiceId) => {
    const invoice = inventoryState.invoices.find((entry) => entry.id === invoiceId);
    if (!invoice) {
      detailPanel.classList.add("hidden");
      return;
    }

    const customer = customerById(invoice.customerId);
    const godown = godownById(invoice.godownId);

    detailPanel.classList.remove("hidden");
    detailPanel.innerHTML = `
      <div class="detail-head">
        <h4>${escapeHtml(invoice.invoiceNo)} (${escapeHtml(invoice.status || "Created")})</h4>
        <div class="detail-actions">
          <button type="button" id="print-invoice-btn">Print Invoice</button>
          <button type="button" id="print-chalan-btn">Print Chalan</button>
          <button type="button" id="reverse-invoice-btn">Reverse</button>
        </div>
      </div>
      <p class="module-note">Customer: ${escapeHtml(customer?.name || "Unknown")} | Godown: ${escapeHtml(godown?.name || "Default")}</p>
      <div class="table-wrap">
        <table class="inventory-table">
          <thead><tr><th>Item</th><th>Qty</th><th>Refunded Qty</th><th>Rate</th><th>Total</th></tr></thead>
          <tbody>
            ${invoice.lines.map((line) => {
              const item = itemById(line.itemId);
              return `<tr><td>${escapeHtml(item?.name || "Unknown")}</td><td>${line.qty}</td><td>${line.refundedQty || 0}</td><td>${formatMoney(line.rate)}</td><td>${formatMoney(line.lineTotal)}</td></tr>`;
            }).join("")}
          </tbody>
        </table>
      </div>
      <p><strong>Grand Total:</strong> ${formatMoney(invoice.grandTotal)}</p>
      <form id="refund-form" class="refund-form">
        <p class="module-note">${hasPermission("refundSale") ? "" : `${roleGateMessage("refundSale")} Owner PIN override is allowed.`}</p>
        <h5>Refund Sale</h5>
        <label>Line Item<select id="refund-line-select"></select></label>
        <label>Refund Qty<input id="refund-qty" type="number" min="1" step="1" value="1" /></label>
        <label>Refund Amount<input id="refund-amount" type="number" min="0" step="0.01" value="0" /></label>
        <div class="form-actions"><button type="submit">Refund</button><p id="refund-notice" class="module-note"></p></div>
      </form>
    `;

    document.getElementById("print-invoice-btn").addEventListener("click", () => openPrintWindow(invoice, { chalan: false }));
    document.getElementById("print-chalan-btn").addEventListener("click", () => openPrintWindow(invoice, { chalan: true }));

    document.getElementById("reverse-invoice-btn").addEventListener("click", async () => {
      if (!requestOwnerOverride("reverseInvoice", `Reverse ${invoice.invoiceNo}`)) {
        alert(`${roleGateMessage("reverseInvoice")} Owner override failed or cancelled.`);
        return;
      }
      if (invoice.status === "Reversed") return;
      const hasRefund = invoice.lines.some((line) => (line.refundedQty || 0) > 0);
      if (hasRefund) {
        alert("Cannot reverse an invoice that already has refunds. Use refund flow only.");
        return;
      }

      try {
        if (apiSyncEnabled) {
          await apiRequest(`/api/invoices/${invoice.id}/reverse`, { method: 'POST' });
          await hydrateInventoryStateFromApi();
        } else {
          invoice.status = "Reversed";
          invoice.reversedAt = new Date().toISOString();
          appendAuditLog("invoice.reverse", `Invoice ${invoice.invoiceNo}`);
          invoice.lines.forEach((line) => {
            appendStockMovement({
              type: "IN",
              itemId: line.itemId,
              godownId: invoice.godownId,
              qty: line.qty,
              note: `Reverse ${invoice.invoiceNo}`,
              refType: "reverse",
              refId: invoice.invoiceNo
            });
          });
          saveInventoryState();
        }
        seedKpis({ products: [] });
        drawInvoices(invoiceSearchInput.value);
        renderInvoiceDetail(invoice.id);
      } catch (error) {
        alert(error.message || 'Failed to reverse invoice.');
      }
    });

    const refundSelect = document.getElementById("refund-line-select");
    invoice.lines.forEach((line, idx) => {
      const item = itemById(line.itemId);
      const remainingQty = line.qty - (line.refundedQty || 0);
      const option = document.createElement("option");
      option.value = String(line.id || idx);
      option.textContent = `${item?.name || "Unknown"} (remaining ${remainingQty})`;
      refundSelect.appendChild(option);
    });

    document.getElementById("refund-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!requestOwnerOverride("refundSale", `Refund ${invoice.invoiceNo}`)) {
        document.getElementById("refund-notice").textContent = `${roleGateMessage("refundSale")} Owner override failed or cancelled.`;
        return;
      }
      if (invoice.status === "Reversed") {
        document.getElementById("refund-notice").textContent = "Cannot refund a reversed invoice.";
        return;
      }

      const selectedLineId = refundSelect.value;
      const line = invoice.lines.find((entry, idx) => String(entry.id || idx) === String(selectedLineId));
      const refundQty = Number(document.getElementById("refund-qty").value || 0);
      const refundAmountInput = Number(document.getElementById("refund-amount").value || 0);

      const remainingQty = line.qty - (line.refundedQty || 0);
      if (refundQty <= 0 || refundQty > remainingQty) {
        document.getElementById("refund-notice").textContent = "Invalid refund quantity.";
        return;
      }

      const computedRefund = Number(formatMoney(refundQty * Number(line.rate)));
      const refundAmount = refundAmountInput > 0 ? refundAmountInput : computedRefund;

      try {
        if (apiSyncEnabled) {
          await apiRequest(`/api/invoices/${invoice.id}/refunds`, {
            method: 'POST',
            body: JSON.stringify({ lineId: line.id || selectedLineId, qty: refundQty, amount: refundAmount })
          });
          await hydrateInventoryStateFromApi();
        } else {
          line.refundedQty = (line.refundedQty || 0) + refundQty;
          invoice.refunds = invoice.refunds || [];
          invoice.refunds.push({
            id: uid("refund"),
            lineId: line.id || selectedLineId,
            qty: refundQty,
            amount: refundAmount,
            createdAt: new Date().toISOString()
          });
          invoice.status = invoice.lines.every((entry) => (entry.refundedQty || 0) >= entry.qty) ? "Refunded" : "Partially Refunded";
          appendAuditLog("sale.refund", `Invoice ${invoice.invoiceNo} | Qty ${refundQty} | Amount ${formatMoney(refundAmount)}`);
          appendStockMovement({
            type: "IN",
            itemId: line.itemId,
            godownId: invoice.godownId,
            qty: refundQty,
            note: `Refund ${invoice.invoiceNo}`,
            refType: "refund",
            refId: invoice.invoiceNo
          });
          saveInventoryState();
        }
        seedKpis({ products: [] });
        drawInvoices(invoiceSearchInput.value);
        renderInvoiceDetail(invoice.id);
      } catch (error) {
        document.getElementById("refund-notice").textContent = error.message || 'Failed refund action.';
      }
    });
  };

  const drawInvoices = (query = "") => {
    const tbody = document.getElementById("invoice-table-body");
    const q = query.trim().toLowerCase();
    const rows = inventoryState.invoices.filter((invoice) => {
      if (!q) return true;
      const customer = customerById(invoice.customerId);
      return `${invoice.invoiceNo} ${customer?.name || ""}`.toLowerCase().includes(q);
    });

    tbody.innerHTML = "";
    if (!rows.length) {
      tbody.innerHTML = `<tr><td colspan='8' class='empty-cell'>No invoices yet.</td></tr>`;
      return;
    }

    rows.forEach((invoice) => {
      const customer = customerById(invoice.customerId);
      const godown = godownById(invoice.godownId);
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${escapeHtml(invoice.invoiceNo)}</td>
        <td>${escapeHtml(invoice.createdAt.slice(0, 10))}</td>
        <td>${escapeHtml(customer?.name || "Unknown")}</td>
        <td>${escapeHtml(godown?.name || "Default")}</td>
        <td>${invoice.lines.length}</td>
        <td>${escapeHtml(invoice.status || "Created")}</td>
        <td>${formatMoney(invoice.grandTotal)}</td>
        <td><button type="button" class="tiny-btn" data-invoice-id="${invoice.id}">View</button></td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll(".tiny-btn").forEach((button) => {
      button.addEventListener("click", () => renderInvoiceDetail(button.dataset.invoiceId));
    });
  };

  linesWrap.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    if (target.classList.contains("sale-line-item")) {
      const line = target.closest(".sale-line");
      if (!line) return;
      const item = itemById(target.value);
      line.querySelector(".sale-line-rate").value = String(item?.regularPrice || 0);
      recalcSaleTotals();
      return;
    }

    if (target.classList.contains("sale-line-qty") || target.classList.contains("sale-line-rate")) {
      recalcSaleTotals();
    }
  });

  linesWrap.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target.closest(".sale-line-remove") : null;
    if (!target) return;
    const line = target.closest(".sale-line");
    if (!line) return;
    line.remove();
    recalcSaleTotals();
  });

  document.getElementById("add-sale-line").addEventListener("click", addSaleLine);

  saleForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const customerId = customerSelect.value;
    const paymentMethod = document.getElementById("sale-payment-method").value;
    const chosenGodownId = godownSelect.value || ensureDefaultGodown();

    if (!customerId) {
      saleNotice.textContent = "Please select a customer.";
      return;
    }

    const lines = [];
    let hasError = false;
    let validationMessage = "";

    linesWrap.querySelectorAll(".sale-line").forEach((line) => {
      const itemId = line.querySelector(".sale-line-item").value;
      const qty = Number(line.querySelector(".sale-line-qty").value || 0);
      const rate = Number(line.querySelector(".sale-line-rate").value || 0);
      const item = itemById(itemId);

      if (!itemId || !item || qty <= 0 || rate < 0) {
        hasError = true;
        validationMessage = "Please provide valid item lines.";
        return;
      }

      if (!hasPermission("discountBelowMin") && rate < Number(item.minimumPrice || 0)) {
        const ok = requestOwnerOverride("discountBelowMin", `${item.name} below minimum`);
        if (!ok) {
          validationMessage = `${item.name} rate cannot be below minimum (${formatMoney(item.minimumPrice)}).`;
          hasError = true;
          return;
        }
      }

      lines.push({
        itemId,
        qty,
        refundedQty: 0,
        rate,
        lineTotal: qty * rate
      });
    });

    if (hasError || !lines.length) {
      saleNotice.textContent = validationMessage || "Please provide valid item lines.";
      return;
    }

    const insufficient = lines.find((line) => getStockBalance(line.itemId, chosenGodownId) < line.qty);
    if (insufficient) {
      const item = itemById(insufficient.itemId);
      saleNotice.textContent = `Insufficient stock for ${item?.name || "item"} in selected/default godown.`;
      return;
    }

    const grandTotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);

    try {
      let createdInvoiceNo = '';
      if (apiSyncEnabled) {
        const payload = {
          customerId,
          godownId: chosenGodownId,
          paymentMethod,
          lines: lines.map((line) => ({
            itemId: line.itemId,
            qty: line.qty,
            rate: line.rate,
            description: line.description || ''
          }))
        };
        const created = await apiRequest('/api/sales', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        createdInvoiceNo = created.invoice_no || created.invoiceNo || created.numbering?.invoiceNo || '';
        await hydrateInventoryStateFromApi();
      } else {
        const invoiceNo = `INV-${Date.now().toString().slice(-7)}`;
        createdInvoiceNo = invoiceNo;
        inventoryState.invoices.unshift({
          id: uid("invoice"),
          invoiceNo,
          customerId,
          godownId: chosenGodownId,
          paymentMethod,
          status: "Created",
          refunds: [],
          lines,
          grandTotal,
          createdAt: new Date().toISOString()
        });
        appendAuditLog("sale.create", `${invoiceNo} | Items ${lines.length} | Total ${formatMoney(grandTotal)}`);
        lines.forEach((line) => {
          appendStockMovement({
            type: "OUT",
            itemId: line.itemId,
            godownId: chosenGodownId,
            qty: line.qty,
            note: `Sold via ${invoiceNo}`,
            refType: "invoice",
            refId: invoiceNo
          });
        });
        saveInventoryState();
      }

      seedKpis({ products: [] });
      drawInvoices(invoiceSearchInput.value);
      linesWrap.innerHTML = "";
      addSaleLine();
      customerSelect.value = "";
      godownSelect.value = "";
      grandTotalEl.textContent = "0.00";
      saleNotice.textContent = `Invoice ${createdInvoiceNo || ''} created.`.trim();
    } catch (error) {
      saleNotice.textContent = error.message || 'Failed to create invoice.';
    }
  });

  invoiceSearchInput.addEventListener("input", () => drawInvoices(invoiceSearchInput.value));

  drawCustomerOptions();
  drawGodownOptions();
  addSaleLine();
  drawInvoices();
}


function renderStockWorkspace(container) {
  container.innerHTML = `
    <div class="workspace-head">
      <h3>Stock & Godowns</h3>
      <p class="module-note">Manage godowns, stock in/out, godown transfer, and batch stock editing. Current role: <strong id="stock-role-label"></strong>.</p>
    </div>

    <div class="split-grid">
      <form id="godown-form" class="mini-form card-muted">
        <h4>Add Godown</h4>
        <label>
          Godown Name *
          <input id="godown-name" required placeholder="Main Warehouse" />
        </label>
        <div class="form-actions">
          <button type="submit">Save Godown</button>
          <p id="godown-notice" class="module-note"></p>
        </div>
        <ul id="godown-list" class="chip-list"></ul>
      </form>

      <form id="stock-form" class="customer-form-grid card-muted">
        <h4 class="full-row">Stock Movement</h4>
        <label>
          Item *
          <select id="stock-item" required></select>
        </label>
        <label>
          Godown *
          <select id="stock-godown" required></select>
        </label>
        <label>
          Movement Type *
          <select id="stock-type" required>
            <option value="IN">Stock In</option>
            <option value="OUT">Stock Out</option>
          </select>
        </label>
        <label>
          Quantity *
          <input id="stock-qty" type="number" min="1" step="1" required value="1" />
        </label>
        <label class="full-row">
          Note
          <input id="stock-note" placeholder="Supplier delivery / adjustment" />
        </label>
        <div class="full-row form-actions">
          <button type="submit">Record Movement</button>
          <p id="stock-notice" class="module-note"></p>
        </div>
      </form>
    </div>

    <form id="transfer-form" class="card-muted transfer-grid">
      <h4 class="full-row">Transfer Between Godowns</h4>
      <label>Item *<select id="transfer-item" required></select></label>
      <label>From Godown *<select id="transfer-from" required></select></label>
      <label>To Godown *<select id="transfer-to" required></select></label>
      <label>Quantity *<input id="transfer-qty" type="number" min="1" step="1" value="1" required /></label>
      <label class="full-row">Note<input id="transfer-note" placeholder="Transfer note" /></label>
      <div class="full-row form-actions">
        <button type="submit" id="transfer-stock-btn">Transfer Stock</button>
        <p id="transfer-notice" class="module-note"></p>
      </div>
    </form>

    <section class="card-muted">
      <div class="customer-table-head">
        <h4>Batch Stock Editor</h4>
        <select id="batch-godown-select"></select>
      </div>
      <div class="table-wrap">
        <table class="inventory-table compact-table">
          <thead><tr><th>Item</th><th>Current Qty</th><th>Adjustment (+/-)</th></tr></thead>
          <tbody id="batch-stock-body"></tbody>
        </table>
      </div>
      <div class="form-actions" style="margin-top:0.6rem;">
        <button id="apply-batch-btn" type="button">Apply Batch Adjustment</button>
        <p id="batch-notice" class="module-note"></p>
      </div>
    </section>

    <div class="customer-table-head">
      <h4>Current Stock Balance</h4>
      <input id="stock-search" type="search" placeholder="Search item or godown" />
    </div>

    <div class="table-wrap">
      <table class="inventory-table">
        <thead>
          <tr><th>Item</th><th>Godown</th><th>Balance</th></tr>
        </thead>
        <tbody id="stock-balance-body"></tbody>
      </table>
    </div>

    <div class="customer-table-head"><h4>Recent Movements</h4></div>
    <div class="table-wrap">
      <table class="inventory-table">
        <thead><tr><th>Date</th><th>Type</th><th>Item</th><th>Godown</th><th>Qty</th><th>Note</th></tr></thead>
        <tbody id="stock-movement-body"></tbody>
      </table>
    </div>
  `;

  const godownForm = document.getElementById("godown-form");
  const godownNotice = document.getElementById("godown-notice");
  const godownList = document.getElementById("godown-list");

  const stockForm = document.getElementById("stock-form");
  const stockNotice = document.getElementById("stock-notice");
  const stockItemSelect = document.getElementById("stock-item");
  const stockGodownSelect = document.getElementById("stock-godown");
  const stockSearchInput = document.getElementById("stock-search");

  const transferForm = document.getElementById("transfer-form");
  const transferNotice = document.getElementById("transfer-notice");
  const transferItemSelect = document.getElementById("transfer-item");
  const transferFromSelect = document.getElementById("transfer-from");
  const transferToSelect = document.getElementById("transfer-to");

  const batchGodownSelect = document.getElementById("batch-godown-select");
  const batchBody = document.getElementById("batch-stock-body");
  const batchNotice = document.getElementById("batch-notice");
  const stockRoleLabel = document.getElementById("stock-role-label");
  if (stockRoleLabel) stockRoleLabel.textContent = ROLE_LABELS[currentRole] || "Owner";
  if (!hasPermission("transferStock")) transferNotice.textContent = `${roleGateMessage("transferStock")} Owner PIN override is allowed.`;
  if (!hasPermission("batchAdjust")) batchNotice.textContent = `${roleGateMessage("batchAdjust")} Owner PIN override is allowed.`;

  const drawGodowns = () => {
    if (!inventoryState.godowns.length) ensureDefaultGodown();
    godownList.innerHTML = "";

    const fill = (select, placeholder = "Select godown") => {
      select.innerHTML = `<option value=''>${placeholder}</option>`;
      inventoryState.godowns.forEach((godown) => {
        const option = document.createElement("option");
        option.value = godown.id;
        option.textContent = godown.name;
        select.appendChild(option);
      });
    };

    fill(stockGodownSelect);
    fill(transferFromSelect, "From godown");
    fill(transferToSelect, "To godown");
    fill(batchGodownSelect, "Select godown for batch");

    inventoryState.godowns.forEach((godown) => {
      const li = document.createElement("li");
      li.className = "chip-item";
      li.textContent = godown.name;
      godownList.appendChild(li);
    });
  };

  const drawItems = () => {
    const fill = (select) => {
      select.innerHTML = "<option value=''>Select item</option>";
      inventoryState.items.forEach((item) => {
        const option = document.createElement("option");
        option.value = item.id;
        option.textContent = `${item.name} (${item.sku || "No SKU"})`;
        select.appendChild(option);
      });
    };
    fill(stockItemSelect);
    fill(transferItemSelect);
  };

  const drawBatchEditor = () => {
    const godownId = batchGodownSelect.value;
    batchBody.innerHTML = "";
    if (!godownId) {
      batchBody.innerHTML = `<tr><td colspan='3' class='empty-cell'>Select a godown to edit stock in batch.</td></tr>`;
      return;
    }

    if (!inventoryState.items.length) {
      batchBody.innerHTML = `<tr><td colspan='3' class='empty-cell'>No items available.</td></tr>`;
      return;
    }

    inventoryState.items.forEach((item) => {
      const current = getStockBalance(item.id, godownId);
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${escapeHtml(item.name)}</td>
        <td>${current}</td>
        <td><input class="batch-adjust-input" data-item-id="${item.id}" type="number" step="1" value="0" /></td>
      `;
      batchBody.appendChild(tr);
    });
  };

  const drawBalances = (query = "") => {
    const tbody = document.getElementById("stock-balance-body");
    const q = query.trim().toLowerCase();
    const balances = stockBalanceMap();

    tbody.innerHTML = "";
    const rows = [];
    for (const [key, qty] of balances.entries()) {
      const [itemId, godownId] = key.split("__");
      const item = itemById(itemId);
      const godown = godownById(godownId);
      const text = `${item?.name || ""} ${godown?.name || ""}`.toLowerCase();
      if (q && !text.includes(q)) continue;
      rows.push({ item, godown, qty });
    }

    if (!rows.length) {
      tbody.innerHTML = `<tr><td colspan='3' class='empty-cell'>No stock balance entries.</td></tr>`;
      return;
    }

    rows.forEach((row) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${escapeHtml(row.item?.name || "Unknown")}</td><td>${escapeHtml(row.godown?.name || "Unknown")}</td><td>${row.qty}</td>`;
      tbody.appendChild(tr);
    });
  };

  const drawMovements = () => {
    const tbody = document.getElementById("stock-movement-body");
    tbody.innerHTML = "";
    const rows = inventoryState.stockMovements.slice(0, 40);
    if (!rows.length) {
      tbody.innerHTML = `<tr><td colspan='6' class='empty-cell'>No stock movements yet.</td></tr>`;
      return;
    }

    rows.forEach((entry) => {
      const item = itemById(entry.itemId);
      const godown = godownById(entry.godownId);
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${escapeHtml(entry.createdAt.slice(0, 10))}</td>
        <td>${escapeHtml(entry.type)}</td>
        <td>${escapeHtml(item?.name || "Unknown")}</td>
        <td>${escapeHtml(godown?.name || "Unknown")}</td>
        <td>${entry.qty}</td>
        <td>${escapeHtml(entry.note || "-")}</td>
      `;
      tbody.appendChild(tr);
    });
  };

  godownForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const nameInput = document.getElementById("godown-name");
    const name = nameInput.value.trim();
    if (!name) return;
    const exists = inventoryState.godowns.some((godown) => godown.name.toLowerCase() === name.toLowerCase());
    if (exists) {
      godownNotice.textContent = "Godown already exists.";
      return;
    }

    try {
      if (apiSyncEnabled) {
        await apiRequest('/api/inventory/godowns', {
          method: 'POST',
          body: JSON.stringify({ name })
        });
        await hydrateInventoryStateFromApi();
      } else {
        inventoryState.godowns.push({ id: uid("godown"), name, createdAt: new Date().toISOString() });
        saveInventoryState();
      }
      drawGodowns();
      drawBatchEditor();
      drawBalances(stockSearchInput.value);
      godownForm.reset();
      godownNotice.textContent = "Godown saved.";
    } catch (error) {
      godownNotice.textContent = error.message || 'Failed to save godown.';
    }
  });

  stockForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const itemId = stockItemSelect.value;
    const godownId = stockGodownSelect.value;
    const type = document.getElementById("stock-type").value;
    const qty = Number(document.getElementById("stock-qty").value || 0);
    const note = document.getElementById("stock-note").value.trim();

    if (!itemId || !godownId || qty <= 0) {
      stockNotice.textContent = "Item, godown and quantity are required.";
      return;
    }
    if (type === "OUT" && getStockBalance(itemId, godownId) < qty) {
      stockNotice.textContent = "Insufficient stock for this movement.";
      return;
    }

    try {
      if (apiSyncEnabled) {
        await apiRequest('/api/inventory/stock/movements', {
          method: 'POST',
          body: JSON.stringify({ type, itemId, godownId, qty, note, refType: 'manual' })
        });
        await hydrateInventoryStateFromApi();
      } else {
        appendStockMovement({ type, itemId, godownId, qty, note, refType: "manual" });
        appendAuditLog("stock.movement", `${type} ${qty} of ${itemById(itemId)?.name || "Item"} @ ${godownById(godownId)?.name || "-"}`);
        saveInventoryState();
      }
      seedKpis({ products: [] });
      drawBatchEditor();
      drawBalances(stockSearchInput.value);
      drawMovements();
      stockForm.reset();
      document.getElementById("stock-qty").value = "1";
      stockNotice.textContent = "Stock movement recorded.";
    } catch (error) {
      stockNotice.textContent = error.message || 'Failed to record movement.';
    }
  });

  transferForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!requestOwnerOverride("transferStock", "Stock transfer")) {
      transferNotice.textContent = `${roleGateMessage("transferStock")} Owner override failed or cancelled.`;
      return;
    }
    const itemId = transferItemSelect.value;
    const fromId = transferFromSelect.value;
    const toId = transferToSelect.value;
    const qty = Number(document.getElementById("transfer-qty").value || 0);
    const note = document.getElementById("transfer-note").value.trim();

    if (!itemId || !fromId || !toId || qty <= 0) {
      transferNotice.textContent = "Item, from, to and quantity are required.";
      return;
    }
    if (fromId === toId) {
      transferNotice.textContent = "From and to godown must be different.";
      return;
    }
    if (getStockBalance(itemId, fromId) < qty) {
      transferNotice.textContent = "Insufficient stock in source godown.";
      return;
    }

    try {
      if (apiSyncEnabled) {
        await apiRequest('/api/inventory/stock/movements', {
          method: 'POST',
          body: JSON.stringify({ type: 'OUT', itemId, godownId: fromId, qty, note: note || 'Transfer out', refType: 'transfer' })
        });
        await apiRequest('/api/inventory/stock/movements', {
          method: 'POST',
          body: JSON.stringify({ type: 'IN', itemId, godownId: toId, qty, note: note || 'Transfer in', refType: 'transfer' })
        });
        await hydrateInventoryStateFromApi();
      } else {
        appendStockMovement({ type: "OUT", itemId, godownId: fromId, qty, note: note || "Transfer out", refType: "transfer" });
        appendStockMovement({ type: "IN", itemId, godownId: toId, qty, note: note || "Transfer in", refType: "transfer" });
        appendAuditLog("stock.transfer", `${itemById(itemId)?.name || "Item"}: ${qty} from ${godownById(fromId)?.name || "-"} to ${godownById(toId)?.name || "-"}`);
        saveInventoryState();
      }
      seedKpis({ products: [] });
      drawBatchEditor();
      drawBalances(stockSearchInput.value);
      drawMovements();
      transferForm.reset();
      document.getElementById("transfer-qty").value = "1";
      transferNotice.textContent = "Transfer completed.";
    } catch (error) {
      transferNotice.textContent = error.message || 'Failed to transfer stock.';
    }
  });

  document.getElementById("apply-batch-btn").addEventListener("click", async () => {
    if (!requestOwnerOverride("batchAdjust", "Batch stock adjustment")) {
      batchNotice.textContent = `${roleGateMessage("batchAdjust")} Owner override failed or cancelled.`;
      return;
    }
    const godownId = batchGodownSelect.value;
    if (!godownId) {
      batchNotice.textContent = "Select godown for batch editing.";
      return;
    }

    let applied = 0;
    batchBody.querySelectorAll(".batch-adjust-input").forEach((input) => {
      const delta = Number(input.value || 0);
      if (!delta) return;
      const itemId = input.dataset.itemId;
      if (delta < 0 && getStockBalance(itemId, godownId) < Math.abs(delta)) return;
      appendStockMovement({
        type: delta > 0 ? "IN" : "OUT",
        itemId,
        godownId,
        qty: Math.abs(delta),
        note: "Batch adjustment",
        refType: "batch"
      });
      applied += 1;
    });

    if (!applied) {
      batchNotice.textContent = "No valid adjustments to apply.";
      return;
    }

    try {
      if (apiSyncEnabled) {
        const requests = [];
        batchBody.querySelectorAll('.batch-adjust-input').forEach((input) => {
          const delta = Number(input.value || 0);
          if (!delta) return;
          const itemId = input.dataset.itemId;
          if (delta < 0 && getStockBalance(itemId, godownId) < Math.abs(delta)) return;
          requests.push(apiRequest('/api/inventory/stock/movements', {
            method: 'POST',
            body: JSON.stringify({
              type: delta > 0 ? 'IN' : 'OUT',
              itemId,
              godownId,
              qty: Math.abs(delta),
              note: 'Batch adjustment',
              refType: 'batch'
            })
          }));
        });
        await Promise.all(requests);
        await hydrateInventoryStateFromApi();
      } else {
        appendAuditLog("stock.batch_adjust", `Godown ${godownById(godownId)?.name || "-"} | Adjustments ${applied}`);
        saveInventoryState();
      }
      seedKpis({ products: [] });
      drawBatchEditor();
      drawBalances(stockSearchInput.value);
      drawMovements();
      batchNotice.textContent = `Applied ${applied} adjustment(s).`;
    } catch (error) {
      batchNotice.textContent = error.message || 'Failed to apply batch.';
    }
  });

  batchGodownSelect.addEventListener("change", drawBatchEditor);
  stockSearchInput.addEventListener("input", () => drawBalances(stockSearchInput.value));

  drawGodowns();
  drawItems();
  drawBatchEditor();
  drawBalances();
  drawMovements();
}


function renderItemsWorkspace(container) {
  container.innerHTML = `
    <div class="workspace-head">
      <h3>Item & Category Management</h3>
      <p class="module-note">Add item categories and maintain item master data for sales and stock modules.</p>
    </div>

    <div class="split-grid">
      <form id="category-form" class="mini-form card-muted">
        <h4>Create Category</h4>
        <label>
          Category Name *
          <input id="category-name" required placeholder="Electrical" />
        </label>
        <div class="form-actions">
          <button type="submit">Add Category</button>
          <p id="category-notice" class="module-note"></p>
        </div>
        <ul id="category-list" class="chip-list"></ul>
      </form>

      <form id="item-form" class="customer-form-grid card-muted">
        <h4 class="full-row">Create Item</h4>
        <label>
          Item Name *
          <input id="item-name" required placeholder="Panda 678 Black" />
        </label>
        <label>
          SKU
          <input id="item-sku" placeholder="PD-678-BLK" />
        </label>
        <label>
          Category *
          <select id="item-category" required></select>
        </label>
        <label>
          Regular Price *
          <input id="item-regular-price" type="number" min="0" step="0.01" required placeholder="320" />
        </label>
        <label>
          Minimum Price *
          <input id="item-minimum-price" type="number" min="0" step="0.01" required placeholder="300" />
        </label>
        <label class="full-row">
          Description
          <textarea id="item-description" placeholder="Item details"></textarea>
        </label>
        <div class="full-row form-actions">
          <button type="submit">Save Item</button>
          <p id="item-notice" class="module-note"></p>
        </div>
      </form>
    </div>

    <div class="customer-table-head">
      <h4>Item List</h4>
      <input id="item-search" type="search" placeholder="Search name, SKU, category" />
    </div>

    <div class="table-wrap">
      <table class="inventory-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>SKU</th>
            <th>Category</th>
            <th>Regular Price</th>
            <th>Minimum Price</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody id="item-table-body"></tbody>
      </table>
    </div>
  `;

  const categoryForm = document.getElementById("category-form");
  const categoryNotice = document.getElementById("category-notice");
  const categorySelect = document.getElementById("item-category");
  const categoryList = document.getElementById("category-list");

  const itemForm = document.getElementById("item-form");
  const itemNotice = document.getElementById("item-notice");
  const itemSearchInput = document.getElementById("item-search");

  const drawCategoryUI = () => {
    categoryList.innerHTML = "";
    categorySelect.innerHTML = "<option value=''>Select category</option>";

    inventoryState.categories.forEach((category) => {
      const option = document.createElement("option");
      option.value = category.id;
      option.textContent = category.name;
      categorySelect.appendChild(option);

      const li = document.createElement("li");
      li.className = "chip-item";
      li.textContent = category.name;
      categoryList.appendChild(li);
    });

    if (!inventoryState.categories.length) {
      categoryList.innerHTML = "<li class='module-note'>No categories yet.</li>";
    }
  };

  const drawItems = (query = "") => {
    const tbody = document.getElementById("item-table-body");
    const q = query.trim().toLowerCase();
    const rows = inventoryState.items.filter((item) => {
      if (!q) return true;
      const haystack = `${item.name} ${item.sku || ""} ${categoryNameById(item.categoryId)}`.toLowerCase();
      return haystack.includes(q);
    });

    tbody.innerHTML = "";
    if (!rows.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="empty-cell">No items found.</td></tr>`;
      return;
    }

    rows.forEach((item) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${escapeHtml(item.name)}</td>
        <td>${escapeHtml(item.sku || "-")}</td>
        <td>${escapeHtml(categoryNameById(item.categoryId))}</td>
        <td>${Number(item.regularPrice).toFixed(2)}</td>
        <td>${Number(item.minimumPrice).toFixed(2)}</td>
        <td>${escapeHtml(item.description || "-")}</td>
      `;
      tbody.appendChild(tr);
    });
  };

  categoryForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const input = document.getElementById("category-name");
    const categoryName = input.value.trim();
    if (!categoryName) return;

    const duplicate = inventoryState.categories.some((category) => category.name.toLowerCase() === categoryName.toLowerCase());
    if (duplicate) {
      categoryNotice.textContent = "Category already exists.";
      return;
    }

    try {
      if (apiSyncEnabled) {
        await apiRequest('/api/inventory/categories', {
          method: 'POST',
          body: JSON.stringify({ name: categoryName })
        });
        await hydrateInventoryStateFromApi();
      } else {
        inventoryState.categories.push({
          id: uid("category"),
          name: categoryName,
          createdAt: new Date().toISOString()
        });
        saveInventoryState();
      }
      drawCategoryUI();
      categoryForm.reset();
      categoryNotice.textContent = "Category added.";
    } catch (error) {
      categoryNotice.textContent = error.message || 'Failed to add category.';
    }
  });

  itemForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = document.getElementById("item-name").value.trim();
    const sku = document.getElementById("item-sku").value.trim();
    const categoryId = document.getElementById("item-category").value;
    const regularPrice = Number(document.getElementById("item-regular-price").value);
    const minimumPrice = Number(document.getElementById("item-minimum-price").value);
    const description = document.getElementById("item-description").value.trim();

    if (!name || !categoryId || Number.isNaN(regularPrice) || Number.isNaN(minimumPrice)) {
      itemNotice.textContent = "Please complete all required fields.";
      return;
    }

    if (minimumPrice > regularPrice) {
      itemNotice.textContent = "Minimum price cannot be greater than regular price.";
      return;
    }

    try {
      if (apiSyncEnabled) {
        await apiRequest('/api/inventory/items', {
          method: 'POST',
          body: JSON.stringify({
            name,
            sku,
            categoryId,
            regularPrice,
            minimumPrice,
            description
          })
        });
        await hydrateInventoryStateFromApi();
      } else {
        inventoryState.items.unshift({
          id: uid("item"),
          name,
          sku,
          categoryId,
          regularPrice,
          minimumPrice,
          description,
          createdAt: new Date().toISOString()
        });
        saveInventoryState();
      }
      seedKpis({ products: [] });
      drawCategoryUI();
      drawItems(itemSearchInput.value);
      itemForm.reset();
      itemNotice.textContent = "Item saved successfully.";
    } catch (error) {
      itemNotice.textContent = error.message || 'Failed to save item.';
    }
  });

  itemSearchInput.addEventListener("input", () => drawItems(itemSearchInput.value));

  drawCategoryUI();
  drawItems();
}

function renderCustomersWorkspace(container) {
  container.innerHTML = `
    <div class="workspace-head">
      <h3>Customer Management</h3>
      <p class="module-note">Add customer profiles, track activity level, and open purchase/due details.</p>
    </div>

    <form id="customer-form" class="customer-form-grid">
      <label>
        Name *
        <input id="customer-name" required placeholder="Customer full name" />
      </label>
      <label>
        Mobile *
        <input id="customer-phone" required placeholder="017xxxxxxxx" />
      </label>
      <label>
        Address
        <input id="customer-address" placeholder="Dhaka" />
      </label>
      <label>
        Last Purchase Date
        <input id="customer-last-purchase" type="date" />
      </label>
      <label class="full-row">
        Note
        <textarea id="customer-note" placeholder="Any important details"></textarea>
      </label>
      <div class="full-row form-actions">
        <button type="submit">Save Customer</button>
        <p id="customer-notice" class="module-note"></p>
      </div>
    </form>

    <section id="customer-detail-panel" class="card-muted hidden"></section>

    <div class="customer-table-head">
      <h4>Customer List</h4>
      <input id="customer-search" type="search" placeholder="Search name, mobile, address" />
    </div>

    <div class="table-wrap">
      <table class="inventory-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Mobile</th>
            <th>Address</th>
            <th>Last Purchase</th>
            <th>Activity</th>
            <th>Due</th>
            <th>Note</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody id="customer-table-body"></tbody>
      </table>
    </div>
  `;

  const form = document.getElementById("customer-form");
  const notice = document.getElementById("customer-notice");
  const searchInput = document.getElementById("customer-search");
  const detailPanel = document.getElementById("customer-detail-panel");

  const customerFinancials = (customerId) => {
    const invoices = (inventoryState.invoices || []).filter((inv) => inv.customerId === customerId && inv.status !== "Reversed");
    const gross = invoices.reduce((sum, inv) => sum + Number(inv.grandTotal || 0), 0);
    const refunded = invoices.reduce((sum, inv) => sum + (inv.refunds || []).reduce((s, r) => s + Number(r.amount || 0), 0), 0);
    const net = gross - refunded;
    const paid = invoices.filter((inv) => inv.paymentMethod !== "Credit").reduce((sum, inv) => sum + Number(inv.grandTotal || 0), 0);
    const due = Math.max(net - paid, 0);
    return { invoices, gross, refunded, net, paid, due };
  };

  const renderCustomerDetail = (customerId) => {
    const customer = customerById(customerId);
    if (!customer) {
      detailPanel.classList.add("hidden");
      return;
    }

    const financials = customerFinancials(customerId);
    detailPanel.classList.remove("hidden");
    detailPanel.innerHTML = `
      <div class="detail-head">
        <h4>${escapeHtml(customer.name)} — Customer Detail</h4>
        <div class="detail-actions"><button type="button" id="close-customer-detail" class="tiny-btn">Close</button></div>
      </div>
      <p class="module-note">Mobile: ${escapeHtml(customer.phone)} | Address: ${escapeHtml(customer.address || "-")}</p>
      <div class="mini-kpi-grid">
        <article class="card-muted"><p>Total Purchase</p><h4>${formatMoney(financials.net)}</h4></article>
        <article class="card-muted"><p>Total Due</p><h4>${formatMoney(financials.due)}</h4></article>
        <article class="card-muted"><p>Invoices</p><h4>${financials.invoices.length}</h4></article>
      </div>
      <div class="table-wrap">
        <table class="inventory-table compact-table">
          <thead><tr><th>Invoice</th><th>Date</th><th>Status</th><th>Payment</th><th>Total</th><th>Refund</th></tr></thead>
          <tbody>
            ${financials.invoices.length ? financials.invoices.map((inv) => {
              const refundAmount = (inv.refunds || []).reduce((s, r) => s + Number(r.amount || 0), 0);
              return `<tr><td>${escapeHtml(inv.invoiceNo)}</td><td>${escapeHtml((inv.createdAt || "").slice(0, 10))}</td><td>${escapeHtml(inv.status || "Created")}</td><td>${escapeHtml(inv.paymentMethod || "-")}</td><td>${formatMoney(inv.grandTotal)}</td><td>${formatMoney(refundAmount)}</td></tr>`;
            }).join("") : '<tr><td colspan="6" class="empty-cell">No purchases yet.</td></tr>'}
          </tbody>
        </table>
      </div>
    `;

    document.getElementById("close-customer-detail").addEventListener("click", () => {
      detailPanel.classList.add("hidden");
      detailPanel.innerHTML = "";
    });
  };

  const drawRows = (query = "") => {
    const tbody = document.getElementById("customer-table-body");
    const q = query.trim().toLowerCase();
    const rows = inventoryState.customers.filter((customer) => {
      if (!q) return true;
      return [customer.name, customer.phone, customer.address]
        .map((value) => (value || "").toLowerCase())
        .join(" ")
        .includes(q);
    });

    tbody.innerHTML = "";

    if (!rows.length) {
      tbody.innerHTML = `<tr><td colspan="8" class="empty-cell">No customers found.</td></tr>`;
      return;
    }

    rows.forEach((customer) => {
      const status = customerActivity(customer);
      const due = customerFinancials(customer.id).due;
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${escapeHtml(customer.name)}</td>
        <td>${escapeHtml(customer.phone)}</td>
        <td>${escapeHtml(customer.address || "-")}</td>
        <td>${escapeHtml(customer.lastPurchaseAt || "-")}</td>
        <td><span class="status-pill ${status.tone}">${status.label}</span></td>
        <td>${formatMoney(due)}</td>
        <td>${escapeHtml(customer.note || "-")}</td>
        <td><button type="button" class="tiny-btn customer-view-btn" data-customer-id="${customer.id}">View</button></td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.customer-view-btn').forEach((button) => {
      button.addEventListener('click', () => renderCustomerDetail(button.dataset.customerId));
    });
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const name = document.getElementById("customer-name").value.trim();
    const phone = document.getElementById("customer-phone").value.trim();
    const address = document.getElementById("customer-address").value.trim();
    const note = document.getElementById("customer-note").value.trim();
    const lastPurchaseAt = document.getElementById("customer-last-purchase").value;

    if (!name || !phone) {
      notice.textContent = "Name and mobile are required.";
      return;
    }

    try {
      if (apiSyncEnabled) {
        await apiRequest('/api/customers', {
          method: 'POST',
          body: JSON.stringify({ name, phone, address, note, lastPurchaseAt })
        });
        await hydrateInventoryStateFromApi();
      } else {
        inventoryState.customers.unshift({
          id: uid("customer"),
          name,
          phone,
          address,
          note,
          lastPurchaseAt,
          createdAt: new Date().toISOString()
        });
        saveInventoryState();
      }
      seedKpis({ products: [] });
      form.reset();
      notice.textContent = "Customer saved successfully.";
      drawRows(searchInput.value);
    } catch (error) {
      notice.textContent = error.message || 'Failed to save customer.';
    }
  });

  searchInput.addEventListener("input", () => drawRows(searchInput.value));
  drawRows();
}


function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function bootstrapInventoryWorkspace() {
  const isLoggedIn = await getAdminSession();
  if (!isLoggedIn) {
    window.location.href = "admin-login.html";
    return;
  }

  inventoryState = loadInventoryState();
  currentRole = loadInventoryRole();
  await hydrateInventoryStateFromApi();

  const data = await loadTopSealData();
  setBranding(data);
  setupModuleNavigation();
  setModuleView("dashboard");
  seedKpis(data);

  document.getElementById("inventory-new-sale").addEventListener("click", () => {
    setModuleView("sales");
  });

  const roleSelect = document.getElementById("inventory-role-select");
  if (roleSelect) {
    roleSelect.value = currentRole;
    roleSelect.addEventListener("change", () => {
      const previousRole = currentRole;
      saveInventoryRole(roleSelect.value);
      appendAuditLog("role.switch", `${ROLE_LABELS[previousRole] || previousRole} -> ${ROLE_LABELS[currentRole] || currentRole}`);
      saveInventoryState();
      const activeModule = document.querySelector(".inventory-nav-item.active")?.dataset?.module || "dashboard";
      setModuleView(activeModule);
    });
  }

  const globalSearchInput = document.getElementById("inventory-global-search");
  globalSearchInput.addEventListener("input", () => {
    const activeModule = document.querySelector(".inventory-nav-item.active")?.dataset?.module;
    if (activeModule === "customers") {
      const customerSearch = document.getElementById("customer-search");
      if (!customerSearch) return;
      customerSearch.value = globalSearchInput.value;
      customerSearch.dispatchEvent(new Event("input"));
      return;
    }

    if (activeModule === "items") {
      const itemSearch = document.getElementById("item-search");
      if (!itemSearch) return;
      itemSearch.value = globalSearchInput.value;
      itemSearch.dispatchEvent(new Event("input"));
      return;
    }

    if (activeModule === "sales") {
      const invoiceSearch = document.getElementById("invoice-search");
      if (!invoiceSearch) return;
      invoiceSearch.value = globalSearchInput.value;
      invoiceSearch.dispatchEvent(new Event("input"));
      return;
    }

    if (activeModule === "stock") {
      const stockSearch = document.getElementById("stock-search");
      if (!stockSearch) return;
      stockSearch.value = globalSearchInput.value;
      stockSearch.dispatchEvent(new Event("input"));
    }
  });
}

bootstrapInventoryWorkspace();
