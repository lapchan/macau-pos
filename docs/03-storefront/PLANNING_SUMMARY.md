# Macau POS — Online Storefront Planning Summary

| Field | Value |
|---|---|
| **Project** | Macau POS — Online Storefront |
| **Reference** | Shopline (primary), Shopify (secondary) |
| **Date** | 2026-04-05 |
| **Status** | Phase 4 — Final Review Complete |

## What We're Building

A **mobile-first online storefront** (`apps/storefront`, port 3300) that lets customers browse products, add to cart, and checkout with Macau payment methods — synced in real-time with the merchant's POS via shared PostgreSQL database.

## Key Differentiators

- **Zero-delay POS sync** — same DB, no sync layer (Shopline/Shopify can't match this)
- **MPay + Alipay + WeChat Pay** — Macau-native payment support
- **5 languages** — TC, SC, EN, PT, JA (more than Shopline's 3)
- **Section-based homepage builder** — merchants customize via admin, no code
- **Delivery zones** — per-location fees (Macau Peninsula, Taipa, Coloane)

## Scope

- **20 P0 features** (catalog, cart, checkout, auth, customization, delivery)
- **9 P1 features** (wishlists, collections, coupons, recommendations)
- **8 P2 deferred** (BOPIS, loyalty, social commerce, PWA)

## Architecture

| Layer | Decision |
|---|---|
| Framework | Next.js 16 (RSC for catalog, Client for cart/checkout) |
| Database | Same PostgreSQL + 9 new tables + 3 modified tables |
| Auth | Passwordless (phone/email + verification code) |
| Cart | DB-backed (guest via session token, registered via customer_id) |
| Payments | Phase 1 simulated, Phase 2 QFPay/AlphaPay/MPay |
| Checkout | One-page, guest + registered, delivery zones |
| Customization | Section-based homepage, branding, custom pages |
| Mobile | Cart drawer, bottom sheets, sticky CTAs, 375px+ |
| Desktop | Full cart page, sidebar filters |

## Build Order (~22 days)

1. DB migrations (1d) → Scaffold app (0.5d) → Product catalog (2d) → Product detail (1.5d)
2. Cart system (2d) + Customer auth (1.5d) — parallel
3. Checkout with delivery (3d) → Order confirmation + history (1.5d)
4. Customer account (1d) + Storefront customization (2d) + Custom pages (1d)
5. Admin additions (4d) + i18n (1d) + Seed/backfill (0.5d) + QA (2d)

**Critical path:** DB → Scaffold → Catalog → Cart → Checkout → Confirmation

## Product Review Outcome

🟢 **Proceed** — 2 blockers + 3 major issues found and resolved:
- Product slugs for SEO URLs
- Multi-image gallery support
- Pickup location selector for multi-store
- Cart merge edge case handling
- JSONB validation with Zod schemas

## Open Questions

1. Custom domains per tenant? (Default: subdomains only v1)
2. Which payment gateway first? (Default: QFPay for Alipay+WeChat)
3. Branded email templates? (Default: plain text v1)
