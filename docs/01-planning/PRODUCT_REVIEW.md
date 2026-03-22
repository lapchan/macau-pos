# Product Design Review — Macau POS

| Field | Value |
|---|---|
| **Project** | Macau POS |
| **Reference** | Admin: yp.mo/yp-resource-business · Cashier: yp.mo/shops |
| **Reviewer** | Claude (Senior PM Review) |
| **Planning doc version** | v0.6 (Phase 3) |
| **Review date** | 2026-03-22 |
| **Overall verdict** | 🟢 Proceed (all major issues resolved) |

## Executive Summary

The Macau POS planning document is well-structured and comprehensive. The 5-phase feature roadmap is sensible, the tech stack is cost-effective (~$7-14/mo), and the multi-tenant architecture is properly designed with 4-layer security. The data model covers all Build Phase 1 requirements and the 43 API endpoints map cleanly to all 30 acceptance test scenarios.

**Strengths:** Excellent tenant isolation design (4 layers), smart cost optimization (single ECS + self-hosted PostgreSQL), clean separation of 3 apps with shared packages, comprehensive user scenarios across 7 personas, and thoughtful order item snapshotting for price history integrity.

**Concerns:** Several operational gaps need addressing before implementation — most critically, there's no API pagination design, no real-time order notification mechanism for merchants/cashiers, no stock reservation strategy for concurrent checkout, and missing empty state / error state UX design. These aren't architectural blockers but will cause real problems if discovered during implementation.

Compared to the reference app, our design significantly improves on UI/UX modernization, multi-tenant SaaS architecture, and developer experience. However, we should ensure we're not under-planning the cashier POS experience — the reference app's cashier workflow is optimized for speed, and our design needs to match that bar.

## Severity Summary

| Severity | Count |
|---|---|
| 🔴 Blocker | 0 |
| 🟡 Major | 5 |
| 🔵 Minor | 6 |
| 💡 Suggestion | 4 |

## Major Issues

### M1. No API pagination design
**Dimension:** API Design Quality
**Section:** §5.1 API overview
**Finding:** All list endpoints (`GET /api/products`, `GET /api/orders`, `GET /api/shop/:slug/products`) have no pagination specification. Storefront product list uses "infinite scroll" (§7.6) but the API contract doesn't define cursor/offset parameters, page size limits, or total count responses.
**Impact:** Without pagination, product lists with 500+ items will load slowly and consume excessive memory. Order lists will grow unbounded. Mobile storefront performance will degrade severely.
**Recommendation:** Define standard pagination contract for all list endpoints:
```
GET /api/products?page=1&limit=20&cursor=xxx
Response: { data: [...], pagination: { total, page, limit, hasMore, nextCursor } }
```
Use cursor-based pagination for storefront (infinite scroll) and offset-based for admin (page numbers).

### M2. No real-time order notification for merchants/cashiers
**Dimension:** UX Completeness
**Section:** §7, §8
**Finding:** When a customer places an order via the storefront, there's no mechanism for the merchant/cashier to know about it in real time. TanStack Query polling at 30s (§8.4) means up to 30 seconds delay. The reference app likely has immediate notification (sound alert / push).
**Impact:** In a real Macau retail scenario, a customer orders for pickup. The merchant doesn't see the order for 30 seconds. Customer walks in, merchant hasn't started preparing. Poor experience.
**Recommendation:** Add Server-Sent Events (SSE) for order notifications in admin. Lightweight, no WebSocket complexity. When new order is created → broadcast SSE event → admin plays a notification sound + shows toast. SSE is supported everywhere and costs nothing.

### M3. Stock race condition on concurrent checkout
**Dimension:** Data Model Quality
**Section:** §4.2 (variants table), §5.2 (order creation API)
**Finding:** The order creation API validates stock at order time, but between validation and INSERT, another request could checkout the same last item. No explicit row-level locking or atomic stock decrement is described.
**Impact:** Two customers could buy the last item simultaneously. One order succeeds, the other should fail but might also succeed, leaving negative stock.
**Recommendation:** Use `SELECT ... FOR UPDATE` on the variant row within the order creation transaction, or use an atomic `UPDATE variants SET stock = stock - $qty WHERE stock >= $qty RETURNING *` — if no rows returned, stock insufficient. This should be explicitly documented in the API contract.

### M4. Missing empty states and error states in UX
**Dimension:** UX Completeness
**Section:** §7 Frontend Architecture
**Finding:** The component hierarchies describe happy-path layouts but don't address: empty product list ("You haven't added any products yet"), empty order list, empty cart, no categories created, shop setup incomplete, network error during checkout, payment failure.
**Impact:** First-time merchants will see blank pages after onboarding. Empty states are critical for guided onboarding UX — they should include CTAs like "Add your first product →".
**Recommendation:** Add empty state components for each major list view. Define error boundary components for network failures. Especially critical: checkout error handling (what happens if order creation fails after customer submitted?).

### M5. No image processing pipeline
**Dimension:** Architecture Soundness
**Section:** §3.1 (Image storage: local disk)
**Finding:** Product images are uploaded as-is to `/uploads/` and served by Caddy. No mention of image resizing, format optimization (WebP), or thumbnail generation. The reference app shows product images in list view (small) and detail view (large).
**Impact:** Merchants upload 4MB phone photos. Storefront loads 20 products × 4MB = 80MB on mobile. Page load time exceeds 10 seconds. Performance budget blown.
**Recommendation:** Add `sharp` (Node.js image library, free) to the upload pipeline. On upload: generate 3 sizes (thumbnail 200px, medium 600px, full 1200px) in WebP format. Store all 3 in `/uploads/{id}/thumb.webp`, etc. Use Next.js `<Image>` component with appropriate `sizes` prop. Cost: $0 (sharp is free, runs on same ECS).

## Minor Issues

### m1. Category i18n gap
**Dimension:** Data Model Quality
**Section:** §4.2 (categories table)
**Finding:** Categories have `name`, `name_en`, `name_pt` fields. But there's no clear strategy for when merchants don't fill in translations. If a merchant only enters Chinese category names, English/Portuguese storefront customers see blank categories.
**Recommendation:** Fallback logic: show `name_en` if available, else fall back to `name` (Chinese). Document this in the API response. Add a "missing translation" indicator in admin for merchants.

### m2. No product sorting in storefront
**Dimension:** UX Completeness
**Section:** §7.3 (Storefront component hierarchy)
**Finding:** Storefront only has category filtering. No price sort (low→high, high→low), no "newest" sort, no "popular" sort. The reference app has filter/sort icons.
**Recommendation:** Add sort parameter to `GET /api/shop/:slug/products?sort=price_asc|price_desc|newest`. Add sort dropdown in storefront header.

### m3. Single product image only
**Dimension:** Reference Comparison
**Section:** §4.2 (products table)
**Finding:** Products have a single `image` field. Many retail products benefit from multiple angles/views. The reference app also appears to support only one image, but as an improvement opportunity, multiple images would differentiate us.
**Recommendation:** For Build Phase 1, single image is fine (keep it simple). Add `product_images` table in Build Phase 2 for gallery support.

### m4. Order number generation not specified
**Dimension:** Data Model Quality
**Section:** §8.5 mentions `ORD-{YYYYMMDD}-{sequential per tenant per day}` using DB sequence
**Finding:** PostgreSQL sequences are global, not per-tenant-per-day. Implementing per-tenant-per-day sequential numbering requires either a counter table or a more complex generation strategy.
**Recommendation:** Use a `order_counters` table with `(tenant_id, date)` composite key and atomic increment. Or simplify to `ORD-{YYYYMMDD}-{random 6 chars}` which avoids the complexity entirely while still being human-readable.

### m5. No rate limiting specification for storefront
**Dimension:** Security & Privacy
**Section:** §10.1 mentions Caddy rate limit for login (10/min)
**Finding:** No rate limiting specified for storefront order creation. A script could spam orders to a merchant's shop.
**Recommendation:** Add rate limit on `POST /api/shop/:slug/orders` — e.g. 5 orders per IP per minute. Caddy can handle this.

### m6. Cashier POS lacks barcode scan support
**Dimension:** Reference Comparison
**Section:** §7, §4.2 (products table has `barcode` field)
**Finding:** Products have a `barcode` field in the schema, and the reference app supports barcode lookup, but the cashier UX in §7 only describes manual search and category browsing. No barcode scan flow.
**Recommendation:** Add barcode scan to cashier interface. The browser `BarcodeDetector` API or a USB barcode scanner (acts as keyboard input) can feed into the search field. When barcode matches a product, auto-add to cart. This is essential for retail POS speed.

## Suggestions

### S1. Add SSE-based order notification with sound
**Benefit:** Merchant/cashier gets instant audio alert when new order arrives. Critical for pickup-order flow. Reference app likely has this.
**Implementation:** EventSource API on client, SSE endpoint on server. Play `new-order.mp3` on event. Show toast with order summary.

### S2. Add "Quick POS" mode for cashier
**Benefit:** A streamlined cashier view optimized for speed: large product buttons (like a restaurant POS), barcode scan field, running total, one-tap payment. Different from the category-browsing storefront layout.
**Implementation:** Separate layout within `(dashboard)/pos/` route in admin app. Grid of popular products + search/scan bar + cart sidebar.

### S3. Add product image optimization with sharp
**Benefit:** 10x smaller images, 5x faster storefront loading on mobile. WebP format supported by all modern browsers.
**Implementation:** `sharp` library in upload API route. Generate thumb (200px), medium (600px), full (1200px). ~20 lines of code.

### S4. Consider adding announcement/notice banner management
**Benefit:** The reference app has an announcement banner in the storefront header. Merchants should be able to set custom announcements ("Holiday hours: closed Dec 25") from admin.
**Implementation:** Add `announcement` text field to `shop_settings`. Display in storefront header if non-empty.

## Scenario Walkthroughs

### W1: New merchant onboarding (Stories 5-7)
```
User: Merchant Owner (just signed up via trial)
Action: "Set up my shop and add my first product"

Step 1: Login → Redirect to (dashboard)/ → ⚠️ No setup wizard mentioned
Step 2: Navigate to Settings → Fill shop info → Save ✅
Step 3: Navigate to Products → See empty list → ⚠️ No empty state CTA
Step 4: Click "新增商品" → Fill form → Upload image → ⚠️ No image processing
Step 5: Save → Product appears in list ✅
Step 6: Open storefront URL → Product visible ✅

Verdict: ⚠️ Functional but onboarding UX gaps (no wizard, no empty states, no image optimization)
```

### W2: Customer places pickup order (Stories 25-29)
```
User: Customer (mobile, Chinese-speaking)
Action: "Browse products and place a pickup order"

Step 1: Scan QR code → Open shop.pos.mo/shop/test-shop ✅
Step 2: See categories sidebar + products ✅
Step 3: Tap "口罩" category → Filtered products ✅
Step 4: Tap "選規格" → Variant bottom sheet → Select "KN95" qty 2 ✅
Step 5: Add to cart → Cart badge updates ✅
Step 6: Open cart → Review items ✅
Step 7: Tap "自取下單" → Order created (status: pending) ✅
Step 8: See order confirmation with number ✅
Step 9: Merchant receives notification → ⚠️ No real-time notification (30s poll delay)
Step 10: Check order status page → ✅

Verdict: ⚠️ Customer flow works, but merchant notification delay is a real UX problem
```

### W3: Cashier processes walk-in sale (Stories 17-20)
```
User: Cashier
Action: "Ring up a customer at the counter"

Step 1: Open admin.pos.mo → Dashboard ✅
Step 2: Navigate to... ⚠️ Where? No dedicated POS interface, only order management
Step 3: Need to create order → POST /api/orders ✅ API exists
Step 4: Search for product "853" → Results ✅
Step 5: Add items → Select variant → ⚠️ Using what UI? Admin product list isn't a POS
Step 6: Select "現金" → Complete order ✅

Verdict: ⚠️ The API supports it but the cashier UI for creating walk-in orders isn't well-defined. Is the cashier using the storefront or a separate POS view in admin?
```

### W4: Multi-tenant isolation (AT-021)
```
Step 1: Merchant A creates product "商品A" ✅
Step 2: Merchant B creates product "商品B" ✅
Step 3: Merchant A queries products → Only "商品A" ✅ (Drizzle middleware)
Step 4: Direct API with wrong tenant → 403 ✅ (Auth.js session check)
Step 5: Raw SQL bypass → Blocked ✅ (PostgreSQL RLS)

Verdict: ✅ Excellent — 4-layer defense is robust
```

### W5: Free trial lifecycle (Stories 38-41, AT-024, AT-030)
```
Step 1: Visit pos.mo → See landing page ✅
Step 2: Click "免費試用" → Fill form ✅
Step 3: Trial account created → Redirected to admin ✅
Step 4: Use all features during trial ✅
Step 5: Trial expires → Banner shown ✅
Step 6: Cannot create new orders → ✅ (middleware blocks)
Step 7: Upgrade to paid → ⚠️ No billing/payment flow in Phase 1
Step 8: Full access restored → ✅ (status change)

Verdict: ⚠️ Trial works but upgrade path is placeholder only (billing is Phase 2)
```

### Scenario coverage

| Scenario | Priority | Verdict | Notes |
|---|---|---|---|
| W1: Merchant onboarding | P0 | ⚠️ | Missing setup wizard, empty states, image processing |
| W2: Customer pickup order | P0 | ⚠️ | Missing real-time notification to merchant |
| W3: Cashier walk-in sale | P0 | ⚠️ | Cashier POS UI not well-defined |
| W4: Tenant isolation | P0 | ✅ | Excellent 4-layer defense |
| W5: Free trial | P0 | ⚠️ | Works but upgrade path is Phase 2 |

**No P0 ❌ failures. All are ⚠️ (fixable) or ✅.**

## Reference Comparison

| Aspect | Reference app | Our design | Verdict |
|---|---|---|---|
| **UI/UX quality** | Dated, basic table layouts | Modern shadcn/ui, responsive | ✅ Better |
| **Multi-tenant SaaS** | Single-tenant | Full multi-tenant with RLS | ✅ Better |
| **Product management** | Comprehensive (CRUD, batch, import) | Comparable for Phase 1 | ⚠️ Comparable |
| **Order management** | Full lifecycle with status tabs | Same pattern, modern UI | ⚠️ Comparable |
| **Cashier POS speed** | Dedicated, fast workflow | Under-designed for speed | ⚠️ Needs attention |
| **Payment methods** | MPAY integrated | Cash only in Phase 1 | ❌ Worse (temporary) |
| **Member system** | Rich (tiers, points, stored value) | Phase 2 | ❌ Worse (planned) |
| **Reporting** | 18+ report types | Basic dashboard in Phase 1 | ❌ Worse (planned) |
| **Real-time updates** | Likely instant | 30s polling | ❌ Worse |
| **Mobile storefront** | Mobile-optimized (uni-app) | Mobile-optimized (responsive) | ⚠️ Comparable |
| **i18n** | Chinese only + EN toggle | Trilingual (zh-TW, en, pt) | ✅ Better |
| **Developer experience** | Unknown | TypeScript, modern tooling | ✅ Better |
| **Cost** | Unknown (likely higher) | ~$7-14/mo | ✅ Better |

## Architecture Assessment

| Component | Soundness | Scalability | Security | Verdict |
|---|---|---|---|---|
| Multi-tenant foundation | Excellent | Scales to 1000s | 4-layer defense | ✅ |
| 3-app monorepo | Good | Independent deploy | Shared auth | ✅ |
| PostgreSQL (self-hosted) | Good | Vertical scaling on ECS | RLS enabled | ⚠️ Need backup testing |
| Drizzle ORM | Good | Efficient queries | Tenant middleware | ✅ |
| Auth.js | Good | Stateless JWT | HTTP-only cookies | ✅ |
| Image handling | Weak | No optimization | No validation detail | 🟡 Needs image processing |
| Caching (ISR + TanStack) | Good | Reduces DB load | Cache invalidation clear | ✅ |
| Background jobs (cron) | Adequate | Simple scripts | Backup encrypted | ⚠️ No job monitoring |

## Recommendations Summary

### Must do before Phase 4
1. **M1:** Add pagination specification to all list API endpoints
2. **M3:** Document atomic stock decrement strategy in order creation
3. **M5:** Add image processing pipeline (sharp) for product uploads

### Should do before Phase 4
4. **M2:** Add SSE-based real-time order notification
5. **M4:** Design empty states for all major views + onboarding wizard
6. **m4:** Clarify order number generation strategy
7. **m6:** Add barcode scan support to cashier flow

### Can do during implementation
8. **m1:** Implement category name fallback logic for i18n
9. **m2:** Add product sorting in storefront
10. **m3:** Plan multi-image support for Build Phase 2
11. **m5:** Add rate limiting for storefront order creation
12. **S1-S4:** Implement suggestions as time allows

## Review Sign-off

| Item | Status |
|---|---|
| Blockers resolved | ✅ None found |
| Major issues resolved or accepted | ✅ All 5 resolved — PLANNING.md updated 2026-03-22 |
| User approves Phase 4 | ☐ Pending |

### Resolution summary
| Issue | Fix applied |
|---|---|
| M1: No API pagination | Added §5.1: offset-based for admin, cursor-based for storefront. Default limit 20, max 100. |
| M2: No real-time notification | Added §8.6: SSE-based order notifications with sound alert. Fallback to 30s polling. |
| M3: Stock race condition | Updated §5.2: Atomic `UPDATE ... WHERE stock >= $qty RETURNING *` in DB transaction. 409 response on insufficient stock. |
| M4: Missing empty states | Added §7.7 (empty states for all views), §7.8 (4-step onboarding wizard), §7.9 (error states). Added `onboarding_completed` to tenants schema. |
| M5: No image processing | Added §8.4.1: `sharp` pipeline — 3 sizes (thumb/medium/full) in WebP. 96% size reduction. $0 cost. |
