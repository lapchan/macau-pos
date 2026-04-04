# Macau POS — Online Storefront Planning Document

| Field | Value |
|---|---|
| **Project** | Macau POS — Online Storefront |
| **Reference** | Shopline (primary), Shopify (secondary) |
| **Document** | Application planning — cumulative |
| **Version** | v0.1 |
| **Status** | Phase 0 — Draft |
| **Date** | 2026-04-04 |

---

## 1. Project Intent

### 1.1 Reference Analysis

#### Shopline (Primary — HK/Macau Market)

**Overview:** Hong Kong-born eCommerce platform (2013), 600K+ merchants, dominant in HK/TW/SEA. Positions as "one-stop smart commerce partner" with Online-Merge-Offline (OMO) focus.

**Key findings:**

| Aspect | Finding | Confidence |
|---|---|---|
| **Core model** | Responsive web storefront (not native app), mobile-first | Confirmed |
| **Checkout** | 3 modes: multi-step, one-page, express (single product) | Confirmed |
| **Payments (HK)** | WeChat Pay, Alipay HK, PayMe, Octopus, Apple/Google Pay, FPS, cards | Confirmed |
| **Payments (Macau)** | No native MPay integration found — critical gap | Strong inference |
| **Categories** | 3-level hierarchy, drag-and-drop ordering | Confirmed |
| **Collections** | Smart (rule-based auto-curate) + Manual (hand-picked) | Confirmed |
| **Search** | Full-text with faceted filtering (brand, color, size, price, season) | Confirmed |
| **Customer accounts** | Guest + registered checkout, saved addresses, order tracking | Confirmed |
| **OMO** | Unified inventory across online + POS + social channels | Confirmed |
| **Social commerce** | Native livestream shopping (FB/IG), WhatsApp ordering | Confirmed |
| **Languages** | EN, TC, SC + auto-translate via Google Translate | Confirmed |
| **Logistics** | SF Express, Kerry Express, HK Post integration | Confirmed |
| **Themes** | 25+ free templates, no-code builder | Confirmed |
| **Transaction fees** | ~2% vs Shopify's 2.4–2.9% | Confirmed |
| **Weakness** | Small app ecosystem (120 vs Shopify 8,000+), limited analytics | Confirmed |
| **Weakness** | No explicit Macau-specific features or compliance | Strong inference |

**Strengths to replicate:** OMO inventory sync, regional address formatting, one-page checkout, faceted filtering, multi-language, social channel ordering.

**Gaps we can exploit:** MPay support (90% Macau population), Macau-specific delivery zones, native POS integration (Shopline sells POS as separate product).

#### Shopify (Secondary — Global Best Practices)

**Key patterns for our storefront:**

| Pattern | Detail | Why it matters |
|---|---|---|
| **Cart drawer** | Slide-out panel instead of cart page | Keeps users browsing, reduces navigation |
| **One-page checkout** | All fields on single scrollable page | Reduces abandonment vs multi-step |
| **Guest checkout** | No forced account creation | 24% fewer cart abandons |
| **Sticky add-to-cart** | Button stays visible on scroll (mobile) | Higher conversion on long product pages |
| **Bottom sheets** | Mobile filters, variant selection, cart | Touch-friendly, familiar pattern |
| **Passwordless auth** | Email/phone + 6-digit code | No passwords to remember |
| **React Server Components** | Server-render catalog, client-render interactions | Fast load, good SEO |
| **Hydrogen patterns** | Framework-agnostic React components for cart, product, price | Reusable component architecture |

**Mobile UX data:** 51.4% of online spend from mobile, 79% of traffic from phones. Checkout target: < 4 minutes. Touch targets: 44x44px minimum.

---

### 1.2 App Identity

| Field | Value |
|---|---|
| **App name** | Macau POS Storefront |
| **Working title** | CountingStars Shop (per-tenant branded) |
| **One-sentence description** | Mobile-first online storefront where customers browse products, order, and pay with Macau payment methods (MPay, Alipay, WeChat Pay) — synced in real-time with the merchant's POS |
| **App type** | Web — responsive mobile-first storefront (3rd app in monorepo) |
| **Target users** | Walk-in customers, online shoppers, tourists, returning customers |
| **Key problem** | Macau small retailers have no affordable way to sell online with local payment methods and POS inventory sync |
| **Scale** | 100–1,000 concurrent shoppers per tenant initially |
| **Tech stack** | Next.js 16, PostgreSQL, Drizzle ORM, Tailwind CSS (same as existing apps) |
| **Port** | 3300 |
| **Timeline** | Build Phase 1 scope (P0 features) |

---

### 1.3 Feature Scope

| # | Feature | In Shopline? | In Shopify? | In our v1? | Priority | Notes |
|---|---|---|---|---|---|---|
| 1 | Product catalog (grid, list) | Yes | Yes | Yes | P0 | Reuse existing products/categories schema |
| 2 | Category navigation (3-level) | Yes | Yes | Yes | P0 | Existing `parentCategoryId` supports hierarchy |
| 3 | Product search (full-text) | Yes | Yes | Yes | P0 | PostgreSQL `ILIKE` + trigram for v1 |
| 4 | Faceted filtering (price, category, stock) | Yes | Yes | Yes | P0 | Essential for discovery |
| 5 | Product detail page (images, description, variants) | Yes | Yes | Yes | P0 | Reuse variant system |
| 6 | Variant selection (color, size, etc.) | Yes | Yes | Yes | P0 | Reuse `option_groups`/`option_values` |
| 7 | Shopping cart (page + drawer) | No (page) | Yes | Yes | P0 | Desktop: full `/cart` page (Shopify classic). Mobile: slide-up drawer |
| 8 | One-page checkout | Yes | Yes | Yes | P0 | Guest + registered |
| 9 | Guest checkout (no account required) | Yes | Yes | Yes | P0 | Reduces abandonment |
| 10 | Customer account (register, login) | Yes | Yes | Yes | P0 | Passwordless (email/phone + code) |
| 11 | Order history | Yes | Yes | Yes | P0 | View past orders + status |
| 12 | Saved addresses | Yes | Yes | Yes | P0 | Auto-fill at checkout |
| 13 | MPay payment | No | No | Yes | P0 | **Key differentiator** |
| 14 | Alipay / WeChat Pay | Yes | Via gateway | Yes | P0 | QR code flow |
| 15 | Card payment (Visa/MC) | Yes | Yes | Yes | P0 | Standard gateway |
| 16 | 5-language i18n | Partial | Partial | Yes | P0 | TC, SC, EN, PT, JA |
| 17 | Responsive mobile-first design | Yes | Yes | Yes | P0 | Bottom sheets, sticky CTAs |
| 18 | Real-time stock sync with POS | Yes | Via app | Yes | P0 | Same DB = automatic |
| 19 | Order tracking (status updates) | Yes | Yes | Yes | P1 | |
| 20 | Wishlist / favorites | Via app | Via app | Yes | P1 | |
| 21 | Smart collections (rule-based) | Yes | Yes | Yes | P1 | Auto-curated by tags/price/category |
| 22 | Product recommendations | Via app | Yes | Yes | P1 | "You may also like" |
| 23 | Recently viewed products | No | Yes | Yes | P1 | Session-based |
| 24 | Coupon / promo code at checkout | Yes | Yes | Yes | P1 | |
| 25 | Per-tenant branding (logo, colors, fonts) | Yes | Yes | Yes | P0 | Logo, accent color, font, favicon, announcement bar |
| 26 | Section-based homepage builder | Yes | Yes (themes) | Yes | P0 | Merchant reorders/toggles pre-built sections via admin |
| 27 | Custom static pages (About, FAQ, Returns) | Yes | Yes | Yes | P0 | Rich text editor in admin, per-locale translations |
| 28 | Navigation customization (header + footer) | Yes | Yes | Yes | P1 | Header links, footer columns, social links |
| 29 | Email order confirmation | Yes | Yes | Yes | P1 | |
| 30 | Buy Online Pick Up In Store (BOPIS) | Yes | Yes | No | P2 | Deferred |
| 31 | Social commerce / livestream | Yes | Via app | No | P2 | Deferred |
| 32 | Loyalty / member points | Yes | Via app | No | P2 | Deferred |
| 33 | Subscription products | Yes | Yes | No | P2 | Deferred |
| 34 | SMS marketing | Yes | Via app | No | P2 | Deferred |
| 35 | Abandoned cart recovery email | Yes | Yes | No | P2 | Deferred |
| 36 | PWA / installable app | Partial | No | No | P2 | Deferred |
| 37 | Native mobile app | Via 3rd party | Via 3rd party | No | P2 | Deferred |

**Summary:** 20 P0 features, 9 P1 features, 8 P2 features (deferred).

---

### 1.4 Success Criteria

1. **Customer can browse → add to cart → checkout → pay within 4 minutes on mobile**
2. **Same product catalog as POS** — no duplicate data entry, real-time stock sync
3. **MPay, Alipay, WeChat Pay all functional** — Macau's primary payment methods
4. **Works in 5 languages** with proper product name translations
5. **Guest checkout converts** — no forced account creation
6. **Orders from storefront appear in admin dashboard** — unified order management
7. **Mobile-first** — full functionality on phone screens (375px+)
8. **Per-tenant branding** — each merchant gets their own branded storefront
9. **Page load < 2 seconds** on 4G connection

---

### 1.5 Out of Scope (v1)

- Native mobile app (iOS/Android)
- Social commerce / livestream shopping
- BOPIS (Buy Online Pick Up In Store)
- Loyalty / member points / stored value cards
- Subscription products
- SMS / email marketing automation
- Abandoned cart recovery
- Advanced analytics / AI recommendations
- Marketplace features (multi-vendor)
- Delivery logistics integration (manual for v1)
- Cash payment (online only — cash is POS-only)

---

### 1.6 Architectural Advantage: Shared Database

Unlike Shopline/Shopify where online store and POS are separate products with sync layers, our storefront shares the **same PostgreSQL database** as admin and cashier:

```
apps/admin (port 3100)      ──┐
apps/cashier (port 3200)    ──┼── packages/database (PostgreSQL)
apps/storefront (port 3300) ──┘
```

**This means:**
- Product created in admin → instantly available on storefront (no sync delay)
- Stock sold on POS → immediately reflected on storefront (same table)
- Order placed on storefront → immediately visible in admin dashboard
- Customer account → shared across storefront and POS (if phone/email match)
- Pricing strategies → same per-location overrides apply

**New tables needed** (customer-facing entities that don't exist yet):
- `customers` — separate from `users` (staff). Customer accounts with email, phone, password hash
- `customer_addresses` — saved shipping/billing addresses
- `carts` — persistent cart (session token for guests, customer_id for registered)
- `cart_items` — line items with product/variant references
- `wishlists` + `wishlist_items` — saved products (P1)
- `collections` + `collection_items` — smart/manual groupings (P1)

---

### Phase 0 Sign-off

**Phase:** 0 — Capture Intent + Research Reference
**Deliverables:** Reference analysis (Shopline + Shopify), project intent, feature scope (17 P0 / 8 P1 / 9 P2), success criteria, out-of-scope list, shared DB architecture
**Decision required:** Does this accurately capture what you want to build?

- [ ] Approved — proceed to Phase 0.1 (User Scenarios)
- [ ] Revisions needed — {specify}

**User notes:**
Approved. Cart: page on desktop, drawer on mobile. Follow Shopify's approach.

---

## 2. User Scenario Design

### 2.1 User Personas

| Persona | Context | Language | Key Need |
|---|---|---|---|
| **本地顧客 (Local Customer)** | Macau resident browsing on phone during commute or at home. Knows the shop from walking past it. Wants to order ahead or browse inventory before visiting. Pays with MPay or Alipay. | zh-TW | Browse products, order online, pay with local methods, pick up or get delivery |
| **遊客 (Tourist)** | Mainland China or international visitor. Discovers shop via search or social media. Mobile-first, may not read Chinese. Pays with Alipay, WeChat Pay, or card. | en / zh-CN / pt / ja | Find products in their language, quick checkout without account, card or mobile pay |
| **回頭客 (Returning Customer)** | Has purchased before (in-store or online). Has a customer account. Wants to reorder, track orders, and use saved addresses. Values speed and convenience. | zh-TW | Quick reorder, order tracking, saved addresses, see purchase history |
| **商戶老闆 (Merchant Owner)** | Reviews storefront from customer perspective. Checks how products look online, verifies pricing, tests checkout flow. Also manages storefront settings in admin. | zh-TW | Verify storefront appearance, test ordering flow, manage online presence |

### 2.2 User Stories

#### Persona: 本地顧客 (Local Customer)

**Discovery & Browsing**
1. 「我想瀏覽這家店的線上商店，看看有什麼商品，按分類找到我要的東西。」
   *I want to browse this shop's online store, see what products are available, and find what I need by category.*

2. 「我想用搜尋功能快速找到某個商品，輸入名字就能找到。」
   *I want to use search to quickly find a product by typing its name.*

3. 「我想篩選商品，例如只看某個價位範圍、只看有貨的、或只看某個分類。」
   *I want to filter products by price range, in-stock only, or by category.*

4. 「我看到一個商品，想看詳細資料——圖片、描述、規格、價格、庫存狀態。」
   *I see a product and want to view details — images, description, specs, pricing, stock status.*

5. 「這個商品有多個規格（例如顏色和尺寸），我想選好規格再加入購物車。」
   *This product has variants (like color and size), I want to select options before adding to cart.*

**Cart & Checkout**
6. 「我選好商品和數量，想加入購物車，然後繼續瀏覽。」
   *I've chosen the product and quantity, I want to add to cart and continue browsing.*

7. 「我想查看購物車，修改數量或刪除商品，確認總價。」
   *I want to review my cart, adjust quantities or remove items, and confirm the total.*

8. 「我不想註冊帳號，直接以訪客身份結帳。」
   *I don't want to create an account, I just want to checkout as a guest.*

9. 「我要選擇付款方式（MPay），完成付款。」
   *I want to select my payment method (MPay) and complete the payment.*

10. 「付款成功後，我想看到確認頁面，顯示訂單編號和預計取貨/送達時間。」
    *After payment, I want to see a confirmation page with order number and estimated pickup/delivery time.*

**Post-Purchase**
11. 「我想查看我的訂單狀態——是否已確認、準備中、可取貨。」
    *I want to check my order status — confirmed, preparing, ready for pickup.*

12. 「我想切換語言到英文或葡文。」
    *I want to switch the language to English or Portuguese.*

#### Persona: 遊客 (Tourist)

**Quick Purchase**
13. 「我在社交媒體看到這家店，想直接點進去看商品。」
    *I saw this shop on social media, I want to tap through and browse products.*

14. 「頁面自動用了中文，我想切換到英文。」
    *The page loaded in Chinese, I want to switch to English.*

15. 「我想快速買一個商品，不用註冊，用信用卡付款。」
    *I want to quickly buy a product without registering, pay with credit card.*

16. 「我在大陸來的，想用支付寶或微信支付。」
    *I'm from mainland China, I want to pay with Alipay or WeChat Pay.*

17. 「我想知道能不能到店自取，或者有沒有送貨到酒店。」
    *I want to know if I can pick up in store, or if they deliver to my hotel.*

#### Persona: 回頭客 (Returning Customer)

**Account & Reorder**
18. 「我想登入我的帳號，用手機號碼收驗證碼就好，不用記密碼。」
    *I want to log in with my phone number and a verification code, no password to remember.*

19. 「我想看到我之前的訂單紀錄，快速重新下單。」
    *I want to see my past orders and quickly reorder.*

20. 「我已經儲存了送貨地址，結帳時自動帶入，不用再打一次。」
    *I have a saved delivery address, it should auto-fill at checkout.*

21. 「我想把喜歡的商品加入收藏，下次容易找到。」
    *I want to save favorite products to my wishlist for easy access later.*

22. 「我想修改我的個人資料——名字、手機、電郵。」
    *I want to update my profile — name, phone, email.*

23. 「我想查看某筆訂單的詳情，包含所有商品和付款資料。」
    *I want to view details of a specific order, including all items and payment info.*

#### Persona: 商戶老闆 (Merchant Owner)

**Storefront Verification**
24. 「我想從顧客角度看看我的線上商店長什麼樣子。」
    *I want to see my online store from the customer's perspective.*

25. 「我想確認商品資料、圖片、價格在線上商店顯示正確。」
    *I want to verify product info, images, and pricing display correctly on the storefront.*

26. 「我想測試整個購買流程——從瀏覽到結帳——確保顧客體驗順暢。」
    *I want to test the entire purchase flow — from browsing to checkout — to ensure smooth customer experience.*

27. 「我想在管理後台看到線上訂單，跟POS訂單一起管理。」
    *I want to see online orders in the admin dashboard, managed alongside POS orders.*

---

### 2.3 Capability Categories

| Category | Examples | Capability | Priority | Build Phase |
|---|---|---|---|---|
| **Product Discovery** | Browse catalog, search, filter, categories | Product listing page with category nav, full-text search, faceted filters | P0 | Phase 1 |
| **Product Detail** | View images, description, variants, stock, price | Product detail page with image gallery, variant selector, stock indicator | P0 | Phase 1 |
| **Cart Management** | Add/remove items, adjust qty, view totals | Desktop: `/cart` page. Mobile: slide-up drawer. Persistent across pages | P0 | Phase 1 |
| **Guest Checkout** | Place order without account | One-page checkout: contact info → payment → confirmation | P0 | Phase 1 |
| **Payment Processing** | MPay, Alipay, WeChat Pay, Visa/MC | Payment method selection → redirect/QR → confirmation webhook | P0 | Phase 1 |
| **Customer Accounts** | Register, login (passwordless), profile | Email/phone + verification code login, profile management | P0 | Phase 1 |
| **Order History** | View past orders, status tracking | Order list + detail page, status badges | P0 | Phase 1 |
| **Saved Addresses** | Store and reuse delivery addresses | Address CRUD, auto-fill at checkout | P0 | Phase 1 |
| **Language Switching** | 5-language i18n | URL-based locale (`/tc/`, `/en/`, etc.), product name translations | P0 | Phase 1 |
| **Responsive Design** | Mobile-first, touch-friendly | Bottom sheets, sticky CTAs, 375px+ support | P0 | Phase 1 |
| **Order Tracking** | Real-time status updates | Status timeline (confirmed → preparing → ready → completed) | P1 | Phase 1 |
| **Wishlist** | Save favorite products | Add/remove favorites, view wishlist page | P1 | Phase 1 |
| **Collections** | Curated product groupings | Smart (rule-based) + manual collections | P1 | Phase 1 |
| **Recommendations** | "You may also like" | Category-based or purchase-history based suggestions | P1 | Phase 2 |
| **Coupons** | Promo code at checkout | Code entry → discount applied to total | P1 | Phase 2 |
| **Per-Tenant Branding** | Merchant logo, accent color | Dynamic theming from `tenants.accentColor` + shop settings | P1 | Phase 1 |
| **Email Confirmation** | Order receipt via email | Transactional email on order placement | P1 | Phase 2 |
| **BOPIS** | Buy online pick up in store | Location selector at checkout, pickup notification | P2 | Phase 3 |
| **Loyalty** | Points, member tiers | Points on purchase, tier benefits, redemption | P2 | Phase 3 |

---

### 2.4 Acceptance Test Cases

| ID | Scenario | Persona | Input | Expected | Pass Criteria |
|---|---|---|---|---|---|
| **ST-001** | Browse by category | Local | Tap "飲品" category | Only beverage products shown | Products filtered, count matches DB |
| **ST-002** | Search product | Local | Type "口罩" in search | Mask products appear | Results include SAVEWO masks |
| **ST-003** | Filter by price | Local | Set price range MOP 10–50 | Only products in range shown | No product outside range appears |
| **ST-004** | View product detail | Local | Tap product card | Detail page with images, price, description | All fields populated, images load |
| **ST-005** | Select variant | Local | Choose "L" size + "黑色" color | Matching variant shown with its price + stock | Price/stock update, correct variant selected |
| **ST-006** | Add to cart | Local | Tap "Add to cart" | Item in cart, cart badge updates | Cart shows correct item, qty, price |
| **ST-007** | Cart drawer (mobile) | Local | Tap cart icon on mobile | Drawer slides up with items | Drawer renders, items match, totals correct |
| **ST-008** | Cart page (desktop) | Local | Click cart icon on desktop | Navigate to `/cart` page | Page renders with items, quantities editable |
| **ST-009** | Update cart quantity | Local | Change qty from 1 to 3 | Line total and cart total update | Total = unit price × 3 |
| **ST-010** | Remove from cart | Local | Click remove on item | Item removed, total recalculated | Cart updates, empty state if last item |
| **ST-011** | Guest checkout | Local | Click checkout, no login | Checkout page with contact fields | No forced login, can enter name/phone/email |
| **ST-012** | Pay with MPay | Local | Select MPay, complete payment | Order created, confirmation shown | Order in DB with status "completed", order number displayed |
| **ST-013** | Pay with Alipay | Tourist | Select Alipay, scan QR | Redirect to Alipay → callback → confirmation | Payment recorded, order confirmed |
| **ST-014** | Pay with WeChat Pay | Tourist | Select WeChat Pay | QR code or redirect → confirmation | Payment recorded, order confirmed |
| **ST-015** | Pay with card | Tourist | Enter card details | Payment processed → confirmation | PCI-compliant, order created |
| **ST-016** | Switch language | Tourist | Select "English" | All UI text switches to English | No Chinese leaking, product names translated |
| **ST-017** | Register account | Local | Enter phone + receive code | Account created, logged in | Customer in DB, session active |
| **ST-018** | Login (passwordless) | Returning | Enter phone, receive code, enter code | Logged in, see past orders | Session created, order history visible |
| **ST-019** | View order history | Returning | Navigate to "My Orders" | List of past orders with status | Orders sorted by date, status badges correct |
| **ST-020** | Order detail | Returning | Tap an order | Full order detail: items, total, payment, status | All fields match DB record |
| **ST-021** | Saved address auto-fill | Returning | Start checkout with saved address | Address fields pre-filled | Correct address, editable |
| **ST-022** | Save new address | Returning | Enter new address at checkout, tick "save" | Address saved to account | Address appears in address book |
| **ST-023** | Add to wishlist | Returning | Tap heart icon on product | Product saved, heart filled | Wishlist page shows product |
| **ST-024** | Mobile responsive | Local | Browse on 375px screen | Full functionality, no horizontal scroll | All interactive elements tappable |
| **ST-025** | Stock sync with POS | Owner | Sell item on POS | Storefront stock decreases | Real-time update (same DB) |
| **ST-026** | Online order in admin | Owner | Customer places order | Order appears in admin dashboard | Order visible with "online" channel label |
| **ST-027** | Variant out of stock | Local | View variant with 0 stock | "Out of stock" label, add-to-cart disabled | Cannot add to cart |
| **ST-028** | Empty cart checkout | Local | Try to checkout with empty cart | Checkout button disabled or error | Cannot proceed to payment |
| **ST-029** | Product with no image | Local | View product without image | Placeholder shown, no broken image | Graceful fallback |
| **ST-030** | Per-tenant branding | Owner | Access storefront | Shop logo, accent color, name displayed | Matches tenant settings |

---

### 2.5 QA Test Playbook

#### QA-SF-001: Complete Guest Purchase Flow
**Priority:** P0
**Precondition:** Storefront running, products seeded, payment sandbox active
**Steps:**
1. Open storefront homepage on mobile (375px viewport)
2. Verify shop name and branding (logo, accent color) are displayed
3. Browse categories — tap "飲品" → verify only beverages shown
4. Search for "PowerBank" → verify results include Savewo products
5. Tap a product with variants → verify variant picker shows options
6. Select a variant (e.g., "Silver") → verify price updates
7. Tap "加入購物車" → verify cart badge shows "1"
8. Tap cart icon → verify cart drawer slides up (mobile) with correct item
9. Change quantity to 2 → verify total doubles
10. Tap "結帳" → verify checkout page loads (no login required)
11. Fill contact: name, phone, email
12. Select payment method: MPay
13. Complete payment (sandbox)
14. Verify confirmation page: order number, items, total
15. Check admin dashboard → verify order appears with "online" channel

**Expected:** Entire flow completes in < 4 minutes on mobile
**If FAIL:** Note which step failed, capture screenshot, check browser console for errors

#### QA-SF-002: Returning Customer Reorder
**Priority:** P0
**Steps:**
1. Register a customer account (phone + verification code)
2. Complete a purchase (any product, any payment method)
3. Log out
4. Log back in with phone + code
5. Navigate to "My Orders" → verify previous order shown
6. Tap order → verify detail page with all items
7. Start a new order → verify saved address auto-fills at checkout
8. Complete checkout → verify order count incremented

**Expected:** Login and reorder are significantly faster than guest checkout
**If FAIL:** Check session persistence, address save logic, order query

#### QA-SF-003: Language Switching
**Priority:** P0
**Steps:**
1. Open storefront (default: TC)
2. Switch to English → verify: all UI, navigation, buttons in English
3. Browse products → verify product names show English translations
4. Switch to Portuguese → verify all text switches
5. Switch to Japanese → verify
6. Switch to Simplified Chinese → verify
7. Add item to cart → verify cart shows product name in current locale
8. Proceed to checkout → verify checkout labels in current locale

**Expected:** Zero Chinese text leaking in non-TC locales (where translations exist)
**If FAIL:** Note which strings are not translated, check `translations` JSONB on products

#### QA-SF-004: Cart Persistence
**Priority:** P0
**Steps:**
1. Add 2 items to cart as guest
2. Close the browser tab
3. Reopen storefront → verify cart still has 2 items
4. Register an account → verify cart items transfer to account
5. Log out → cart cleared (or show empty cart)
6. Log back in → verify cart is restored from account

**Expected:** Guest cart persists via session token cookie. Registered cart merges on login.
**If FAIL:** Check cart session cookie, cart merge logic on login

#### QA-SF-005: Desktop Cart Page
**Priority:** P0
**Steps:**
1. Open storefront at 1280px+ viewport (desktop)
2. Add 3 different products to cart
3. Click cart icon → verify navigates to `/cart` page (not drawer)
4. Verify all items listed with images, names, prices, quantities
5. Change quantity of item 2 → verify total updates
6. Remove item 3 → verify item removed, total recalculated
7. Click "Checkout" → verify proceeds to checkout page

**Expected:** Full cart page with clear layout, not a drawer
**If FAIL:** Check responsive breakpoint logic, cart page route

#### QA-SF-006: Payment Methods
**Priority:** P0
**Steps:**
1. Add item to cart, proceed to checkout
2. Verify all payment methods shown: MPay, Alipay, WeChat Pay, Visa/MC
3. Select MPay → verify redirect/QR flow initiates
4. (Sandbox) Complete payment → verify confirmation
5. Repeat with Alipay → verify QR/redirect flow
6. Repeat with card → verify card form renders (PCI iframe)
7. Check admin → all orders show correct payment method

**Expected:** Each payment method creates order with correct `payments.method` value
**If FAIL:** Check payment gateway integration, webhook handler

#### QA-SF-007: Stock Sync Verification
**Priority:** P0
**Steps:**
1. Note stock count of a product on storefront (e.g., "5 in stock")
2. On cashier POS, sell 1 unit of that product
3. Refresh storefront product page → verify stock shows "4 in stock"
4. Sell remaining 4 units on POS
5. Refresh storefront → verify "Out of stock" label, add-to-cart disabled
6. On admin, increase stock to 10
7. Refresh storefront → verify "10 in stock", add-to-cart enabled

**Expected:** Zero sync delay (same database)
**If FAIL:** Check if storefront is caching product queries, verify no separate inventory table

#### QA-SF-008: Mobile Responsive
**Priority:** P0
**Steps:**
1. Test at 375px (iPhone SE), 390px (iPhone 14), 768px (iPad)
2. On each viewport:
   a. Browse categories — verify horizontal scroll or collapsible menu
   b. Search — verify search input accessible
   c. Product grid — verify 2-column on phone, 3+ on tablet
   d. Product detail — verify images, variant picker, sticky add-to-cart
   e. Cart — verify drawer on mobile, page on desktop
   f. Checkout — verify all fields accessible, payment buttons tappable
3. Verify no horizontal scroll on any page
4. Verify all tap targets ≥ 44x44px

**Expected:** Full functionality at all viewports
**If FAIL:** Note viewport size and failing element, check Tailwind breakpoints

#### QA-SF-009: Per-Tenant Branding
**Priority:** P1
**Steps:**
1. Open storefront for tenant "CountingStars"
2. Verify: shop name displayed, accent color applied, logo shown (if set)
3. Change accent color in admin settings to "#e8590c" (orange)
4. Refresh storefront → verify accent color changed
5. Change shop name in admin → refresh storefront → verify name updated

**Expected:** Storefront reflects tenant branding settings from admin
**If FAIL:** Check if storefront reads from `tenants` + `shop_settings` tables

---

### Phase 0.1 Sign-off

**Phase:** 0.1 — User Scenario Design
**Deliverables:** 4 user personas, 27 user stories, 19-row capability matrix, 30 acceptance test cases, 9 QA playbook scenarios
**Active persona:** 🎭 Senior Product Manager
**Decision required:** Do the personas, stories, and test cases accurately capture the storefront user experience?

- [ ] Approved — proceed to Phase 1 (Technical Feasibility & Stack)
- [ ] Revisions needed — {specify}

**User notes:**
Approved — proceed to Phase 1.

---

## 3. Technical Feasibility & Stack

🎭 **Active: Backend Architect**

### 3.1 Technology Decisions

The storefront is the 3rd app in the existing monorepo. Most technology decisions are **inherited** from the POS platform (see `docs/01-planning/PLANNING.md` §3.1). This section covers only **storefront-specific** decisions.

| Decision | Reference uses | Selected | Rationale | Confidence |
|---|---|---|---|---|
| **Framework** | Shopline: proprietary. Shopify: Liquid or Hydrogen (React Router) | **Next.js 16 (App Router)** — inherited | Same stack as admin + cashier. RSC for catalog pages. | Confirmed |
| **Routing** | Shopify: `/collections/[slug]`, `/products/[slug]` | **`/[locale]/products/[slug]`** | Locale prefix for i18n + SEO. Matches next-intl pattern. | Confirmed |
| **State (cart)** | Shopify: server-side cart (Storefront API). Shopline: session-based | **DB-backed cart** (session token for guests, customer_id for registered) | Persists across devices for logged-in users. Guest cart survives browser close via cookie. Server-rendered cart page on desktop. | Strong inference |
| **Cart on mobile** | Shopify: cart drawer. Shopline: cart page | **Slide-up drawer** (CSS keyframe animation, same as cashier variant-picker) | No framer-motion dependency. Touch-friendly. Keeps user on current page. | Confirmed |
| **Cart on desktop** | Shopify: `/cart` page | **Full `/cart` page** | User decision — follow Shopify's classic web approach. | Confirmed |
| **Customer auth** | Shopline: email+password or guest. Shopify: passwordless (email+code) | **Passwordless** (phone/email + 6-digit verification code) | No passwords to remember. Best for mobile-first Macau market. Reuse existing session system. | Strong inference |
| **Verification codes** | N/A | **DB-stored codes** with 5-min expiry, 3 attempts max | Simple, no external SMS/email service needed for v1 (display code in dev mode). Production: Brevo for email, TBD for SMS. | Strong inference |
| **Payment gateway** | Shopline: Shopline Payments. Shopify: Shopify Payments | **Phase 1: Simulated** (MPay/Alipay/WeChat as UI + webhook stubs). **Phase 2: QFPay or AlphaPay** (real gateway) | No Macau payment gateway has a free sandbox. Build the UI + webhook handler now, wire real gateway later. | Strong inference |
| **Payment enum** | Existing: tap, insert, qr, cash | **Extend with**: `mpay`, `alipay`, `wechat_pay`, `visa`, `mastercard` | Current enum only covers POS methods. Storefront needs online-specific methods. Migration required. | Confirmed |
| **Order channel** | Not tracked | **Add `channel` column** to orders: `pos`, `online`, `kiosk` | Distinguishes storefront orders from POS orders in admin dashboard. | Confirmed |
| **Customer table** | Existing `users` table (staff only) | **New `customers` table** — separate from staff users | Different auth flow (passwordless vs password+PIN), different fields (addresses, wishlist), no role/posRole needed. Cleaner separation. | Strong inference |
| **SEO** | Shopline: SSR. Shopify: SSR or headless | **Server Components for all catalog pages** | Product/category pages rendered on server for SEO. Cart/checkout are client-interactive. | Confirmed |
| **Image optimization** | Shopify: CDN + responsive. Shopline: CDN | **Next.js `<Image>` with local storage** | Existing product images in `/public/uploads`. Next.js handles responsive srcset. Migrate to CDN at scale. | Confirmed |
| **Port** | N/A | **3300** | Next available after admin (3100) and cashier (3200). | Confirmed |

### 3.2 Feasibility Matrix

| Scenario (from §2.4) | Technical Requirement | Feasible? | Notes |
|---|---|---|---|
| ST-001: Browse by category | Server component query with category filter | ✅ | Existing `categories` table with `parentCategoryId` |
| ST-002: Search product | PostgreSQL `ILIKE` + product name/translations | ✅ | v1 simple. v2: pg_trgm for fuzzy search |
| ST-003: Filter by price | WHERE clause on `sellingPrice` range | ✅ | Index on `(tenantId, status, sellingPrice)` |
| ST-004: Product detail | Server component fetching product + category + images | ✅ | Existing schema covers all fields |
| ST-005: Select variant | Client component reading `option_groups` + `product_variants` | ✅ | Reuse cashier's `VariantPicker` pattern |
| ST-006: Add to cart | Server action: insert/update `cart_items` | ✅ | New `carts` + `cart_items` tables |
| ST-007: Cart drawer (mobile) | Client component with CSS animation | ✅ | Same pattern as cashier history sheet |
| ST-008: Cart page (desktop) | Server component at `/cart` route | ✅ | Standard Next.js page |
| ST-009–010: Cart CRUD | Server actions for qty update / remove | ✅ | Simple DB operations |
| ST-011: Guest checkout | Cart linked to session token (cookie), no customer_id | ✅ | Session token in httpOnly cookie |
| ST-012–015: Payment methods | UI selection + gateway redirect/QR + webhook confirmation | ⚠️ | **Phase 1: simulated.** Real gateway (QFPay/AlphaPay) in Phase 2. Payment UI built now. |
| ST-016: Switch language | URL locale prefix + product translations JSONB | ✅ | Existing translations on products/categories |
| ST-017–018: Customer auth | Verification code via email/phone, session creation | ✅ | Reuse `sessions` table. New `customers` table + `verification_codes` table |
| ST-019–020: Order history | Query orders by customer_id | ✅ | Add `customerId` FK to orders table |
| ST-021–022: Saved addresses | `customer_addresses` table with CRUD | ✅ | New table needed |
| ST-023: Wishlist | `wishlists` + `wishlist_items` tables | ✅ | P1 — straightforward |
| ST-024: Mobile responsive | Tailwind responsive classes, viewport meta | ✅ | Same approach as existing apps |
| ST-025: Stock sync with POS | Same `products.stock` column | ✅ | **Zero sync needed — same DB** |
| ST-026: Online order in admin | Orders table with `channel = 'online'` | ✅ | Admin queries already fetch all orders |
| ST-027: Variant out of stock | Check `product_variants.stock` | ✅ | Existing field |
| ST-028: Empty cart checkout | Client-side validation | ✅ | Disable checkout button if cart empty |
| ST-029: No image fallback | Next.js `<Image>` with fallback | ✅ | Placeholder SVG |
| ST-030: Per-tenant branding | Read `tenants.accentColor` + `shopSettings` | ✅ | Existing fields |

**All P0 scenarios: ✅ feasible (payments ⚠️ simulated in Phase 1)**

### 3.3 Technical Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| 1 | **No Macau payment gateway sandbox** | High | Medium | Phase 1: build payment UI + webhook handler with simulated responses. Phase 2: integrate real gateway (QFPay offers Alipay+WeChat sandbox, MPay requires direct partnership) |
| 2 | **MPay API documentation unavailable** | Medium | High | Research MPay developer portal. Fallback: integrate QFPay (which supports Alipay+WeChat) first, add MPay when docs available |
| 3 | **Verification code delivery (SMS)** | Medium | Medium | Phase 1: email only (Brevo free tier: 300/day). Phase 2: SMS via Twilio or local provider. Dev mode: display code on screen |
| 4 | **Cart race condition** (two tabs, same product with limited stock) | Low | Medium | Atomic stock decrement at checkout: `UPDATE products SET stock = stock - $qty WHERE stock >= $qty RETURNING *`. Already proven in cashier app |
| 5 | **SEO for SPA-like interactions** | Low | Low | Catalog pages are RSC (server-rendered HTML). Cart/checkout don't need SEO. Use `generateMetadata()` for product/category pages |
| 6 | **Guest cart cleanup** | Low | Low | Cron job: delete guest carts older than 7 days. Prevents DB bloat |
| 7 | **Customer ↔ POS user linkage** | Low | Low | Match by phone number. If customer registers with same phone as POS visit, link accounts. Deferred to Phase 2 |

### 3.4 Dependencies (Storefront-Specific)

| Dependency | Purpose | License | Cost | Risk |
|---|---|---|---|---|
| `@macau-pos/database` | Shared DB schema + queries | Workspace | $0 | None — existing |
| `@macau-pos/i18n` | Shared locale types | Workspace | $0 | None — existing |
| Next.js 16 | Framework | MIT | $0 | None — existing |
| Tailwind CSS 4 | Styling | MIT | $0 | None — existing |
| `server-only` | Enforce server-side code | MIT | $0 | None — existing |
| `lucide-react` | Icons | ISC | $0 | None — existing |
| **No new npm dependencies required for Phase 1** |||||

### 3.5 Merchant Storefront Customization

🎨 **Approach: Section-based builder with branding + layout + custom pages**

Merchants customize their storefront via the admin dashboard (not a separate builder tool). The storefront reads a JSON config from the DB and renders pre-built sections accordingly.

#### 3.5.1 Customization Model

```
storefront_config (new table — per location)
├── branding: { logo, accentColor, font, favicon }
├── header: { announcementBar, navLinks[], showSearch, showLanguageSwitcher }
├── homepage_sections: [  ← ordered array, merchant can reorder/toggle
│     { type: "hero_banner", enabled: true, data: { image, title, subtitle, cta } }
│     { type: "featured_collection", enabled: true, data: { collectionId, title } }
│     { type: "product_grid", enabled: true, data: { title, productIds[], columns } }
│     { type: "text_with_image", enabled: false, data: { image, text, layout } }
│     { type: "testimonials", enabled: false, data: { items[] } }
│     { type: "newsletter", enabled: false, data: { title, subtitle } }
│     { type: "about_preview", enabled: true, data: { text, image, linkTo } }
│   ]
├── footer: { columns[], socialLinks[], copyright, showPaymentIcons }
└── pages: { aboutUs, faq, returnPolicy, contact }  ← custom static pages
```

#### 3.5.2 Section Types (Pre-Built)

| Section Type | Description | Data Fields | Priority |
|---|---|---|---|
| `hero_banner` | Full-width banner with CTA button | image, title, subtitle, ctaText, ctaLink, overlayOpacity | P0 |
| `featured_collection` | Product grid from a collection | collectionId, title, subtitle, limit (4/6/8) | P0 |
| `product_grid` | Hand-picked products | productIds[], title, columns (2/3/4) | P0 |
| `category_grid` | Browse by category cards | categoryIds[], title, columns | P0 |
| `text_with_image` | Split layout: text + image | image, heading, body (rich text), imagePosition (left/right) | P1 |
| `testimonials` | Customer quotes carousel | items[{quote, author, avatar}] | P1 |
| `newsletter` | Email signup form | title, subtitle, placeholder | P2 |
| `video` | Embedded video (YouTube/local) | url, title, autoplay | P2 |
| `html_block` | Raw HTML/embed (advanced) | html content | P2 |

#### 3.5.3 Branding Options

| Setting | Type | Default | Notes |
|---|---|---|---|
| Logo | Image upload | Tenant initials | Displayed in header + footer |
| Accent color | Hex color | `#0071e3` | Buttons, links, active states |
| Secondary color | Hex color | Auto-derived | Hover states, badges |
| Font family | Select | Inter | Options: Inter, Noto Sans, system |
| Header style | Select | `default` | Options: default, centered, minimal |
| Favicon | Image upload | Auto-generated | From logo or initials |
| Announcement bar | Text + link + color | Empty (hidden) | Top-of-page notification strip |

#### 3.5.4 Custom Pages

Merchant can create/edit static pages with a rich text editor in admin:

| Page | Route | Default Content | Notes |
|---|---|---|---|
| About Us | `/{locale}/pages/about` | Empty (hidden until content added) | Rich text + images |
| FAQ | `/{locale}/pages/faq` | Empty | Accordion-style Q&A |
| Return Policy | `/{locale}/pages/returns` | Template provided | Rich text |
| Contact | `/{locale}/pages/contact` | Shop address + phone + email from settings | Form + map (P2) |
| Custom pages | `/{locale}/pages/{slug}` | Merchant creates | Unlimited custom pages (P1) |

**Storage:** Custom page content stored as JSONB (rich text blocks) in `storefront_pages` table. Supports translations per locale.

#### 3.5.5 Navigation Customization

Merchant can configure:
- **Header nav links** — reorder, add/remove. Links to: categories, collections, custom pages, external URLs
- **Footer columns** — up to 4 columns, each with title + links
- **Social links** — Facebook, Instagram, WhatsApp, WeChat, Xiaohongshu (common in Macau)

#### 3.5.6 Admin UI for Customization

In the admin dashboard, a new **"Online Store"** section with:

| Admin Page | What Merchant Does |
|---|---|
| **Appearance** | Logo, colors, fonts, header style, announcement bar |
| **Homepage** | Drag-to-reorder sections, toggle on/off, edit section data |
| **Navigation** | Edit header links, footer columns, social links |
| **Pages** | Create/edit custom pages (rich text editor) |
| **Domain** | Custom domain setup (P2) |

#### 3.5.7 New DB Tables for Customization

```
storefront_configs       — 1 per location. JSONB config for branding, header, footer, homepage sections
storefront_pages         — Custom pages (about, FAQ, etc.). slug, title, content (JSONB), translations, isPublished
storefront_page_content  — (if needed) Per-locale content for pages. Or just JSONB translations in storefront_pages.
```

**Note:** Homepage section ordering + toggle state is stored as a JSONB array in `storefront_configs.homepageSections`. No separate table needed — the section list is small (< 20 items) and always loaded as one unit.

### 3.6 Storefront URL Structure

```
/{locale}/                          → Homepage (section-based, merchant-customized)
/{locale}/products                  → All products (with filters)
/{locale}/products/{slug}           → Product detail
/{locale}/categories/{slug}         → Category page
/{locale}/collections/{slug}        → Collection page (P1)
/{locale}/cart                      → Cart page (desktop)
/{locale}/checkout                  → One-page checkout
/{locale}/checkout/confirmation     → Order confirmation
/{locale}/account                   → Customer dashboard
/{locale}/account/orders            → Order history
/{locale}/account/orders/{id}       → Order detail
/{locale}/account/addresses         → Saved addresses
/{locale}/account/wishlist          → Wishlist (P1)
/{locale}/pages/{slug}              → Custom pages (about, faq, returns, contact, etc.)
/{locale}/login                     → Login (passwordless)
/{locale}/register                  → Register
```

Locale values: `tc` (default), `sc`, `en`, `pt`, `ja`

### 3.7 Database Changes Summary

**New tables (9 for P0):**
- `customers` — customer accounts (separate from staff users)
- `customer_sessions` — separate session table for customers (not shared with staff)
- `customer_addresses` — saved shipping/billing addresses
- `carts` — persistent cart (session token for guests, customer_id for registered)
- `cart_items` — cart line items
- `verification_codes` — 6-digit codes for passwordless auth
- `storefront_configs` — per-tenant/location branding, header, homepage sections, footer (JSONB + Zod validated)
- `storefront_pages` — custom pages (about, FAQ, etc.) with rich text JSONB + translations
- `delivery_zones` — per-location delivery fee zones (Macau Peninsula, Taipa, Coloane)

**Modified existing tables:**
- `products` — add: `slug` (unique per tenant, auto-generated from EN name), `images` (JSONB array replacing single image)
- `categories` — add: `slug` (unique per tenant)
- `orders` — add: `customerId`, `channel` (pos/online/kiosk), `fulfillmentStatus`, `deliveryMethod`, `shippingAddress` (JSONB), `trackingNumber`, `courierName`, `deliveryFee`, `estimatedDeliveryAt`, `fulfilledAt`, `fulfillmentNotes`, `pickupLocationId`
- `payment_method` enum — add: `mpay`, `alipay`, `wechat_pay`, `visa`, `mastercard`

**New tables (P1):**
- `wishlists` + `wishlist_items` — saved products
- `collections` + `collection_items` — smart/manual product groupings

---

### Phase 1 Sign-off

**Phase:** 1 — Technical Feasibility & Stack
**Deliverables:** Technology decisions (storefront-specific), storefront customization architecture (section-based builder + branding + custom pages), feasibility matrix (30 scenarios — all ✅), 7 technical risks with mitigations, dependency list, URL structure, DB changes summary (8 new tables)
**Active persona:** 🎭 Backend Architect
**Decision required:** Is the technical approach sound? Key questions:
1. **Simulated payments in Phase 1** — acceptable? (Real gateway in Phase 2)
2. **Separate `customers` table** — vs reusing `users` table with `customer` role?
3. **Passwordless auth** — email + verification code for v1, add SMS later?
4. **Section-based homepage** — JSONB array of ordered sections in `storefront_configs`?
5. **Custom pages** — rich text JSONB with per-locale translations in `storefront_pages`?

- [ ] Approved — proceed to Phase 2 (Data Model & API Design)
- [ ] Revisions needed — {specify}

**User notes:**
Approved. Added storefront customization (section-based builder). Proceed.

---

## 4. Data Model

🎭 **Active: Database Optimizer + Data Engineer**

### 4.1 Entity-Relationship Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    EXISTING TABLES (unchanged)                  │
│  tenants, locations, products, categories, product_variants,    │
│  option_groups, option_values, pricing_strategies,              │
│  pricing_strategy_items, shop_settings, orders, order_items,    │
│  payments, users, sessions, shifts, terminals,                  │
│  terminal_cash_log, user_locations                              │
└──────────────────────────┬──────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
  ┌─────────────┐  ┌──────────────┐  ┌───────────────────┐
  │  customers   │  │    carts     │  │ storefront_configs │
  │─────────────│  │──────────────│  │───────────────────│
  │ id           │  │ id           │  │ id                │
  │ tenantId  →T │  │ tenantId  →T │  │ tenantId       →T │
  │ name         │  │ customerId →C│  │ locationId     →L │
  │ email        │  │ sessionToken │  │ branding (JSONB)  │
  │ phone        │  │ expiresAt    │  │ header (JSONB)    │
  │ passwordHash │  │              │  │ homepageSections[] │
  │ isVerified   │  │              │  │ footer (JSONB)    │
  └──────┬───────┘  └──────┬───────┘  └───────────────────┘
         │                 │
    ┌────┴────┐      ┌─────┴─────┐
    ▼         ▼      ▼           │
┌─────────┐ ┌────────────┐ ┌─────────┐
│addresses│ │ cart_items  │ │         │
│─────────│ │────────────│ │         │
│ id      │ │ id         │ │         │
│ custId→C│ │ cartId  →Ct│ │         │
│ label   │ │ productId→P│ │         │
│ address │ │ variantId→V│ │         │
│ phone   │ │ quantity   │ │         │
│isDefault│ └────────────┘ │         │
└─────────┘                │         │
                           │         │
  ┌────────────────────────┘         │
  ▼                                  │
┌──────────────────┐  ┌──────────────────┐
│ storefront_pages │  │ verification_    │
│──────────────────│  │ codes            │
│ id               │  │──────────────────│
│ tenantId      →T │  │ id               │
│ slug             │  │ tenantId      →T │
│ title            │  │ target (email/ph)│
│ content (JSONB)  │  │ code (6-digit)   │
│ translations     │  │ expiresAt        │
│ isPublished      │  │ attempts         │
└──────────────────┘  └──────────────────┘

MODIFIED EXISTING:
  orders += customerId →C, channel (pos/online/kiosk)
  payment_method enum += mpay, alipay, wechat_pay, visa, mastercard
```

### 4.2 Database Schema

All new tables follow existing patterns: UUID PKs, tenantId FK with cascade, timestamps with timezone, JSONB for translations.

#### Modified: `products` table — Add slug + images (B1 + B2 fix)

```sql
-- B1 fix: SEO-friendly URL slugs
ALTER TABLE products ADD COLUMN slug VARCHAR(200);

-- Auto-generate from English translation or SKU: "pocari-sweat-500ml"
-- Collision handling: append -2, -3, etc.
-- Backfill existing 102 products from translations.en or sku
CREATE UNIQUE INDEX idx_products_tenant_slug
  ON products(tenant_id, slug)
  WHERE slug IS NOT NULL AND deleted_at IS NULL;

-- B2 fix: Multiple product images (replaces single image VARCHAR)
ALTER TABLE products ADD COLUMN images JSONB DEFAULT '[]'::jsonb;
/*  [
      { "url": "/uploads/product-1.jpg", "alt": "Front view", "altTranslations": {"en": "Front view", "tc": "正面"}, "sortOrder": 0 },
      { "url": "/uploads/product-2.jpg", "alt": "Side view", "sortOrder": 1 },
      { "url": "/uploads/product-3.jpg", "alt": "Back view", "variantId": "uuid-for-silver", "sortOrder": 2 }
    ]
    - variantId: optional — if set, image shows when that variant is selected
    - sortOrder: display order in gallery carousel
    - Existing products.image migrated to images[0] in backfill
*/
```

**Slug generation strategy:**
1. Source: `translations.en` (English name) → `slugify()` → lowercase, replace spaces with hyphens, strip non-alphanumeric
2. Fallback: `sku` field if no English translation
3. Fallback: `name` field (Chinese) → transliterate or use product ID prefix
4. Collision: append `-2`, `-3` etc. if slug already exists for tenant
5. Editable in admin product editor (auto-generated, manual override allowed)
6. Backfill script: `packages/database/src/backfill-slugs.ts`

**Image migration:**
- Existing `products.image` (single URL) → copy to `images[0]` as `{ url, alt: name, sortOrder: 0 }`
- Keep `products.image` column temporarily for backward compatibility (admin + cashier read it)
- Storefront reads `products.images` JSONB array
- Admin product editor: multi-image upload with drag-to-reorder

#### Modified: `categories` table — Add slug (m3 fix)

```sql
ALTER TABLE categories ADD COLUMN slug VARCHAR(100);

CREATE UNIQUE INDEX idx_categories_tenant_slug
  ON categories(tenant_id, slug)
  WHERE slug IS NOT NULL;
```

**Same slug strategy as products.** Auto-generated from `translations.en` or `name`.

---

#### Table: `customer_sessions` (m4 fix — separate from staff sessions)

```sql
CREATE TABLE customer_sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  token       VARCHAR(255) NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,  -- 30 days
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_customer_sessions_token ON customer_sessions(token);
CREATE INDEX idx_customer_sessions_customer ON customer_sessions(customer_id);
```

**Design notes:**
- Completely separate from staff `sessions` table — no ambiguity.
- Cookie: `sf_customer_session` (30-day expiry, vs staff's 7-day).
- Cleanup: cron deletes expired rows.

---

#### Table: `customers`

```sql
CREATE TABLE customers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(255),
  phone         VARCHAR(20),
  password_hash VARCHAR(255),          -- optional: for password login (future)
  avatar        VARCHAR(500),
  is_verified   BOOLEAN NOT NULL DEFAULT false,
  locale        VARCHAR(10) DEFAULT 'tc',
  last_login_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ            -- soft delete
);

-- Unique email per tenant (only for non-deleted, non-null)
CREATE UNIQUE INDEX idx_customers_email
  ON customers(tenant_id, email)
  WHERE email IS NOT NULL AND deleted_at IS NULL;

-- Unique phone per tenant
CREATE UNIQUE INDEX idx_customers_phone
  ON customers(tenant_id, phone)
  WHERE phone IS NOT NULL AND deleted_at IS NULL;

-- Tenant lookup
CREATE INDEX idx_customers_tenant ON customers(tenant_id, created_at DESC);
```

**Design notes:**
- Separate from `users` (staff). Different auth flow, different fields.
- `email` and `phone` are both nullable — customer can register with either.
- `password_hash` optional for v1 (passwordless auth). Future: allow password login.
- Soft delete for GDPR / data retention compliance.

#### Table: `customer_addresses`

```sql
CREATE TABLE customer_addresses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  label           VARCHAR(50),           -- "Home", "Office", "Hotel"
  recipient_name  VARCHAR(100) NOT NULL,
  phone           VARCHAR(20),
  address_line1   VARCHAR(500) NOT NULL,  -- street address
  address_line2   VARCHAR(200),           -- apt/suite/floor
  district        VARCHAR(100),           -- Macau parish (freguesia)
  city            VARCHAR(100) DEFAULT 'Macau',
  postal_code     VARCHAR(20),
  country         VARCHAR(50) DEFAULT 'MO',
  is_default      BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_addresses_customer ON customer_addresses(customer_id);
```

**Design notes:**
- Macau addresses: no postal codes in practice, but field kept for international support.
- `district` maps to Macau's 7 parishes (聖安多尼堂區, 望德堂區, etc.)
- `is_default` — only one per customer (enforced in app logic).

#### Table: `carts`

```sql
CREATE TABLE carts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id   UUID REFERENCES customers(id) ON DELETE CASCADE,  -- NULL for guests
  session_token VARCHAR(255),           -- for guest carts (httpOnly cookie)
  expires_at    TIMESTAMPTZ NOT NULL,   -- guest carts expire after 7 days
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Guest cart lookup by session token
CREATE UNIQUE INDEX idx_carts_session ON carts(session_token) WHERE session_token IS NOT NULL;

-- Customer cart lookup (1 active cart per customer)
CREATE UNIQUE INDEX idx_carts_customer ON carts(customer_id) WHERE customer_id IS NOT NULL;

-- Cleanup: find expired guest carts
CREATE INDEX idx_carts_expires ON carts(expires_at) WHERE customer_id IS NULL;
```

**Design notes:**
- Guest cart: `customer_id = NULL`, identified by `session_token` cookie.
- Registered cart: `customer_id` set, `session_token` cleared.
- On login: merge guest cart → customer cart (sum quantities, resolve conflicts).
- Unique index ensures one active cart per customer.
- Cron job deletes expired guest carts (> 7 days).

#### Table: `cart_items`

```sql
CREATE TABLE cart_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id     UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id  UUID REFERENCES product_variants(id) ON DELETE CASCADE,
  quantity    INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  added_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cart_items_cart ON cart_items(cart_id);

-- Prevent duplicate product+variant in same cart
CREATE UNIQUE INDEX idx_cart_items_unique
  ON cart_items(cart_id, product_id, COALESCE(variant_id, '00000000-0000-0000-0000-000000000000'));
```

**Design notes:**
- `COALESCE` trick for unique index handles NULL variant_id (non-variant products).
- Adding same product+variant increments quantity (upsert pattern).
- `CHECK (quantity > 0)` — remove item instead of setting to 0.

#### Cart Merge Strategy (M2 fix)

When a guest logs in or registers, their guest cart merges into their customer cart:

```
mergeGuestCart(guestSessionToken, customerId):
  1. Validate guestCart.tenantId === customerCart.tenantId (reject cross-tenant)
  2. For each guest cart item:
     a. If same product+variant exists in customer cart:
        → SUM quantities, CAP at stock (if stock tracked)
     b. If product+variant NOT in customer cart:
        → Move item to customer cart
     c. If product is now deleted/inactive or variant out of stock:
        → SKIP item, add to skippedItems[] for notification
  3. Delete guest cart + its items
  4. Return { mergedCount, skippedItems[] }
  5. Frontend shows toast: "2 items added to your cart" or "1 item was unavailable"
```

**Edge cases handled:**
- Cross-tenant: rejected (guard clause)
- Duplicate product+variant: quantities summed, capped at stock
- Out of stock: skipped with user notification
- Guest cart empty: no-op
- Customer has no cart yet: create new cart, transfer all items

#### Table: `verification_codes`

```sql
CREATE TABLE verification_codes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  target      VARCHAR(255) NOT NULL,    -- email or phone number
  code        VARCHAR(6) NOT NULL,      -- 6-digit numeric
  purpose     VARCHAR(20) NOT NULL DEFAULT 'login',  -- login, register, reset
  attempts    INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  expires_at  TIMESTAMPTZ NOT NULL,     -- 5 minutes from creation
  verified_at TIMESTAMPTZ,             -- set when code verified
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_verification_target ON verification_codes(tenant_id, target, created_at DESC);

-- Cleanup: old codes
CREATE INDEX idx_verification_expires ON verification_codes(expires_at);
```

**Design notes:**
- Rate limit: max 3 attempts per code, max 5 codes per target per hour (app logic).
- `verified_at` set once — code becomes single-use.
- Dev mode: display code on screen instead of sending email.
- Production: send via Brevo (email) or Twilio (SMS).

#### Table: `storefront_configs`

```sql
CREATE TABLE storefront_configs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  location_id         UUID REFERENCES locations(id) ON DELETE CASCADE,  -- NULL = tenant-wide default

  -- Branding
  branding            JSONB NOT NULL DEFAULT '{}'::jsonb,
  /*  {
        "logo": "/uploads/logo.png",
        "favicon": "/uploads/favicon.ico",
        "accentColor": "#0071e3",
        "secondaryColor": "#5856d6",
        "fontFamily": "inter",          -- inter | noto-sans | system
        "headerStyle": "default",       -- default | centered | minimal
        "announcementBar": { "text": "Free delivery over MOP 200!", "link": "/products", "bgColor": "#000", "textColor": "#fff", "enabled": true }
      }
  */

  -- Header
  header              JSONB NOT NULL DEFAULT '{}'::jsonb,
  /*  {
        "navLinks": [
          { "label": "All Products", "labelTranslations": {"en": "All Products", "tc": "全部商品"}, "href": "/products", "type": "internal" },
          { "label": "About", "href": "/pages/about", "type": "page" }
        ],
        "showSearch": true,
        "showLanguageSwitcher": true,
        "showCartIcon": true
      }
  */

  -- Homepage sections (ordered array — merchant can reorder)
  homepage_sections   JSONB NOT NULL DEFAULT '[]'::jsonb,
  /*  [
        { "id": "hero-1", "type": "hero_banner", "enabled": true, "data": { "image": "...", "title": "...", "titleTranslations": {...}, "subtitle": "...", "ctaText": "Shop Now", "ctaLink": "/products" } },
        { "id": "feat-1", "type": "featured_collection", "enabled": true, "data": { "collectionId": "...", "title": "Hot Items", "limit": 8 } },
        { "id": "cats-1", "type": "category_grid", "enabled": true, "data": { "categoryIds": [...], "title": "Browse by Category", "columns": 3 } },
        { "id": "prods-1", "type": "product_grid", "enabled": false, "data": { "productIds": [...], "title": "Staff Picks", "columns": 4 } },
        { "id": "about-1", "type": "text_with_image", "enabled": true, "data": { "heading": "Our Story", "body": "...", "image": "...", "imagePosition": "right" } }
      ]
  */

  -- Footer
  footer              JSONB NOT NULL DEFAULT '{}'::jsonb,
  /*  {
        "columns": [
          { "title": "Shop", "links": [{"label": "All Products", "href": "/products"}, ...] },
          { "title": "Help", "links": [{"label": "FAQ", "href": "/pages/faq"}, ...] }
        ],
        "socialLinks": { "facebook": "https://...", "instagram": "https://...", "whatsapp": "https://...", "wechat": "weixin://..." },
        "copyright": "© 2026 CountingStars",
        "showPaymentIcons": true
      }
  */

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One config per tenant (global) or per location (override)
CREATE UNIQUE INDEX idx_sf_config_tenant ON storefront_configs(tenant_id) WHERE location_id IS NULL;
CREATE UNIQUE INDEX idx_sf_config_location ON storefront_configs(tenant_id, location_id) WHERE location_id IS NOT NULL;
```

**Design notes:**
- `location_id = NULL` → tenant-wide default config.
- `location_id` set → location-specific override (for multi-store merchants).
- Section `id` field (e.g., "hero-1") enables stable drag-and-drop reordering.

**JSONB validation strategy (M3 fix):**

All JSONB fields validated via **Zod schemas** in server actions before writing to DB:

```typescript
// lib/storefront-config-schemas.ts
const brandingSchema = z.object({
  logo: z.string().optional(),
  favicon: z.string().optional(),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#0071e3'),
  secondaryColor: z.string().optional(),
  fontFamily: z.enum(['inter', 'noto-sans', 'system']).default('inter'),
  headerStyle: z.enum(['default', 'centered', 'minimal']).default('default'),
  announcementBar: z.object({
    text: z.string(), link: z.string().optional(),
    bgColor: z.string(), textColor: z.string(), enabled: z.boolean()
  }).optional(),
});

const homepageSectionSchema = z.object({
  id: z.string(),
  type: z.enum(['hero_banner','featured_collection','product_grid','category_grid',
                'text_with_image','testimonials','newsletter','video','html_block']),
  enabled: z.boolean(),
  data: z.record(z.unknown()),  // type-specific validation per section type
});

const storefrontConfigSchema = z.object({
  branding: brandingSchema,
  header: headerSchema,
  homepageSections: z.array(homepageSectionSchema),
  footer: footerSchema,
});
```

**Defense in depth:** Zod validates on write (primary). PostgreSQL CHECK constraint as safety net:
```sql
ALTER TABLE storefront_configs ADD CONSTRAINT chk_branding_valid
  CHECK (branding ? 'accentColor');
ALTER TABLE storefront_configs ADD CONSTRAINT chk_sections_array
  CHECK (jsonb_typeof(homepage_sections) = 'array');
```

#### Table: `storefront_pages`

```sql
CREATE TABLE storefront_pages (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  slug                  VARCHAR(100) NOT NULL,       -- "about", "faq", "returns", "contact"
  title                 VARCHAR(200) NOT NULL,
  title_translations    JSONB DEFAULT '{}'::jsonb,   -- {"en": "About Us", "tc": "關於我們", "pt": "Sobre Nós"}
  content               JSONB NOT NULL DEFAULT '[]'::jsonb,  -- rich text blocks (see below)
  content_translations  JSONB DEFAULT '{}'::jsonb,   -- {"en": [...blocks], "tc": [...blocks]}
  meta_description      VARCHAR(500),                -- SEO meta description
  is_published          BOOLEAN NOT NULL DEFAULT false,
  sort_order            INTEGER NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_sf_pages_slug ON storefront_pages(tenant_id, slug);
CREATE INDEX idx_sf_pages_published ON storefront_pages(tenant_id, is_published, sort_order);
```

**Rich text content format:**
```json
[
  { "type": "heading", "level": 2, "text": "Our Story" },
  { "type": "paragraph", "text": "Founded in 2020 in Macau..." },
  { "type": "image", "src": "/uploads/store.jpg", "alt": "Our store", "caption": "Our flagship location" },
  { "type": "heading", "level": 3, "text": "Our Mission" },
  { "type": "paragraph", "text": "We believe in quality products..." },
  { "type": "faq", "items": [
    { "q": "What are your hours?", "a": "Mon-Sat 10am-8pm" },
    { "q": "Do you deliver?", "a": "Yes, free delivery over MOP 200" }
  ]}
]
```

#### Modified: `orders` table

```sql
-- Add columns to existing orders table
ALTER TABLE orders ADD COLUMN customer_id UUID REFERENCES customers(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN channel VARCHAR(10) NOT NULL DEFAULT 'pos';  -- pos, online, kiosk

-- Fulfillment (online orders only — NULL for POS)
ALTER TABLE orders ADD COLUMN fulfillment_status VARCHAR(20);
  -- NULL (POS) | pending_confirmation | confirmed | preparing | ready_for_pickup |
  -- shipped | out_for_delivery | delivered | cancelled | returned
ALTER TABLE orders ADD COLUMN delivery_method VARCHAR(20);
  -- NULL (POS) | pickup | self_delivery | courier
ALTER TABLE orders ADD COLUMN shipping_address JSONB;
  -- snapshot at order time: { recipientName, phone, addressLine1, addressLine2, district, city }
ALTER TABLE orders ADD COLUMN tracking_number VARCHAR(100);
ALTER TABLE orders ADD COLUMN courier_name VARCHAR(50);     -- "SF Express", "Flash Express", etc.
ALTER TABLE orders ADD COLUMN delivery_fee DECIMAL(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN estimated_delivery_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN fulfilled_at TIMESTAMPTZ;     -- when marked delivered/picked up
ALTER TABLE orders ADD COLUMN fulfillment_notes TEXT;
ALTER TABLE orders ADD COLUMN pickup_location_id UUID REFERENCES locations(id) ON DELETE SET NULL;  -- M1 fix: which store for pickup

CREATE INDEX idx_orders_customer ON orders(customer_id, created_at DESC) WHERE customer_id IS NOT NULL;
CREATE INDEX idx_orders_channel ON orders(tenant_id, channel, created_at DESC);
CREATE INDEX idx_orders_fulfillment ON orders(tenant_id, fulfillment_status, created_at DESC)
  WHERE fulfillment_status IS NOT NULL;
```

**Design notes:**
- `fulfillment_status = NULL` for POS orders — they're fulfilled immediately at the register.
- `shipping_address` is JSONB snapshot (not FK). If customer edits address later, order keeps original.
- `delivery_fee` added to order total at checkout.
- `channel = 'pos'` default preserves backward compatibility with existing POS orders.
- `customer_id` is nullable — POS orders may not have a customer account.

**Fulfillment state machine (online orders):**
```
pending_confirmation → confirmed → preparing → ready_for_pickup (pickup)
                                            → shipped → out_for_delivery → delivered (delivery/courier)
                                 → cancelled (at any point before shipped)
delivered/picked_up → returned (after delivery)
```

#### Table: `delivery_zones` (per-location delivery fee configuration)

```sql
CREATE TABLE delivery_zones (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  location_id   UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  name          VARCHAR(100) NOT NULL,          -- "Macau Peninsula", "Taipa", "Coloane"
  name_translations JSONB DEFAULT '{}'::jsonb,  -- {"en": "Macau Peninsula", "tc": "澳門半島"}
  fee           DECIMAL(10,2) NOT NULL,         -- delivery fee in MOP
  min_order     DECIMAL(10,2) DEFAULT 0,        -- minimum order for this zone
  free_above    DECIMAL(10,2),                  -- free delivery above this amount (NULL = never free)
  estimated_minutes INTEGER,                    -- estimated delivery time
  is_active     BOOLEAN NOT NULL DEFAULT true,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_delivery_zones_location ON delivery_zones(tenant_id, location_id, is_active);
```

**Design notes:**
- Merchant defines zones per location in admin.
- At checkout, customer selects zone → delivery fee calculated.
- `free_above` enables "Free delivery over MOP 200" promotions.
- `estimated_minutes` shown to customer at checkout.
- Courier integration (SF Express, Flash Express) is Phase 2 — for now merchant manages delivery manually.

#### Modified: `payment_method` enum

```sql
ALTER TYPE payment_method ADD VALUE 'mpay';
ALTER TYPE payment_method ADD VALUE 'alipay';
ALTER TYPE payment_method ADD VALUE 'wechat_pay';
ALTER TYPE payment_method ADD VALUE 'visa';
ALTER TYPE payment_method ADD VALUE 'mastercard';
```

### 4.3 Index Strategy

| Table | Index | Columns | Purpose | Query Pattern |
|---|---|---|---|---|
| customers | `idx_customers_email` | (tenant_id, email) UNIQUE WHERE email IS NOT NULL AND deleted_at IS NULL | Login by email | `WHERE tenant_id = $1 AND email = $2` |
| customers | `idx_customers_phone` | (tenant_id, phone) UNIQUE WHERE phone IS NOT NULL AND deleted_at IS NULL | Login by phone | `WHERE tenant_id = $1 AND phone = $2` |
| customers | `idx_customers_tenant` | (tenant_id, created_at DESC) | Admin customer list | `WHERE tenant_id = $1 ORDER BY created_at DESC` |
| customer_addresses | `idx_addresses_customer` | (customer_id) | Fetch addresses | `WHERE customer_id = $1` |
| carts | `idx_carts_session` | (session_token) UNIQUE WHERE session_token IS NOT NULL | Guest cart lookup | `WHERE session_token = $1` |
| carts | `idx_carts_customer` | (customer_id) UNIQUE WHERE customer_id IS NOT NULL | Customer cart | `WHERE customer_id = $1` |
| carts | `idx_carts_expires` | (expires_at) WHERE customer_id IS NULL | Guest cart cleanup | `WHERE expires_at < NOW() AND customer_id IS NULL` |
| cart_items | `idx_cart_items_cart` | (cart_id) | Fetch cart items | `WHERE cart_id = $1` |
| cart_items | `idx_cart_items_unique` | (cart_id, product_id, COALESCE(variant_id,...)) UNIQUE | Prevent duplicates | Upsert on add-to-cart |
| verification_codes | `idx_verification_target` | (tenant_id, target, created_at DESC) | Find latest code | `WHERE tenant_id = $1 AND target = $2 ORDER BY created_at DESC LIMIT 1` |
| orders | `idx_orders_customer` | (customer_id, created_at DESC) WHERE customer_id IS NOT NULL | Customer order history | `WHERE customer_id = $1 ORDER BY created_at DESC` |
| orders | `idx_orders_channel` | (tenant_id, channel, created_at DESC) | Admin channel filter | `WHERE tenant_id = $1 AND channel = $2` |
| storefront_configs | `idx_sf_config_tenant` | (tenant_id) UNIQUE WHERE location_id IS NULL | Tenant default | `WHERE tenant_id = $1 AND location_id IS NULL` |
| storefront_pages | `idx_sf_pages_slug` | (tenant_id, slug) UNIQUE | Page by slug | `WHERE tenant_id = $1 AND slug = $2` |

**Total: 14 new indexes** (all B-tree). Partial indexes used where applicable to reduce index size.

### 4.4 Migration Strategy

**Migration order** (dependencies flow downward):

```
Migration 0013: Add customers table
Migration 0014: Add customer_addresses table
Migration 0015: Add carts + cart_items tables
Migration 0016: Add verification_codes table
Migration 0017: Add storefront_configs + storefront_pages tables
Migration 0018: Alter orders (add customer_id, channel, shipping_address)
Migration 0019: Alter payment_method enum (add mpay, alipay, wechat_pay, visa, mastercard)
```

**Zero-downtime strategy:**
- All new columns on `orders` are nullable or have defaults → no table lock.
- Enum additions are non-breaking → existing rows unaffected.
- New tables are independent → can deploy incrementally.

---

## 5. API Design

🎭 **Active: Backend Architect + Data Engineer**

### 5.1 API Overview

The storefront uses **Next.js Server Actions** for mutations and **server-only queries** for reads (same pattern as admin + cashier apps). No separate REST API needed — the storefront is a full-stack Next.js app reading from the same DB.

**Public endpoints** (no auth required):

| # | Type | Path / Action | Purpose | Priority |
|---|---|---|---|---|
| 1 | Query | `getStorefrontProducts(tenantSlug, filters)` | Catalog with search/filter/sort | P0 |
| 2 | Query | `getProductBySlug(tenantSlug, productSlug)` | Product detail page | P0 |
| 3 | Query | `getStorefrontCategories(tenantSlug)` | Category navigation | P0 |
| 4 | Query | `getProductVariants(productId)` | Variant options for product | P0 |
| 5 | Query | `getStorefrontConfig(tenantSlug)` | Branding, header, homepage, footer | P0 |
| 6 | Query | `getStorefrontPage(tenantSlug, slug)` | Custom page content | P0 |
| 7 | Action | `addToCart(sessionToken, productId, variantId, qty)` | Add item to cart | P0 |
| 8 | Action | `updateCartItem(sessionToken, itemId, qty)` | Change quantity | P0 |
| 9 | Action | `removeCartItem(sessionToken, itemId)` | Remove from cart | P0 |
| 10 | Query | `getCart(sessionToken)` | Fetch cart with items + totals | P0 |

**Auth endpoints** (customer auth):

| # | Type | Path / Action | Purpose | Priority |
|---|---|---|---|---|
| 11 | Action | `sendVerificationCode(tenantSlug, target)` | Send code to email/phone | P0 |
| 12 | Action | `verifyCode(tenantSlug, target, code)` | Verify code → create session | P0 |
| 13 | Action | `registerCustomer(tenantSlug, name, email, phone)` | Create customer account | P0 |
| 14 | Action | `customerLogout()` | Delete session | P0 |
| 15 | Query | `getCustomerSession()` | Current customer from cookie | P0 |

**Authenticated endpoints** (customer logged in):

| # | Type | Path / Action | Purpose | Priority |
|---|---|---|---|---|
| 16 | Query | `getCustomerOrders()` | Order history | P0 |
| 17 | Query | `getCustomerOrderDetail(orderId)` | Single order with items | P0 |
| 18 | Query | `getCustomerAddresses()` | Saved addresses | P0 |
| 19 | Action | `createAddress(data)` | Add address | P0 |
| 20 | Action | `updateAddress(id, data)` | Edit address | P0 |
| 21 | Action | `deleteAddress(id)` | Remove address | P0 |
| 22 | Action | `updateCustomerProfile(data)` | Edit name/email/phone | P0 |

**Checkout endpoints:**

| # | Type | Path / Action | Purpose | Priority |
|---|---|---|---|---|
| 23 | Action | `createOrder(cartId, contactInfo, paymentMethod, deliveryMethod, zoneId?, addressId?)` | Place order → create order + items + payment + delivery fee | P0 |
| 24 | Action | `mergeGuestCart(sessionToken)` | Merge guest cart into customer cart on login | P0 |
| 25 | API Route | `POST /api/payments/webhook` | Payment gateway callback (MPay, Alipay, WeChat) | P0 |
| 26 | Query | `getDeliveryZones(tenantSlug, locationId)` | Available delivery zones + fees for checkout | P0 |

**Fulfillment endpoints** (merchant manages from admin):

| # | Type | Path / Action | Purpose | Priority |
|---|---|---|---|---|
| 27 | Action | `updateFulfillmentStatus(orderId, status)` | Advance order: confirmed → preparing → shipped/ready | P0 |
| 28 | Action | `addTrackingNumber(orderId, courier, trackingNumber)` | Attach courier tracking to order | P1 |
| 29 | Query | `getOnlineOrders(filters)` | Admin: list online orders with fulfillment status filter | P0 |
| 30 | Action | `createDeliveryZone(locationId, data)` | Admin: create delivery zone | P0 |
| 31 | Action | `updateDeliveryZone(zoneId, data)` | Admin: edit delivery zone | P0 |
| 32 | Action | `deleteDeliveryZone(zoneId)` | Admin: remove delivery zone | P0 |

**Admin endpoints** (merchant configures storefront):

| # | Type | Path / Action | Purpose | Priority |
|---|---|---|---|---|
| 33 | Action | `updateStorefrontBranding(data)` | Save branding settings | P0 |
| 34 | Action | `updateHomepageSections(sections[])` | Reorder/toggle/edit sections | P0 |
| 35 | Action | `updateStorefrontHeader(data)` | Header nav links | P1 |
| 36 | Action | `updateStorefrontFooter(data)` | Footer columns + social | P1 |
| 37 | Action | `createStorefrontPage(slug, title, content)` | Create custom page | P0 |
| 38 | Action | `updateStorefrontPage(id, data)` | Edit custom page | P0 |
| 39 | Action | `deleteStorefrontPage(id)` | Remove custom page | P0 |

**Total: 39 endpoints** (31 P0, 8 P1)

### 5.2 Key API Contracts

#### `getStorefrontProducts` — Catalog query

```typescript
// Input
type ProductFilters = {
  tenantSlug: string;
  categorySlug?: string;
  search?: string;          // ILIKE on name + translations
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;    // WHERE stock IS NULL OR stock > 0
  sortBy?: "newest" | "price_asc" | "price_desc" | "popular" | "name";
  page?: number;            // default 1
  pageSize?: number;        // default 24
};

// Output
type ProductListResponse = {
  products: {
    id: string;
    slug: string;           // derived from SKU or name
    name: string;
    translations: Record<string, string>;
    sellingPrice: string;
    originalPrice: string | null;
    image: string | null;
    stock: number | null;
    hasVariants: boolean;
    isPopular: boolean;
    categoryName: string;
    categoryTranslations: Record<string, string>;
  }[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};
```

#### `createOrder` — Checkout

```typescript
// Input
type CreateOrderInput = {
  cartId: string;
  contactName: string;
  contactPhone: string;
  contactEmail?: string;
  paymentMethod: "mpay" | "alipay" | "wechat_pay" | "visa" | "mastercard";
  deliveryMethod: "pickup" | "self_delivery" | "courier";
  pickupLocationId?: string;  // required if pickup — which store to pick up from (M1 fix)
  deliveryZoneId?: string;    // required if delivery/courier
  shippingAddress?: {         // required if delivery/courier
    recipientName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    district?: string;
    city?: string;
  };
  savedAddressId?: string;    // use saved address instead of inline
  notes?: string;
  customerId?: string;        // if logged in
};

// Process
// 1. Validate cart exists and has items
// 2. Check stock for each item (atomic decrement)
// 3. Look up delivery zone → calculate delivery fee
// 4. Create order with channel = 'online', fulfillment_status = 'pending_confirmation'
// 5. Order total = subtotal + tax + delivery_fee
// 6. Create order_items (snapshot product names, prices, translations)
// 7. Create payment record (status depends on method)
// 8. Snapshot shipping address as JSONB on order
// 9. Clear cart
// 10. Return order number

// Output
type CreateOrderResponse = {
  success: boolean;
  orderNumber: string;        // e.g., "CS-260405-0001"
  orderId: string;
  subtotal: string;
  deliveryFee: string;
  total: string;
  paymentRedirectUrl?: string;  // for MPay/Alipay/WeChat redirect
};
```

### 5.3 Scenario-to-API Mapping

| Scenario | API Call(s) | Covered? |
|---|---|---|
| ST-001: Browse by category | `getStorefrontProducts({ categorySlug })` | ✅ |
| ST-002: Search product | `getStorefrontProducts({ search })` | ✅ |
| ST-003: Filter by price | `getStorefrontProducts({ minPrice, maxPrice })` | ✅ |
| ST-004: Product detail | `getProductBySlug(slug)` | ✅ |
| ST-005: Select variant | `getProductVariants(productId)` | ✅ |
| ST-006: Add to cart | `addToCart(sessionToken, productId, variantId, qty)` | ✅ |
| ST-007: Cart drawer (mobile) | `getCart(sessionToken)` | ✅ |
| ST-008: Cart page (desktop) | `getCart(sessionToken)` | ✅ |
| ST-009: Update cart qty | `updateCartItem(itemId, qty)` | ✅ |
| ST-010: Remove from cart | `removeCartItem(itemId)` | ✅ |
| ST-011: Guest checkout | `createOrder({ cartId, contactInfo })` (no customerId) | ✅ |
| ST-012–015: Payments | `createOrder({ paymentMethod })` + `/api/payments/webhook` | ✅ (simulated Phase 1) |
| ST-016: Switch language | URL locale prefix — no API needed | ✅ |
| ST-017: Register | `registerCustomer()` + `sendVerificationCode()` + `verifyCode()` | ✅ |
| ST-018: Login | `sendVerificationCode()` + `verifyCode()` | ✅ |
| ST-019: Order history | `getCustomerOrders()` | ✅ |
| ST-020: Order detail | `getCustomerOrderDetail(orderId)` | ✅ |
| ST-021: Address auto-fill | `getCustomerAddresses()` | ✅ |
| ST-022: Save address | `createAddress(data)` | ✅ |
| ST-023: Wishlist | P1 — deferred | ☐ |
| ST-024: Mobile responsive | Frontend only — no API needed | ✅ |
| ST-025: Stock sync | Same DB — no API needed | ✅ |
| ST-026: Online order in admin | `orders.channel = 'online'` — admin queries pick it up | ✅ |
| ST-027: Variant out of stock | `getProductVariants()` returns stock per variant | ✅ |
| ST-028: Empty cart checkout | `createOrder()` validates cart not empty | ✅ |
| ST-029: No image fallback | Frontend only | ✅ |
| ST-030: Per-tenant branding | `getStorefrontConfig(tenantSlug)` | ✅ |

**29/30 scenarios covered (1 deferred to P1)**

---

### Phase 2 Sign-off

**Phase:** 2 — Data Model & API Design
**Deliverables:**
- Entity-relationship diagram with all new + modified tables
- 8 new table schemas (customers, addresses, carts, cart_items, verification_codes, storefront_configs, storefront_pages, delivery_zones)
- Orders table extended with 10 fulfillment columns + fulfillment state machine
- payment_method enum extended with 5 online methods
- 16 indexes (B-tree, partial, unique) with documented query patterns
- 8-step migration strategy (zero-downtime)
- 39 API endpoints (31 P0, 8 P1) with full contracts
- 29/30 scenario coverage (1 P1 deferred)
- Delivery zones with configurable fees, minimums, and free-above thresholds

**Active persona:** 🎭 Database Optimizer + Data Engineer
**Decision required:** Is the data model and API design sound?

- [ ] Approved — proceed to Phase 3 (Full Architecture)
- [ ] Revisions needed — {specify}

**User notes:**
Approved. Online orders have fulfillment workflow + delivery zones. Courier integration Phase 2.

---

## 6. System Architecture

🎭 **Active: Backend Architect + Frontend Developer**

### 6.1 Architecture Overview

```
                         ┌──────────────────────────────────┐
                         │         Caddy Reverse Proxy       │
                         │  admin.shop.mo  → :3100           │
                         │  cashier.shop.mo → :3200          │
                         │  {tenant}.shop.mo → :3300         │ ← NEW
                         └──────────┬───────────────────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              ▼                     ▼                     ▼
     ┌────────────────┐  ┌────────────────┐  ┌────────────────┐
     │   Admin App    │  │  Cashier App   │  │ Storefront App │ ← NEW
     │  Next.js :3100 │  │ Next.js :3200  │  │ Next.js :3300  │
     │                │  │                │  │                │
     │ Server Actions │  │ Server Actions │  │ Server Actions │
     │ + Queries      │  │ + Queries      │  │ + Queries      │
     └───────┬────────┘  └───────┬────────┘  └───────┬────────┘
             │                   │                   │
             └───────────────────┼───────────────────┘
                                 ▼
                    ┌─────────────────────────┐
                    │  packages/database       │
                    │  Drizzle ORM + Auth      │
                    │  Shared schema + queries │
                    └────────────┬────────────┘
                                 ▼
                    ┌─────────────────────────┐
                    │  PostgreSQL 16           │
                    │  Single instance         │
                    │  20+ tables              │
                    └─────────────────────────┘
```

**Key principle:** All 3 apps share the same PostgreSQL database via `packages/database`. No sync layer, no message queue, no microservices. A product sold on POS is instantly reflected on storefront because it's the same row in the same table.

### 6.2 Multi-Tenant Storefront Routing

Each merchant gets a subdomain or path-based URL:

```
Option A (subdomain — recommended):
  countingstars.shop.mo → storefront app, tenant resolved from subdomain
  admin.shop.mo → admin app

Option B (path-based — simpler for dev):
  shop.mo/s/countingstars → storefront app, tenant from path segment
```

**Tenant resolution middleware** (storefront):
1. Extract tenant slug from subdomain or path
2. Look up `tenants` table by slug
3. Inject `tenantId` into request context
4. All queries filter by this `tenantId`
5. 404 if tenant not found or suspended

### 6.3 Request Flow

```
Customer browser
  → Caddy (SSL termination, routing)
    → Next.js Storefront (:3300)
      → Middleware: resolve tenant from URL
      → Server Component: fetch data (products, config)
        → Drizzle ORM query (filtered by tenantId)
          → PostgreSQL
      → Render HTML (RSC)
      → Stream to browser
      → Client hydration (cart, checkout interactivity)
```

**For mutations (add to cart, checkout):**
```
Customer action (click "Add to cart")
  → Server Action (addToCart)
    → Validate session/cart
    → Drizzle: INSERT/UPDATE cart_items
    → revalidatePath (refresh cart count)
  → UI updates
```

---

## 7. Frontend Architecture

### 7.1 App Structure

```
apps/storefront/
├── src/
│   ├── app/
│   │   ├── [locale]/                    ← locale prefix (tc, sc, en, pt, ja)
│   │   │   ├── layout.tsx               ← tenant branding + header/footer
│   │   │   ├── page.tsx                 ← homepage (section renderer)
│   │   │   ├── products/
│   │   │   │   ├── page.tsx             ← catalog (RSC: search, filter, paginate)
│   │   │   │   └── [slug]/
│   │   │   │       └── page.tsx         ← product detail (RSC)
│   │   │   ├── categories/
│   │   │   │   └── [slug]/
│   │   │   │       └── page.tsx         ← category listing (RSC)
│   │   │   ├── cart/
│   │   │   │   └── page.tsx             ← cart page (desktop)
│   │   │   ├── checkout/
│   │   │   │   ├── page.tsx             ← one-page checkout
│   │   │   │   └── confirmation/
│   │   │   │       └── page.tsx         ← order confirmation
│   │   │   ├── account/
│   │   │   │   ├── layout.tsx           ← account sidebar
│   │   │   │   ├── page.tsx             ← account dashboard
│   │   │   │   ├── orders/
│   │   │   │   │   ├── page.tsx         ← order history
│   │   │   │   │   └── [id]/
│   │   │   │   │       └── page.tsx     ← order detail + tracking
│   │   │   │   └── addresses/
│   │   │   │       └── page.tsx         ← saved addresses
│   │   │   ├── pages/
│   │   │   │   └── [slug]/
│   │   │   │       └── page.tsx         ← custom pages (about, faq, etc.)
│   │   │   ├── login/
│   │   │   │   └── page.tsx             ← passwordless login
│   │   │   └── register/
│   │   │       └── page.tsx             ← registration
│   │   ├── api/
│   │   │   └── payments/
│   │   │       └── webhook/
│   │   │           └── route.ts         ← payment gateway callbacks
│   │   ├── layout.tsx                   ← root layout (fonts, metadata)
│   │   └── globals.css                  ← Tailwind + storefront theme tokens
│   ├── components/
│   │   ├── layout/
│   │   │   ├── storefront-header.tsx    ← nav + search + cart + account
│   │   │   ├── storefront-footer.tsx    ← columns + social + payment icons
│   │   │   ├── announcement-bar.tsx     ← top banner
│   │   │   ├── mobile-nav.tsx           ← hamburger menu (mobile)
│   │   │   └── language-switcher.tsx    ← 5-locale selector
│   │   ├── product/
│   │   │   ├── product-card.tsx         ← grid item (image, name, price)
│   │   │   ├── product-gallery.tsx      ← image carousel
│   │   │   ├── variant-selector.tsx     ← color/size chips
│   │   │   ├── add-to-cart-button.tsx   ← sticky on mobile
│   │   │   ├── stock-indicator.tsx      ← "In stock" / "Low stock" / "Sold out"
│   │   │   └── product-filters.tsx      ← sidebar/drawer filters
│   │   ├── cart/
│   │   │   ├── cart-drawer.tsx          ← mobile slide-up drawer
│   │   │   ├── cart-page-content.tsx    ← desktop cart layout
│   │   │   ├── cart-item.tsx            ← line item (image, qty, price)
│   │   │   ├── cart-summary.tsx         ← subtotal, delivery, total
│   │   │   └── cart-icon.tsx            ← header icon with badge
│   │   ├── checkout/
│   │   │   ├── checkout-form.tsx        ← contact + delivery + payment
│   │   │   ├── delivery-picker.tsx      ← pickup vs delivery + zone selection
│   │   │   ├── payment-selector.tsx     ← MPay, Alipay, WeChat, Card
│   │   │   ├── address-form.tsx         ← inline address or saved address selector
│   │   │   └── order-summary.tsx        ← items + fees + total
│   │   ├── account/
│   │   │   ├── order-list.tsx           ← order history with status badges
│   │   │   ├── order-detail.tsx         ← items + tracking + fulfillment timeline
│   │   │   ├── address-list.tsx         ← saved addresses CRUD
│   │   │   └── profile-form.tsx         ← edit name, email, phone
│   │   ├── homepage/
│   │   │   ├── section-renderer.tsx     ← reads homepageSections[], renders components
│   │   │   ├── hero-banner.tsx          ← full-width image + CTA
│   │   │   ├── featured-collection.tsx  ← product grid from collection
│   │   │   ├── product-grid-section.tsx ← hand-picked products
│   │   │   ├── category-grid.tsx        ← browse by category cards
│   │   │   ├── text-with-image.tsx      ← split layout content
│   │   │   └── testimonials.tsx         ← customer quotes carousel
│   │   ├── pages/
│   │   │   └── rich-text-renderer.tsx   ← renders JSONB content blocks
│   │   └── shared/
│   │       ├── empty-state.tsx
│   │       ├── skeleton.tsx
│   │       ├── badge.tsx
│   │       ├── breadcrumbs.tsx
│   │       └── pagination.tsx
│   ├── lib/
│   │   ├── storefront-queries.ts        ← server-only: products, categories, config
│   │   ├── cart-actions.ts              ← "use server": add, update, remove cart items
│   │   ├── checkout-actions.ts          ← "use server": create order, payment
│   │   ├── customer-auth-actions.ts     ← "use server": login, register, verify code
│   │   ├── customer-queries.ts          ← server-only: orders, addresses, profile
│   │   ├── tenant-resolver.ts           ← resolve tenant from URL
│   │   └── cn.ts                        ← clsx utility (shared pattern)
│   ├── i18n/
│   │   ├── locales.ts                   ← storefront translation keys (all 5 locales)
│   │   └── context.tsx                  ← locale provider (URL-based)
│   └── middleware.ts                    ← tenant resolution + locale redirect + auth guard
├── package.json
├── next.config.ts
└── tsconfig.json
```

### 7.2 Component Rendering Strategy

| Component Type | Rendering | Why |
|---|---|---|
| Homepage sections | **RSC** (server) | SEO, fast first paint, config from DB |
| Product catalog | **RSC** (server) | SEO, paginated, filter params in URL |
| Product detail | **RSC** (server) | SEO, product data from DB |
| Product gallery | **Client** | Swipe/zoom interactions |
| Variant selector | **Client** | Interactive selection state |
| Add to cart button | **Client** | Click handler, optimistic UI |
| Cart drawer (mobile) | **Client** | Animation, slide-up overlay |
| Cart page | **RSC** + **Client** | Server fetches cart, client handles qty changes |
| Checkout form | **Client** | Form state, payment flow, address validation |
| Order history | **RSC** (server) | Paginated, no interactivity needed |
| Order detail | **RSC** + **Client** | Server renders order, client handles tracking refresh |
| Header/footer | **RSC** (server) | Config from DB, minimal interactivity |
| Search | **Client** | Debounced input, live suggestions |
| Filters | **Client** | Toggle checkboxes, price range slider |

### 7.3 State Management

**No global state library needed.** Use:

| State Type | Solution | Scope |
|---|---|---|
| Cart item count (header badge) | **React Context** | App-wide, synced with server |
| Cart items | **Server-fetched** via `getCart()` | Per-page, revalidated on mutation |
| Filter/search params | **URL search params** (`?category=drinks&minPrice=10`) | URL-based, shareable |
| Locale | **URL path** (`/tc/`, `/en/`) | URL-based, no client state |
| Customer session | **Cookie** (`storefront_session`) | httpOnly, read on server |
| Checkout form | **Local component state** (`useState`) | Checkout page only |
| Cart drawer open/close | **Local state** (`useState`) | Header component |

**No Zustand or TanStack Query** — Server Actions + `revalidatePath` handle mutations + cache invalidation. RSC eliminates need for client-side data fetching in most cases.

### 7.4 Key UI Patterns

**Mobile-first responsive breakpoints:**
```
xs: 375px   ← iPhone SE (minimum supported)
sm: 640px   ← large phones landscape
md: 768px   ← iPad portrait
lg: 1024px  ← iPad landscape / small laptop
xl: 1280px  ← desktop
```

**Product grid columns:**
```
xs: 2 columns (phone)
sm: 2 columns
md: 3 columns (tablet)
lg: 4 columns (desktop)
```

**Sticky elements (mobile):**
- Header (nav + search + cart) — sticky top
- Add-to-cart button — sticky bottom (product detail page)
- Cart total + checkout CTA — sticky bottom (cart drawer)

**Bottom sheets (mobile only, CSS keyframes — no framer-motion):**
- Cart drawer (slide-up, 80vh)
- Filter panel (slide-up, 70vh)
- Mobile nav menu (slide-up, full screen)

**Desktop equivalents:**
- Cart → full `/cart` page
- Filters → sidebar panel (sticky)
- Nav → horizontal top nav

### 7.5 Storefront Theme System

```css
/* apps/storefront/src/app/globals.css */
@theme {
  /* Base — overridden per-tenant from storefront_configs.branding */
  --color-sf-bg: #ffffff;
  --color-sf-surface: #f8f9fa;
  --color-sf-border: #e9ecef;
  --color-sf-text: #212529;
  --color-sf-text-secondary: #6c757d;
  --color-sf-text-muted: #adb5bd;

  /* Accent — injected from tenant.accentColor */
  --color-sf-accent: var(--tenant-accent, #0071e3);
  --color-sf-accent-hover: var(--tenant-accent-hover, #0077ed);

  /* Semantic */
  --color-sf-success: #198754;
  --color-sf-warning: #ffc107;
  --color-sf-danger: #dc3545;
  --color-sf-info: #0dcaf0;

  /* Layout */
  --sf-max-width: 1280px;
  --sf-header-height: 64px;
}
```

**Dynamic tenant branding** applied via inline CSS variables in `[locale]/layout.tsx`:
```tsx
// Server Component — reads storefront_configs from DB
export default async function LocaleLayout({ children, params }) {
  const config = await getStorefrontConfig(tenantSlug);
  const { accentColor, fontFamily } = config.branding;

  return (
    <div style={{
      '--tenant-accent': accentColor,
      '--tenant-font': fontFamily,
    }}>
      <StorefrontHeader config={config.header} />
      {children}
      <StorefrontFooter config={config.footer} />
    </div>
  );
}
```

---

## 8. Backend Architecture

### 8.1 Service Structure

No microservices — all logic lives in the Next.js storefront app as **Server Actions** and **server-only queries**. Same pattern as admin + cashier.

```
apps/storefront/src/lib/
├── storefront-queries.ts     ← READ: products, categories, config, pages
├── cart-actions.ts           ← WRITE: cart CRUD
├── checkout-actions.ts       ← WRITE: create order, payment handling
├── customer-auth-actions.ts  ← WRITE: login, register, verify code
├── customer-queries.ts       ← READ: orders, addresses, profile
├── fulfillment-actions.ts    ← WRITE: (admin) update fulfillment status
├── delivery-zone-queries.ts  ← READ: delivery zones for checkout
└── tenant-resolver.ts        ← resolve tenantId from URL slug
```

### 8.2 Middleware Stack

```typescript
// apps/storefront/src/middleware.ts
export async function middleware(request: NextRequest) {
  // 1. Tenant resolution — extract slug from subdomain or path
  const tenantSlug = extractTenantSlug(request);
  if (!tenantSlug) return NextResponse.redirect('/not-found');

  // 2. Locale detection — redirect to default locale if missing
  const locale = extractLocale(request.pathname);
  if (!locale) return NextResponse.redirect(`/${defaultLocale}${request.pathname}`);

  // 3. Guest cart session — ensure session token cookie exists
  if (!request.cookies.has('sf_cart_session')) {
    const response = NextResponse.next();
    response.cookies.set('sf_cart_session', generateToken(), {
      httpOnly: true, secure: true, sameSite: 'lax', maxAge: 7 * 86400
    });
    return response;
  }

  // 4. Auth guard — /account/* requires customer session
  if (request.pathname.includes('/account')) {
    const token = request.cookies.get('sf_customer_session');
    if (!token) return NextResponse.redirect(`/${locale}/login`);
  }

  return NextResponse.next();
}
```

### 8.3 Error Handling

| Error | User sees | System does |
|---|---|---|
| Product not found | 404 page with search | Log, no alert |
| Out of stock at checkout | "Item no longer available" toast + cart update | Remove item from cart, revalidate |
| Payment failed | "Payment failed — try again" + retry button | Log payment error, keep order in `pending` |
| Tenant not found | 404 "Store not found" | Log, no alert |
| DB connection error | 500 "Something went wrong" + retry | Alert via monitoring, PM2 auto-restart |
| Cart expired (guest) | Empty cart state | Session token cookie refreshed |
| Verification code expired | "Code expired — send new code" | Log attempt |
| Rate limit (verification) | "Too many attempts — try later" | Block for 1 hour |

### 8.4 Caching Strategy

| Data | Cache | TTL | Invalidation |
|---|---|---|---|
| Storefront config (branding, sections) | Next.js RSC cache | 5 min | `revalidatePath` when admin updates |
| Product catalog | Next.js RSC cache | 1 min | `revalidatePath` when product changes |
| Product detail | Next.js RSC cache | 1 min | `revalidatePath` on product update |
| Categories | Next.js RSC cache | 5 min | `revalidatePath` on category change |
| Custom pages | Next.js RSC cache | 5 min | `revalidatePath` on page update |
| Cart | No cache (always fresh) | — | Server Action returns fresh data |
| Customer session | Cookie (7 days) | 7 days | Delete on logout |
| Delivery zones | Next.js RSC cache | 5 min | `revalidatePath` on zone change |

**No Redis needed.** Next.js RSC + `revalidatePath`/`revalidateTag` provides sufficient caching for this scale (100–1,000 concurrent users per tenant).

### 8.5 Background Processing

| Task | Trigger | Implementation |
|---|---|---|
| Guest cart cleanup | Cron (daily) | Delete carts where `expires_at < NOW() AND customer_id IS NULL` |
| Verification code cleanup | Cron (hourly) | Delete codes where `expires_at < NOW()` |
| Order confirmation email | After `createOrder` | Nodemailer + Brevo (async, fire-and-forget) |
| Stock low alert | After stock decrement | If stock < 5, notify merchant (in-app notification) |
| Payment webhook processing | POST `/api/payments/webhook` | Update order + payment status, emit SSE to admin |

**No separate worker process.** Background tasks run as:
- Cron via PM2 (`pm2 start cleanup.js --cron "0 3 * * *"`)
- Async functions after server actions (fire-and-forget)

---

## 9. Integration Architecture

### 9.1 Third-Party Integrations

| Integration | Purpose | Phase | Implementation |
|---|---|---|---|
| **Brevo (email)** | Order confirmation, verification codes | Phase 1 | Nodemailer SMTP (300/day free) |
| **QFPay / AlphaPay** | Alipay + WeChat Pay gateway | Phase 2 | REST API + webhook |
| **MPay** | Macau local payment | Phase 2 | REST API + webhook (pending docs) |
| **Stripe** | Visa/Mastercard processing | Phase 2 | Stripe Checkout / Elements |
| **SF Express Macau** | Courier tracking | Phase 2 | API for tracking number → status |
| **Cloudflare** | DNS + CDN (images) | Phase 1 | Free tier |

### 9.2 Payment Webhook Flow

```
Customer pays via Alipay/WeChat/MPay
  → Payment gateway processes
  → Gateway sends webhook POST to /api/payments/webhook
    → Verify webhook signature (HMAC)
    → Look up order by gateway reference
    → Update payment status (confirmed / failed)
    → Update order status (pending_confirmation → confirmed)
    → Trigger confirmation email
    → Return 200 OK to gateway
```

**Phase 1 (simulated):** Webhook endpoint exists but returns simulated success. Payment UI shows full flow with mock confirmations.

---

## 10. Security Design

### 10.1 Authentication

**Customer auth (storefront):**
- Passwordless: email/phone + 6-digit verification code
- Session: `sf_customer_session` cookie (httpOnly, secure, sameSite=lax, 30-day expiry)
- Session stored in `sessions` table (reuse existing, add `customerId` FK)
- Rate limit: 5 codes per target per hour, 3 attempts per code

**Staff auth (admin + cashier):**
- Unchanged: `pos_session` cookie with password/PIN login

**Cookie separation:**
- `sf_customer_session` — customer login (storefront)
- `sf_cart_session` — guest cart token (storefront)
- `pos_session` — staff login (admin + cashier)
- All httpOnly, secure in production

### 10.2 Authorization

| Resource | Public | Customer | Merchant | Admin |
|---|---|---|---|---|
| Product catalog | ✅ | ✅ | ✅ | ✅ |
| Product detail | ✅ | ✅ | ✅ | ✅ |
| Cart (own) | ✅ (guest) | ✅ | — | — |
| Checkout | ✅ (guest) | ✅ | — | — |
| Order history | — | ✅ (own) | ✅ (all) | ✅ (all) |
| Saved addresses | — | ✅ (own) | — | — |
| Profile edit | — | ✅ (own) | — | — |
| Storefront config | — | — | ✅ | ✅ |
| Fulfillment status | — | — | ✅ | ✅ |
| Delivery zones | — | — | ✅ | ✅ |
| Custom pages (edit) | — | — | ✅ | ✅ |

### 10.3 Input Validation

| Input | Validation | Where |
|---|---|---|
| Email | RFC 5322 format | Server action |
| Phone | E.164 format (Macau: +853XXXXXXXX) | Server action |
| Verification code | 6 digits only | Server action |
| Cart quantity | 1–99, integer | Server action + DB CHECK |
| Order total | Recalculated server-side (never trust client) | checkout-actions.ts |
| Delivery fee | Recalculated from zone (never trust client) | checkout-actions.ts |
| Payment amount | Must equal order total | checkout-actions.ts |
| Shipping address | Required fields validated | Server action |
| Product slug | Alphanumeric + hyphens only | Middleware |
| Locale | Must be one of: tc, sc, en, pt, ja | Middleware |
| Tenant slug | Alphanumeric + hyphens only | Middleware |

### 10.4 Data Protection

| Data | Protection | Notes |
|---|---|---|
| Customer passwords | bcrypt (12 rounds) | Optional — passwordless is primary |
| Verification codes | Plain text (6-digit, 5-min expiry) | Short-lived, rate-limited |
| Payment card numbers | **Never stored** — handled by gateway PCI iframe | Stripe Elements / gateway hosted fields |
| Customer PII (name, email, phone) | Encrypted at rest (PostgreSQL TDE if needed) | Soft delete for GDPR |
| Session tokens | crypto.randomUUID() — 128-bit | httpOnly cookie |
| Webhook signatures | HMAC-SHA256 verification | Per-gateway secret |
| Shipping addresses | JSONB snapshot on order (immutable) | Customer edits don't affect historical orders |

---

## 11. Scenario Coverage Check

| Scenario | Frontend | API | Backend | DB | Covered? |
|---|---|---|---|---|---|
| ST-001: Browse by category | Category page (RSC) | `getStorefrontProducts({categorySlug})` | Drizzle query with category filter | products + categories | ✅ |
| ST-002: Search product | Search input (Client) | `getStorefrontProducts({search})` | ILIKE on name + translations JSONB | products | ✅ |
| ST-003: Filter by price | Filter panel (Client) | `getStorefrontProducts({minPrice, maxPrice})` | WHERE sellingPrice BETWEEN | products | ✅ |
| ST-004: Product detail | Product page (RSC) | `getProductBySlug(slug)` | Join with category, variants | products + variants | ✅ |
| ST-005: Select variant | Variant selector (Client) | `getProductVariants(id)` | option_groups + option_values + variants | variant tables | ✅ |
| ST-006: Add to cart | Button (Client) | `addToCart(session, productId, variantId, qty)` | Upsert cart_items | carts + cart_items | ✅ |
| ST-007: Cart drawer (mobile) | Cart drawer (Client) | `getCart(session)` | Join cart_items with products + variants | carts + cart_items | ✅ |
| ST-008: Cart page (desktop) | `/cart` page (RSC+Client) | `getCart(session)` | Same query | Same tables | ✅ |
| ST-009–010: Cart CRUD | Cart item (Client) | `updateCartItem` / `removeCartItem` | UPDATE/DELETE cart_items | cart_items | ✅ |
| ST-011: Guest checkout | Checkout form (Client) | `createOrder(cartId, contact, payment, delivery)` | INSERT order + items + payment, decrement stock | orders + payments | ✅ |
| ST-012–015: Payments | Payment selector (Client) | `createOrder` + webhook | Gateway redirect/QR + webhook handler | payments | ⚠️ Phase 1 simulated |
| ST-016: Language switch | URL locale prefix | — | Locale in URL path | translations JSONB | ✅ |
| ST-017–018: Auth | Login/register page (Client) | `sendVerificationCode` + `verifyCode` | Code generation + validation | verification_codes + customers + sessions | ✅ |
| ST-019–020: Order history | Order list/detail (RSC) | `getCustomerOrders` / `getCustomerOrderDetail` | Query by customerId | orders + order_items | ✅ |
| ST-021–022: Addresses | Address form (Client) | `getCustomerAddresses` / `createAddress` | CRUD customer_addresses | customer_addresses | ✅ |
| ST-025: Stock sync | Product card (RSC) | Same products table | Same stock column | products | ✅ |
| ST-026: Online order in admin | Admin orders page | orders.channel = 'online' | Existing admin query | orders | ✅ |
| ST-030: Per-tenant branding | Layout (RSC) | `getStorefrontConfig` | Read branding JSONB | storefront_configs | ✅ |
| **NEW: Delivery at checkout** | Delivery picker (Client) | `getDeliveryZones` + `createOrder({deliveryMethod, zoneId})` | Zone fee lookup + order total calc | delivery_zones + orders | ✅ |
| **NEW: Fulfillment tracking** | Order detail timeline (Client) | `getCustomerOrderDetail` | fulfillment_status on order | orders | ✅ |
| **NEW: Merchant fulfillment** | Admin order detail | `updateFulfillmentStatus` | UPDATE orders SET fulfillment_status | orders | ✅ |

**All P0 scenarios: ✅ (payments ⚠️ simulated in Phase 1)**

---

### Phase 3 Sign-off

**Phase:** 3 — Full Architecture Design
**Deliverables:**
- System architecture (3-app monorepo, shared DB, Caddy routing, tenant resolution)
- Frontend architecture (50+ components, RSC/Client split, app structure, theme system)
- Backend architecture (server actions + queries, middleware stack, caching, background jobs)
- Integration architecture (6 third-party services phased in)
- Security design (customer auth, cookie separation, input validation, PCI compliance)
- Scenario coverage (30/30 covered, payments simulated Phase 1)

**Active persona:** 🎭 Backend Architect + Frontend Developer
**Decision required:** Is the architecture sound for building the storefront?

- [ ] Approved — proceed to Phase 4 (Final Review)
- [ ] Revisions needed — {specify}

**User notes:**
Approved. Product Review ran — 2 blockers + 3 major resolved. Proceed to Phase 4.

---

## 12. Non-Functional Requirements

🎭 **Active: All Personas — Final Review**

### 12.1 Performance Targets

| Metric | Target | Measurement |
|---|---|---|
| **First Contentful Paint (FCP)** | < 1.5s on 4G | Lighthouse mobile |
| **Largest Contentful Paint (LCP)** | < 2.5s on 4G | Lighthouse mobile |
| **Time to Interactive (TTI)** | < 3.5s on 4G | Lighthouse mobile |
| **Cumulative Layout Shift (CLS)** | < 0.1 | Lighthouse |
| **Server response (TTFB)** | < 200ms | Next.js server |
| **Product catalog query** | < 50ms for 200 products | Drizzle query timing |
| **Add to cart** | < 100ms perceived | Optimistic UI + server action |
| **Checkout page load** | < 1s | Server component render |
| **JS bundle (storefront)** | < 150KB initial | Next.js build analysis |

**How to achieve:**
- RSC for all catalog pages (zero client JS for product listing/detail)
- Next.js `<Image>` with responsive srcset + lazy loading
- Code-split: checkout, account, cart drawer loaded on demand
- No external fonts from CDN — self-host Inter/Noto Sans
- Product queries use existing indexes (tenantId + status + categoryId)

### 12.2 Scalability

| Scale point | Current capacity | Upgrade path |
|---|---|---|
| **Concurrent users per tenant** | 100–1,000 | PostgreSQL handles 100+ concurrent connections on 2GB ECS |
| **Products per tenant** | 10,000+ | Indexed queries, paginated (24/page) |
| **Orders per day per tenant** | 1,000+ | orders table indexed on (tenantId, createdAt) |
| **Tenants on platform** | 50–200 | Row-level tenant isolation, single DB |
| **Image storage** | 40GB+ on local disk | Migrate to Alibaba OSS at 20GB |
| **DB size** | ~1GB for 200 tenants | pg_dump daily, upgrade ECS disk if needed |

**Scaling triggers:**
- DB response > 100ms consistently → add read replica or upgrade ECS
- > 200 tenants → consider per-tenant connection pooling
- > 50GB images → migrate to Alibaba OSS + CDN
- > 10K concurrent platform-wide → add second ECS behind SLB

### 12.3 Monitoring

| What | Tool | Alert |
|---|---|---|
| Uptime (all 3 apps) | Better Stack (free tier) | Down > 1 min → email + webhook |
| Process health | PM2 | Auto-restart on crash, log rotation |
| Error rate | Next.js error.tsx + PM2 logs | Manual review (v1); Sentry free tier (v2) |
| DB disk space | Cron: `df -h` check | Alert at 80% capacity |
| Guest cart bloat | Cron: count expired carts | Alert if > 10,000 expired carts |
| Response time | Next.js server timing headers | Manual review in PM2 logs |

### 12.4 Logging

| Event | Log Level | Destination |
|---|---|---|
| Order created (online) | INFO | PM2 stdout + file |
| Payment webhook received | INFO | PM2 stdout + file |
| Payment webhook failed signature | WARN | PM2 stderr + file |
| Customer login/register | INFO | PM2 stdout |
| Storefront config updated | INFO | PM2 stdout |
| Cart merge (guest → customer) | DEBUG | PM2 stdout |
| Stock decrement at checkout | INFO | PM2 stdout |
| Fulfillment status change | INFO | PM2 stdout |
| Verification code sent | INFO | PM2 stdout (+ code in dev mode) |
| Rate limit triggered | WARN | PM2 stderr |

**No structured logging framework for v1.** Console.log with prefixes: `[STOREFRONT]`, `[ORDER]`, `[PAYMENT]`, `[AUTH]`. Migrate to Pino or Winston if log volume increases.

---

## 13. Deployment Plan

### 13.1 Environments

| Environment | URL | Database | Purpose |
|---|---|---|---|
| **Local dev** | `localhost:3300` | Docker PostgreSQL (:5433) | Development |
| **Staging** | `staging-{tenant}.shop.mo` | Same ECS, separate DB | Pre-production testing |
| **Production** | `{tenant}.shop.mo` | Production DB on ECS | Live |

### 13.2 PM2 Configuration Update

```javascript
// ecosystem.config.js — add storefront app
module.exports = {
  apps: [
    { name: 'admin',      script: 'apps/admin/.next/standalone/server.js',      env: { PORT: 3100 } },
    { name: 'cashier',    script: 'apps/cashier/.next/standalone/server.js',    env: { PORT: 3200 } },
    { name: 'storefront', script: 'apps/storefront/.next/standalone/server.js', env: { PORT: 3300 } },  // NEW
  ]
};
```

### 13.3 Caddy Configuration Update

```caddyfile
# Admin dashboard
admin.shop.mo {
    reverse_proxy localhost:3100
}

# Cashier POS
cashier.shop.mo {
    reverse_proxy localhost:3200
}

# Storefront — wildcard subdomain for multi-tenant
*.shop.mo {
    reverse_proxy localhost:3300
}
```

**Tenant resolution:** Storefront middleware extracts tenant slug from `Host` header subdomain. `countingstars.shop.mo` → slug = `countingstars`.

### 13.4 CI/CD (GitHub Actions)

```yaml
# .github/workflows/deploy-storefront.yml
on:
  push:
    branches: [main]
    paths: ['apps/storefront/**', 'packages/database/**', 'packages/i18n/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter storefront build
      - run: rsync -az apps/storefront/.next/standalone/ $SSH_HOST:/app/storefront/
      - run: ssh $SSH_HOST "cd /app && pm2 restart storefront"
```

**Selective deploy:** Only triggers when storefront or shared packages change.

### 13.5 Secrets Management

| Secret | Storage | Used by |
|---|---|---|
| `DATABASE_URL` | `.env` on ECS | All 3 apps |
| `BREVO_SMTP_KEY` | `.env` on ECS | Storefront (verification emails) |
| `PAYMENT_WEBHOOK_SECRET` | `.env` on ECS | Storefront (webhook HMAC) |
| `SF_SESSION_SECRET` | `.env` on ECS | Storefront (cookie signing) |

**No secrets in git.** `.env.example` provided for reference.

---

## 14. Risks & Gaps

| # | Risk | Likelihood | Impact | Mitigation | Status |
|---|---|---|---|---|---|
| 1 | No Macau payment gateway sandbox | High | Medium | Phase 1: simulated payments with full UI. Phase 2: real gateway | Accepted |
| 2 | MPay API docs unavailable | Medium | High | QFPay (Alipay+WeChat) first, MPay when docs available | Accepted |
| 3 | SMS delivery for verification codes | Medium | Medium | Email-only v1 (Brevo free). SMS Phase 2 | Accepted |
| 4 | Product slug backfill for 102 existing products | Low | Low | One-time migration script | **Fixed in PR** |
| 5 | Image migration (single → array) | Low | Low | Backfill script: `image` → `images[0]` | **Fixed in PR** |
| 6 | Guest cart DB bloat | Low | Low | Cron: delete expired carts (> 7 days) | Planned |
| 7 | Storefront config corruption | Low | High | Zod validation + DB CHECK constraints | **Fixed in PR** |
| 8 | Cart merge data loss | Low | Medium | Explicit merge strategy with notifications | **Fixed in PR** |
| 9 | Pickup location confusion | Low | Medium | Location picker at checkout for multi-store | **Fixed in PR** |
| 10 | 4th Next.js app on single ECS | Low | Low | Each app ~150MB RAM. 2GB ECS handles 4 apps. Monitor with PM2 | Accepted |

---

## 15. Implementation Phases (Build Order)

| Step | What to Build | Depends on | Est. Effort | Priority |
|---|---|---|---|---|
| **S1** | **DB migrations** — 9 new tables + product slug/images + order columns + payment enum | Nothing | 1 day | P0 |
| **S2** | **Scaffold storefront app** — Next.js 16 app, Tailwind, middleware (tenant + locale + cart session) | S1 | 0.5 day | P0 |
| **S3** | **Product catalog** — listing page (RSC), category nav, search, filters, pagination | S2 | 2 days | P0 |
| **S4** | **Product detail page** — image gallery, variant selector, stock indicator, sticky add-to-cart | S3 | 1.5 days | P0 |
| **S5** | **Cart system** — cart actions (add/update/remove), cart drawer (mobile), cart page (desktop) | S2 + S1 (carts table) | 2 days | P0 |
| **S6** | **Customer auth** — passwordless login/register, verification codes, customer sessions | S1 (customers + customer_sessions + verification_codes) | 1.5 days | P0 |
| **S7** | **Checkout** — one-page form, delivery picker (pickup + zones), payment selector, order creation | S5 + S6 + S1 (delivery_zones) | 3 days | P0 |
| **S8** | **Order confirmation + history** — confirmation page, order list, order detail with fulfillment timeline | S7 | 1.5 days | P0 |
| **S9** | **Customer account** — saved addresses CRUD, profile edit | S6 | 1 day | P0 |
| **S10** | **Storefront customization** — branding (layout.tsx), section-based homepage renderer | S2 + S1 (storefront_configs) | 2 days | P0 |
| **S11** | **Custom pages** — rich text renderer, about/FAQ/returns/contact | S10 + S1 (storefront_pages) | 1 day | P0 |
| **S12** | **Admin: Online Store section** — appearance, homepage editor, pages editor, delivery zones | S10 + S11 | 2.5 days | P0 |
| **S13** | **Admin: Fulfillment management** — online orders view, status updates, tracking | S7 (orders with fulfillment) | 1.5 days | P0 |
| **S14** | **i18n** — storefront translation keys × 5 locales, product name locale rendering | Throughout | 1 day | P0 |
| **S15** | **Seed data + slug backfill** — storefront config, delivery zones, product slugs, image migration | S1 | 0.5 day | P0 |
| **S16** | **QA + polish** — all 9 QA playbook scenarios, mobile testing, empty states, 404 pages, OG meta | All | 2 days | P0 |
| | | | **~22 days** | |

**Critical path:** S1 → S2 → S3 → S5 → S7 → S8 (catalog → cart → checkout → confirmation)

**Parallelizable:** S6 (auth) can run alongside S3–S4 (catalog). S10–S11 (customization) can run alongside S5 (cart). S12–S13 (admin additions) can run after S7.

---

## 16. Open Questions

| # | Question | Impact | Who Decides | Default if Unanswered |
|---|---|---|---|---|
| 1 | **Custom domain per tenant?** Should merchants use their own domain (e.g., `shop.countingstars.mo`) instead of subdomains? | Medium — affects Caddy config, SSL provisioning | User | Subdomains only for v1. Custom domains Phase 2. |
| 2 | **Which payment gateway to integrate first?** QFPay (Alipay+WeChat), AlphaPay, or direct MPay? | High — affects Phase 2 timeline | User (needs gateway partnerships) | QFPay for Alipay+WeChat. MPay when docs available. |
| 3 | **Email template design?** Should order confirmation emails have merchant branding (logo, colors)? | Low — affects email template | User | Plain text with order details for v1. Branded HTML template Phase 2. |
| 4 | **Product slug language?** Should slugs be English-only or support Chinese characters (URL-encoded)? | Low — affects SEO | User | English-only slugs. Chinese names in meta tags for SEO. |
| 5 | **Storefront theme presets?** Should we offer 3-5 pre-designed color/layout themes for merchants who don't want to customize? | Low — nice to have | User | Single default theme. Merchant customizes via admin. |

---

## 17. Final Sign-off Gate

- [x] Phase 0 sign-off — Reference analysis, project intent, feature scope
- [x] Phase 0.1 sign-off — 4 personas, 27 stories, 30 acceptance tests, 9 QA scenarios
- [x] Phase 1 sign-off — Tech stack, feasibility (30/30 ✅), customization architecture
- [x] Phase 2 sign-off — 9 new tables, 3 table modifications, 39 API endpoints, delivery zones + fulfillment
- [x] Phase 3 sign-off — System + frontend + backend + integration + security architecture
- [x] Product Review — 🟢 All blockers + major issues resolved
- [x] Architecture confirmed
- [x] Data model confirmed (slug, images, cart merge, JSONB validation fixed)
- [x] API design confirmed (39 endpoints, pickup location, delivery zones)
- [x] Tech stack confirmed (Next.js 16, same monorepo, no new deps)
- [x] Security confirmed (cookie separation, Zod validation, PCI gateway iframe)
- [x] Build order agreed (16 steps, ~22 days, critical path identified)

**Approved:** ☐ Yes — proceed to Implementation Phase A / ☐ Revisions needed

---

*Document version: v1.0 — Phase 4 Final Review — 2026-04-05*
