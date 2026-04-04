# Product Design Review — Macau POS Online Storefront

| Field | Value |
|---|---|
| **Project** | Macau POS — Online Storefront |
| **Reference** | Shopline (primary), Shopify (secondary) |
| **Reviewer** | Claude (Senior PM Review) |
| **Planning doc version** | v0.1 / 2026-04-05 |
| **Review date** | 2026-04-05 |
| **Overall verdict** | 🟢 Proceed (all issues resolved) |

## Executive Summary

The storefront planning is **strong and well-structured**. The shared-DB architecture is a genuine competitive advantage over Shopline/Shopify (zero sync delay). The feature scope is realistic — 20 P0 features for v1 with clear deferrals. The section-based homepage builder and delivery zone system add meaningful merchant value without overcomplicating the MVP.

**Key strengths:** Shared DB eliminates sync complexity; mobile-first design with proven patterns from cashier app; Macau-specific payment focus (MPay differentiator); clear fulfillment state machine for online orders; solid security model with cookie separation.

**Key concerns:** (1) Product slug generation is not defined — critical for SEO URLs. (2) No product image gallery schema — current `products.image` is a single VARCHAR. (3) Checkout requires delivery selection but the "pickup" option has no location picker. (4) Guest-to-customer cart merge has edge cases not addressed. (5) `storefront_configs` JSONB validation is entirely app-side with no schema contract.

**Reference comparison:** We exceed Shopline on POS integration and Macau payment support. We match Shopify on checkout UX patterns (one-page, guest, cart drawer). We're behind both on product media (no gallery, no video support in v1).

**Recommendation:** Fix the 2 blockers (product slugs, image gallery), address the 3 major issues, then proceed to Phase 4.

## Severity Summary

| Severity | Count |
|---|---|
| 🔴 Blocker | 2 |
| 🟡 Major | 3 |
| 🔵 Minor | 4 |
| 💡 Suggestion | 3 |

---

## Blockers

### B1. No product slug strategy — SEO URLs broken

**Dimension:** Data Model Quality
**Section:** §3.6 URL Structure, §4.2 products table
**Finding:** The URL structure defines `/{locale}/products/{slug}` but the existing `products` table has no `slug` column. There is no strategy for generating slugs. SKU exists but is optional and not URL-safe. Product names are Chinese — `products/{保力達寶礦力500ml}` is not a valid URL.
**Impact:** Every product URL will be broken. SEO completely fails. Shareable links impossible.
**Recommendation:** Add `slug VARCHAR(200)` column to products table. Auto-generate from English translation or SKU at creation: `pocari-sweat-500ml`. Migration: backfill from existing `translations.en` or `sku`. Add unique index `(tenantId, slug)`.

### B2. Single product image — no gallery support

**Dimension:** UX Completeness / Reference Comparison
**Section:** §1.3 Feature #5, §7.1 product-gallery.tsx
**Finding:** The existing `products.image` is a single `VARCHAR(500)`. The frontend architecture (§7.1) includes a `product-gallery.tsx` component, but there's no DB support for multiple images. Shopline supports multiple images per product. Shopify recommends 5-7 images per product. The storefront product detail page would show only 1 image.
**Impact:** Product detail pages look bare compared to any reference. Variant-specific images impossible. Customers expect to see products from multiple angles. Mobile carousel meaningless with 1 image.
**Recommendation:** Add `product_images` table: `id, productId, url, altText, altTranslations (JSONB), sortOrder, variantId (nullable)`. Or simpler: change `products.image` to `products.images JSONB` (array of `{url, alt, variantId?}`). The JSONB array approach is simpler and matches existing patterns.

---

## Major Issues

### M1. Pickup option has no location selection

**Dimension:** UX Completeness
**Section:** §5.2 createOrder, §7.1 delivery-picker.tsx
**Finding:** The checkout supports `deliveryMethod: "pickup"` but the API contract doesn't include a `pickupLocationId`. For multi-location merchants (e.g., CountingStars has "Main Store" + "Airport Kiosk"), the customer needs to choose WHICH location to pick up from. The delivery-picker component exists but no location selector is defined.
**Impact:** Multi-location merchants can't offer pickup properly. Customer doesn't know where to go.
**Recommendation:** Add `pickupLocationId` to createOrder input. At checkout, if method = "pickup", show location selector (name, address, hours from `locations` table). Store `pickupLocationId` on order.

### M2. Cart merge edge cases unhandled

**Dimension:** Architecture Soundness
**Section:** §4.2 carts, §5.1 endpoint #24
**Finding:** `mergeGuestCart` is defined as a single action, but these edge cases aren't addressed:
- Guest cart has 3x ProductA, customer cart already has 2x ProductA → merge to 5? Or keep customer's 2?
- Guest cart has a variant that's now out of stock → fail silently? Notify?
- Guest cart has items from a different tenant (multi-tenant: customer visits StoreA then StoreB) → must not merge cross-tenant
**Impact:** Silent data corruption or confusing cart states on login.
**Recommendation:** Define merge strategy explicitly: (1) Sum quantities for same product+variant, cap at stock. (2) Skip out-of-stock items with a toast notification. (3) Validate tenantId matches on both carts before merge. (4) Log merge events for debugging.

### M3. JSONB schema validation only app-side

**Dimension:** Data Model Quality
**Section:** §4.2 storefront_configs, storefront_pages
**Finding:** `storefront_configs.homepageSections` and `storefront_pages.content` are JSONB with complex documented structures, but PostgreSQL has no CHECK constraints on them. Any malformed JSON (missing `type` field, invalid section type, missing required `data` fields) would silently persist and cause runtime errors on the storefront.
**Impact:** A single bad admin save could break the storefront homepage for all customers until manually fixed.
**Recommendation:** Add Zod validation schemas in the server actions (already app-side). Additionally, add a PostgreSQL CHECK constraint or trigger that validates the JSONB structure minimally: `CHECK (branding ? 'accentColor')`, `CHECK (jsonb_array_length(homepage_sections) >= 0)`. The app-side Zod validation is the primary defense; DB checks are a safety net.

---

## Minor Issues

### m1. No "back to shopping" path after checkout confirmation

**Dimension:** UX Completeness
**Section:** §7.1 checkout/confirmation
**Finding:** The confirmation page shows order number and details, but there's no explicit "Continue Shopping" button or link back to the catalog. Both Shopline and Shopify include this. Without it, the customer journey dead-ends.
**Recommendation:** Add a "Continue Shopping" button linking to `/{locale}/products` and a "View Order" button linking to order detail (if logged in) or "Track Order" link with order number lookup.

### m2. No 404 page design for storefront

**Dimension:** UX Completeness
**Section:** §7.1 app structure
**Finding:** No `not-found.tsx` in the app structure. Product slugs that don't exist, tenants that don't exist, and invalid locales need graceful handling. The middleware mentions 404 for invalid tenants but the customer-facing page design isn't specified.
**Recommendation:** Add `app/[locale]/not-found.tsx` with: shop branding (if tenant resolved), search bar, "Back to homepage" link, "Popular products" section. Also add `app/not-found.tsx` for invalid tenants.

### m3. Category slug not defined

**Dimension:** Data Model Quality
**Section:** §3.6 URL Structure
**Finding:** URL structure has `/{locale}/categories/{slug}` but the existing `categories` table has no `slug` column (only `name` in Chinese + `translations` JSONB). Same issue as B1 for products but lower priority since categories are admin-managed.
**Recommendation:** Add `slug VARCHAR(100)` to categories. Auto-generate from English translation or category name. Add unique index `(tenantId, slug)`.

### m4. Customer session table reuse unclear

**Dimension:** Architecture Soundness
**Section:** §10.1 Authentication
**Finding:** §10.1 says "Reuse `sessions` table (add `customerId` FK)" but the existing sessions table has `userId` FK → users. The customer auth would need a `customerId` FK → customers. Having both `userId` and `customerId` on the same sessions table is confusing — a session is either staff or customer, never both.
**Recommendation:** Create a separate `customer_sessions` table: `id, customerId, token, expiresAt, createdAt`. Simpler, no ambiguity. Or add a `type` column (staff/customer) to the existing sessions table and make `userId`/`customerId` mutually exclusive.

---

## Suggestions

### S1. Add Open Graph / social sharing meta tags

**Benefit:** When customers share product links on WhatsApp/WeChat/Facebook, the preview shows product image + name + price instead of a blank card. Critical for Macau social commerce (even though livestream is P2, link sharing is happening now).
**Implementation:** `generateMetadata()` on product detail page returning `og:title`, `og:description`, `og:image`, `og:price:amount`, `og:price:currency`.

### S2. Add product slug to admin product editor

**Benefit:** When merchants edit products in admin, they can see and customize the URL slug. Important for SEO-aware merchants.
**Implementation:** Auto-generate slug from English name, allow manual override. Show preview URL in product editor.

### S3. Consider adding `products.slug` as auto-generated on seed/import

**Benefit:** Existing 102 products + 127 variants need slugs backfilled. The import scripts should generate slugs automatically.
**Implementation:** In seed.ts and import scripts: `slugify(translations.en || name)` with collision detection (append -2, -3).

---

## Scenario Walkthroughs

### W1: Guest Purchase (Local Customer — Mobile)
```
User: 本地顧客 on iPhone (375px)
Action: "Buy a PowerBank, pay with MPay, no account"
Step 1: → Homepage (RSC) → section renderer → hero + featured → PASS
Step 2: → Search "PowerBank" → product list → filter → PASS
Step 3: → Tap product → detail page → image (❌ only 1 image, B2) → variant selector → PASS
Step 4: → Add to cart → cart badge updates → PASS
Step 5: → Tap cart → drawer slides up → items shown → PASS
Step 6: → Tap checkout → contact form → PASS
Step 7: → Select delivery method → "pickup" → ❌ no location picker (M1) → "delivery" → zone selector → PASS
Step 8: → Select MPay → simulated redirect → confirmation → ❌ no "continue shopping" (m1) → PASS (with warning)
Verdict: ⚠️ (B2 + M1 + m1)
```

### W2: Returning Customer Reorder
```
User: 回頭客 on desktop (1280px)
Action: "Login, reorder from history"
Step 1: → Login page → enter phone → verification code → ❌ session table ambiguity (m4) → logged in → PASS
Step 2: → Account → orders → past order shown → PASS
Step 3: → Product detail → add to cart → PASS
Step 4: → Cart page (desktop) → items shown → PASS
Step 5: → Checkout → saved address auto-fills → PASS
Step 6: → Pay with card → confirmation → PASS
Verdict: ⚠️ (m4)
```

### W3: Tourist Quick Purchase (English)
```
User: 遊客 (Tourist from UK) on iPhone
Action: "Switch to English, buy one item with Visa"
Step 1: → Homepage in TC → language switcher → select EN → URL changes to /en/ → PASS
Step 2: → Browse products → names show English translations → PASS
Step 3: → Product detail → ❌ URL has no slug (B1) → variant selector → PASS
Step 4: → Guest checkout → contact form → PASS
Step 5: → Enter card → Stripe iframe → confirmation → PASS
Verdict: ❌ (B1)
```

### W4: Merchant Configures Storefront
```
User: 商戶老闆 in admin dashboard
Action: "Set up my storefront homepage and branding"
Step 1: → Admin → Online Store → Appearance → upload logo, set accent color → PASS
Step 2: → Homepage → reorder sections (drag hero, featured, categories) → PASS
Step 3: → Pages → create "About Us" page → rich text editor → PASS
Step 4: → Visit storefront → verify branding applied → PASS
Step 5: → ❌ No product slug visible in admin to verify SEO URLs (S2)
Verdict: ⚠️ (S2)
```

### W5: Delivery Zone Checkout
```
User: 本地顧客 ordering delivery to Taipa
Action: "Order for delivery, select Taipa zone"
Step 1: → Add items → checkout → select "Delivery" → PASS
Step 2: → Zone selector → "Taipa: MOP 25" → delivery fee added to total → PASS
Step 3: → Enter address → district = Taipa → PASS
Step 4: → Pay → order created with delivery_fee = 25, fulfillment_status = pending_confirmation → PASS
Step 5: → Admin sees order → updates to "confirmed" → "preparing" → "shipped" → PASS
Verdict: ✅
```

### Scenario Coverage Summary

| Scenario | Priority | Verdict | Notes |
|---|---|---|---|
| W1: Guest Purchase | P0 | ⚠️ | B2 (single image), M1 (no pickup location), m1 (no continue shopping) |
| W2: Returning Reorder | P0 | ⚠️ | m4 (session table ambiguity) |
| W3: Tourist Purchase | P0 | ❌ | B1 (no product slug = broken URLs) |
| W4: Merchant Config | P0 | ⚠️ | S2 (no slug in admin) |
| W5: Delivery Checkout | P0 | ✅ | Clean pass |

---

## Reference Comparison

| Aspect | Shopline | Shopify | Our Design | Verdict |
|---|---|---|---|---|
| POS inventory sync | Separate product (delay) | Via app (delay) | Same DB (instant) | ✅ Better |
| Macau payments (MPay) | Not supported | Not native | P0 feature | ✅ Better |
| Product images | Multiple per product | 5-7 recommended | Single image ❌ | ❌ Worse |
| Guest checkout | Supported | Supported, 24% less abandonment | Supported | ⚠️ Comparable |
| One-page checkout | Supported | Standard | Designed | ⚠️ Comparable |
| Product search | Full-text + faceted | Full-text + faceted | ILIKE (basic) | ⚠️ Worse (v1) |
| Mobile UX | Responsive, mobile-first | 51% mobile traffic | Mobile-first with bottom sheets | ⚠️ Comparable |
| Storefront customization | 25+ themes, no-code builder | 800+ themes, Liquid | Section-based, config-driven | ⚠️ Comparable (simpler but sufficient) |
| Multi-language | 3 langs + auto-translate | 2 native + apps | 5 languages native | ✅ Better |
| Customer accounts | Email + password | Passwordless | Passwordless | ✅ Better |
| Order fulfillment | Full logistics integration | Full logistics | Manual + delivery zones | ⚠️ Simpler (sufficient for v1) |
| Delivery zones | Shipping zone config | Shipping zones | Per-location zones with fees | ⚠️ Comparable |

---

## Architecture Assessment

| Component | Soundness | Scalability | Security | Verdict |
|---|---|---|---|---|
| Shared DB (3 apps) | ✅ Excellent | ⚠️ Single DB bottleneck at scale | ✅ Tenant isolation via middleware | ✅ Sound for MVP |
| Customer auth (passwordless) | ✅ Well-designed | ✅ Stateless verification | ✅ Rate-limited, single-use codes | ✅ Sound |
| Cart (DB-backed) | ✅ Persistent | ✅ Simple queries | ✅ Session token + tenant isolation | ✅ Sound |
| Storefront config (JSONB) | ⚠️ No schema validation in DB | ✅ Single row per tenant | ⚠️ Malformed JSON = broken storefront | 🟡 Needs Zod validation |
| Payment (simulated Phase 1) | ✅ Correct phasing | N/A | ⚠️ Webhook signature verification not yet implemented | ⚠️ Track for Phase 2 |
| Fulfillment state machine | ✅ Clear states | ✅ Simple column update | ✅ Server-side only | ✅ Sound |
| Section-based homepage | ✅ Flexible | ✅ Single JSON read | ⚠️ Depends on app-side validation | ⚠️ Sound with validation |

---

## Recommendations Summary

### Must do before Phase 4
1. **B1:** Add `slug` column to `products` table with auto-generation strategy and backfill plan
2. **B2:** Add multiple image support — either `product_images` table or `products.images` JSONB array

### Should do before Phase 4
1. **M1:** Add `pickupLocationId` to checkout for multi-location pickup
2. **M2:** Define explicit cart merge strategy with edge case handling
3. **M3:** Add Zod validation schemas for all JSONB config fields

### Can do during implementation
1. **m1:** Add "Continue Shopping" + "View Order" buttons on confirmation page
2. **m2:** Design 404 pages for storefront (invalid tenant, product, locale)
3. **m3:** Add `slug` column to `categories` table
4. **m4:** Create separate `customer_sessions` table (or add `type` column)

---

## Resolutions Applied (2026-04-05)

| Issue | Resolution |
|---|---|
| 🔴 B1: No product slug | Added `slug VARCHAR(200)` to products + categories. Auto-generate from EN translation. Unique index per tenant. Backfill script planned. |
| 🔴 B2: Single product image | Added `images JSONB` array to products. Supports multiple images with alt text, translations, variant-specific images, sort order. Migration: existing `image` → `images[0]`. |
| 🟡 M1: No pickup location | Added `pickupLocationId` to createOrder input + orders table. Checkout shows location selector when method = "pickup". |
| 🟡 M2: Cart merge edge cases | Defined explicit merge strategy: sum quantities (cap at stock), skip OOS items with toast notification, reject cross-tenant, handle empty carts. |
| 🟡 M3: JSONB validation | Added Zod validation schemas for all storefront config JSONB fields. DB CHECK constraints as safety net. |
| 🔵 m3: Category slug | Added `slug VARCHAR(100)` to categories with same strategy as products. |
| 🔵 m4: Session table ambiguity | Created separate `customer_sessions` table instead of reusing staff sessions. |

## Review Sign-off

| Item | Status |
|---|---|
| Blockers resolved | ✅ Done (B1, B2) |
| Major issues resolved or accepted | ✅ Done (M1, M2, M3) |
| User approves Phase 4 | ☐ Pending |
