# Product Design Review — Cashier POS App (v2)

| Field | Value |
|---|---|
| **Project** | Macau POS — Cashier App |
| **Reference** | yp.mo/shops |
| **Reviewer** | Claude (Senior PM Review) |
| **Previous review** | 2026-04-05 (v1) |
| **Review date** | 2026-04-05 (v2 — post-fix) |
| **Overall verdict** | **🟢 Proceed** |

## Executive Summary

Since the v1 review earlier today, all 2 blockers and 4 of 6 major issues have been resolved. The cashier app is now a **production-viable MVP** with real stock deduction, real customer search, per-item and per-order discounts with tax support, offline order queuing with auto-sync, PWA support, and a well-decomposed component architecture. The remaining gaps (refund/void, barcode scanner) are important but not blockers for an initial deployment.

**What improved since v1:**
- B1 Stock deduction: Fixed — `createOrder` decrements `products.stock` and `product_variants.stock` in the transaction
- B2 Customer search: Fixed — real DB query against `customers` table, `customerId` persisted on orders
- M1 Component refactor: Done — 5 components extracted, `pos-client.tsx` reduced from 1705 to ~1050 lines (core logic), plus bottom bar UX overhaul (user menu with flyout submenus for theme/language)
- M2 Discount/tax: Done — per-item + per-order discounts (% or fixed MOP), cents-based numpad, tax from shop_settings, receipt integration
- M4 Offline resilience: Done — localStorage queue, auto-sync on reconnect, "saved offline" checkout state, connectivity indicator with manual check, PWA with Service Worker

**Remaining concerns:** No refund/void flow (M3), no barcode scanner (M5), favorites stub still empty, cart lost on page refresh. These are acceptable for MVP launch.

## Severity Summary

| Severity | Count | Previously |
|---|---|---|
| 🔴 Blocker | 0 | 2 (both fixed) |
| 🟡 Major | 2 | 6 (4 fixed) |
| 🔵 Minor | 5 | 7 (2 fixed) |
| 💡 Suggestion | 5 | 5 (unchanged) |

---

## Resolved Issues

| ID | Issue | Status |
|---|---|---|
| B1 | No stock deduction | ✅ Fixed — deducts in transaction, skips null (unlimited) |
| B2 | Customer search mocked | ✅ Fixed — real DB query, customerId on orders, 10 test customers seeded |
| M1 | God component (1700+ lines) | ✅ Fixed — 5 components extracted (LockScreen, KeypadView, CustomerSearch, CustomerDetail, ProductSearch, DiscountPopover) |
| M2 | No discount/tax | ✅ Fixed — per-item + per-order, % or fixed, tax from settings, receipt shows discounts |
| M4 | No offline resilience | ✅ Fixed — localStorage queue, auto-sync, PWA/Service Worker, connectivity indicator |
| m4 | Hardcoded nameCn | ✅ Fixed — sends full translations object |
| m6 | LockScreen inline | ✅ Fixed — extracted to `components/shared/lock-screen.tsx` |

---

## Remaining Major Issues

### M3. No Refund / Void Flow (unchanged from v1)

**Finding:** Orders can only be `completed`. No UI or server action to void/refund.
**Impact:** Cashier mistakes or customer returns require manual out-of-system adjustment.
**Recommendation:** Add void button in order history (with manager PIN for high amounts). Medium effort.

### M5. No Barcode / Scanner Input (unchanged from v1)

**Finding:** Products have `barcode` fields in DB but the POS doesn't use them. No global keyboard listener for scanner input.
**Impact:** Manual product selection is slow for high-volume checkout.
**Recommendation:** Add global keydown listener detecting rapid character input + Enter. Low effort, high impact.

---

## Remaining Minor Issues

### m1. Favorites View Is Still Empty
**Finding:** Tab shows placeholder. No storage mechanism.
**Recommendation:** localStorage array of product IDs. Low effort.

### m2. QR Code Randomly Generated
**Finding:** Fake QR flickers on re-render.
**Recommendation:** Static placeholder or deterministic pattern.

### m3. Cart Lost on Page Refresh
**Finding:** Cart is React state only.
**Recommendation:** Persist to sessionStorage. Low effort.

### m5. History Payment Filter Duplicates Query
**Finding:** Payment method filter rebuilds entire query.
**Recommendation:** Push condition into existing array.

### m7. No Keyboard Shortcuts
**Finding:** No F-key shortcuts for payment methods, Enter for checkout, etc.
**Recommendation:** Global useEffect handler. Low effort, high value for trained cashiers.

---

## Updated Scenario Walkthroughs

| Scenario | Priority | v1 | v2 | Notes |
|---|---|---|---|---|
| W1: Standard purchase | P0 | ✅ | ✅ | Unchanged — solid |
| W2: Variant purchase | P0 | ✅ | ✅ | Unchanged — solid |
| W3: Custom keypad entry | P0 | ✅ | ✅ | Unchanged — solid |
| W4: Member lookup + link | P1 | ❌ | ✅ | **Fixed** — real DB search, customerId on orders |
| W5: Shift lifecycle | P0 | ✅ | ✅ | Unchanged — solid |
| W6: Refund / void | P1 | ❌ | ❌ | Still no flow |
| W7: Offline resilience | P1 | ❌ | ✅ | **Fixed** — localStorage queue, auto-sync, PWA |
| W8: Discount application | P1 | ❌ | ✅ | **New** — per-item + per-order, receipt shows discounts |

**P0 scenarios: 4/4 passing. P1 scenarios: 3/4 passing (only refund missing).**

---

## Updated Reference Comparison

| Aspect | YP SHOPS | Our App | v1 | v2 |
|---|---|---|---|---|
| Product browsing | Category sidebar + grid | Tabs + category chips + search spotlight | ✅ | ✅ |
| Variant selection | Tag-based modal | Bottom sheet, color swatches, images | ✅ | ✅ |
| Cart management | Bottom bar | Right sidebar, stepper, brand labels | ✅ | ✅ |
| Payment methods | MPAY + cash | Tap/Insert/QR/Cash | ✅ | ✅ |
| Member lookup | Phone → real data | Phone → real DB search | ❌ | ✅ |
| Barcode scanning | Supported | Not supported | ❌ | ❌ |
| Shift management | Unknown | Full lifecycle + cash ledger | ✅ | ✅ |
| Discounts | Full system (滿減, vouchers) | Manual % / fixed, per-item + per-order | ❌ | ⚠️ |
| Refunds | Likely supported | Not supported | ❌ | ❌ |
| Offline mode | Unknown | localStorage queue + PWA + auto-sync | ❌ | ✅ |
| i18n | CN + EN | 5 languages | ✅ | ✅ |
| Theming | Single brand | 5 merchant themes | ✅ | ✅ |
| Receipt | Printer integration | Browser print + discount/tax rows | ⚠️ | ⚠️ |

---

## Architecture Assessment (Updated)

| Component | Soundness | Scalability | Security | v2 Verdict |
|---|---|---|---|---|
| Auth | ✅ | ✅ | ✅ | ✅ |
| Multi-tenant isolation | ✅ | ✅ | ✅ | ✅ |
| Shift management | ✅ | ✅ | ✅ | ✅ |
| Order creation | ✅ Stock deduction | ⚠️ Sequential numbers | ✅ Transactional | ✅ |
| Discount system | ✅ Per-item + per-order | ✅ | ✅ | ✅ New |
| Offline queue | ✅ localStorage | ✅ Auto-sync | ⚠️ No dedup | ✅ New |
| PWA / Service Worker | ✅ App shell caching | ✅ | ✅ | ✅ New |
| Component architecture | ✅ 6 extracted components | ✅ | N/A | ✅ Improved |
| Terminal guard | ✅ | ✅ | ⚠️ localStorage ID | ⚠️ |
| Cart state | ⚠️ In-memory only | ✅ | N/A | ⚠️ |
| Connectivity detection | ✅ Periodic ping + events | ✅ | ✅ | ✅ New |

---

## Recommendations Summary

### Before production deployment
1. **M3** — Add void/refund flow (medium effort)
2. **M5** — Add barcode scanner input (low effort)

### Can address during/after deployment
1. **m1** — Implement favorites (localStorage)
2. **m3** — Persist cart to sessionStorage
3. **m7** — Add keyboard shortcuts
4. **m2** — Fix QR code flickering
5. **m5** — Fix history query duplication

### Known limitations (accepted for MVP)
- Offline orders skip stock deduction until synced (small overselling risk)
- No server-side order dedup (duplicate possible if sync response lost)
- Cart lost on page refresh
- PWA only works with HTTPS (production) — not localhost dev
- Order numbers for offline orders use `LOCAL-...` prefix until synced

---

## Review Sign-off

| Item | Status |
|---|---|
| Blockers resolved | ✅ All resolved |
| Major issues resolved or accepted | ✅ 4/6 resolved, 2 accepted for post-MVP |
| User approves | ☐ Pending |
