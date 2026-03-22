# Macau POS — Planning Summary

| Field | Value |
|---|---|
| **Project** | Macau POS |
| **Reference** | yp.mo/yp-resource-business (admin) · yp.mo/shops (cashier) |
| **Document** | Executive planning summary |
| **Version** | v1.0 |
| **Status** | Planning complete — ready for implementation |
| **Date** | 2026-03-22 |

## What we're building

A modern **multi-tenant SaaS POS system** for Macau retail merchants. Two main interfaces: a merchant admin dashboard and a customer-facing ordering storefront. Built to replace/compete with the existing YP SHOPS system by Macau Yellow Pages, with a modern UI, SaaS architecture, and trilingual support.

## Who it's for (7 personas)

| Persona | Role |
|---|---|
| Platform Admin | Manages the SaaS platform, onboards merchants |
| Merchant Owner | Manages their shop — products, orders, settings, staff |
| Cashier | Processes orders and payments at the counter |
| Customer | Browses and orders from a merchant's storefront |
| Promoter | Sells the platform to merchants, earns commissions |
| Potential Customer | Evaluates the platform, starts a free trial |
| Accountant | Read-only access to financial reports |

## Tech stack (~$7-14/month)

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router), TypeScript |
| Architecture | 3 apps (Turborepo): admin, storefront, landing |
| Database | PostgreSQL 16 (self-hosted on ECS) |
| ORM | Drizzle ORM |
| Auth | Auth.js v5, 7 roles, RBAC |
| UI | Tailwind CSS + shadcn/ui |
| Hosting | Alibaba Cloud ECS, Hong Kong region |
| Infrastructure | Caddy (reverse proxy), PM2 (process manager) |
| Multi-tenancy | Row-level tenant_id + PostgreSQL RLS (4-layer defense) |

## Data model (11 tables, 43 API endpoints)

Core tables: tenants, users, categories, products, variants, orders, order_items, payments, refunds, shop_settings, referrals, audit_logs.

## Build Phase 1 (Core POS MVP) — ~30-45 working days

17 implementation steps (A→Q):
1. Scaffold → Database → Auth → Landing/Trial
2. Products (with variants, image processing) → Storefront browsing
3. Cart → Checkout (atomic stock) → Order management
4. Dashboard → SSE notifications → Settings → Platform admin → Promoter
5. i18n → Empty/error states → Deploy → QA

## 5-phase feature roadmap (all features eventually)

| Phase | Focus | Key additions |
|---|---|---|
| **1 (MVP)** | Core POS | Products, orders, cart, checkout, dashboard, trial, auth |
| **2** | Operations | Inventory, members, reporting, MPAY, printing, Excel import |
| **3** | Growth | Promotions, points, stored value, advanced reports |
| **4** | Supply chain | Full inventory, wholesale, procurement, BOM |
| **5** | Ecosystem | Chain management, WeChat, secondary screen, reservations |

## Key architectural decisions

- **3 apps on 1 ECS** — Caddy routes by subdomain (admin.pos.mo, shop.pos.mo, pos.mo)
- **4-layer tenant isolation** — Auth.js JWT → Drizzle middleware → PostgreSQL RLS → API route guards
- **SSE for real-time** — Instant order notifications to merchants (no WebSocket complexity)
- **sharp image pipeline** — 3 sizes in WebP, 96% size reduction
- **Atomic stock decrement** — `UPDATE WHERE stock >= $qty` in transaction, 409 on conflict
- **Onboarding wizard** — 4-step guided setup for new merchants

## Open questions for user

1. Domain name?
2. Design direction/theme?
3. MPAY merchant account availability?
4. Trial duration (14 or 30 days)?
5. Pricing plans for SaaS subscription?
6. SMS provider for OTP?
