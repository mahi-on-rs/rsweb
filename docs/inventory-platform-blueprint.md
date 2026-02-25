# Inventory Platform Blueprint

## 1. Goal
Build a new **inventory + sales web app** hosted in the same Render project, while reusing:
- Existing API environment patterns (auth, env vars, deployment conventions).
- Existing admin panel settings for business-level branding/configuration (name, theme colors, contact metadata, etc.).

This document translates your feature list into a build-ready structure.

---

## 2. Product Scope (V1)

### Core workflows
1. Dashboard and analytics (sales, invoice signals, trends).
2. Product master data management (item catalog, category, default/last price, description).
3. Stock management (incoming/outgoing, batch updates, transfer between godowns).
4. Sales and invoice lifecycle (create, print invoice, print chalan, reverse, refund).
5. Customer management (search, profile, recent invoices, activity scoring).

### Print definitions
- **Invoice**: standard bill with prices and totals.
- **Chalan**: dispatch note with item + quantity only (no price columns).

---

## 3. IA / Navigation

## Primary modules
- Dashboard
- Sales
  - New Sale
  - Invoice List
  - Refunds
- Inventory
  - Items
  - Stock Ledger
  - Godowns
  - Transfer
- Customers
  - Customer List
  - Customer Profile
- Reports
  - Sales Analysis
  - Item Movement
  - Due / Collections

## Shared UX requirements
- Global search in header (items + customers).
- Table-level search in item and customer lists.
- Quick-create customer from “New Sale”.
- Professional “purple modern” aesthetic + clean enterprise spacing.

---

## 4. Feature-to-Module Mapping

| Requirement | Proposed module |
|---|---|
| Sales analysis + recent sales + invoices | Dashboard + Reports |
| Animated charts (pie/line/bar) from real data | Dashboard analytics widgets |
| Create new sale | Sales / New Sale |
| Add/edit items | Inventory / Items |
| Add/edit stock + batch edit | Inventory / Stock Ledger |
| Item category split | Inventory / Categories |
| Stock incoming/outgoing | Inventory transactions |
| Multiple godowns + transfer | Inventory / Godowns + Transfer |
| Auto stock deduction on sale (with/without godown selected) | Sales + stock service |
| Reverse sale / invoice | Sales action (void/reverse) |
| Refund sale (qty + amount) | Refund workflow |
| Print invoice + print chalan | Invoice detail page |
| View/add customers + profile history + due | Customer module |
| Customer activity status (green/yellow/red) | Customer scoring service |
| Item/customer typeahead in forms | Reusable search components |

---

## 5. Data Model (recommended)

## Entities
- `customers`
- `items`
- `item_categories`
- `godowns`
- `stock_balances` (item + godown aggregated qty)
- `stock_movements` (in/out/transfer audit trail)
- `sales`
- `sale_items`
- `invoices`
- `refunds`
- `invoice_events` (created, approved, reversed, refunded)

## Important fields
- `items`: `regular_price`, `minimum_price`, `description`, `sku`, `active`
- `customers`: `name`, `phone`, `address`, `note`, `credit_limit`, `due_amount`
- `sales`: `customer_id`, `godown_id (nullable)`, `status`, `subtotal`, `discount`, `vat`, `service_charge`, `grand_total`
- `sale_items`: `item_id`, `qty`, `rate`, `line_total`, `description`, `refunded_qty`
- `stock_movements`: `type` = `IN | OUT | TRANSFER | REFUND_IN | REVERSE_IN`, with references to source transaction

## Customer activeness scoring
Daily job or query-based score using last purchase date + frequency:
- **Active (green)**: purchase in last 30 days.
- **Not very active (yellow)**: purchase in last 31–90 days.
- **Inactive (red)**: no purchase for >90 days.

---

## 6. Sales Rules

1. New sale requires customer selection; allow inline customer creation.
2. Item lines support typeahead, editable quantity/rate/description.
3. Default line rate comes from item regular price, editable down to minimum price (based on role permission).
4. On submit, stock is deducted:
   - From selected godown when provided.
   - From default godown or global stock strategy when not selected.
5. Reverse sale restores stock and marks invoice as reversed.
6. Refund supports partial qty and amount; adds stock back only for returned qty.

---

## 7. Print Layout Rules

## Invoice print
- Header: company details, customer details, invoice number/date.
- Line items: item, qty, rate, discount, total.
- Financial summary: subtotal, discount, VAT/GST, service charge, grand total, due.

## Chalan print
- Same header identity and references.
- Line items show **item + qty only**.
- No prices, no totals.

---

## 8. API Layer (high-level)

## Suggested route groups
- `/api/inventory/items`
- `/api/inventory/categories`
- `/api/inventory/godowns`
- `/api/inventory/stock/movements`
- `/api/sales`
- `/api/invoices`
- `/api/refunds`
- `/api/customers`
- `/api/reports/*`

## Key integration requirement
Reuse current environment contracts (auth token, API base URL, Render env vars) so both existing store/admin and new inventory app can run under one Render project.

---

### Migration status update
- Backend API + DB migration is implemented for:
  - customers
  - categories
  - items
  - godowns
  - stock movements
  - invoices/sales
  - refunds
- Frontend should now switch module-by-module from localStorage to these API routes.

## 9. Frontend architecture (recommended)

## Pages
- `/inventory/dashboard`
- `/inventory/sales/new`
- `/inventory/sales/invoices`
- `/inventory/sales/invoices/:id`
- `/inventory/customers`
- `/inventory/customers/:id`
- `/inventory/items`
- `/inventory/stock`
- `/inventory/godowns`
- `/inventory/reports`

## Components
- KPI cards with animated counters.
- Chart wrappers (line/bar/pie with load + refresh animations).
- Reusable searchable select (customer/item typeahead).
- Invoice/chalan print templates.
- Batch stock editor grid.

---

## 10. Branding + Admin Panel Reuse

Use current admin panel as **shared configuration source** for:
- Brand name.
- Theme colors.
- Logo/favicon.
- Business address/contact details.

Inventory app should read this settings payload at bootstrap and apply same design language automatically.

---

## 11. Render deployment strategy

1. Keep current app and API services.
2. Add new inventory frontend service (or route under same frontend build if monorepo SPA).
3. Reuse existing API service and environment group.
4. Configure routing:
   - Existing public site: `/`
   - Inventory app: `/inventory`
   - Admin panel: `/admin` (existing)

---

## 12. Delivery plan

## Phase 1 (MVP)
- Auth + shell layout + theming bridge.
- Customers CRUD + Items CRUD + Categories.
- Godown setup + stock in/out.
- New sale + invoice list + invoice print + chalan print.

## Phase 2
- Dashboard analytics and report pages (real data charts).
- Refund + reverse flow.
- Customer activeness scoring + due insights.

## Phase 3
- Batch stock editing.
- Advanced transfer and reconciliation.
- Enhanced audit/event trail + exports.

---

## 13. Open decisions

1. Multi-user roles and permission matrix (owner, manager, sales, storekeeper).
2. Tax behavior (VAT/GST per line vs invoice-level).
3. Numbering formats for invoice/chalan.
4. Refund approval process.
5. Offline support or always-online.

---


## 13.1 Decisions resolved for backend implementation

The following business decisions are now fixed in API implementation:

1. **Invoice numbering**: `INV-YYYYMM-####`
2. **Chalan numbering**: `CHL-YYYYMM-####`
3. **Tax model**: invoice-level (`tax_percent` and `tax_amount` on invoice)
4. **Refund approval**: auto-approved for now (single-admin flow)
5. **Godown fallback**: if not selected in sale, first-created godown is used

These are exposed from backend config endpoint: `/api/inventory/config`.

---

## 14. Immediate next actions

1. Confirm role matrix and invoice numbering rules.
2. Finalize godown deduction fallback when no godown selected.
3. Approve MVP pages list.
4. Start DB schema migration + API contracts.
5. Begin frontend module scaffolding under `/inventory`.

---

## 15. Suggested additions before coding starts

These are high-impact additions that reduce future rework and make the first release safer.

1. **Role permissions matrix (must-have before coding)**
   - Define which roles can edit sale price below regular rate.
   - Define who can reverse invoices and approve refunds.
   - Define who can transfer stock between godowns.

2. **Audit + traceability baseline**
   - Store `created_by`, `updated_by`, and source action for key events.
   - Add timeline view on invoice page: created, approved, reversed, refunded.

3. **Numbering strategy**
   - Configurable invoice/chalan prefixes (for example `INV-2026-xxxxx`, `CH-2026-xxxxx`).
   - Keep sequences unique and immutable after generation.

4. **Data safety rules**
   - Prevent negative stock unless explicit override permission exists.
   - Do not allow refund quantity greater than sold quantity.
   - Do not allow reverse on already-refunded invoices without guided flow.

5. **Import/export utilities (early version)**
   - CSV import for items and opening stock.
   - CSV export for sales, stock movement, customers due.

---

## 16. Section-by-section execution plan

Use this order to implement safely and deliver visible value quickly.

### Section A — Foundation and shared configuration
**Goal:** establish app shell + auth + settings bridge.

Deliverables:
- `/inventory` route and layout shell.
- Authentication guard compatible with existing API token flow.
- Read brand/theme settings from admin settings source and apply in inventory UI.

Exit criteria:
- Inventory pages load with same brand name/logo/colors as admin/public store.
- Unauthorized users are blocked from protected inventory routes.

### Section B — Master data (customers, categories, items)
**Goal:** prepare clean data before stock and sales.

Deliverables:
- Customer CRUD (with notes, address, phone, due fields).
- Category CRUD.
- Item CRUD with regular price, minimum price, description, SKU.

Exit criteria:
- New sale form can search/select customers and items through typeahead.

### Section C — Stock and godown operations
**Goal:** make inventory quantities reliable.

Deliverables:
- Godown CRUD.
- Stock in/out transaction forms.
- Godown transfer flow.
- Stock ledger page with filters by date/item/godown/type.

Exit criteria:
- Current stock can be explained via movement history.

### Section D — Sales, invoice, chalan
**Goal:** complete business-critical billing cycle.

Deliverables:
- New sale page with customer + multi-line items.
- Auto stock deduction rule (selected godown or fallback strategy).
- Invoice list + invoice detail.
- Print invoice and print chalan templates.

Exit criteria:
- From one sale, invoice and chalan are printable and stock updates are visible.

### Section E — Reverse and refund lifecycle
**Goal:** handle corrections without data corruption.

Deliverables:
- Reverse invoice action with stock restoration.
- Partial/full refund action with quantity and amount.
- Refund history table linked to invoice detail.

Exit criteria:
- System blocks invalid reverse/refund combinations and preserves audit logs.

### Section F — Dashboard and analytics
**Goal:** give owners actionable insights.

Deliverables:
- KPI cards (today/month sales, invoice count, due amount).
- Animated line/bar/pie charts bound to real API data.
- Recent sales and recent invoice widgets.

Exit criteria:
- Dashboard values reconcile with report totals for same period.

### Section G — Hardening and operations
**Goal:** production-readiness.

Deliverables:
- Role-based route/action guards.
- Input validation and server-side constraints.
- Error states, loading states, empty states.
- CSV import/export and basic reconciliation report.

Exit criteria:
- App is deployable to Render with health checks and stable error handling.

---

## 17. Coding session checklist (work one-by-one)

For each section above, use this repeatable workflow:

1. Define API contract and DB migration.
2. Build backend endpoints and validation.
3. Build frontend page and state handling.
4. Add happy-path + edge-case tests.
5. QA with sample data (including reverse/refund scenarios).
6. Demo and sign-off before moving to next section.

This avoids building too many modules in parallel before core rules are validated.

---

## 18. Acceptance metrics for first launch

- Invoice creation success rate > 99% for valid requests.
- No unexplained stock mismatch between balances and movement ledger.
- Invoice/chalan print completion under 2 clicks from invoice detail page.
- Customer and item search response under 300ms for normal dataset size.
- Dashboard totals matching report totals for selected date range.
