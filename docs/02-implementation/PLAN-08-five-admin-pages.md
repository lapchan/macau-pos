# Plan: Build 5 Remaining Admin Pages (Full Feature)

## Context
5 admin pages currently show "Coming Soon": Payments, Staff, Settings, Online, AI Insights. This plan builds them all as production-ready pages with real data, CRUD, and proper UX.

---

## Page 1: Payments & Invoices (`/payments`)

### What it does
Shows all payment transactions from completed orders. Merchants see how money flows — by method, by date, by status.

### Data source
- JOIN `payments` × `orders` tables (both already exist with data)
- New query: `getPaymentTransactions()` — payments with order number, date, method, amount

### UI Structure
- **MetricCard row**: Today's revenue, Today's transactions, Cash total, Digital total
- **Filter bar**: Date range picker, payment method filter (Cash/Card/QR), search by order number
- **Transaction table**: Order #, Date/Time, Method (badge), Amount, Status, Change given (cash only)
- **Payment method breakdown**: Pie/donut chart showing % by method
- Pagination (20 per page)

### Files
- `apps/admin/src/app/(dashboard)/payments/page.tsx` — Server component
- `apps/admin/src/app/(dashboard)/payments/payments-client.tsx` — Client component
- `apps/admin/src/lib/queries.ts` — Add `getPaymentTransactions()`, `getPaymentStats()`
- `apps/admin/src/i18n/locales.ts` — Add ~25 `payments.*` keys × 5 locales

---

## Page 2: Staff (`/staff`)

### What it does
Manage team members — add cashiers, set roles, manage PINs, view login history. This is the user management hub.

### Data source
- `users` table (already exists with 4 demo users)
- New queries: `getStaffList()`, `getStaffById()`
- New server actions: `createStaff()`, `updateStaff()`, `deleteStaff()`, `resetPin()`

### UI Structure
- **PageHeader**: "Staff" + "Add staff" button
- **Staff table**: Name, Email/Phone, Role (badge), Status (active/inactive dot), Last login, Actions (Edit/Delete)
- **Add/Edit slide-over** (reuse bottom sheet pattern):
  - Name, Email, Phone
  - Role dropdown (merchant_owner, cashier, accountant)
  - PIN field (4-6 digits, masked)
  - Active toggle
- **Delete confirmation** dialog
- Role permission summary card (read-only display of what each role can do)

### Files
- `apps/admin/src/app/(dashboard)/staff/page.tsx`
- `apps/admin/src/app/(dashboard)/staff/staff-client.tsx`
- `apps/admin/src/lib/staff-actions.ts` — CRUD server actions
- `apps/admin/src/lib/queries.ts` — Add `getStaffList()`
- `apps/admin/src/components/staff/staff-editor.tsx` — Add/edit bottom sheet
- `apps/admin/src/i18n/locales.ts` — Add ~30 `staff.*` keys × 5 locales

---

## Page 3: Settings (`/settings`)

### What it does
Shop configuration hub — business info, payment methods, language, branding, receipt template.

### Data source
- `shop_settings` table (already exists, 1 row per tenant)
- `tenants` table (name, slug, subscription)
- New server actions: `updateShopSettings()`, `updateTenantInfo()`

### UI Structure
Tabbed layout or sectioned single page:

**Section: Business Info**
- Shop name, address, phone, email
- Business hours (7 day grid)
- Logo upload

**Section: Payment Methods**
- Toggle switches for: Cash, Card, MPAY, Alipay, WeChat Pay
- Default payment method selector

**Section: Regional**
- Currency (MOP default)
- Default language selector
- Tax rate (%) — Macau has no sales tax, but configurable
- Receipt footer text

**Section: Branding**
- Accent color picker (5 preset merchant themes + custom)
- Preview of how accent looks on buttons

**Section: Receipt**
- Receipt header/footer text
- Show/hide fields toggles (address, phone, tax, etc.)

### Files
- `apps/admin/src/app/(dashboard)/settings/page.tsx`
- `apps/admin/src/app/(dashboard)/settings/settings-client.tsx`
- `apps/admin/src/lib/settings-actions.ts` — Update server actions
- `apps/admin/src/lib/queries.ts` — Add `getShopSettings()`
- `apps/admin/src/i18n/locales.ts` — Add ~40 `settings.*` keys × 5 locales

---

## Page 4: Online (`/online`)

### What it does
Configure the online storefront channel. For MVP: channel toggle, store URL, basic presence settings. Full e-commerce is Phase 5 but the config page should exist now.

### Data source
- `shop_settings` table (add `online_config` JSONB column if needed)
- Or store in existing `shop_settings` columns

### UI Structure
- **Channel cards**:
  - POS Terminal (always on, shows count of terminals)
  - Online Store (toggle on/off, shows URL when active)
  - WeChat Mini-Program (toggle, "Coming Phase 5")
- **Online Store settings** (when enabled):
  - Store URL: `{tenant-slug}.retailos.app`
  - Store name, description
  - Banner image upload
  - Product visibility rules
  - Operating hours (inherit from shop or custom)
- **QR Code generator**: Generate QR for the online store URL

### Files
- `apps/admin/src/app/(dashboard)/online/page.tsx`
- `apps/admin/src/app/(dashboard)/online/online-client.tsx`
- `apps/admin/src/i18n/locales.ts` — Add ~20 `online.*` keys × 5 locales

---

## Page 5: AI Insights (`/ai-insights`)

### What it does
Analytics dashboard with real data from orders. Shows trends, rankings, anomalies. Uses Recharts (already installed).

### Data source
- `orders` + `order_items` + `payments` tables
- New queries: `getSalesTrend()`, `getTopProducts()`, `getPaymentMethodBreakdown()`, `getPeakHours()`, `getRecentInsights()`

### UI Structure
- **MetricCards row**: Total revenue (all time), Avg order value, Total orders, Unique products sold
- **Sales trend chart**: Line chart, last 30 days, daily revenue (Recharts)
- **Top 10 products**: Horizontal bar chart by revenue
- **Payment method breakdown**: Donut chart (Cash vs Card vs QR)
- **Peak hours heatmap**: 7×24 grid (day × hour) colored by order volume
- **AI Insights feed**: List of auto-generated observations:
  - "Top seller this week: SAVEWO 3DMASK Kuro Collection"
  - "Cash payments account for 62% of transactions"
  - "Peak hour: 12pm-1pm with avg 8 orders"
  - "Stock alert: 3 products below threshold"

### Files
- `apps/admin/src/app/(dashboard)/ai-insights/page.tsx`
- `apps/admin/src/app/(dashboard)/ai-insights/insights-client.tsx`
- `apps/admin/src/lib/queries.ts` — Add analytics queries
- `apps/admin/src/i18n/locales.ts` — Add ~25 `insights.*` keys × 5 locales

---

## Build Order

| Step | Page | Effort | Dependencies |
|------|------|--------|-------------|
| 1 | **Settings** | 1 day | None — standalone config page |
| 2 | **Staff** | 1 day | Uses `users` table (exists) |
| 3 | **Payments** | 1 day | Uses `payments` × `orders` (exist) |
| 4 | **AI Insights** | 1 day | Uses order/payment data (needs queries) |
| 5 | **Online** | 0.5 day | Mostly UI config, minimal data |

**Total: ~4.5 days**

**Rationale for order:**
1. Settings first — it's standalone and enables merchants to configure their shop
2. Staff — user management is a security prerequisite
3. Payments — uses existing order data, high business value
4. AI Insights — analytics needs order data to be meaningful
5. Online — mostly placeholder config, least urgent

---

## i18n Strategy

Each page gets its own namespace:
- `payments.*` (~25 keys)
- `staff.*` (~30 keys)
- `settings.*` (~40 keys)
- `online.*` (~20 keys)
- `insights.*` (~25 keys)

Total: ~140 new keys × 5 locales = 700 translation strings.

---

## Shared Patterns to Reuse

| Pattern | Source | Reuse in |
|---------|--------|----------|
| Data table with pagination | `items-client.tsx` | Payments, Staff |
| Bottom sheet editor | `product-editor.tsx` | Staff editor, Settings sections |
| MetricCard row | `orders-client.tsx` | Payments, AI Insights |
| Delete confirmation dialog | `delete-confirm-dialog.tsx` | Staff |
| Status dots + badges | `items-client.tsx` | Staff (active/inactive), Payments (method badges) |
| Date range selector | `shared/date-range-selector.tsx` | Payments, AI Insights |
| Recharts integration | `dashboard/performance-chart-card.tsx` | AI Insights |
| Server action pattern | `product-actions.ts` | Staff actions, Settings actions |

---

## Verification

1. **Settings**: Change shop name → reflected in sidebar logo area. Change accent color → buttons update. Toggle payment method → affects cashier checkout options.
2. **Staff**: Add new cashier → can login at cashier POS with PIN. Edit role → permissions change. Deactivate → can't login.
3. **Payments**: View matches order history. Filter by Cash → only cash transactions shown. Date range → correct totals. Metrics match order data.
4. **AI Insights**: Charts render with real data. Top products match actual sales. Peak hours reflect order timestamps. Insights text is accurate.
5. **Online**: Toggle online store → URL generates. QR code renders. Config saves and persists.
6. **i18n**: Switch language → all 5 pages fully translated. No English leaking in any locale.
