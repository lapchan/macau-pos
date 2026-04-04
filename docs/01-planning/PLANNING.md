# Macau POS — Planning Document

| Field | Value |
|---|---|
| **Project** | Macau POS |
| **Reference** | Admin: yp.mo/yp-resource-business · Cashier: yp.mo/shops |
| **Document** | Application planning — cumulative |
| **Version** | v1.0 |
| **Status** | Phase 4 — Final Review (Awaiting sign-off) |
| **Date** | 2026-03-22 |

## 1. Project Intent

### 1.1 Reference analysis

**App overview:**
YP SHOPS is a full-featured POS (Point of Sale) system built by Macau Yellow Pages (yp.mo). It serves Macau retail businesses with two main interfaces: an admin dashboard for shop management and a customer-facing ordering/cashier storefront. The system handles everything from product catalog management to order processing, member loyalty, inventory control, promotions, and business reporting.

**Key features discovered:**

**A. Admin Dashboard (yp.mo/yp-resource-business)**

| Module | Sub-features |
|---|---|
| **店鋪主頁 (Shop Home)** | Dashboard with today's order count, sales total, monthly settlement, delivery fees; quick-access shortcuts; order statistics (today/week/month) with day-over-day comparison |
| **商品 (Products)** | Product categories, tag management, combo/package templates, product library (full CRUD with batch operations, import/export via xlsx), product BOM, add-on management & binding, remark management, special operation reasons |
| **訂單 (Orders)** | Order management with status tabs (pending payment, pending use, completed, refund/after-sales), order export, order remark management; orders show: order number, product details, time, quantity, payment amount, refund amount, delivery method, payment status, payment method (MPAY), settlement method, operator/cashier, channel, discounts, surcharges, member info |
| **會員 (Members)** | Basic settings, member levels/tiers, member management, points management & rules (including API integration), points mall & detail, top-up/stored value rules & records |
| **促銷管理 (Promotions)** | Spend-threshold discounts (滿減), red envelope vouchers, gift vouchers, exchange vouchers, coupon campaigns & claim details, offline cash vouchers & details |
| **進銷存管理 (Inventory)** | Unit management, warehouse management, supplier management, sales customer creation, stock inquiry, purchase orders, transfer/return, distribution, procurement (single & batch settlement), receiving/acceptance, other outbound, purchase returns, wholesale sales (orders, outbound, batch settlement), damage/loss reporting |
| **報表中心 (Reports)** | Product sales ranking & details, business report, payment method reports (summary & detail), business overview, daily cashier report, time-period sales detail, sensitive operations report, cash voucher report, inventory in/out report, product statistics & category statistics, monthly inventory settlement, receivable/payable reports, daily gross profit report, wholesale sales statistics & collection details |
| **設置 (Settings)** | Table management, self-pickup point management, shop information, discount strategy, surcharge management, product data recovery, permission/role management, WeChat official account settings, POS custom payment methods, POS electronic payment methods, printer settings, secondary screen settings, reservation management |
| **日誌 (Logs)** | File import logs, user activity logs, SMS logs |
| **連鎖管理報表 (Chain Reports)** | Inventory consolidation, collection consolidation, daily collection consolidation, product sales detail consolidation, product sales ranking consolidation |

**B. Cashier/Storefront (yp.mo/shops)**

| Feature | Details |
|---|---|
| **Shop header** | Shop name, announcements banner, language toggle (EN), "My Orders" button |
| **Member promotion banner** | Red banner promoting member benefits (points accumulation & member pricing) |
| **Product browsing** | Left sidebar with scrollable category list; product grid/list on right showing name, image, price |
| **Product variants** | Specification selector modal — tag-based variant selection with quantity control (- 1 +) |
| **Cart & checkout** | "Add to Cart" button; bottom bar with Phone, Cart, Self-pickup Order |
| **Search** | Search icon and filter/sort icon in top right |

**UX patterns observed:**
- Admin: Left sidebar navigation with expandable menu groups, tabbed content pages, breadcrumb navigation, data tables with filters/search/batch operations, quick-action buttons
- Cashier: Mobile-optimized layout, bottom tab navigation, modal-based variant selection, category sidebar + product content split view

**Data model hints:**
- Products: categories (hierarchical), tags, variants/specifications, BOM, add-ons, pricing (original/selling/member), stock tracking, images, barcodes, product codes
- Orders: order number (OPay prefix), line items, payment method (MPAY), delivery method (到店/delivery), payment status, settlement method, operator/cashier tracking, member association, discounts/surcharges
- Members: tiers/levels, points system, stored value/top-up, membership pricing
- Inventory: warehouses, suppliers, purchase orders, receiving, distribution, returns, damage reporting
- Promotions: threshold discounts, vouchers (red envelope, gift, exchange, coupons, cash vouchers)

**Tech stack signals:**
- Admin: Web-based SPA, likely Vue.js
- Cashier: Hash-based routing, likely uni-app (Vue-based)
- Payment: MPAY integration (Macau payment gateway)
- Data import: Excel (xlsx) file import/export
- Printing: Printer integration for receipts
- Secondary screen: Customer-facing display support

**Strengths:**
- Comprehensive feature set covering full retail POS lifecycle
- Multi-channel support (POS terminal, online storefront, WeChat)
- Rich member loyalty system with points mall
- Full inventory management with wholesale support
- Extensive reporting suite
- Chain/multi-store management capabilities
- Macau-localized (MOP currency, MPAY, Traditional Chinese)

**Weaknesses / gaps (our improvements):**
- UI appears dated — **we will modernize with a clean, modern design**
- No visible real-time analytics or dashboard charts — **we will add live charts**
- Mobile admin experience unclear — **we will make admin responsive**
- No visible multi-tenant SaaS architecture — **we will build SaaS-first**
- Limited storefront customization — **we will support per-merchant branding**

### 1.2 App identity

| Field | Value |
|---|---|
| App name / working title | Macau POS |
| Reference URL | Admin: yp.mo/yp-resource-business · Cashier: yp.mo/shops |
| One-sentence description | A modern multi-tenant SaaS POS system for Macau retail merchants with admin dashboard and customer-facing ordering interface |
| App type | Web (SPA) — Multi-tenant SaaS with Admin + Storefront |
| Target users | **Platform admin** (SaaS operator), **Merchants** (shop owners/managers), **Cashiers** (staff), **Customers** (end users) |
| Key problem it solves | Provides a modern, unified SaaS platform for Macau retail merchants to manage their entire retail operation — products, orders, members, inventory, promotions, and reporting |
| Features from reference to keep | All features (phased rollout — see §1.3) |
| Features to change / improve | Modern UI/UX (user to provide design direction), SaaS multi-tenancy, responsive admin, live analytics, per-merchant branding |
| Features to exclude (v1) | See phase breakdown below — v1 focuses on core POS |
| Scale expectations | Multi-merchant SaaS — dozens of merchants initially, scaling to hundreds |
| Known tech preferences | Next.js (user preference) |
| Timeline / constraints | None specified |

### 1.3 Feature scope — Phased rollout

**Recommended approach: 5 build phases, each delivering a usable increment.**

---

#### BUILD PHASE 1 — Core POS (MVP)
> Goal: A working POS that a merchant can use to sell products and process orders.

| Feature | Priority | Notes |
|---|---|---|
| **Multi-tenant SaaS foundation** | P0 | Tenant isolation, merchant onboarding, platform admin |
| **Auth & user management** | P0 | Login, roles (platform admin, merchant owner, cashier) |
| **Product catalog** | P0 | Categories (hierarchical), product CRUD, images, pricing (original/selling) |
| **Product variants/specifications** | P0 | Size/color/type variants with per-variant pricing |
| **Customer storefront (cashier UI)** | P0 | Category browsing, product display, variant selection, search |
| **Shopping cart & checkout** | P0 | Add to cart, quantity adjustment, order summary, place order |
| **Order management** | P0 | Order list with status tabs, order detail, status transitions |
| **Basic payment** | P0 | Cash payment, manual payment recording; payment method configuration |
| **Shop settings** | P0 | Shop info, business hours, basic configuration |
| **Dashboard** | P0 | Today's orders/sales summary, basic stats |

**Deliverable:** Merchant can create products, customers can browse & order, cashier can manage orders.

---

#### BUILD PHASE 2 — Operations & Members
> Goal: Inventory control, member loyalty, and essential reporting.

| Feature | Priority | Notes |
|---|---|---|
| **Inventory management (basic)** | P1 | Stock tracking per product/variant, low-stock alerts, stock adjustment |
| **Member/loyalty system** | P1 | Member registration, tiers/levels, member pricing |
| **Basic reporting** | P1 | Sales report, product sales ranking, payment method report, daily cashier report |
| **Payment gateway integration** | P1 | MPAY, possibly other Macau gateways |
| **Product add-ons** | P1 | Add-on management, binding to products |
| **Combo/package templates** | P1 | Bundle products as combos |
| **Order export** | P1 | Export orders to Excel |
| **Receipt printing** | P1 | Thermal printer integration, receipt templates |
| **Permission/role management** | P1 | Fine-grained permissions per role |
| **Product import/export** | P1 | Bulk import via Excel template, export catalog |
| **Self-pickup points** | P1 | Configure pickup locations |
| **Staff Daily Settlement (員工每日結數)** | P1 | Shift open/close, cash float, cash count, variance detection, manager approval. Schema ready: `shifts` table + `shift_id`/`cashier_id` on orders (added in Phase 1 as future-proofing). |

**Deliverable:** Merchant has inventory visibility, member retention tools, business insights, and **cash accountability per shift**.

---

#### BUILD PHASE 3 — Promotions & Advanced Reporting
> Goal: Drive sales with promotions and provide deep business intelligence.

| Feature | Priority | Notes |
|---|---|---|
| **Promotions engine** | P1 | Spend-threshold discounts (滿減), coupons, vouchers |
| **Voucher system** | P1 | Gift vouchers, exchange vouchers, cash vouchers (online + offline) |
| **Points system** | P2 | Points earning rules, points redemption, points balance |
| **Stored value / top-up** | P2 | Member wallet, top-up rules, top-up records |
| **Advanced reporting** | P1 | Business overview, time-period sales, gross profit, inventory in/out, receivable/payable, sensitive operations |
| **Dashboard charts** | P1 | Live analytics, trend charts, comparison widgets |
| **Tag management** | P1 | Product tags for filtering/organization |
| **Remark management** | P1 | Order & product remarks/notes |
| **Surcharge management** | P1 | Configurable surcharges (packaging fees, etc.) |

**Deliverable:** Merchant can run promotions, reward loyal customers, and analyze business deeply.

---

#### BUILD PHASE 4 — Advanced Inventory & Wholesale
> Goal: Full supply chain management and B2B wholesale capabilities.

| Feature | Priority | Notes |
|---|---|---|
| **Full inventory management** | P2 | Warehouses, suppliers, purchase orders, receiving, distribution, returns, damage reporting |
| **Wholesale management** | P2 | Wholesale sales orders, wholesale outbound, batch settlement |
| **Sales customer management** | P2 | B2B customer records |
| **Procurement** | P2 | Purchase orders, batch settlement, supplier management |
| **Points mall** | P2 | Points-based product redemption store |
| **Product BOM** | P2 | Bill of materials for composite products |
| **Audit logs** | P2 | User activity logs, file import logs, SMS logs |
| **Special operation reasons** | P2 | Tracking reasons for voids, refunds, adjustments |

**Deliverable:** Full supply chain visibility from procurement to sales, wholesale channel.

---

#### BUILD PHASE 5 — Ecosystem & Scale
> Goal: Multi-store chains, integrations, and advanced features.

| Feature | Priority | Notes |
|---|---|---|
| **Chain/multi-store management** | P2 | Multi-location support, consolidated reporting |
| **Chain reports** | P2 | Inventory/sales/collection consolidation across stores |
| **WeChat integration** | P2 | WeChat Official Account, mini-program storefront |
| **Secondary screen** | P2 | Customer-facing display during checkout |
| **Table management** | P2 | For F&B merchants — table layout, table status |
| **Reservation management** | P2 | Booking system for appointments/tables |
| **Product data recovery** | P2 | Data integrity tools |
| **Discount strategy engine** | P2 | Advanced discount rules and combinations |
| **SMS notifications** | P2 | Order confirmation, member notifications |

**Deliverable:** Enterprise-grade POS platform supporting multi-store chains and ecosystem integrations.

---

### 1.4 Success criteria

| Criteria | Measurement |
|---|---|
| Merchant can self-onboard | Sign up → create shop → add products in < 30 minutes |
| Order placement works end-to-end | Customer browse → cart → checkout → merchant receives order |
| Modern, responsive UI | Works well on desktop admin + mobile cashier |
| Multi-tenant isolation | Each merchant's data is fully isolated |
| Performance | Admin pages load in < 2s, cashier storefront < 1s |

### 1.5 Out of scope (Build Phase 1 / v1)

- Inventory management (Phase 2)
- Member/loyalty system (Phase 2)
- Reporting beyond basic dashboard (Phase 2)
- Payment gateway integration — Phase 1 uses cash/manual only (Phase 2)
- Promotions, vouchers, coupons (Phase 3)
- Points, stored value (Phase 3)
- Wholesale, procurement (Phase 4)
- Chain management, WeChat, secondary screen (Phase 5)
- Table management, reservations (Phase 5)

### 1.6 Recommended tech stack

| Layer | Technology | Cost | Rationale |
|---|---|---|---|
| **Framework** | Next.js 15 (App Router) | Free | User preference; SSR + API routes |
| **Language** | TypeScript | Free | Type safety across full stack |
| **Architecture** | 3 Next.js apps (Turborepo) | Free | Admin, Storefront, Landing — clear separation |
| **Database** | PostgreSQL 16 (self-hosted on ECS) | $0 | ACID compliance, RLS for multi-tenancy |
| **ORM** | Drizzle ORM | Free | Lighter than Prisma, SQL-first, type-safe |
| **Auth** | Auth.js v5 (NextAuth) | Free | Self-hosted, 7 roles |
| **UI** | Tailwind CSS + shadcn/ui | Free | Modern, accessible, customizable |
| **State** | Zustand | Free | Lightweight client state (cart, UI) |
| **Data Fetching** | TanStack Query | Free | Server state caching, optimistic updates |
| **Charts** | Recharts | Free | Dashboard charts |
| **Hosting** | Alibaba Cloud ECS (Hong Kong) | **~¥50-100/mo** | Low latency to Macau (~2ms), Alibaba ecosystem |
| **Reverse proxy** | Caddy | Free | Auto-HTTPS, routes 3 apps by subdomain |
| **Process manager** | PM2 | Free | Manages 3 Next.js processes |
| **Image storage** | Local disk (ECS) → Alibaba OSS at scale | $0 | Served by Caddy |
| **Email** | Nodemailer + Brevo free | $0 | 300 emails/day |
| **Backups** | pg_dump → Alibaba OSS / R2 free | $0 | Daily automated |
| **i18n** | next-intl | Free | zh-TW, en, pt |
| **CI/CD** | GitHub Actions | Free | Auto-deploy on push |
| **Multi-tenancy** | Row-level (tenant_id) + RLS | Free | Drizzle middleware + PostgreSQL RLS |
| **Monorepo** | Turborepo | Free | Shared packages: db, ui, auth, utils, i18n |
| **TOTAL** | | **~$7-14/mo** | |

### Phase 0 Sign-off

**Phase:** 0 — Capture Intent + Research Reference
**Deliverables:** Reference analysis, project identity, 5-phase feature roadmap, tech stack recommendation
**Decision required:** Do you approve the phased feature breakdown and tech stack?

- [x] Approved — proceed to Phase 0.1 (User Scenario Design) ✅ 2026-03-22

**User notes:**
Approved. User confirmed: all features eventually, modern UI (will provide design), SaaS for multiple merchants, Next.js stack.

---

## 2. User Scenario Design

### 2.1 User personas

| Persona | Context | Language | Key need |
|---|---|---|---|
| **平台管理員 (Platform Admin)** | SaaS operator who manages the entire platform. Onboards merchants, monitors system health, manages billing. Desktop-first, technical. | zh-TW / en | Manage merchants, monitor platform, configure system-wide settings |
| **商戶老闆 (Merchant Owner)** | Shop owner/manager in Macau. Sets up their store, manages products, reviews sales, configures promotions. Uses desktop admin daily, checks mobile occasionally. May manage 1–3 stores. | zh-TW | Set up shop quickly, manage products & pricing, understand business performance |
| **收銀員 (Cashier)** | Frontline staff operating the POS. Creates orders, processes payments, handles refunds. Fast workflow is critical — often serving customers face-to-face. Desktop POS terminal or tablet. | zh-TW | Process orders fast, handle payments, manage order status with minimal clicks |
| **顧客 (Customer)** | End customer browsing and ordering from a merchant's storefront. Mobile-first. May be local (Chinese) or tourist (English/Portuguese). Wants quick browsing and easy checkout. | zh-TW / en / pt | Find products, place orders, track order status |
| **推廣員 (Promoter/Sales Agent)** | Commissioned agent who sells the POS platform to Macau merchants. Demos the product, onboards leads, tracks referral commissions. Mobile + desktop. May manage 10–50 leads. | zh-TW / en | Demo the platform, track referrals, see commission earnings |
| **潛在商戶 (Potential Customer)** | Shop owner evaluating the platform. Hasn't signed up yet. Visits landing page, watches demo, compares pricing, may start a free trial. Mobile or desktop. | zh-TW / en | Understand value proposition, see pricing, try before committing |
| **會計/簿記員 (Accountant)** | Merchant's bookkeeper or accountant. Read-only access to financial reports, order summaries, and settlement data. Desktop-first. May serve multiple merchants. | zh-TW / en | Access financial reports, export data for bookkeeping, no operational access |

### 2.2 User stories

#### Persona: 平台管理員 (Platform Admin)

**Onboarding & Management**
1. 「我想要新增一間商戶到平台，設定他們的帳號和基本資料，讓他們可以開始使用系統。」
   *I want to add a new merchant to the platform, set up their account and basic info, so they can start using the system.*

2. 「我想要查看所有商戶的列表，了解他們的狀態（活躍/暫停），以及他們的訂單量。」
   *I want to see a list of all merchants, their status (active/suspended), and their order volume.*

3. 「我想要暫停或停用某個商戶的帳號，當他們違反使用條款或停止付費時。」
   *I want to suspend or disable a merchant's account when they violate terms or stop paying.*

4. 「我想要查看整個平台的總覽數據——今日總訂單數、總銷售額、活躍商戶數。」
   *I want to see platform-wide overview data — total orders today, total sales, active merchants.*

#### Persona: 商戶老闆 (Merchant Owner)

**Shop Setup**
5. 「我剛註冊，想要設定我的店鋪資料——店名、地址、營業時間、聯絡電話。」
   *I just signed up and want to set up my shop info — name, address, business hours, phone.*

6. 「我想要建立商品分類，例如『飲品』、『小食』、『周邊商品』，方便管理和顧客瀏覽。」
   *I want to create product categories like 'Drinks', 'Snacks', 'Merchandise' for easy management and customer browsing.*

**Product Management**
7. 「我想要新增一個商品，填寫名稱、價格、圖片、描述，並指定分類。」
   *I want to add a new product with name, price, image, description, and assign a category.*

8. 「我的商品有多種規格（例如口罩有平面款、KN95、10片裝），我想要為一個商品設定多個規格，每個規格可以有不同價格。」
   *My product has multiple specs (e.g. masks have flat, KN95, 10-pack). I want to set multiple variants for one product, each with different pricing.*

9. 「我想要批量上架或下架商品，而不是一個一個操作。」
   *I want to batch list or delist products instead of doing them one by one.*

10. 「我想要修改商品的價格或資料，修改後顧客端立即更新。」
    *I want to edit a product's price or info, and have the customer storefront update immediately.*

11. 「我想要查看哪些商品已售空、已下架、或缺少圖片，快速處理問題。」
    *I want to see which products are sold out, delisted, or missing images, to fix issues quickly.*

**Order & Sales**
12. 「我想要查看今天的所有訂單，包括訂單狀態、金額、付款方式。」
    *I want to see today's orders including status, amount, and payment method.*

13. 「我想要為一筆訂單辦理退款，並記錄退款原因。」
    *I want to process a refund for an order and record the reason.*

14. 「我想要在首頁看到今日的銷售概況——訂單數、銷售額、跟昨天的比較。」
    *I want to see today's sales overview on the dashboard — orders, revenue, comparison to yesterday.*

**Settings**
15. 「我想要設定我的店鋪支持哪些付款方式（現金、MPAY等）。」
    *I want to configure which payment methods my shop supports (cash, MPAY, etc.).*

16. 「我想要新增收銀員帳號，讓我的員工可以登入POS操作。」
    *I want to add cashier accounts so my staff can log into the POS.*

#### Persona: 收銀員 (Cashier)

**Order Creation**
17. 「顧客來到店裡，我要快速找到他想要的商品，加入訂單。」
    *A customer arrives, I need to quickly find the product they want and add it to the order.*

18. 「顧客要買口罩，我需要選擇規格（平面/KN95），確認數量，加入購物車。」
    *Customer wants to buy masks, I need to select the spec (flat/KN95), confirm quantity, add to cart.*

19. 「我要修改購物車中的商品數量，或者刪除某個商品。」
    *I need to modify quantity of items in the cart, or remove an item.*

20. 「顧客決定結帳，我要選擇付款方式（現金），完成訂單。」
    *Customer is ready to pay, I select the payment method (cash) and complete the order.*

21. 「我要能夠通過搜尋商品名稱或編碼快速找到商品，不用一直翻分類。」
    *I need to search by product name or code to find products quickly without browsing categories.*

**Order Management**
22. 「我想查看待處理的訂單列表，快速確認和處理。」
    *I want to see pending orders and process them quickly.*

23. 「顧客想要取消訂單或退貨，我要能夠處理退款。」
    *Customer wants to cancel or return, I need to process the refund.*

24. 「我今天的班次結束了，想看看我今天處理了多少訂單、多少銷售額。」
    *My shift is ending, I want to see how many orders I processed and my total sales today.*

#### Persona: 顧客 (Customer)

**Browsing & Ordering**
25. 「我想瀏覽這家店的商品，按分類找到我要的東西。」
    *I want to browse this shop's products and find what I need by category.*

26. 「我看到一個商品想了解更多，點進去看詳情、規格和價格。」
    *I see a product and want to learn more — tap to see details, specs, and pricing.*

27. 「我選好了規格和數量，要加入購物車。」
    *I've selected the spec and quantity, I want to add to cart.*

28. 「我想查看購物車，確認所有商品和總價，然後下單。」
    *I want to review my cart, confirm all items and total, then place the order.*

29. 「我下單後想要查看訂單狀態。」
    *After ordering, I want to check my order status.*

30. 「我是遊客，想切換語言到英文或葡文。」
    *I'm a tourist, I want to switch the language to English or Portuguese.*

**Edge cases**
31. 「我選的商品缺貨了，系統應該告訴我而不是讓我下了單才發現。」
    *The product I selected is out of stock — the system should tell me rather than letting me order and finding out later.*

32. 「我想用手機掃描二維碼直接進入某家店的點餐頁面。」
    *I want to scan a QR code on my phone to go directly to a shop's ordering page.*

#### Persona: 推廣員 (Promoter/Sales Agent)

**Lead Management & Demo**
33. 「我遇到一個有興趣的商戶，想要用演示模式給他看系統功能，不需要真實數據。」
    *I've found an interested merchant and want to use demo mode to show them the system features without real data.*

34. 「我想要生成一個推薦連結或推薦碼，發給潛在商戶，這樣他們註冊後會算在我的業績。」
    *I want to generate a referral link or code to send to potential merchants, so their sign-up is attributed to me.*

35. 「我想要查看我推薦了多少商戶、有多少已註冊、我的佣金是多少。」
    *I want to see how many merchants I've referred, how many signed up, and my commission earnings.*

36. 「我想要查看我的潛在客戶列表，跟進那些還沒註冊的。」
    *I want to see my lead list and follow up with those who haven't signed up yet.*

37. 「有商戶想試用，我想要幫他快速開通一個試用帳號。」
    *A merchant wants to try it out, I want to quickly set up a trial account for them.*

#### Persona: 潛在商戶 (Potential Customer)

**Evaluation & Onboarding**
38. 「我想了解這個POS系統有什麼功能、收費多少，看看適不適合我的店。」
    *I want to understand what features this POS offers and how much it costs, to see if it suits my shop.*

39. 「我想先試用一下，不用馬上付費，看看操作起來方不方便。」
    *I want to try it first without paying, to see if it's easy to use.*

40. 「我想看看其他商戶的使用案例或評價，確認這個系統可靠。」
    *I want to see case studies or reviews from other merchants to confirm the system is reliable.*

41. 「試用之後我覺得可以，想要正式訂閱，選擇適合的方案。」
    *After the trial I'm convinced, I want to officially subscribe and choose the right plan.*

42. 「我有問題想諮詢，想要聯繫客服或我的推廣員。」
    *I have questions and want to contact support or my promoter/agent.*

#### Persona: 會計/簿記員 (Accountant)

**Financial Reporting**
43. 「我要查看這個月的營業報表，包括總銷售額、退款金額、淨收入。」
    *I want to view this month's business report including total sales, refunds, and net revenue.*

44. 「我要導出訂單和收款明細到Excel，方便做帳。」
    *I want to export order and payment details to Excel for bookkeeping.*

45. 「我要查看各付款方式的收款報表（現金、MPAY等），核對銀行入帳。」
    *I want to see payment method reports (cash, MPAY, etc.) to reconcile bank deposits.*

46. 「我負責多間商戶的帳務，要能夠切換不同商戶查看報表，但不能修改任何營運資料。」
    *I handle accounts for multiple merchants, I need to switch between them to view reports, but cannot modify any operational data.*

47. 「我要查看每日的收銀報表，核對收銀員的現金交接。」
    *I want to view daily cashier reports to verify cash handover between shifts.*

### 2.3 Capability categories

| Category | Examples | Capability needed | Priority | Build Phase |
|---|---|---|---|---|
| **Multi-tenant platform** | Merchant onboarding, tenant isolation, platform admin | Tenant management, row-level isolation | P0 | 1 |
| **Authentication** | Login, 7 roles (platform admin/merchant/cashier/customer/promoter/potential customer/accountant), session | Auth system with role-based access | P0 | 1 |
| **Product catalog** | CRUD products, categories, images, pricing | Product management module | P0 | 1 |
| **Product variants** | Multiple specs per product, per-variant pricing | Variant/specification system | P0 | 1 |
| **Storefront browsing** | Category navigation, product listing, search, product detail | Customer-facing storefront | P0 | 1 |
| **Shopping cart** | Add/remove/update items, cart summary, variant selection | Cart state management | P0 | 1 |
| **Order placement** | Checkout flow, payment method selection, order creation | Order creation pipeline | P0 | 1 |
| **Order management** | Order list, status tabs, detail view, status transitions | Order management module | P0 | 1 |
| **Basic payment** | Cash payment recording, payment method configuration | Payment recording | P0 | 1 |
| **Dashboard** | Today's stats, order/sales summary | Dashboard with summary cards | P0 | 1 |
| **Shop settings** | Shop info, hours, payment config, staff accounts | Settings module | P0 | 1 |
| **Refunds** | Process refund, record reason | Refund workflow | P0 | 1 |
| **Product search** | Search by name/code | Search functionality | P0 | 1 |
| **i18n** | Language switching (zh-TW, en, pt) | Internationalization | P0 | 1 |
| **QR code storefront** | Scan to enter shop's ordering page | QR code generation | P0 | 1 |
| **Batch product ops** | Batch list/delist products | Batch operations | P1 | 2 |
| **Inventory tracking** | Stock levels, low-stock alerts | Inventory module | P1 | 2 |
| **Member system** | Registration, tiers, member pricing | Member module | P1 | 2 |
| **Reporting** | Sales reports, product rankings | Reporting module | P1 | 2 |
| **Payment gateway** | MPAY integration | Payment gateway | P1 | 2 |
| **Receipt printing** | Thermal printer integration | Print module | P1 | 2 |
| **Excel import/export** | Bulk product import, order export | File processing | P1 | 2 |
| **Promotions** | Discounts, coupons, vouchers | Promotions engine | P1 | 3 |
| **Points system** | Earn/redeem points | Points module | P2 | 3 |
| **Stored value** | Member wallet, top-up | Wallet module | P2 | 3 |
| **Full inventory** | Warehouses, suppliers, procurement | Full inventory module | P2 | 4 |
| **Wholesale** | B2B orders, bulk pricing | Wholesale module | P2 | 4 |
| **Chain management** | Multi-store, consolidated reports | Chain module | P2 | 5 |
| **WeChat** | Official account, mini-program | WeChat integration | P2 | 5 |
| **Promoter portal** | Referral links, lead tracking, commission dashboard | Promoter module | P1 | 2 |
| **Demo mode** | Sandbox with sample data for sales demos | Demo environment | P1 | 2 |
| **Landing page & pricing** | Public marketing site, feature list, pricing plans | Marketing site | P0 | 1 |
| **Free trial** | Time-limited trial account, self-serve sign-up | Trial provisioning | P0 | 1 |
| **Subscription & billing** | Plan selection, billing cycle, payment | Billing module | P1 | 2 |
| **Accountant role** | Read-only financial access, multi-merchant view, report export | Accountant role + reports | P1 | 2 |
| **Referral system** | Referral codes, attribution tracking, commission calculation | Referral engine | P1 | 2 |

### 2.4 Acceptance test cases (Build Phase 1 — P0)

| ID | Scenario | Persona | Input | Expected | Pass criteria |
|---|---|---|---|---|---|
| AT-001 | Platform admin creates merchant | Platform Admin | Fill merchant form: name, email, phone | Merchant account created, login credentials generated | Merchant can log in with generated credentials |
| AT-002 | Merchant sets up shop | Merchant Owner | Fill shop info: name, address, hours, phone | Shop profile saved, visible on storefront | Storefront shows correct shop name and info |
| AT-003 | Merchant creates category | Merchant Owner | Enter category name "飲品" | Category created and appears in category list | Category visible in admin and storefront sidebar |
| AT-004 | Merchant adds simple product | Merchant Owner | Name: "澳門明信片", Price: $18, Category: "明信片", Image: upload | Product created, listed in product library | Product appears in admin list and customer storefront |
| AT-005 | Merchant adds product with variants | Merchant Owner | Name: "853口罩", Variants: [平面/$36, KN95/$59, 10片裝/$120] | Product with 3 variants created | Each variant shows correct price in variant selector |
| AT-006 | Merchant edits product price | Merchant Owner | Change "澳門明信片" price from $18 to $20 | Price updated in DB | Storefront shows $20 immediately |
| AT-007 | Merchant batch delists products | Merchant Owner | Select 3 products → click "批量下架" | All 3 products delisted | Products no longer visible on storefront |
| AT-008 | Customer browses by category | Customer | Tap "口罩" category on storefront | Products in 口罩 category displayed | Only mask products shown, with name/price/image |
| AT-009 | Customer selects variant and adds to cart | Customer | Tap "選規格" on 853口罩 → select "KN95" → qty 2 → "加入購物車" | 2x KN95 added to cart at $59 each | Cart shows: 853口罩 (KN95) × 2 = $118 |
| AT-010 | Customer modifies cart | Customer | Change qty from 2 to 1, remove another item | Cart updated | Total recalculated correctly |
| AT-011 | Customer places order | Customer | Review cart → tap "自取下單" → confirm | Order created with status "待處理" | Order appears in merchant's order list |
| AT-012 | Cashier finds product by search | Cashier | Type "853" in search bar | Products matching "853" shown | 853口罩 appears in results |
| AT-013 | Cashier creates order with cash payment | Cashier | Add products → select "現金" payment → complete | Order created, status "已完成", payment "現金" | Order shows in order list with correct payment method |
| AT-014 | Cashier processes refund | Cashier | Open completed order → click "退款" → enter reason → confirm | Refund recorded, order status updated | Order status shows "已退款", refund amount recorded |
| AT-015 | Merchant views dashboard | Merchant Owner | Navigate to dashboard | Today's stats displayed | Shows correct order count, total sales, comparison to yesterday |
| AT-016 | Merchant adds cashier account | Merchant Owner | Enter staff name, phone, set role "收銀員" | Staff account created | Staff can log in with cashier role (limited permissions) |
| AT-017 | Customer switches language | Customer | Tap "EN" language toggle | Storefront switches to English | All UI labels, buttons, category names in English |
| AT-018 | Customer sees out-of-stock | Customer | Browse to a product with 0 stock | "售罄" / "Sold Out" badge shown, add-to-cart disabled | Cannot add out-of-stock product to cart |
| AT-019 | Customer scans QR to enter shop | Customer | Scan shop's QR code with phone camera | Opens shop's storefront page | Correct shop loaded with its products |
| AT-020 | Merchant configures payment methods | Merchant Owner | Go to Settings → Payment → enable "現金", disable "MPAY" | Payment options saved | Checkout only shows "現金" as option |
| AT-021 | Tenant isolation verified | Platform Admin | Merchant A logs in | Only Merchant A's data visible | No products/orders from Merchant B visible |
| AT-022 | Cashier views shift summary | Cashier | Click "我的班次" at end of day | Today's personal stats shown | Correct order count and sales total for this cashier |
| AT-023 | Potential customer views landing page | Potential Customer | Visit platform URL | Landing page with features, pricing, CTA | Page loads < 2s, pricing plans visible, "Free Trial" button works |
| AT-024 | Potential customer starts free trial | Potential Customer | Click "免費試用" → fill name, email, phone, shop name | Trial account created, redirected to shop setup | Can log in, see trial badge with days remaining, full feature access |
| AT-025 | Promoter generates referral link | Promoter | Log in → Referral Dashboard → "生成推薦連結" | Unique referral URL generated | URL contains promoter's referral code |
| AT-026 | Referral attribution works | Promoter | Potential customer signs up via referral link | Sign-up attributed to promoter | Promoter's dashboard shows +1 referral, merchant record shows referral source |
| AT-027 | Promoter views commission dashboard | Promoter | Navigate to Commission Dashboard | Referral stats and commission shown | Correct count of referred merchants, sign-ups, and calculated commission |
| AT-028 | Accountant views reports (read-only) | Accountant | Log in with accountant role → navigate to Reports | Financial reports visible | Can view/export reports, but NO edit/delete buttons on products/orders/settings |
| AT-029 | Accountant switches between merchants | Accountant | Select "商戶B" from merchant switcher dropdown | Reports switch to Merchant B's data | Data changes completely, no cross-contamination |
| AT-030 | Trial expiry handling | Potential Customer | Trial period expires (e.g. 14 days) | System shows upgrade prompt, restricts new orders | Existing data preserved, can still view but not create; clear upgrade CTA |

### 2.5 QA test playbook

#### QA-001: Merchant onboarding end-to-end
**Priority:** P0
**Steps:**
1. Log in as Platform Admin
2. Navigate to Merchant Management → "新增商戶"
3. Fill in: Shop name "測試咖啡店", Owner email, phone
4. Submit → note generated credentials
5. Log out
6. Log in with generated merchant credentials
7. Complete shop setup wizard: name, address, hours
8. Navigate to Products → "新增商品"
9. Create product: "拿鐵咖啡", $38, category "飲品"
10. Open storefront URL in incognito browser
11. Verify shop name and product appear
**Expected:** Full flow completes without errors. Product visible on storefront within 5 seconds.
**If FAIL:** Check tenant creation, auth token generation, product API, storefront data fetching.

#### QA-002: Product variant creation and display
**Priority:** P0
**Steps:**
1. Log in as Merchant Owner
2. Navigate to Products → "發佈新品"
3. Enter product name "853口罩", base price $36
4. Add specification group "款式"
5. Add variants: "平面" $36, "KN95" $59, "10片裝" $120
6. Upload product image
7. Save and publish
8. Open storefront in new tab
9. Navigate to product category
10. Tap product → verify variant selector appears
11. Select "KN95" → verify price shows $59
12. Set qty to 2 → tap "加入購物車"
13. Open cart → verify "853口罩 (KN95) × 2 = $118"
**Expected:** All variants display with correct pricing. Cart calculation is accurate.
**If FAIL:** Check variant schema, pricing logic, cart state management.

#### QA-003: Order lifecycle (create → complete → refund)
**Priority:** P0
**Steps:**
1. As Customer: add 2 products to cart, place order
2. Note order number (format: ORD-YYYYMMDD-XXXXX)
3. As Cashier: navigate to Order Management
4. Verify new order appears in "待處理" tab
5. Open order → verify line items, quantities, total
6. Click "確認" → order moves to "處理中"
7. Click "完成" → select payment "現金" → order moves to "已完成"
8. Click "退款" → enter reason "顧客要求" → confirm partial refund for 1 item
9. Verify refund amount recorded, order status updated
10. As Merchant: check dashboard → verify order count and sales include this order
**Expected:** Order flows through all status transitions correctly. Refund is recorded accurately.
**If FAIL:** Check order state machine, refund calculation, dashboard aggregation queries.

#### QA-004: Multi-tenant data isolation
**Priority:** P0
**Steps:**
1. Create Merchant A with product "商品A-1" at $10
2. Create Merchant B with product "商品B-1" at $20
3. Log in as Merchant A → navigate to Products
4. Verify ONLY "商品A-1" appears, NOT "商品B-1"
5. Log in as Merchant B → navigate to Products
6. Verify ONLY "商品B-1" appears, NOT "商品A-1"
7. Open Merchant A's storefront → verify only A's products
8. Open Merchant B's storefront → verify only B's products
9. Attempt API call: GET /api/products with Merchant A's token but Merchant B's tenant_id
10. Verify 403 Forbidden response
**Expected:** Complete data isolation between tenants at UI and API level.
**If FAIL:** Check tenant_id middleware, Prisma query filters, API authorization layer. **THIS IS A SECURITY BLOCKER.**

#### QA-005: Storefront browsing and language switching
**Priority:** P0
**Steps:**
1. Open a merchant's storefront URL on mobile viewport (375px)
2. Verify shop name, categories sidebar, products display correctly
3. Tap a category → verify filtered products
4. Use search → verify results match query
5. Tap language toggle "EN"
6. Verify all UI elements switch to English
7. Tap language toggle "PT"
8. Verify all UI elements switch to Portuguese
9. Tap a product → verify variant selector works in current language
10. Add to cart → verify cart labels are in current language
**Expected:** Storefront is fully functional on mobile. Language switching is complete and consistent.
**If FAIL:** Check responsive CSS, i18n translation keys, language persistence (localStorage).

#### QA-006: Dashboard accuracy
**Priority:** P0
**Steps:**
1. Note current dashboard stats (orders, sales)
2. Create 3 orders: $50, $100, $75
3. Complete 2 orders (cash), leave 1 pending
4. Refresh dashboard
5. Verify: order count increased by 2 (only completed), sales increased by $150
6. Process refund of $50 on one order
7. Refresh dashboard
8. Verify: refund count shows 1, refund amount shows $50
9. Compare to yesterday toggle → verify comparison percentages
**Expected:** Dashboard stats accurately reflect completed orders and refunds.
**If FAIL:** Check aggregation queries, status filters, refund inclusion logic.

#### QA-007: Promoter referral flow end-to-end
**Priority:** P1 (Build Phase 2)
**Steps:**
1. Log in as Platform Admin → create Promoter account
2. Log in as Promoter
3. Navigate to Referral Dashboard → click "生成推薦連結"
4. Copy the generated referral URL
5. Open referral URL in incognito browser
6. Landing page loads with promoter attribution in URL params
7. Click "免費試用" → fill in merchant details → submit
8. Verify: new merchant account created with trial status
9. Log back in as Promoter
10. Verify: Referral Dashboard shows +1 new referral
11. Verify: merchant record shows this promoter as referral source
12. As Platform Admin: verify merchant's subscription shows referral attribution
**Expected:** Full referral attribution chain works from link generation to merchant sign-up.
**If FAIL:** Check referral code persistence (URL params → cookie → DB), promoter-merchant relationship.

#### QA-008: Free trial lifecycle
**Priority:** P0
**Steps:**
1. Visit landing page → click "免費試用"
2. Fill sign-up form: shop name, owner name, email, phone
3. Verify: redirected to shop setup wizard
4. Verify: trial badge shows "試用期：剩餘14天"
5. Complete shop setup → add products → create test order
6. Verify: all features work during trial
7. Simulate trial expiry (admin sets trial end date to past)
8. Log in as trial merchant
9. Verify: banner shows "試用期已結束，請選擇方案繼續使用"
10. Verify: can still view existing data but cannot create new orders
11. Click "升級方案" → select plan → confirm
12. Verify: full access restored, trial badge removed
**Expected:** Trial provides full functionality, expires gracefully, data preserved through upgrade.
**If FAIL:** Check trial expiry middleware, subscription status checks, upgrade flow.

#### QA-009: Accountant read-only access
**Priority:** P1 (Build Phase 2)
**Steps:**
1. As Merchant Owner: navigate to Settings → Staff → "新增帳號"
2. Create account with role "會計/簿記員"
3. Log in as Accountant
4. Verify: sidebar only shows Reports section (no Products, Orders creation, Settings edit)
5. Navigate to 營業報表 → verify data is visible
6. Click "導出" → verify Excel download works
7. Attempt to navigate to /products → verify redirected or 403
8. Attempt API call: POST /api/products → verify 403 Forbidden
9. If accountant serves multiple merchants: verify merchant switcher in header
10. Switch merchant → verify reports change to selected merchant's data
**Expected:** Accountant sees only financial reports, can export, cannot modify anything.
**If FAIL:** Check role-based route guards, API authorization middleware, merchant switcher logic.

### Phase 0.1 Sign-off

**Phase:** 0.1 — User Scenario Design
**Deliverables:** 7 user personas, 47 user stories, capability matrix with build phase mapping, 30 acceptance test cases, 9 QA playbook scenarios
**Active persona:** Senior Product Manager
**Decision required:** Do these scenarios accurately capture the user experience you want to build?

- [x] Approved — proceed to Phase 1 (Technical Feasibility & Stack) ✅ 2026-03-22

**User notes:**
Approved after adding 3 additional personas (Promoter, Potential Customer, Accountant).

---

## 3. Technical Feasibility & Stack

🎭 **Active: Backend Architect**

### 3.0 Cost-first design philosophy

**Principle: Minimize infrastructure cost while keeping clean separation of concerns.**

3 separate apps (admin, storefront, landing) for clear ownership and independent deployment, running on a single Alibaba Cloud ECS instance with self-hosted PostgreSQL.

**Cost summary:**

| Item | Technology | Monthly cost |
|---|---|---|
| App hosting (3 apps) | **Alibaba Cloud ECS** (Hong Kong region) | ~¥50-100/mo (~$7-14) |
| Database | **PostgreSQL on same ECS** | $0 |
| Image storage | **Local disk on ECS** → Alibaba OSS at scale | $0 |
| Email | **Nodemailer + Brevo free tier** | $0 |
| DNS/SSL | **Cloudflare free + Caddy auto-SSL** | $0 |
| Backup | **pg_dump → Alibaba OSS free tier** | $0 |
| **TOTAL** | | **~$7-14/mo** |

### 3.1 Technology decisions

| Decision | Selected | Rationale | Confidence |
|---|---|---|---|
| **Framework** | **Next.js 15 (App Router)** | User preference. SSR + API routes + RSC. | Confirmed |
| **Language** | **TypeScript** | Type safety for multi-tenant SaaS with 7 roles. | Confirmed |
| **Architecture** | **3 Next.js apps (Turborepo monorepo)** | Separation of concerns: admin, storefront, landing. Independent builds/deploys. Shared packages for DB, UI, auth, utils. | Confirmed (user preference) |
| **Database** | **PostgreSQL 16 (self-hosted on ECS)** | ACID compliance, RLS for multi-tenancy, JSON columns, FTS. Zero managed DB cost. | Confirmed |
| **ORM** | **Drizzle ORM** | Lighter than Prisma (~50KB vs ~2MB), no binary engine, SQL-first, type-safe. | Confirmed |
| **Auth** | **Auth.js v5 (NextAuth)** | Free, self-hosted. Credentials (phone+password), OAuth, magic link. 7 roles via `role` field. | Confirmed |
| **UI** | **shadcn/ui + Tailwind CSS** | Modern, accessible, customizable per-merchant branding. | Confirmed |
| **State (client)** | **Zustand** | Lightweight cart state, UI toggles. ~1KB. | Confirmed |
| **Server state** | **TanStack Query** | Caching, refetch, optimistic updates for fresh POS data. | Confirmed |
| **API pattern** | **Server Actions + REST** | Server Actions for admin mutations, REST for public storefront API. | Confirmed |
| **Hosting** | **Alibaba Cloud ECS (Hong Kong region)** | Low latency to Macau (~2ms). ecs.t6-c1m1.large (2 vCPU, 2GB) or ecs.c6.large (2 vCPU, 4GB). Single instance runs 3 Next.js apps + PostgreSQL + Caddy. | Confirmed (user preference) |
| **Reverse proxy / SSL** | **Caddy** | Auto-HTTPS, routes 3 apps by subdomain/path. Free. | Confirmed |
| **Process manager** | **PM2** | Manages 3 Next.js processes (admin :3001, storefront :3002, landing :3003). Auto-restart, log management. | Confirmed |
| **Image storage** | **Local disk on ECS** | Product images served by Caddy. Migrate to Alibaba OSS when >20GB. | Confirmed |
| **Email** | **Nodemailer + Brevo free tier** | 300 emails/day free. Trial signups, password resets. | Confirmed |
| **Charts** | **Recharts** | Lightweight dashboard charts. Free. | Confirmed |
| **i18n** | **next-intl** | zh-TW, en, pt. App Router native. | Confirmed |
| **Payments** | **Manual (Phase 1) → MPAY (Phase 2)** | Cash payment recording in Phase 1. | Confirmed |
| **Printing** | **Web Serial API + ESC/POS** | Browser-to-thermal-printer. Chrome/Edge. | Confirmed |
| **Multi-tenancy** | **Drizzle middleware + PostgreSQL RLS** | Row-level tenant_id isolation. Double defense. | Confirmed |
| **Monorepo** | **Turborepo** | Shared packages: `@macau-pos/db`, `@macau-pos/ui`, `@macau-pos/auth`, `@macau-pos/utils`, `@macau-pos/i18n`. | Confirmed |
| **Backup** | **pg_dump cron → Alibaba OSS / Cloudflare R2 free** | Daily automated backup. | Confirmed |
| **CI/CD** | **GitHub Actions** | Push to main → SSH deploy to ECS. Per-app selective deploy. | Confirmed |
| **Monitoring** | **Better Stack free (uptime) + PM2 logs** | Uptime alerts + log rotation. | Confirmed |

### 3.2 Monthly cost breakdown

| Phase | Merchants | ECS spec | ECS cost | Domain | Other | **Total** |
|---|---|---|---|---|---|---|
| **MVP / Dev** | 0-5 | ecs.t6 (2 vCPU, 2GB) | ~¥50/mo (~$7) | $0 (subdomain) | $0 | **~$7/mo** |
| **Early traction** | 5-50 | ecs.c6 (2 vCPU, 4GB) | ~¥100/mo (~$14) | ~$12/yr | $0 | **~$15/mo** |
| **Growth** | 50-200 | ecs.c6 (4 vCPU, 8GB) | ~¥200/mo (~$28) | ~$12/yr | OSS ~$2/mo | **~$31/mo** |
| **Scale** | 200+ | Multiple ECS + RDS | ~¥500+/mo | ~$12/yr | OSS + CDN | **~$70+/mo** |

**Key insight:** Alibaba ECS Hong Kong gives Macau-optimal latency (~2ms) at competitive pricing. Stays within Alibaba ecosystem for easy future upgrades (RDS, OSS, CDN, SLB).

### 3.3 Feasibility matrix

| Scenario (from §2.3) | Technical requirement | Feasible? | Notes |
|---|---|---|---|
| Multi-tenant platform | Row-level tenant isolation, Drizzle middleware, PostgreSQL RLS | ✅ | Same pattern as before, different ORM |
| Auth with 7 roles | Auth.js v5 with role-based session, route middleware | ✅ | Unchanged |
| Product catalog CRUD | Drizzle CRUD operations, image upload to local disk | ✅ | Images served by Caddy static file server |
| Product variants | Normalized variant tables | ✅ | Unchanged |
| Storefront browsing | SSR product pages, category filtering, search | ✅ | Next.js standalone mode on VPS, no cold starts |
| Shopping cart | Zustand store, persisted to localStorage | ✅ | Unchanged |
| Order placement | Server Action with DB transaction | ✅ | Actually faster on VPS — no serverless cold start |
| Order management | Data table with status filters | ✅ | Unchanged |
| Cash payment | Enum field on order | ✅ | Unchanged |
| Dashboard stats | PostgreSQL aggregation | ✅ | Faster — DB is on same machine, no network hop |
| Refunds | Refund table linked to order | ✅ | Unchanged |
| Product search | PostgreSQL full-text search | ✅ | Unchanged |
| i18n (3 languages) | next-intl | ✅ | Unchanged |
| QR code storefront | qrcode npm package | ✅ | Unchanged |
| Landing page | Static route group in same app | ✅ | Simpler — same deployment, no separate app |
| Free trial | Subscription status enum + middleware | ✅ | Unchanged |
| Promoter referral | Referral code in URL → cookie → DB | ✅ | Unchanged |
| Accountant read-only | Role-based route guard | ✅ | Unchanged |
| Tenant data isolation | Drizzle middleware + PostgreSQL RLS | ✅ | Unchanged |
| Receipt printing | Web Serial API | ⚠️ | Chrome/Edge only, same as before |
| MPAY integration | MPAY API (Phase 2) | ⚠️ | Unchanged |
| **VPS reliability** | PM2 + Caddy + auto-restart | ✅ | PM2 auto-restarts crashed processes. Hetzner has 99.9% uptime SLA. |
| **SSL certificates** | Caddy auto-HTTPS (Let's Encrypt) | ✅ | Zero config, auto-renewal |
| **Database backups** | pg_dump cron + R2 upload | ✅ | Daily automated backups, 10GB free on R2 |

### 3.4 Technical risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| 1 | **ECS single point of failure** | Medium | High | Daily backups to Alibaba OSS / R2. ECS snapshot before major updates. Can spin up replacement ECS in < 30 mins from backup. For production: add SLB (Server Load Balancer) for failover. |
| 2 | **MPAY API docs unavailable** | Medium | High | Phase 1 manual payment. Research MPAY early in Phase 2. |
| 3 | **Tenant isolation breach** | Low | Critical | Drizzle middleware + PostgreSQL RLS. Penetration testing. Audit logging. |
| 4 | **ECS resource limits** | Low | Medium | t6 (2 vCPU, 2GB) handles ~100 concurrent users. Monitor with PM2. Vertical scaling on Alibaba is instant — upgrade to c6 (4 vCPU, 8GB) with one click. |
| 5 | **Web Serial API browser support** | Medium | Low | Receipt printing only. Fallback to browser print. |
| 6 | **Image disk space** | Low | Low | 40GB+ system disk. ~60,000 images before concern. Migrate to Alibaba OSS when >20GB. |
| 7 | **Trial abuse** | Medium | Low | Rate limit by phone. SMS OTP verification. |
| 8 | **No auto-scaling** | Low | Low | POS traffic is predictable and steady, not spiky. VPS handles well. |
| 9 | **Concurrent order modification** | Low | Medium | Optimistic locking with version field. |
| 10 | **3 apps on one ECS** | Low | Low | PM2 manages 3 processes efficiently. 2GB RAM is enough (Next.js standalone ~150MB each). Upgrade ECS if needed. |

### 3.5 Dependencies

| Dependency | Purpose | License | Cost | Risk |
|---|---|---|---|---|
| Next.js 15 | Full-stack framework | MIT | Free | Low |
| Drizzle ORM | Database queries + migrations | Apache 2.0 | Free | Low |
| Auth.js v5 | Authentication | ISC | Free | Low |
| shadcn/ui | UI components | MIT | Free | None — copied into project |
| Tailwind CSS | Utility CSS | MIT | Free | Low |
| Zustand | Client state | MIT | Free | Low |
| TanStack Query | Server state | MIT | Free | Low |
| Recharts | Dashboard charts | MIT | Free | Low |
| next-intl | Internationalization | MIT | Free | Low |
| Turborepo | Monorepo tooling | MIT | Free | Low — build tool only |
| PostgreSQL 16 | Database | PostgreSQL License | Free | None — self-hosted |
| Caddy | Reverse proxy + SSL | Apache 2.0 | Free | Low |
| PM2 | Process manager | AGPL-3.0 | Free | Low |
| Alibaba Cloud ECS | VPS hosting | Managed service | ~¥50-100/mo | Low — standard Linux VPS, portable |
| Nodemailer | Email sending | MIT | Free | Low |

**Total software licensing cost: $0.** Only infrastructure cost is the ECS instance.

### 3.6 Project structure (3-app monorepo)

```
macau-pos/
├── apps/
│   ├── admin/                        ← Merchant admin + Platform admin + Promoter portal
│   │   ├── src/app/
│   │   │   ├── [locale]/
│   │   │   │   ├── (auth)/           ← Login, register, forgot password
│   │   │   │   ├── (dashboard)/      ← Merchant admin pages
│   │   │   │   │   ├── page.tsx      ← Dashboard home
│   │   │   │   │   ├── products/
│   │   │   │   │   ├── orders/
│   │   │   │   │   ├── members/
│   │   │   │   │   ├── reports/
│   │   │   │   │   └── settings/
│   │   │   │   ├── (platform)/       ← Platform admin (super-admin only)
│   │   │   │   │   ├── merchants/
│   │   │   │   │   ├── promoters/
│   │   │   │   │   └── overview/
│   │   │   │   └── (promoter)/       ← Promoter portal
│   │   │   │       ├── referrals/
│   │   │   │       └── commissions/
│   │   │   └── api/                  ← Admin API routes
│   │   ├── next.config.ts
│   │   └── package.json
│   │
│   ├── storefront/                   ← Customer-facing ordering (mobile-optimized)
│   │   ├── src/app/
│   │   │   ├── [locale]/
│   │   │   │   ├── shop/[slug]/      ← Per-merchant storefront
│   │   │   │   │   ├── page.tsx      ← Product browsing
│   │   │   │   │   ├── [productId]/  ← Product detail
│   │   │   │   │   ├── cart/
│   │   │   │   │   ├── checkout/
│   │   │   │   │   └── orders/
│   │   │   │   └── (auth)/           ← Customer login (optional)
│   │   │   └── api/                  ← Public API routes
│   │   ├── next.config.ts
│   │   └── package.json
│   │
│   └── landing/                      ← Marketing site (SSG, public)
│       ├── src/app/
│       │   ├── [locale]/
│       │   │   ├── page.tsx          ← Landing page
│       │   │   ├── pricing/
│       │   │   ├── features/
│       │   │   └── trial/            ← Free trial signup
│       │   └── api/                  ← Trial signup API
│       ├── next.config.ts
│       └── package.json
│
├── packages/
│   ├── db/                           ← Drizzle schema + client + migrations + seed
│   │   ├── src/
│   │   │   ├── schema/               ← Table definitions
│   │   │   ├── client.ts             ← Drizzle client with tenant middleware
│   │   │   └── seed.ts               ← Seed data
│   │   └── drizzle/                  ← Migration files
│   │
│   ├── ui/                           ← Shared UI components (shadcn/ui)
│   │   └── src/components/
│   │
│   ├── auth/                         ← Shared auth config + middleware
│   │   └── src/
│   │
│   ├── utils/                        ← Shared utilities (formatting, validation, i18n)
│   │   └── src/
│   │
│   └── i18n/                         ← Translation files (zh-TW, en, pt)
│       └── messages/
│
├── uploads/                          ← Product images (local storage, served by Caddy)
│
├── scripts/
│   ├── backup.sh                     ← pg_dump → OSS/R2 backup script
│   ├── deploy.sh                     ← Git pull + turbo build + pm2 restart
│   └── setup.sh                      ← Initial ECS setup (PostgreSQL, Caddy, PM2, Node)
│
├── turbo.json
├── package.json
├── pnpm-workspace.yaml
└── .env.example
```

**3 apps, 5 shared packages, 1 deployment target.** Turborepo handles building only changed apps. PM2 runs 3 processes on separate ports.

### 3.7 Deployment architecture

```
                    ┌──────────────────────────────────────────────┐
                    │     Alibaba Cloud ECS (Hong Kong region)      │
                    │                                               │
                    │  ┌──────────┐                                 │
  Internet ──────▶  │  │  Caddy    │  Routes by subdomain:          │
                    │  │  (:443)   │                                 │
  HTTPS :443 ─────▶ │  │          ├──▶ admin.pos.mo    → :3001      │
                    │  │          ├──▶ shop.pos.mo     → :3002      │
                    │  │          ├──▶ pos.mo           → :3003      │
                    │  │          ├──▶ pos.mo/uploads/  → /uploads/  │
                    │  └──────────┘                                 │
                    │                                               │
                    │  ┌─────────────────────────────────────────┐  │
                    │  │  PM2 (process manager)                   │  │
                    │  │                                          │  │
                    │  │  ┌─────────┐ ┌────────────┐ ┌────────┐  │  │
                    │  │  │  Admin   │ │ Storefront  │ │Landing │  │  │
                    │  │  │  :3001   │ │   :3002     │ │ :3003  │  │  │
                    │  │  └────┬────┘ └─────┬──────┘ └───┬────┘  │  │
                    │  └───────┼─────────────┼───────────┼───────┘  │
                    │          └─────────────┼───────────┘          │
                    │                ┌───────▼───────┐              │
                    │                │  PostgreSQL    │              │
                    │                │  (:5432)       │              │
                    │                └───────────────┘              │
                    │                                               │
                    │  Daily: pg_dump → Alibaba OSS / R2 backup     │
                    └──────────────────────────────────────────────┘
```

### Phase 1 Sign-off

**Phase:** 1 — Technical Feasibility & Stack
**Deliverables:** Technology decisions (22 decisions), cost breakdown (~$7-14/mo MVP), feasibility matrix (23 scenarios — all ✅ or ⚠️), 10 risks, 15 dependencies, 3-app monorepo structure, deployment architecture
**Active persona:** Backend Architect
**Decision required:** Do you approve this architecture? (3 apps, Alibaba ECS, self-hosted PostgreSQL, Drizzle ORM, Turborepo)

- [x] Approved — proceed to Phase 2 (Data Model & API Design) ✅ 2026-03-22

**User notes:**
Approved. User requested: 3 apps (not single), Alibaba ECS hosting (not Hetzner), kept all other cost optimizations.

---

## 4. Data Model

🎭 **Active: Database Optimizer + Data Engineer**

### 4.1 Entity-Relationship overview

**Core entities for Build Phase 1 (Core POS):**

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Tenant     │────<│    User      │     │   Category   │
│  (merchant)  │     │  (7 roles)   │     │ (hierarchical│
└──────┬───────┘     └─────────────┘     └──────┬───────┘
       │                                        │
       │  ┌─────────────┐     ┌─────────────┐   │
       ├─<│   Product    │────<│  Variant     │   │
       │  │              │─────│              │───┘
       │  └──────┬───────┘     └─────────────┘
       │         │
       │  ┌──────▼───────┐     ┌─────────────┐
       ├─<│    Order      │────<│  OrderItem   │
       │  │              │     │              │
       │  └──────┬───────┘     └─────────────┘
       │         │
       │  ┌──────▼───────┐
       ├─<│   Payment     │
       │  └──────────────┘
       │
       │  ┌──────────────┐
       ├─<│   Refund      │
       │  └──────────────┘
       │
       │  ┌──────────────┐
       └─<│  ShopSettings │
          └──────────────┘

Standalone:
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Referral    │     │ Subscription │     │  AuditLog    │
└─────────────┘     └─────────────┘     └─────────────┘
```

**Relationships:**
- Tenant 1:N Users (platform admin has no tenant)
- Tenant 1:N Categories, Products, Orders, Payments, Settings
- Category self-referencing (parent_id for hierarchy)
- Product 1:N Variants (variant has its own price, stock, SKU)
- Product N:1 Category
- Order 1:N OrderItems (each item references a variant)
- Order 1:N Payments (support split payments)
- Order 1:N Refunds
- User (promoter) 1:N Referrals

### 4.2 Database schema (Drizzle ORM)

```typescript
// packages/db/src/schema/tenants.ts
import { pgTable, uuid, varchar, text, timestamp, pgEnum, boolean } from 'drizzle-orm/pg-core';

export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'trial', 'active', 'expired', 'suspended', 'cancelled'
]);

export const tenants = pgTable('tenants', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).unique().notNull(),
  logo: varchar('logo', { length: 500 }),
  phone: varchar('phone', { length: 20 }),
  address: text('address'),
  businessHours: text('business_hours'),  // JSON string
  subscriptionStatus: subscriptionStatusEnum('subscription_status').default('trial').notNull(),
  trialEndsAt: timestamp('trial_ends_at', { withTimezone: true }),
  referralCode: varchar('referral_code', { length: 50 }),
  referredBy: uuid('referred_by'),  // promoter user ID
  onboardingCompleted: boolean('onboarding_completed').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});
```

```typescript
// packages/db/src/schema/users.ts
export const userRoleEnum = pgEnum('user_role', [
  'platform_admin', 'merchant_owner', 'cashier', 'customer',
  'promoter', 'accountant', 'potential_customer'
]);

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id),  // null for platform_admin & promoter
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 20 }),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  role: userRoleEnum('role').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});
```

```typescript
// packages/db/src/schema/categories.ts
export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  parentId: uuid('parent_id'),  // self-ref for hierarchy
  name: varchar('name', { length: 255 }).notNull(),
  nameEn: varchar('name_en', { length: 255 }),
  namePt: varchar('name_pt', { length: 255 }),
  sortOrder: integer('sort_order').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
```

```typescript
// packages/db/src/schema/products.ts
import { pgTable, uuid, varchar, text, timestamp, boolean, integer, decimal } from 'drizzle-orm/pg-core';

export const productStatusEnum = pgEnum('product_status', [
  'draft', 'active', 'inactive', 'sold_out'
]);

export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  categoryId: uuid('category_id').references(() => categories.id),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  code: varchar('code', { length: 50 }),       // merchant product code (e.g. SW0253)
  barcode: varchar('barcode', { length: 50 }),
  image: varchar('image', { length: 500 }),
  originalPrice: decimal('original_price', { precision: 10, scale: 2 }).notNull(),
  sellingPrice: decimal('selling_price', { precision: 10, scale: 2 }).notNull(),
  memberPrice: decimal('member_price', { precision: 10, scale: 2 }),
  hasVariants: boolean('has_variants').default(false).notNull(),
  // If no variants, stock is tracked here; if variants, stock is on each variant
  stock: integer('stock'),  // null = unlimited
  status: productStatusEnum('status').default('active').notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  isPurchasable: boolean('is_purchasable').default(true).notNull(),
  packagingFee: decimal('packaging_fee', { precision: 10, scale: 2 }).default('0'),
  version: integer('version').default(1).notNull(),  // optimistic locking
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});
```

```typescript
// packages/db/src/schema/variants.ts
export const variants = pgTable('variants', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),  // e.g. "KN95", "平面", "10片裝"
  sku: varchar('sku', { length: 50 }),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  stock: integer('stock'),  // null = unlimited
  sortOrder: integer('sort_order').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
```

```typescript
// packages/db/src/schema/orders.ts
export const orderStatusEnum = pgEnum('order_status', [
  'pending',      // 待處理 — just placed
  'confirmed',    // 已確認 — merchant acknowledged
  'completed',    // 已完成 — fulfilled and paid
  'cancelled',    // 已取消
  'refunded',     // 已退款 — fully refunded
  'partial_refund' // 部分退款
]);

export const deliveryMethodEnum = pgEnum('delivery_method', [
  'pickup',       // 自取 / 到店
  'delivery',     // 配送
]);

export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  orderNumber: varchar('order_number', { length: 30 }).unique().notNull(),  // e.g. ORD-20260322-00001
  customerId: uuid('customer_id').references(() => users.id),  // null for walk-in
  cashierId: uuid('cashier_id').references(() => users.id),    // who processed it
  status: orderStatusEnum('status').default('pending').notNull(),
  deliveryMethod: deliveryMethodEnum('delivery_method').default('pickup').notNull(),
  subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull(),
  discount: decimal('discount', { precision: 10, scale: 2 }).default('0').notNull(),
  surcharge: decimal('surcharge', { precision: 10, scale: 2 }).default('0').notNull(),
  total: decimal('total', { precision: 10, scale: 2 }).notNull(),
  refundedAmount: decimal('refunded_amount', { precision: 10, scale: 2 }).default('0').notNull(),
  note: text('note'),
  version: integer('version').default(1).notNull(),  // optimistic locking
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
```

```typescript
// packages/db/src/schema/order-items.ts
export const orderItems = pgTable('order_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  productId: uuid('product_id').references(() => products.id).notNull(),
  variantId: uuid('variant_id').references(() => variants.id),  // null if no variants
  productName: varchar('product_name', { length: 255 }).notNull(),  // snapshot
  variantName: varchar('variant_name', { length: 255 }),             // snapshot
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),  // snapshot
  quantity: integer('quantity').notNull(),
  subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
```

```typescript
// packages/db/src/schema/payments.ts
export const paymentMethodEnum = pgEnum('payment_method', [
  'cash', 'mpay', 'wechat', 'alipay', 'visa', 'mastercard', 'other'
]);

export const paymentStatusEnum = pgEnum('payment_status', [
  'pending', 'completed', 'failed', 'refunded'
]);

export const payments = pgTable('payments', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  orderId: uuid('order_id').references(() => orders.id).notNull(),
  method: paymentMethodEnum('method').notNull(),
  status: paymentStatusEnum('status').default('pending').notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  reference: varchar('reference', { length: 100 }),  // external payment ref
  processedBy: uuid('processed_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
```

```typescript
// packages/db/src/schema/refunds.ts
export const refunds = pgTable('refunds', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  orderId: uuid('order_id').references(() => orders.id).notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  reason: text('reason').notNull(),
  processedBy: uuid('processed_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
```

```typescript
// packages/db/src/schema/referrals.ts
export const referrals = pgTable('referrals', {
  id: uuid('id').defaultRandom().primaryKey(),
  promoterId: uuid('promoter_id').references(() => users.id).notNull(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  referralCode: varchar('referral_code', { length: 50 }).notNull(),
  status: varchar('status', { length: 20 }).default('signed_up').notNull(),  // signed_up, active, churned
  commissionRate: decimal('commission_rate', { precision: 5, scale: 4 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
```

```typescript
// packages/db/src/schema/shop-settings.ts
export const shopSettings = pgTable('shop_settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id).unique().notNull(),
  enabledPaymentMethods: text('enabled_payment_methods'),  // JSON array: ["cash", "mpay"]
  currency: varchar('currency', { length: 10 }).default('MOP').notNull(),
  taxRate: decimal('tax_rate', { precision: 5, scale: 4 }).default('0'),
  receiptHeader: text('receipt_header'),
  receiptFooter: text('receipt_footer'),
  autoConfirmOrders: boolean('auto_confirm_orders').default(false).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
```

```typescript
// packages/db/src/schema/audit-log.ts
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id'),
  userId: uuid('user_id').references(() => users.id),
  action: varchar('action', { length: 50 }).notNull(),  // e.g. 'product.create', 'order.refund'
  entityType: varchar('entity_type', { length: 50 }),    // e.g. 'product', 'order'
  entityId: uuid('entity_id'),
  details: text('details'),  // JSON with before/after
  ipAddress: varchar('ip_address', { length: 45 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
```

### 4.3 Index strategy

| Table | Index | Columns | Purpose | Query pattern |
|---|---|---|---|---|
| tenants | `idx_tenants_slug` | slug | Storefront URL lookup | `WHERE slug = ?` |
| tenants | `idx_tenants_status` | subscription_status | Active merchant listing | `WHERE subscription_status = 'active'` |
| users | `idx_users_tenant` | tenant_id, role | User listing per tenant | `WHERE tenant_id = ? AND role = ?` |
| users | `idx_users_email` | email (unique) | Login by email | `WHERE email = ?` |
| users | `idx_users_phone` | phone | Login by phone | `WHERE phone = ?` |
| categories | `idx_categories_tenant` | tenant_id, sort_order | Category listing | `WHERE tenant_id = ? ORDER BY sort_order` |
| categories | `idx_categories_parent` | tenant_id, parent_id | Subcategory lookup | `WHERE tenant_id = ? AND parent_id = ?` |
| products | `idx_products_tenant_cat` | tenant_id, category_id, status | Product listing by category | `WHERE tenant_id = ? AND category_id = ? AND status = 'active'` |
| products | `idx_products_tenant_status` | tenant_id, status | Product listing with status filter | `WHERE tenant_id = ? AND status = ?` |
| products | `idx_products_search` | GIN(to_tsvector(name)) | Product search | `WHERE to_tsvector(name) @@ to_tsquery(?)` |
| products | `idx_products_barcode` | tenant_id, barcode | Barcode scan lookup | `WHERE tenant_id = ? AND barcode = ?` |
| variants | `idx_variants_product` | product_id, sort_order | Variant listing | `WHERE product_id = ? ORDER BY sort_order` |
| orders | `idx_orders_tenant_status` | tenant_id, status, created_at DESC | Order listing with status tabs | `WHERE tenant_id = ? AND status = ? ORDER BY created_at DESC` |
| orders | `idx_orders_number` | order_number (unique) | Order lookup by number | `WHERE order_number = ?` |
| orders | `idx_orders_cashier` | cashier_id, created_at DESC | Cashier shift summary | `WHERE cashier_id = ? AND created_at >= ?` |
| orders | `idx_orders_tenant_date` | tenant_id, created_at DESC | Dashboard stats | `WHERE tenant_id = ? AND created_at >= ?` |
| order_items | `idx_oitems_order` | order_id | Order line items | `WHERE order_id = ?` |
| payments | `idx_payments_order` | order_id | Payment lookup | `WHERE order_id = ?` |
| refunds | `idx_refunds_order` | order_id | Refund lookup | `WHERE order_id = ?` |
| referrals | `idx_referrals_promoter` | promoter_id | Promoter dashboard | `WHERE promoter_id = ?` |
| audit_logs | `idx_audit_tenant_date` | tenant_id, created_at DESC | Audit log listing | `WHERE tenant_id = ? ORDER BY created_at DESC` |

### 4.4 Migration strategy

- **Tool:** Drizzle Kit (`drizzle-kit generate` + `drizzle-kit migrate`)
- **Approach:** Forward-only migrations. Each migration is a numbered SQL file in `packages/db/drizzle/`.
- **Deployment:** `pnpm db:migrate` runs before app restart in deploy script.
- **Rollback:** Manual reverse migration SQL prepared for critical changes. Most changes are additive (add column, add table) — no destructive migrations without review.
- **Seed data:** `pnpm db:seed` creates platform admin user, demo tenant with sample products.

## 5. API Design

### 5.1 API overview

**Convention:** All API routes prefixed with `/api/`. Server Actions used for admin mutations. REST API for storefront (public, cacheable).

**Pagination standard (all list endpoints):**

```typescript
// Admin list endpoints — offset-based (for page numbers in DataTable)
GET /api/products?page=1&limit=20&status=active&categoryId=xxx&search=口罩
Response: {
  data: [...],
  pagination: { total: 150, page: 1, limit: 20, totalPages: 8 }
}

// Storefront list endpoints — cursor-based (for infinite scroll)
GET /api/shop/:slug/products?cursor=xxx&limit=20&categoryId=xxx
Response: {
  data: [...],
  pagination: { hasMore: true, nextCursor: "product-uuid-last" }
}
```

Default `limit`: 20. Max `limit`: 100. Cursor is the last item's ID.

| # | Method | Path | Purpose | Auth | App | Priority |
|---|---|---|---|---|---|---|
| **Auth** | | | | | | |
| 1 | POST | `/api/auth/login` | Login (email/phone + password) | Public | All | P0 |
| 2 | POST | `/api/auth/register` | Register new customer | Public | Storefront | P0 |
| 3 | POST | `/api/auth/logout` | Logout | Authenticated | All | P0 |
| 4 | GET | `/api/auth/session` | Get current session | Authenticated | All | P0 |
| **Platform Admin** | | | | | | |
| 5 | GET | `/api/platform/tenants` | List all merchants | Platform Admin | Admin | P0 |
| 6 | POST | `/api/platform/tenants` | Create merchant | Platform Admin | Admin | P0 |
| 7 | PATCH | `/api/platform/tenants/:id` | Update merchant status | Platform Admin | Admin | P0 |
| 8 | GET | `/api/platform/stats` | Platform-wide stats | Platform Admin | Admin | P0 |
| **Products** | | | | | | |
| 9 | GET | `/api/products` | List products (with filters) | Merchant+ | Admin | P0 |
| 10 | POST | `/api/products` | Create product | Merchant+ | Admin | P0 |
| 11 | GET | `/api/products/:id` | Get product detail | Merchant+ | Admin | P0 |
| 12 | PATCH | `/api/products/:id` | Update product | Merchant+ | Admin | P0 |
| 13 | DELETE | `/api/products/:id` | Soft-delete product | Merchant+ | Admin | P0 |
| 14 | PATCH | `/api/products/batch-status` | Batch list/delist | Merchant+ | Admin | P0 |
| 15 | POST | `/api/products/:id/variants` | Add variant to product | Merchant+ | Admin | P0 |
| 16 | PATCH | `/api/products/:id/variants/:vid` | Update variant | Merchant+ | Admin | P0 |
| **Categories** | | | | | | |
| 17 | GET | `/api/categories` | List categories (tree) | Merchant+ | Admin | P0 |
| 18 | POST | `/api/categories` | Create category | Merchant+ | Admin | P0 |
| 19 | PATCH | `/api/categories/:id` | Update category | Merchant+ | Admin | P0 |
| 20 | DELETE | `/api/categories/:id` | Delete category | Merchant+ | Admin | P0 |
| **Orders** | | | | | | |
| 21 | GET | `/api/orders` | List orders (with status filter) | Merchant+/Cashier | Admin | P0 |
| 22 | GET | `/api/orders/:id` | Get order detail | Merchant+/Cashier | Admin | P0 |
| 23 | POST | `/api/orders` | Create order (cashier POS) | Cashier+ | Admin | P0 |
| 24 | PATCH | `/api/orders/:id/status` | Update order status | Cashier+ | Admin | P0 |
| 25 | POST | `/api/orders/:id/refund` | Process refund | Merchant+ | Admin | P0 |
| **Payments** | | | | | | |
| 26 | POST | `/api/orders/:id/payment` | Record payment | Cashier+ | Admin | P0 |
| **Dashboard** | | | | | | |
| 27 | GET | `/api/dashboard/stats` | Today's stats (orders, sales, refunds) | Merchant+ | Admin | P0 |
| 28 | GET | `/api/dashboard/cashier-summary` | Cashier shift summary | Cashier | Admin | P0 |
| **Settings** | | | | | | |
| 29 | GET | `/api/settings` | Get shop settings | Merchant+ | Admin | P0 |
| 30 | PATCH | `/api/settings` | Update shop settings | Merchant Owner | Admin | P0 |
| **Staff** | | | | | | |
| 31 | GET | `/api/staff` | List staff accounts | Merchant Owner | Admin | P0 |
| 32 | POST | `/api/staff` | Create staff (cashier/accountant) | Merchant Owner | Admin | P0 |
| 33 | PATCH | `/api/staff/:id` | Update staff | Merchant Owner | Admin | P0 |
| **Storefront (public)** | | | | | | |
| 34 | GET | `/api/shop/:slug` | Get shop info | Public | Storefront | P0 |
| 35 | GET | `/api/shop/:slug/categories` | Get shop categories | Public | Storefront | P0 |
| 36 | GET | `/api/shop/:slug/products` | Get shop products (by category) | Public | Storefront | P0 |
| 37 | GET | `/api/shop/:slug/products/:id` | Get product detail + variants | Public | Storefront | P0 |
| 38 | POST | `/api/shop/:slug/orders` | Place order (customer) | Public/Customer | Storefront | P0 |
| 39 | GET | `/api/shop/:slug/orders/:id` | Get order status | Customer | Storefront | P0 |
| **Trial & Referral** | | | | | | |
| 40 | POST | `/api/trial/signup` | Free trial signup | Public | Landing | P0 |
| 41 | GET | `/api/promoter/referrals` | List referrals | Promoter | Admin | P1 |
| 42 | POST | `/api/promoter/referral-link` | Generate referral link | Promoter | Admin | P1 |
| 43 | GET | `/api/promoter/commissions` | Commission dashboard | Promoter | Admin | P1 |

### 5.2 Key API contracts

**POST `/api/orders` — Create order (Cashier POS)**
```typescript
// Request
{
  items: [
    { productId: "uuid", variantId: "uuid|null", quantity: 2 },
    { productId: "uuid", variantId: null, quantity: 1 }
  ],
  deliveryMethod: "pickup",
  payment: { method: "cash", amount: 236.00 },
  customerId?: "uuid",  // optional — walk-in has no customer
  note?: "string"
}

// Response 201
{
  id: "uuid",
  orderNumber: "ORD-20260322-A7K3M2",
  status: "completed",  // cash = immediate completion
  items: [...],
  subtotal: 236.00,
  discount: 0,
  surcharge: 0,
  total: 236.00,
  payments: [{ method: "cash", amount: 236.00, status: "completed" }],
  createdAt: "2026-03-22T14:30:00Z"
}

// Error 409 — stock insufficient
{
  error: {
    code: "INSUFFICIENT_STOCK",
    message: "Not enough stock for 1 item(s)",
    details: {
      items: [{ productId: "uuid", variantId: "uuid", requested: 2, available: 1 }]
    }
  }
}
```

**Stock decrement strategy (atomic, race-condition safe):**
```sql
-- Inside a single DB transaction:
-- Step 1: Atomic decrement with guard (prevents negative stock)
UPDATE variants
SET stock = stock - $quantity
WHERE id = $variantId
  AND tenant_id = $tenantId
  AND (stock IS NULL OR stock >= $quantity)  -- NULL = unlimited
RETURNING stock;

-- If no rows returned → stock insufficient → ROLLBACK → return 409
-- If rows returned → proceed to INSERT order + order_items
-- Step 2: INSERT order, order_items, payment
-- Step 3: COMMIT

-- This is a single transaction — no race condition possible.
-- FOR UPDATE lock is implicit in UPDATE statement.
```

**POST `/api/shop/:slug/orders` — Place order (Customer storefront)**
```typescript
// Request
{
  items: [
    { productId: "uuid", variantId: "uuid", quantity: 1 }
  ],
  deliveryMethod: "pickup",
  customerPhone: "+853XXXXXXXX",
  note?: "string"
}

// Response 201
{
  id: "uuid",
  orderNumber: "ORD-20260322-B9X4P1",
  status: "pending",  // awaits merchant confirmation
  total: 59.00,
  createdAt: "2026-03-22T15:00:00Z"
}

// Same stock decrement strategy applies.
// After successful order → trigger SSE notification to merchant (§8.6).
```

**GET `/api/dashboard/stats` — Dashboard statistics**
```typescript
// Response 200
{
  today: {
    orderCount: 10,
    salesTotal: 1083.00,
    refundCount: 0,
    refundTotal: 0,
    netRevenue: 1083.00
  },
  yesterday: {
    orderCount: 10,
    salesTotal: 1720.00
  },
  comparison: {
    ordersDelta: 0,          // percentage change
    salesDelta: -37.03
  }
}
```

**POST `/api/trial/signup` — Free trial**
```typescript
// Request
{
  shopName: "測試咖啡店",
  ownerName: "陳先生",
  email: "chen@example.com",
  phone: "+853XXXXXXXX",
  referralCode?: "PROMO-ABC123"
}

// Response 201
{
  tenantId: "uuid",
  slug: "test-coffee-shop",
  loginEmail: "chen@example.com",
  trialEndsAt: "2026-04-05T23:59:59Z",
  message: "Trial account created. Check your email for login details."
}
```

### 5.3 Scenario-to-API mapping

| Scenario (from §2.4) | API call(s) | Covered? |
|---|---|---|
| AT-001: Platform admin creates merchant | `POST /api/platform/tenants` | ✅ |
| AT-002: Merchant sets up shop | `PATCH /api/settings` | ✅ |
| AT-003: Merchant creates category | `POST /api/categories` | ✅ |
| AT-004: Merchant adds simple product | `POST /api/products` | ✅ |
| AT-005: Merchant adds product with variants | `POST /api/products` + `POST /api/products/:id/variants` (×3) | ✅ |
| AT-006: Merchant edits product price | `PATCH /api/products/:id` | ✅ |
| AT-007: Merchant batch delists | `PATCH /api/products/batch-status` | ✅ |
| AT-008: Customer browses by category | `GET /api/shop/:slug/products?categoryId=` | ✅ |
| AT-009: Customer selects variant, adds to cart | Client-side (Zustand) — no API | ✅ |
| AT-010: Customer modifies cart | Client-side (Zustand) — no API | ✅ |
| AT-011: Customer places order | `POST /api/shop/:slug/orders` | ✅ |
| AT-012: Cashier finds product by search | `GET /api/products?search=853` | ✅ |
| AT-013: Cashier creates order with cash | `POST /api/orders` | ✅ |
| AT-014: Cashier processes refund | `POST /api/orders/:id/refund` | ✅ |
| AT-015: Merchant views dashboard | `GET /api/dashboard/stats` | ✅ |
| AT-016: Merchant adds cashier account | `POST /api/staff` | ✅ |
| AT-017: Customer switches language | Client-side (next-intl) — no API | ✅ |
| AT-018: Customer sees out-of-stock | `GET /api/shop/:slug/products` returns stock info | ✅ |
| AT-019: Customer scans QR | QR encodes `/{locale}/shop/{slug}` URL | ✅ |
| AT-020: Merchant configures payment methods | `PATCH /api/settings` | ✅ |
| AT-021: Tenant isolation | All APIs filter by `tenant_id` via Drizzle middleware | ✅ |
| AT-022: Cashier shift summary | `GET /api/dashboard/cashier-summary` | ✅ |
| AT-023: Potential customer views landing | Static page — no API | ✅ |
| AT-024: Start free trial | `POST /api/trial/signup` | ✅ |
| AT-025-027: Promoter referrals | `POST /api/promoter/referral-link` + `GET /api/promoter/referrals` | ✅ |
| AT-028-029: Accountant reports | `GET /api/dashboard/stats` + role check | ✅ |
| AT-030: Trial expiry | Middleware checks `trial_ends_at` | ✅ |

**All 30 acceptance test scenarios are covered by the API design.** ✅

### Phase 2 Sign-off

**Phase:** 2 — Data Model & API Design
**Deliverables:** ER diagram, 11 Drizzle schema tables, 22 indexes, migration strategy, 43 API endpoints, key API contracts, full scenario-to-API mapping (30/30 covered)
**Active persona:** Database Optimizer + Data Engineer
**Decision required:** Do you approve the data model and API design?

- [x] Approved — proceed to Phase 3 (Full Architecture Design) ✅ 2026-03-22

**User notes:**
Approved.

---

## 6. System Architecture

🎭 **Active: Backend Architect + Frontend Developer**

### 6.1 Architecture overview

**Pattern:** Monorepo with 3 Next.js apps sharing packages, deployed on a single Alibaba Cloud ECS instance.

```
┌─────────────────────────────────────────────────────────┐
│                    Cloudflare DNS                        │
│    pos.mo / admin.pos.mo / shop.pos.mo                  │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│              Alibaba Cloud ECS (Hong Kong)               │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Caddy (reverse proxy + auto-SSL)                 │   │
│  │                                                    │   │
│  │  pos.mo          → Landing  :3003                  │   │
│  │  admin.pos.mo    → Admin    :3001                  │   │
│  │  shop.pos.mo     → Store    :3002                  │   │
│  │  */uploads/*     → /uploads/ (static)              │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  PM2 Ecosystem                                     │  │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────────┐  │  │
│  │  │ Landing    │ │ Admin      │ │ Storefront      │  │  │
│  │  │ :3003      │ │ :3001      │ │ :3002           │  │  │
│  │  │ (SSG)      │ │ (SSR+API)  │ │ (SSR+API)      │  │  │
│  │  └────────────┘ └─────┬──────┘ └───────┬────────┘  │  │
│  │                       │                │            │  │
│  │                ┌──────▼────────────────▼──────┐     │  │
│  │                │  @macau-pos/db (Drizzle)      │     │  │
│  │                │  @macau-pos/auth (Auth.js)    │     │  │
│  │                │  @macau-pos/ui (shadcn/ui)    │     │  │
│  │                │  @macau-pos/utils             │     │  │
│  │                │  @macau-pos/i18n              │     │  │
│  │                └──────────────┬───────────────┘     │  │
│  └───────────────────────────────┼─────────────────────┘  │
│                                  │                        │
│  ┌───────────────────────────────▼──────────────────────┐ │
│  │  PostgreSQL 16 (:5432)                                │ │
│  │  Row-Level Security enabled                           │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                          │
│  /uploads/  ← product images (local disk)                │
│  cron: pg_dump → Alibaba OSS daily                       │
└──────────────────────────────────────────────────────────┘
```

### 6.2 Request flow

**Admin — Merchant creates a product:**
```
Browser → Caddy (admin.pos.mo) → Next.js Admin :3001
  → Auth.js middleware (verify session + role)
  → Drizzle tenant middleware (inject tenant_id)
  → Server Action: createProduct()
    → Validate input (zod)
    → Upload image to /uploads/
    → INSERT into products + variants
    → Revalidate product cache
  → Return success → UI updates via TanStack Query
```

**Storefront — Customer places order:**
```
Mobile Browser → Caddy (shop.pos.mo) → Next.js Storefront :3002
  → SSR: load shop info + products (cached)
  → Client: browse → add to cart (Zustand, localStorage)
  → POST /api/shop/:slug/orders
    → Validate cart items exist + in stock
    → DB transaction:
      → INSERT order + order_items
      → Decrement variant stock (if tracked)
      → INSERT payment record (if cash POS)
    → Return order confirmation
  → UI: show order status page
```

### 6.3 Component communication

```
Landing ──(link)──▶ Admin (trial signup → redirect to admin login)
Landing ──(link)──▶ Storefront (demo shop link)
Admin   ──(link)──▶ Storefront (QR code preview, "View my shop")
Storefront ──(shared DB)──▶ Admin (orders appear in merchant dashboard)

All 3 apps share:
  @macau-pos/db     → same Drizzle schema, same DB connection
  @macau-pos/auth   → same Auth.js config, shared session
  @macau-pos/ui     → same component library
  @macau-pos/i18n   → same translations
  @macau-pos/utils  → same helpers
```

## 7. Frontend Architecture

### 7.1 App-specific responsibilities

| App | URL | Purpose | Rendering | Key pages |
|---|---|---|---|---|
| **Landing** | pos.mo | Marketing, pricing, trial signup | SSG (static) | Home, Features, Pricing, Trial signup |
| **Admin** | admin.pos.mo | Merchant dashboard, platform admin, promoter portal | SSR + Client | Dashboard, Products, Orders, Members, Reports, Settings |
| **Storefront** | shop.pos.mo/[slug] | Customer ordering | SSR + Client | Shop home, Product detail, Cart, Checkout, Order status |

### 7.2 Component hierarchy (Admin)

```
AdminLayout
├── Sidebar
│   ├── NavGroup (商品, 訂單, 會員, ...)
│   │   └── NavItem (active state, icon, label)
│   └── TenantSwitcher (for accountants)
├── Header
│   ├── Breadcrumbs
│   ├── SearchCommand (Cmd+K global search)
│   ├── NotificationBell
│   ├── LanguageSwitcher
│   └── UserMenu (profile, logout)
└── MainContent
    ├── PageHeader (title, action buttons)
    └── PageContent
        ├── DataTable (products, orders — with filters, sort, pagination)
        ├── FormDialog (create/edit modals)
        └── StatsCards (dashboard KPIs)
```

### 7.3 Component hierarchy (Storefront)

```
StorefrontLayout
├── ShopHeader
│   ├── ShopLogo + ShopName
│   ├── AnnouncementBanner
│   ├── LanguageSwitcher (zh-TW / EN / PT)
│   └── MyOrdersButton
├── MainContent
│   ├── CategorySidebar (scrollable, sticky)
│   └── ProductGrid
│       └── ProductCard
│           ├── ProductImage
│           ├── ProductName + Price
│           └── AddButton / VariantButton
├── VariantSheet (bottom sheet modal)
│   ├── VariantSelector (tag chips)
│   ├── QuantityControl (- N +)
│   └── AddToCartButton
├── CartSheet (slide-up from bottom)
│   ├── CartItemList
│   │   └── CartItem (name, variant, qty, subtotal, remove)
│   ├── CartSummary (subtotal, total)
│   └── CheckoutButton
└── BottomBar (fixed)
    ├── PhoneButton
    ├── CartButton (with badge count)
    └── PickupOrderButton
```

### 7.4 State management

| State | Tool | Scope | Persistence |
|---|---|---|---|
| **Auth session** | Auth.js | Server + Client | HTTP-only cookie |
| **Cart** | Zustand | Client (Storefront) | localStorage (per-shop slug) |
| **Product list** | TanStack Query | Client | In-memory cache (5min stale) |
| **Order list** | TanStack Query | Client | In-memory cache (30s stale, auto-refetch) |
| **Dashboard stats** | TanStack Query | Client | In-memory cache (60s stale) |
| **UI state** (sidebar open, active tab) | Zustand | Client | None (reset on reload) |
| **Language** | next-intl | Server + Client | URL locale prefix + cookie |
| **Form state** | React Hook Form + Zod | Client | None |

### 7.5 Routing

**Admin** (`apps/admin/src/app/[locale]/`)
```
(auth)/login                    → Login page
(auth)/register                 → Register (potential customer)
(auth)/forgot-password          → Password reset

(dashboard)/                    → Dashboard (redirect based on role)
(dashboard)/products/           → Product list
(dashboard)/products/new        → Create product
(dashboard)/products/[id]       → Edit product
(dashboard)/orders/             → Order list (tabs: all/pending/completed/refunded)
(dashboard)/orders/[id]         → Order detail
(dashboard)/settings/           → Shop settings
(dashboard)/settings/staff      → Staff management
(dashboard)/settings/payments   → Payment methods

(platform)/                     → Platform overview
(platform)/merchants/           → Merchant list
(platform)/merchants/[id]       → Merchant detail
(platform)/promoters/           → Promoter list

(promoter)/                     → Promoter dashboard
(promoter)/referrals/           → Referral list
(promoter)/commissions/         → Commission report
```

**Storefront** (`apps/storefront/src/app/[locale]/`)
```
shop/[slug]/                    → Shop home (products by category)
shop/[slug]/product/[id]        → Product detail
shop/[slug]/cart                 → Cart page
shop/[slug]/checkout             → Checkout
shop/[slug]/orders/[id]          → Order status
```

**Landing** (`apps/landing/src/app/[locale]/`)
```
/                               → Landing page
/features                       → Feature showcase
/pricing                        → Pricing plans
/trial                          → Free trial signup
```

### 7.6 Key UI patterns

| Pattern | Implementation | Used in |
|---|---|---|
| **Data tables** | shadcn/ui DataTable + TanStack Table | Product list, Order list, Staff list |
| **Command palette** | shadcn/ui Command (Cmd+K) | Global search in Admin |
| **Sheet/Drawer** | shadcn/ui Sheet | Variant selector, Cart in Storefront |
| **Toast notifications** | shadcn/ui Sonner | Success/error feedback everywhere |
| **Form validation** | React Hook Form + Zod | All forms |
| **Optimistic updates** | TanStack Query mutation + onMutate | Product status toggle, order status change |
| **Infinite scroll** | TanStack Query useInfiniteQuery | Product list in Storefront |
| **Skeleton loading** | shadcn/ui Skeleton | All data-fetching pages |
| **Responsive sidebar** | Sheet on mobile, fixed on desktop | Admin sidebar |
| **Bottom sheet** | Custom Sheet variant | Storefront variant selector, cart |
| **Order notification sound** | SSE EventSource + Audio API | Admin dashboard — plays 🔔 on new order |
| **Barcode scan input** | Hidden input field, USB scanner acts as keyboard | Cashier POS — auto-search on barcode scan |

### 7.7 Empty states

Every list view must handle the "zero data" case with a helpful illustration + CTA.

| Page | Empty state message | CTA |
|---|---|---|
| Products (first time) | "還沒有商品，新增你的第一個商品吧！" / "No products yet" | → "新增商品" button |
| Products (filtered, no results) | "沒有符合條件的商品" / "No matching products" | → Clear filters |
| Orders (no orders today) | "今天還沒有訂單" / "No orders today" | — (informational) |
| Categories (none created) | "建立分類來整理你的商品" / "Create categories to organize products" | → "新增分類" button |
| Staff (no staff) | "新增收銀員讓員工可以操作POS" / "Add cashiers so staff can use the POS" | → "新增員工" button |
| Storefront (shop has no products) | "此商店尚未上架商品" / "This shop has no products yet" | — (customer-facing) |
| Cart (empty) | "購物車是空的" / "Your cart is empty" | → "繼續購物" button |
| Promoter referrals (none) | "還沒有推薦記錄" / "No referrals yet" | → "生成推薦連結" button |

### 7.8 Onboarding wizard (new merchant)

After first login (trial or admin-created), merchant sees a step-by-step setup wizard:

```
Step 1: Shop Info (required)
  → Shop name, address, phone, business hours
  → "下一步" →

Step 2: Add Your First Category (recommended)
  → Quick-add 3-5 common categories
  → "跳過" or "下一步" →

Step 3: Add Your First Product (recommended)
  → Simplified product form (name, price, image)
  → "跳過" or "下一步" →

Step 4: Configure Payment Methods (required)
  → Toggle: 現金 ✅ / MPAY ☐
  → "完成設定" →

→ Redirect to dashboard with confetti 🎉
→ Show "Quick Start Guide" card on dashboard for first 7 days
```

Wizard state tracked in `tenants.onboarding_completed` boolean field. Skip button available on optional steps.

### 7.9 Error states

| Error scenario | UI behavior |
|---|---|
| **Network error (API call fails)** | Toast: "網絡錯誤，請重試" + Retry button. Page content stays (stale data from cache). |
| **Checkout fails (stock insufficient)** | Dialog: "以下商品庫存不足" + list of items + "返回購物車" button. Cart updated with available stock. |
| **Checkout fails (server error)** | Dialog: "下單失敗，請重試" + Retry button. Cart preserved. No duplicate order risk (idempotency key). |
| **Session expired** | Redirect to login page. Preserve current URL as `?redirect=` param. |
| **Permission denied (wrong role)** | Redirect to dashboard with toast: "您沒有權限訪問此頁面" |
| **404 (product/order not found)** | Standard 404 page: "找不到此頁面" + "返回首頁" link |

## 8. Backend Architecture

### 8.1 Request processing pipeline

```
Request
  │
  ▼
Caddy (SSL termination, routing by subdomain)
  │
  ▼
Next.js App (admin/storefront/landing)
  │
  ├── Static assets → served directly (/_next/static/)
  │
  ├── Pages (SSR/SSG)
  │   └── React Server Components → Drizzle queries → HTML
  │
  └── API routes / Server Actions
      │
      ▼
  Auth.js Middleware
  ├── Verify session (JWT from cookie)
  ├── Check role (platform_admin / merchant_owner / cashier / ...)
  └── Reject if unauthorized → 401/403
      │
      ▼
  Tenant Middleware (Drizzle)
  ├── Extract tenant_id from session
  ├── Inject into all Drizzle queries
  └── PostgreSQL RLS as second layer
      │
      ▼
  Input Validation (Zod)
  ├── Parse + validate request body/params
  └── Return 400 with field-level errors if invalid
      │
      ▼
  Business Logic
  ├── Drizzle queries (auto-filtered by tenant_id)
  ├── DB transactions for multi-step operations
  ├── File uploads to /uploads/
  └── Side effects (email, cache invalidation)
      │
      ▼
  Response
  ├── Success: 200/201 with JSON
  ├── Client error: 400/401/403/404 with error code
  └── Server error: 500 with generic message (details logged)
```

### 8.2 Middleware stack

```typescript
// Execution order for API routes:
1. Caddy            → SSL, routing, rate limiting (100 req/s per IP)
2. Next.js          → Parse request, match route
3. next-intl        → Detect/set locale
4. Auth.js          → Verify session, extract user + role
5. roleGuard()      → Check user.role against route requirements
6. tenantMiddleware()→ Inject tenant_id, configure Drizzle scoping
7. zodValidation()  → Validate request body against schema
8. handler()        → Business logic
9. auditLog()       → Log mutations to audit_logs table
```

### 8.3 Error handling

```typescript
// Consistent error response format across all 3 apps
{
  error: {
    code: "PRODUCT_NOT_FOUND",        // machine-readable
    message: "Product not found",      // human-readable
    details?: {                        // optional field-level errors
      name: "Name is required",
      price: "Price must be positive"
    }
  }
}

// HTTP status codes used:
// 200 — Success
// 201 — Created
// 400 — Validation error (bad input)
// 401 — Not authenticated
// 403 — Not authorized (wrong role or wrong tenant)
// 404 — Not found
// 409 — Conflict (optimistic lock version mismatch)
// 429 — Rate limited
// 500 — Internal server error
```

### 8.4 Caching strategy

| Data | Cache location | TTL | Invalidation |
|---|---|---|---|
| Shop info (name, logo, hours) | Next.js ISR | 5 min | `revalidateTag('shop:slug')` on settings update |
| Product list (storefront) | Next.js ISR | 2 min | `revalidateTag('products:tenantId')` on product change |
| Categories | Next.js ISR | 10 min | `revalidateTag('categories:tenantId')` |
| Dashboard stats | TanStack Query | 60s | Auto-refetch on window focus |
| Order list (admin) | TanStack Query | 30s | Auto-refetch, plus manual refetch on status change |
| Auth session | HTTP-only cookie | 30 days | Cleared on logout |
| Cart | localStorage | Permanent | Cleared on checkout complete |
| Static assets | Caddy headers | 1 year | Content-hashed filenames |
| Product images | Caddy headers | 30 days | Filename includes content hash |

### 8.4.1 Image processing pipeline

**Problem:** Merchants upload raw phone photos (3-5MB). Loading 20 products × 4MB = 80MB on mobile.

**Solution:** Process images on upload using `sharp` (free Node.js library).

```
Upload flow:
  1. Merchant uploads image via product form
  2. Server receives file (max 5MB, jpg/png/webp only — validated by Zod)
  3. sharp processes the image into 3 sizes:
     - thumb:  200×200  WebP ~10KB  (product grid, cart)
     - medium: 600×600  WebP ~40KB  (product detail)
     - full:   1200×1200 WebP ~100KB (zoom/modal)
  4. Save to /uploads/{tenantId}/{productId}/
     - thumb.webp
     - medium.webp
     - full.webp
  5. Store path prefix in products.image field
  6. Caddy serves with Cache-Control: public, max-age=2592000

Storage per product: ~150KB (vs 4MB raw) = 96% reduction
1000 products = ~150MB (fits easily on 40GB ECS disk)
```

**Storefront usage:**
```tsx
// Product grid (list view) — uses thumbnail
<Image src={`/uploads/${product.image}/thumb.webp`} width={200} height={200} />

// Product detail — uses medium
<Image src={`/uploads/${product.image}/medium.webp`} width={600} height={600} />
```

**Cost:** $0 — `sharp` is MIT licensed, runs on same ECS. No external service.

### 8.5 Background processing

| Task | Trigger | Implementation |
|---|---|---|
| Daily DB backup | Cron (2:00 AM HKT) | `scripts/backup.sh` — pg_dump → gzip → upload to OSS |
| Trial expiry check | Cron (daily 00:00) | Node script: find expired trials → update status → send email |
| Image cleanup | Cron (weekly) | Remove orphaned images in /uploads/ not referenced by any product |
| Order number generation | On order create | `ORD-{YYYYMMDD}-{random 6 chars}` — human-readable, no sequence needed |

### 8.6 Real-time order notifications (SSE)

**Problem:** Merchants/cashiers need instant notification when a customer places an order. Polling at 30s is too slow for pickup-order flow.

**Solution:** Server-Sent Events (SSE) — lightweight, unidirectional, no WebSocket complexity.

```
Architecture:
  Admin app ←── SSE connection ←── /api/events/orders (per tenant)

Flow:
  1. Admin/cashier opens dashboard → browser opens EventSource to /api/events/orders
  2. Customer places order via storefront → POST /api/shop/:slug/orders
  3. Order creation handler → write to in-memory event bus (per tenant_id)
  4. SSE endpoint → push event to connected admin clients for that tenant
  5. Admin client receives event → play notification sound 🔔 → show toast → refetch order list

Implementation:
  - In-memory Map<tenantId, Set<Response>> on the Admin app server
  - On order creation: POST from storefront → internal HTTP call to admin /api/internal/notify
  - SSE endpoint: long-lived GET /api/events/orders (auth required, tenant-scoped)
  - Heartbeat every 30s to keep connection alive
  - Auto-reconnect on client via EventSource (built-in)
  - Graceful degradation: if SSE fails, TanStack Query polling (30s) still works as fallback
```

**Cost:** $0 — native browser API, no third-party service. Runs on same ECS.

## 9. Integration Architecture

### 9.1 Third-party integrations (Build Phase 1)

| Integration | Purpose | Approach |
|---|---|---|
| **Brevo (email)** | Trial confirmation, password reset | Nodemailer SMTP → Brevo relay (300/day free) |
| **QR code** | Storefront access via QR | `qrcode` npm package, generate on admin side |
| **Web Serial API** | Receipt printing | Browser-native, ESC/POS commands to USB thermal printer |

### 9.2 Internal integration between apps

All 3 apps connect to the **same PostgreSQL database** via `@macau-pos/db` package. No inter-app API calls needed — data consistency is guaranteed by the shared database.

Auth sessions are shared via the `@macau-pos/auth` package — same cookie domain (`.pos.mo`), same JWT secret. User logs into `admin.pos.mo`, session is valid on `shop.pos.mo` too.

## 10. Security Design

### 10.1 Authentication

| Aspect | Implementation |
|---|---|
| **Strategy** | Auth.js v5 with Credentials provider (phone/email + bcrypt password) |
| **Session** | JWT stored in HTTP-only, Secure, SameSite=Lax cookie on `.pos.mo` domain |
| **Session lifetime** | 30 days, refreshed on activity |
| **Password hashing** | bcrypt with cost factor 12 |
| **Password policy** | Minimum 8 chars, at least 1 letter + 1 number |
| **Brute force protection** | Caddy rate limit: 10 login attempts per IP per minute |
| **Session payload** | `{ userId, tenantId, role, name }` — minimal, no sensitive data |

### 10.2 Authorization (RBAC)

```typescript
// Role permissions matrix
const permissions = {
  platform_admin:   ['platform.*', 'tenant.*'],
  merchant_owner:   ['product.*', 'order.*', 'staff.*', 'settings.*', 'dashboard.*', 'report.*'],
  cashier:          ['product.read', 'order.*', 'dashboard.cashier'],
  accountant:       ['report.*', 'order.read', 'dashboard.read'],
  promoter:         ['referral.*', 'commission.read'],
  customer:         ['shop.read', 'order.create', 'order.read.own'],
  potential_customer: ['landing.read', 'trial.create'],
};

// Middleware checks role against route:
// (dashboard)/* → requires merchant_owner | cashier | accountant
// (platform)/*  → requires platform_admin
// (promoter)/*  → requires promoter
// shop/*        → public (no auth required for browsing)
```

### 10.3 Multi-tenant security (defense in depth)

```
Layer 1: Auth.js session
  → JWT contains tenantId
  → User can only have one tenantId

Layer 2: Drizzle middleware
  → Automatically appends WHERE tenant_id = ? to ALL queries
  → Automatically sets tenant_id on all INSERTs
  → Cannot be bypassed by application code

Layer 3: PostgreSQL Row-Level Security
  → RLS policy: tenant_id = current_setting('app.tenant_id')
  → Even raw SQL cannot access other tenant's data
  → Set via: SET LOCAL app.tenant_id = 'uuid' per transaction

Layer 4: API route guards
  → Explicit role checks before handler execution
  → Accountant role blocks all write operations
  → Cashier role blocks settings/staff modifications
```

### 10.4 Input validation

```typescript
// All API inputs validated with Zod schemas
// Example: Create product
const createProductSchema = z.object({
  name: z.string().min(1).max(255),
  categoryId: z.string().uuid().optional(),
  originalPrice: z.number().positive().multipleOf(0.01),
  sellingPrice: z.number().positive().multipleOf(0.01),
  code: z.string().max(50).optional(),
  barcode: z.string().max(50).optional(),
  hasVariants: z.boolean().default(false),
  variants: z.array(z.object({
    name: z.string().min(1).max(255),
    price: z.number().positive().multipleOf(0.01),
    sku: z.string().max(50).optional(),
    stock: z.number().int().nonnegative().optional(),
  })).optional(),
});

// XSS prevention: React escapes all output by default
// SQL injection: Drizzle parameterized queries
// CSRF: SameSite=Lax cookie + custom header check for API mutations
// File upload: validate MIME type, max 5MB, images only (jpg/png/webp)
```

### 10.5 Data protection

| Concern | Measure |
|---|---|
| **Passwords** | bcrypt hash, never stored in plain text, never logged |
| **Sessions** | HTTP-only cookie, Secure flag, SameSite=Lax |
| **API keys** | Stored in `.env`, never in code or client bundle |
| **PII** | Minimal collection (name, phone, email). No ID cards, no payment card numbers (MPAY handles that) |
| **Backups** | pg_dump encrypted at rest on Alibaba OSS |
| **HTTPS** | Caddy auto-SSL on all 3 subdomains. HSTS header. |
| **Audit trail** | All mutations logged with user, action, entity, timestamp |

## 11. Scenario Coverage Check

| Scenario | Frontend | API | Backend | DB | Covered? |
|---|---|---|---|---|---|
| AT-001: Admin creates merchant | Platform admin form | POST /api/platform/tenants | Create tenant + owner user | tenants, users | ✅ |
| AT-002: Merchant sets up shop | Settings form | PATCH /api/settings | Update shop_settings | shop_settings | ✅ |
| AT-003: Create category | Category form | POST /api/categories | Insert with tenant_id | categories | ✅ |
| AT-004: Add product | Product form | POST /api/products | Insert + image upload | products | ✅ |
| AT-005: Add product with variants | Product form + variant sub-form | POST /api/products + variants | Insert product + N variants | products, variants | ✅ |
| AT-006: Edit product price | Edit form | PATCH /api/products/:id | Update with version check | products | ✅ |
| AT-007: Batch delist | Checkbox + batch action | PATCH /api/products/batch-status | Update N products | products | ✅ |
| AT-008: Browse by category | CategorySidebar + ProductGrid | GET /api/shop/:slug/products | Filter by category_id + tenant | products, categories | ✅ |
| AT-009: Select variant + cart | VariantSheet + Zustand | Client-side only | — | — | ✅ |
| AT-010: Modify cart | CartSheet + Zustand | Client-side only | — | — | ✅ |
| AT-011: Place order | Checkout page | POST /api/shop/:slug/orders | Transaction: order + items + stock | orders, order_items, variants | ✅ |
| AT-012: Search product | SearchCommand (Cmd+K) | GET /api/products?search= | PostgreSQL FTS | products (GIN index) | ✅ |
| AT-013: Cash order | POS interface | POST /api/orders | Transaction: order + payment | orders, payments | ✅ |
| AT-014: Process refund | Refund dialog | POST /api/orders/:id/refund | Insert refund + update order | refunds, orders | ✅ |
| AT-015: Dashboard | StatsCards + Charts | GET /api/dashboard/stats | Aggregation queries | orders, payments | ✅ |
| AT-016: Add cashier | Staff form | POST /api/staff | Create user with cashier role | users | ✅ |
| AT-017: Switch language | LanguageSwitcher | next-intl locale routing | — | — | ✅ |
| AT-018: Out of stock | ProductCard badge | GET /api/shop/:slug/products | Check stock field | products/variants | ✅ |
| AT-019: QR code | QR generator in admin | Static URL encoding | — | — | ✅ |
| AT-020: Configure payments | Settings form | PATCH /api/settings | Update enabled_payment_methods | shop_settings | ✅ |
| AT-021: Tenant isolation | All components | All APIs | Drizzle middleware + RLS | All tables (tenant_id) | ✅ |
| AT-022: Cashier summary | Shift summary card | GET /api/dashboard/cashier-summary | Filter by cashier_id + date | orders | ✅ |
| AT-023: Landing page | Static SSG page | None | None | None | ✅ |
| AT-024: Free trial | Trial signup form | POST /api/trial/signup | Create tenant (trial) + user | tenants, users | ✅ |
| AT-025-027: Promoter | Referral dashboard | GET/POST promoter APIs | Referral tracking | referrals | ✅ |
| AT-028-029: Accountant | Reports (read-only) | GET dashboard/report APIs | Role guard blocks writes | — | ✅ |
| AT-030: Trial expiry | Upgrade banner | Middleware check | Check trial_ends_at | tenants | ✅ |

**All 30 acceptance test scenarios: ✅ fully covered across all layers.**

### Phase 3 Sign-off

**Phase:** 3 — Full Architecture Design
**Deliverables:** System architecture diagram, frontend architecture (3 apps, component hierarchies, state management, routing, UI patterns), backend architecture (request pipeline, middleware stack, error handling, caching, background jobs), integration architecture, security design (auth, RBAC, 4-layer tenant isolation, input validation, data protection), scenario coverage (30/30 ✅)
**Active persona:** Backend Architect + Frontend Developer
**Decision required:** Do you approve the full architecture? After this, "pr" is recommended for Product Review, then Phase 4 (Final Review Package).

- [x] Approved — proceed to Phase 4 (Final Review Package) ✅ 2026-03-22

**User notes:**
Approved after Product Review (pr). 5 major issues addressed: pagination, SSE notifications, atomic stock decrement, empty states + onboarding wizard, image processing pipeline.

---

## 12. Non-Functional Requirements

🎭 **Active: All Personas — Final Review**

### 12.1 Performance targets

| Metric | Target | Measurement | Priority |
|---|---|---|---|
| **Storefront first load (SSR)** | < 1.5s | Time to First Contentful Paint (FCP) on 4G mobile | P0 |
| **Storefront page navigation** | < 300ms | Client-side route transition | P0 |
| **Admin page load** | < 2s | Full page render on desktop | P0 |
| **API response (simple CRUD)** | < 200ms | P95 latency | P0 |
| **API response (dashboard stats)** | < 500ms | Aggregation query P95 | P0 |
| **Image load (product thumbnail)** | < 100ms | Cached WebP via Caddy | P0 |
| **Order creation (full transaction)** | < 500ms | Stock check + insert + payment | P0 |
| **SSE notification delivery** | < 2s | Order created → admin receives event | P1 |
| **Search response** | < 300ms | PostgreSQL FTS query | P0 |
| **Bundle size (storefront)** | < 150KB | Gzipped JS | P1 |
| **Bundle size (admin)** | < 300KB | Gzipped JS (larger due to DataTable, charts) | P1 |
| **Lighthouse score (storefront)** | > 90 | Performance + Accessibility | P1 |

### 12.2 Scalability

| Dimension | Current capacity (ECS t6 2vCPU/2GB) | Upgrade path |
|---|---|---|
| **Concurrent users** | ~100 | Upgrade ECS to c6 4vCPU/8GB → ~500 |
| **Merchants** | ~200 | Row-level tenancy scales linearly with DB size |
| **Products per merchant** | ~10,000 | Indexed queries, pagination. No practical limit. |
| **Orders per day (platform)** | ~5,000 | PostgreSQL handles easily. Add read replica at 50k+/day. |
| **Image storage** | ~20GB on disk | Migrate to Alibaba OSS (unlimited) |
| **SSE connections** | ~200 concurrent | In-memory Map. At 1000+, add Redis pub/sub. |
| **Database size** | ~10GB on 40GB disk | Upgrade disk or move to Alibaba RDS |

**Scaling triggers:**
- CPU consistently > 70% → upgrade ECS tier
- Disk > 75% full → migrate images to OSS, upgrade disk
- SSE connections > 500 → add Redis for pub/sub
- Orders > 50k/day → add PostgreSQL read replica

### 12.3 Monitoring

| What | Tool | Cost | Alert |
|---|---|---|---|
| **Uptime** | Better Stack (free tier) | $0 | Ping 3 URLs (pos.mo, admin.pos.mo, shop.pos.mo) every 3 min. Alert via email/Telegram. |
| **Process health** | PM2 | $0 | Auto-restart on crash. `pm2 monit` for live dashboard. |
| **Error tracking** | Console logs + PM2 log files | $0 | Grep logs for errors. Consider Sentry free tier (5k events/mo) in Phase 2. |
| **DB health** | pg_stat_activity + cron check | $0 | Alert if connection count > 80% of max_connections. |
| **Disk usage** | Cron + df | $0 | Alert if disk > 80% full. |
| **Backup verification** | Cron + check OSS timestamp | $0 | Alert if last backup > 26 hours old. |

### 12.4 Logging

```
Log locations:
  /var/log/macau-pos/
    ├── admin.log        ← PM2 stdout/stderr for admin app
    ├── storefront.log   ← PM2 stdout/stderr for storefront app
    ├── landing.log      ← PM2 stdout/stderr for landing app
    └── caddy.log        ← Caddy access + error logs

Log rotation: PM2 log-rotate module (max 10MB per file, keep 30 days)

Structured logging format (JSON):
{
  "timestamp": "2026-03-22T14:30:00.000Z",
  "level": "info|warn|error",
  "app": "admin|storefront|landing",
  "tenantId": "uuid",
  "userId": "uuid",
  "action": "order.create",
  "duration": 145,
  "status": 201,
  "message": "Order created"
}

What to log:
  ✅ All API requests (method, path, status, duration, tenant)
  ✅ All authentication events (login, logout, failed attempt)
  ✅ All order state transitions
  ✅ All errors with stack traces
  ✅ Slow queries (> 500ms)
  ❌ Never log passwords, tokens, full credit card numbers
  ❌ Never log request bodies containing PII in production
```

## 13. Deployment Plan

### 13.1 Environments

| Environment | URL | Purpose | Infrastructure |
|---|---|---|---|
| **Local dev** | localhost:3001/3002/3003 | Development | Local machine, Docker Compose for PostgreSQL |
| **Staging** | staging.pos.mo / admin.staging.pos.mo | Pre-production testing | Same ECS (separate PM2 processes on :4001/4002/4003) or separate cheap ECS |
| **Production** | pos.mo / admin.pos.mo / shop.pos.mo | Live | Alibaba ECS Hong Kong |

### 13.2 CI/CD

```
GitHub Actions workflow:

on push to main:
  1. Install dependencies (pnpm install)
  2. Lint (eslint)
  3. Type check (tsc --noEmit)
  4. Run tests (vitest)
  5. Build all 3 apps (turbo build)
  6. If all pass → SSH to ECS:
     a. git pull origin main
     b. pnpm install --frozen-lockfile
     c. pnpm db:migrate (Drizzle migrations)
     d. turbo build
     e. pm2 restart all
  7. Health check: curl 3 URLs, verify 200

on pull request:
  1-5 only (no deploy)

Rollback:
  git revert HEAD && git push  → triggers re-deploy
  Or: ssh to ECS → git checkout <previous-sha> → turbo build → pm2 restart
```

### 13.3 Secrets management

```
Secrets stored in:
  ECS: /home/deploy/macau-pos/.env (chmod 600, owned by deploy user)
  GitHub: Repository secrets (for CI/CD SSH key)

.env contents:
  DATABASE_URL=postgresql://pos_user:xxx@localhost:5432/macau_pos
  AUTH_SECRET=xxx                    # Auth.js JWT secret (32+ random chars)
  AUTH_URL=https://admin.pos.mo      # Auth.js callback URL
  BREVO_SMTP_KEY=xxx                 # Email sending
  R2_ACCESS_KEY=xxx                  # Backup storage (optional)
  R2_SECRET_KEY=xxx
  NODE_ENV=production

Never in code:
  ❌ No secrets in git
  ❌ No secrets in Docker images
  ❌ No secrets in client-side code (NEXT_PUBLIC_* only for public values)

Rotation:
  AUTH_SECRET: rotate every 90 days (invalidates all sessions — users re-login)
  DATABASE password: rotate on suspected compromise
  BREVO key: rotate on suspected compromise
```

## 14. Risks & Gaps (consolidated)

| # | Risk | Likelihood | Impact | Mitigation | Status |
|---|---|---|---|---|---|
| 1 | ECS single point of failure | Medium | High | Daily backups + ECS snapshots. Spin up replacement in <30 min. | Accepted |
| 2 | MPAY API availability | Medium | High | Phase 1 uses cash only. Research MPAY in Phase 2. | Deferred |
| 3 | Tenant isolation breach | Low | Critical | 4-layer defense (Auth + Drizzle + RLS + Route guards). Pen testing. | Mitigated |
| 4 | Stock race condition | Low | Medium | Atomic UPDATE in transaction. 409 on conflict. | Resolved (§5.2) |
| 5 | Image storage growth | Low | Low | Local disk for MVP. Migrate to Alibaba OSS at 20GB. | Planned |
| 6 | Trial abuse | Medium | Low | Rate limit by phone. SMS OTP. | Planned |
| 7 | No auto-scaling | Low | Low | POS traffic is predictable. Vertical ECS upgrade is instant. | Accepted |
| 8 | Browser compatibility (Web Serial) | Medium | Low | Receipt printing Chrome-only. Fallback: browser print dialog. | Accepted |
| 9 | Concurrent order modification | Low | Medium | Optimistic locking (version field). 409 on conflict. | Mitigated |
| 10 | Domain/SSL setup complexity | Low | Low | Caddy auto-SSL. Cloudflare DNS free tier. Document setup steps. | Planned |

**No open blockers. All critical risks mitigated.**

## 15. Implementation Phases (Build Phase 1 — build order)

| Step | What to build | Depends on | Effort | Days* |
|---|---|---|---|---|
| **A** | Project scaffold: Turborepo, 3 Next.js apps, shared packages, Drizzle schema, Caddy config, PM2 config | Nothing | Small | 1-2 |
| **B** | Database: full schema, migrations, seed data, tenant middleware, RLS policies | A | Medium | 2-3 |
| **C** | Auth: Auth.js setup, login/register pages, role middleware, session management | A, B | Medium | 2-3 |
| **D** | Landing app: landing page, pricing page, trial signup flow, onboarding wizard | A, B, C | Medium | 2-3 |
| **E** | Admin — Products: category CRUD, product CRUD with variants, image upload + sharp processing, batch operations, search | A, B, C | Large | 4-5 |
| **F** | Storefront — Browsing: shop page, category sidebar, product grid (paginated), product detail, variant selector, search | A, B, E | Medium | 3-4 |
| **G** | Storefront — Cart & Checkout: Zustand cart, cart page, checkout flow, order creation (atomic stock decrement) | F | Medium | 2-3 |
| **H** | Admin — Orders: order list (paginated, status tabs), order detail, status transitions, cash payment recording, refund flow | B, C, G | Medium | 3-4 |
| **I** | Admin — Dashboard: stats cards, today's orders/sales/refunds, comparison to yesterday, Recharts charts | B, C, H | Small | 1-2 |
| **J** | SSE notifications: event bus, SSE endpoint, admin client EventSource, notification sound | H | Small | 1 |
| **K** | Admin — Settings: shop info, payment methods, staff management (CRUD cashier/accountant) | B, C | Medium | 2-3 |
| **L** | Admin — Platform: merchant list, merchant create, merchant status, platform stats | B, C | Medium | 2-3 |
| **M** | Promoter: referral link generation, referral dashboard, commission view | B, C, D | Small | 1-2 |
| **N** | i18n: translations for all 3 apps (zh-TW, en, pt), language switcher | All above | Medium | 2-3 |
| **O** | Empty states, error states, QR code generation, barcode scan support | All above | Small | 1-2 |
| **P** | Deployment: ECS setup, Caddy config, PM2 ecosystem, CI/CD, backup script, monitoring | All above | Medium | 1-2 |
| **Q** | Testing & QA: run all 9 QA playbook scenarios, fix issues | All above | Medium | 3-4 |

*Estimated working days per step. Total: ~30-45 working days for Build Phase 1.*

```
Build dependency graph:

A (scaffold)
├── B (database) ──┬── C (auth) ──┬── D (landing + trial)
│                  │              ├── E (products) ── F (storefront browse)
│                  │              │                    └── G (cart + checkout)
│                  │              │                         └── H (orders)
│                  │              │                              ├── I (dashboard)
│                  │              │                              └── J (SSE)
│                  │              ├── K (settings)
│                  │              ├── L (platform admin)
│                  │              └── M (promoter)
│                  └── N (i18n) ─── O (empty/error states) ─── P (deploy) ─── Q (QA)
```

## 16. Open Questions

| # | Question | Impact | Who decides |
|---|---|---|---|
| 1 | What domain name to use? (pos.mo is example) | Branding, SSL setup | User |
| 2 | Design direction — what style/theme? User mentioned providing design info. | All UI implementation | User |
| 3 | MPAY API — does the user have an existing MPAY merchant account? | Phase 2 payment integration | User |
| 4 | Trial duration — 14 days? 30 days? | Trial signup flow | User |
| 5 | Pricing plans — what tiers and prices for SaaS subscription? | Landing page, billing | User |
| 6 | SMS provider for phone OTP verification? (e.g. Twilio, Alibaba SMS) | Trial signup, security | User |
| 7 | Will staging environment be on same ECS or separate? | Deployment setup | User |

## 17. Final Sign-off Gate

- [x] Phase 0 — Reference analysis + project intent ✅
- [x] Phase 0.1 — User scenarios (7 personas, 47 stories, 30 tests) ✅
- [x] Phase 1 — Tech stack (3-app Turborepo, Alibaba ECS, Drizzle, ~$7-14/mo) ✅
- [x] Phase 2 — Data model (11 tables, 22 indexes) + API (43 endpoints) ✅
- [x] Phase 3 — Full architecture (system, frontend, backend, security) ✅
- [x] Product Review — 🟢 All 5 major issues resolved ✅
- [x] Reference features confirmed (all features, 5-phase rollout)
- [x] Architecture confirmed (3 apps on Alibaba ECS HK)
- [x] Data model confirmed (Drizzle + PostgreSQL + RLS)
- [x] API design confirmed (43 endpoints, paginated, atomic stock)
- [x] Tech stack confirmed (Next.js 15 + Drizzle + shadcn/ui)
- [x] Security confirmed (4-layer tenant isolation, RBAC, Zod validation)
- [x] Build order agreed (17 steps, A→Q, ~30-45 working days)

**Approved:** ☐ Yes / ☐ Revisions needed

**Planning is complete. Upon approval, proceed to APP_IMPLEMENTER Phase A.**
