# Plan: Staff Daily Settlement (員工每日結數) — Phase 2

## Status: SCHEMA READY, UI DEFERRED TO PHASE 2

## What's Done Now (Phase 1 Future-Proofing)

### Database Schema — Deployed
- ✅ `shifts` table created with full schema (18 columns, 2 indexes)
- ✅ `shift_status` enum: `open`, `pending_approval`, `closed`, `flagged`
- ✅ `orders.cashier_id` added (nullable FK → users, with index)
- ✅ `orders.shift_id` added (nullable FK → shifts)
- ✅ Migration: `0005_shifts_schema.sql`

### Why Now?
Adding `shift_id` and `cashier_id` to orders now prevents a painful data migration later. Every order created from now on **can** carry shift/cashier info even before the Shifts UI is built. The columns are nullable so they don't break existing code.

---

## What to Build in Phase 2

### Priority: P1 (first sprint of Phase 2)
**RICE Score: 60** — blocks real-world multi-staff deployment

### User Flows

#### Flow 1: Open Shift
```
Cashier logs in → System checks: any open shift for this user?
  NO  → "Start your shift" prompt → Enter opening float → Shift opens
  YES → Resume existing shift (show running summary)
```

#### Flow 2: During Shift
```
All orders automatically tagged with current shift_id + cashier_id
Cashier can view running shift summary anytime:
  - Orders processed
  - Total sales
  - Payment method breakdown
  - Time elapsed
```

#### Flow 3: Close Shift (結數)
```
Cashier taps "End Shift" / "結數"
→ System shows: expected cash = opening_float + cash_payments
→ Cashier counts physical cash, enters actual amount
→ System calculates variance (actual - expected)
→ IF variance within tolerance (configurable, default ±MOP 5): auto-approve
→ IF variance exceeds tolerance: flag for manager review
→ Print shift settlement report
→ Shift status → pending_approval or closed
```

#### Flow 4: Manager Review
```
Manager sees flagged shifts in admin dashboard
→ Reviews variance, cashier notes
→ Approves → shift status = closed
→ Or flags for investigation
```

### New UI Screens

1. **Cashier: Shift open prompt** — Modal on login when no open shift
2. **Cashier: Shift summary panel** — Slide-over showing current shift stats
3. **Cashier: End shift flow** — Cash count input, variance display, notes
4. **Admin: Shifts page** — Table of all shifts with filters (date, cashier, status)
5. **Admin: Shift detail** — Full breakdown of a single shift
6. **Admin: Dashboard widget** — Active shifts count, flagged shifts alert

### New Server Actions
- `openShift(cashierId, terminalId, openingFloat)`
- `closeShift(shiftId, actualCash, notes)`
- `approveShift(shiftId, approvedBy)`
- `flagShift(shiftId, notes)`
- `getActiveShift(cashierId)` — returns open shift or null
- `getShiftSummary(shiftId)` — shift + order stats
- `getShiftsForDate(tenantId, date)` — all shifts for a day

### Modified Code
- `createOrder()` — include `cashierId` and `shiftId` from current session/shift
- Cashier POS layout — check for open shift on mount, show prompt if needed
- Admin sidebar — add "Shifts" / "結數管理" nav item

### i18n Keys (~25 new keys)
```
shifts.title = "Shift Management" / "班次管理"
shifts.openShift = "Start Shift" / "開始班次"
shifts.closeShift = "End Shift" / "結束班次"
shifts.openingFloat = "Opening Float" / "開班金額"
shifts.expectedCash = "Expected Cash" / "應有現金"
shifts.actualCash = "Actual Cash" / "實際現金"
shifts.variance = "Variance" / "差異"
shifts.approve = "Approve" / "批准"
shifts.flag = "Flag for Review" / "標記審查"
shifts.shiftDuration = "Duration" / "班次時長"
shifts.ordersProcessed = "Orders Processed" / "已處理訂單"
shifts.totalSales = "Total Sales" / "總銷售額"
shifts.paymentBreakdown = "Payment Breakdown" / "付款方式明細"
shifts.withinTolerance = "Within tolerance" / "在容許範圍內"
shifts.overTolerance = "Exceeds tolerance" / "超出容許範圍"
shifts.cashierNotes = "Cashier Notes" / "收銀員備註"
shifts.managerNotes = "Manager Notes" / "管理員備註"
```

### Estimated Effort: 2-3 weeks
- Week 1: Server actions + shift open/close flows on cashier
- Week 2: Admin shift management page + manager approval
- Week 3: Print receipt + polish + edge cases (midnight rollover, force-close stale shifts)

---

## Schema Reference

```sql
-- shifts table (already deployed)
CREATE TABLE shifts (
  id              uuid PK DEFAULT gen_random_uuid(),
  tenant_id       uuid FK → tenants (cascade),
  cashier_id      uuid FK → users (cascade),
  terminal_id     varchar(100),
  opened_at       timestamp with tz NOT NULL DEFAULT now(),
  closed_at       timestamp with tz,
  opening_float   decimal(10,2) NOT NULL DEFAULT 0,
  expected_cash   decimal(10,2) NOT NULL DEFAULT 0,
  actual_cash     decimal(10,2),
  variance        decimal(10,2),
  total_sales     decimal(10,2) NOT NULL DEFAULT 0,
  total_orders    int NOT NULL DEFAULT 0,
  payment_breakdown jsonb,
  status          shift_status NOT NULL DEFAULT 'open',
  approved_by     uuid FK → users (set null),
  approved_at     timestamp with tz,
  notes           text,
  created_at      timestamp with tz NOT NULL DEFAULT now()
);

-- orders table additions (already deployed)
ALTER TABLE orders ADD COLUMN cashier_id uuid FK → users;
ALTER TABLE orders ADD COLUMN shift_id uuid FK → shifts;
CREATE INDEX idx_orders_cashier ON orders(cashier_id, created_at);
```

---

## Decision Record

**ADR-007: Staff Shift Schema Deployed in Phase 1**

**Status:** Accepted

**Context:** Macau POS needs cash accountability per staff shift. Without `shift_id` on orders, we'd need a data migration later to retroactively tag historical orders with shift info.

**Decision:** Deploy `shifts` table + `shift_id`/`cashier_id` columns on orders during Phase 1, with nullable FKs. Build the UI in Phase 2.

**Consequences:**
- ✅ Zero-cost future-proofing (nullable columns don't affect existing code)
- ✅ Orders created after deployment carry cashier info even before shift UI exists
- ✅ No data migration needed when Phase 2 ships
- ❌ Table exists but unused until Phase 2 (negligible cost)
