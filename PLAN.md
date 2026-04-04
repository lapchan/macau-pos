# Auth Module — Implementation Plan

| Field | Value |
|---|---|
| **Project** | Macau POS |
| **Module** | Authentication & Authorization |
| **Phase** | nm (New Module) → Implementation |
| **Date** | 2026-03-23 |
| **Personas** | 🎭 Backend Architect + Database Optimizer |
| **Traces to** | PLANNING.md §4 (users table), §5 (auth APIs), §6.2 (request flow), §10 (security) |

---

## 1. What We're Building

A combined auth system supporting:
- **Phone + password** — primary login for owners/admins
- **Email + password** — alternative login
- **PIN-only** — fast cashier login at POS
- **Role-based access** — 7 roles with route protection
- **Multi-tenant isolation** — session carries `tenantId`, all queries filter by it

### Login Methods by Role

| Role | Login method | App |
|---|---|---|
| platform_admin | email+password | Admin |
| merchant_owner | phone+password OR email+password | Admin |
| cashier | PIN (4-6 digit) at POS, phone+password at Admin | Cashier + Admin |
| accountant | email+password | Admin (read-only) |
| customer | phone+password | Storefront (future) |
| promoter | email+password | Admin (limited) |

---

## 2. Database Changes

### 2.1 New: `users` table

```sql
CREATE TYPE user_role AS ENUM (
  'platform_admin', 'merchant_owner', 'cashier',
  'customer', 'promoter', 'accountant', 'potential_customer'
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),  -- NULL for platform_admin
  email VARCHAR(255),
  phone VARCHAR(20),
  name VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  pin VARCHAR(255),  -- hashed 4-6 digit PIN for cashier quick-login
  role user_role NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX idx_users_email ON users(email) WHERE email IS NOT NULL AND deleted_at IS NULL;
CREATE UNIQUE INDEX idx_users_phone ON users(phone) WHERE phone IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_users_tenant_role ON users(tenant_id, role);
CREATE UNIQUE INDEX idx_users_tenant_pin ON users(tenant_id, pin) WHERE pin IS NOT NULL AND deleted_at IS NULL;
```

### 2.2 New: `sessions` table (for DB-backed sessions)

```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_user ON sessions(user_id);
```

### 2.3 Seed data update

Add demo users for the existing CountingStars tenant:
- Owner: `owner@countingstars.mo` / `demo1234` (merchant_owner)
- Cashier: phone `85312345678` / PIN `1234` (cashier)
- Platform admin: `admin@retailos.mo` / `admin1234` (platform_admin)

---

## 3. Auth Library (`packages/auth/`)

### 3.1 Password hashing
- Use `bcrypt` (via `bcryptjs` for pure JS — no native deps needed on ECS)
- Salt rounds: 12
- PIN hashing: same bcrypt

### 3.2 Session management
- **Cookie-based sessions** (httpOnly, secure, sameSite=lax)
- Session token: `crypto.randomUUID()` stored in DB
- Session duration: 7 days (configurable)
- Cookie name: `pos_session`
- No JWT — simpler, revocable, server-validated

### 3.3 Auth functions

```
login(email/phone, password) → { session token, user, tenant }
loginWithPin(tenantSlug, pin) → { session token, user, tenant }
logout(sessionToken) → void
getSession(cookieToken) → { user, tenant } | null
hashPassword(password) → hash
verifyPassword(password, hash) → boolean
```

### 3.4 Why NOT Auth.js/NextAuth

The PLANNING.md specified Auth.js v5, but for this MVP:
- We need PIN login (not supported by Auth.js)
- We need shared sessions across 2 apps (same DB, same cookie domain)
- Custom session table is simpler than Auth.js adapter complexity
- No OAuth needed for MVP
- **Decision: Custom lightweight auth** — migrate to Auth.js later if needed

---

## 4. Middleware

### 4.1 Auth middleware (`withAuth`)
- Reads `pos_session` cookie
- Looks up session in DB (with user join)
- If invalid/expired → redirect to `/login`
- If valid → injects `user` and `tenantId` into request context

### 4.2 Role middleware (`requireRole(roles[])`)
- Checks `user.role` against allowed roles
- If unauthorized → 403 page

### 4.3 Tenant resolution
- Replace `DEMO_TENANT_SLUG` constant with session-derived `tenantId`
- `getTenantId()` reads from auth context instead of hardcoded slug
- All existing queries continue to work — just the source of `tenantId` changes

---

## 5. Pages & UI

### 5.1 Admin app — New pages

| Route | Purpose | Components |
|---|---|---|
| `/login` | Email/phone + password login | LoginForm, LanguageToggle |
| `/register` | Trial signup (creates tenant + owner) | RegisterForm |
| `/forgot-password` | Password reset (future) | Placeholder |

### 5.2 Cashier app — New pages/components

| Route | Purpose | Components |
|---|---|---|
| `/login` | PIN entry screen | PinPad (4-6 digit grid) |
| `/login?mode=full` | Phone+password fallback | LoginForm |

### 5.3 Login page design
- Clean, centered card (consistent with existing design language)
- CS logo at top
- Language switcher
- "CountingStars" merchant branding
- Light theme (admin), matches POS theme (cashier)

### 5.4 PIN pad design (cashier)
- Full-screen dark interface
- Large number buttons (touch-friendly, 80×80px minimum)
- 4 dots showing PIN entry progress
- Merchant logo at top
- "Switch to password login" link

---

## 6. Build Order

| # | Task | Files | Depends on |
|---|---|---|---|
| 1 | Users + sessions schema | `packages/database/src/schema/users.ts`, `sessions.ts` | — |
| 2 | Run migration | `drizzle/` migration files | #1 |
| 3 | Auth library (hash, session, login) | `packages/database/src/auth.ts` | #1 |
| 4 | Seed demo users | `packages/database/src/seed.ts` | #2, #3 |
| 5 | Admin login page | `apps/admin/src/app/(auth)/login/page.tsx` | #3 |
| 6 | Admin auth middleware | `apps/admin/src/middleware.ts` | #3 |
| 7 | Replace getTenantId() in admin | `apps/admin/src/lib/queries.ts` | #6 |
| 8 | Cashier PIN login page | `apps/cashier/src/app/login/page.tsx` | #3 |
| 9 | Cashier auth middleware | `apps/cashier/src/middleware.ts` | #3 |
| 10 | Replace getTenantId() in cashier | `apps/cashier/src/lib/queries.ts` | #9 |
| 11 | User menu (sidebar) — show name, logout | `apps/admin/src/components/sidebar/` | #6 |
| 12 | Test login flows | Manual + future automated | All |

---

## 7. Security Considerations

- Passwords hashed with bcrypt (12 rounds)
- Session tokens are random UUIDs (not predictable)
- Cookies: `httpOnly`, `secure` (in prod), `sameSite=lax`
- Rate limiting on login endpoints (future — use middleware)
- PIN brute-force protection: lock after 5 failed attempts (future)
- Session cleanup: cron job to delete expired sessions (future)
- All queries filter by `tenantId` from session — no URL-based tenant

---

## 8. Migration Path

After auth is working:
1. Remove `DEMO_TENANT_SLUG` constant
2. Remove `constants.ts` file
3. All tenant resolution goes through authenticated session
4. Future: Add Auth.js if OAuth/social login needed
