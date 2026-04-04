# Implementation Plan 01: Auth System

**Status:** ✅ Completed (2026-03-23)
**Persona:** Backend Architect + Database Optimizer

---

## Context
Both admin and cashier apps had no authentication. All data was accessed via a hardcoded `DEMO_TENANT_SLUG`. This plan adds a custom lightweight auth system with 3 login methods, cookie-based DB sessions, and middleware route protection.

## Key Decisions
- **Custom auth** (not Auth.js) — PIN login needed, shared sessions across apps, simpler than Auth.js adapter
- **Combined login methods** — phone+password (primary), email+password (alt), PIN-only (cashier quick-login)
- **Cookie-based DB sessions** — not JWT. Simpler, revocable, server-validated. 7-day expiry.

## Files Created
1. `packages/database/src/schema/users.ts` — Users table (13 cols, 3 indexes)
2. `packages/database/src/schema/sessions.ts` — Sessions table (5 cols, 2 indexes)
3. `packages/database/src/auth.ts` — Auth library (hash, login, session CRUD)
4. `apps/admin/src/lib/auth-actions.ts` — Admin login/logout server actions
5. `apps/admin/src/middleware.ts` — Admin route protection
6. `apps/admin/src/app/(auth)/login/page.tsx` — Admin login page
7. `apps/cashier/src/lib/auth-actions.ts` — Cashier login/logout server actions
8. `apps/cashier/src/middleware.ts` — Cashier route protection
9. `apps/cashier/src/app/login/page.tsx` — Apple-style PIN login

## Files Modified
- `packages/database/src/schema/index.ts` — export users + sessions
- `packages/database/src/seed.ts` — 4 demo users
- `apps/admin/src/app/(dashboard)/layout.tsx` — server layout with session
- `apps/admin/src/components/sidebar/app-sidebar.tsx` — user menu + logout
- `apps/admin/src/lib/queries.ts` — session-based tenant resolution
- `apps/cashier/src/lib/queries.ts` — session-based tenant resolution
- `apps/cashier/src/app/pos-client.tsx` — logout button + hydration fix

## Demo Users
| Email/Phone | Role | Password | PIN |
|---|---|---|---|
| admin@retailos.mo | Platform Admin | admin1234 | — |
| owner@countingstars.mo | Merchant Owner | demo1234 | — |
| 85312345678 | Cashier | demo1234 | 1234 |
| acct@countingstars.mo | Accountant | demo1234 | — |
