# Plan: Terminal/Device Management

## Context
The admin Terminals page and dashboard card use mock data only. Cashier devices have no identity — login captures the user but not which physical device is being used. This prevents per-terminal reporting, shift tracking, and remote management. This plan adds a full terminal lifecycle: registration via activation code, heartbeat status tracking, and admin management.

---

## Architecture

| Decision | Choice | Why |
|----------|--------|-----|
| Registration | **6-char activation code** | Simplest for non-technical merchants, no camera needed |
| Identity storage | **localStorage** (`pos_terminal_id`) | Survives logouts, works offline |
| Status tracking | **60s heartbeat** + derived online/offline | No WebSocket infra, one column |
| Online threshold | **3 minutes** stale = offline | Tolerates brief network blips |
| Activation code charset | 30 chars (no 0/O/1/I/L) | Avoids verbal/written confusion |

---

## Database Changes

### New enum: `terminal_status`
Values: `active`, `disabled`, `maintenance`

### New table: `terminals`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| tenant_id | uuid FK → tenants, NOT NULL | Multi-tenant isolation |
| name | varchar(100) NOT NULL | "Counter 1", "Lobby A" |
| code | varchar(20) NOT NULL | Short ID like "T-001", unique per tenant |
| activation_code | varchar(20) nullable | 6-char code, cleared after pairing |
| location | varchar(200) | "G/F Main Counter" |
| device_info | jsonb DEFAULT '{}' | { userAgent, screen } captured on activation |
| status | terminal_status DEFAULT 'active' | Admin-controlled |
| last_heartbeat_at | timestamptz nullable | Updated every 60s by cashier |
| activated_at | timestamptz nullable | Set when device pairs |
| current_user_id | uuid FK → users, SET NULL | Who is currently logged in |
| notes | text | Admin notes |
| created_at / updated_at | timestamptz | Standard |

Indexes: `UNIQUE(tenant_id, code)`, `UNIQUE(activation_code) WHERE NOT NULL`, `(tenant_id, status)`

### Modified tables:
- **orders**: Add `terminal_id` uuid FK → terminals (nullable, SET NULL)
- **sessions**: Add `terminal_id` uuid FK → terminals (nullable)
- **shifts**: Change `terminal_id` from varchar to uuid FK → terminals

---

## Registration Flow

```
Admin: [+ Add Terminal] → name + location → system generates "A3K9M2"
                                                    ↓
Cashier iPad: First open → "Activate Terminal" → enter code → paired!
                                                    ↓
                                              Login screen
```

### Cashier activation page (`/activate`)
- Full-screen, Apple-style, centered input for 6-char code
- Auto-uppercase, auto-focus
- Validate → store `pos_terminal_id` in localStorage → redirect to `/login`

### Terminal guard
- Layout component checks localStorage for `pos_terminal_id`
- Missing → redirect to `/activate`
- Present → validate with `GET /api/terminals/me` → continue or show error

---

## Heartbeat

- Cashier sends `POST /api/terminals/heartbeat` every 60s while app is open
- Server updates `terminals.last_heartbeat_at = NOW()`
- Admin derives status: `last_heartbeat_at` < 3min ago = online, else = offline
- Admin page polls every 30s for fresh data

---

## New Files (12)

| # | File | Purpose |
|---|------|---------|
| 1 | `packages/database/src/schema/terminals.ts` | Schema |
| 2 | `packages/database/drizzle/0006_terminals.sql` | Migration |
| 3 | `apps/cashier/src/app/activate/page.tsx` | Activation screen |
| 4 | `apps/cashier/src/components/shared/terminal-guard.tsx` | Layout guard |
| 5 | `apps/cashier/src/lib/use-heartbeat.ts` | 60s heartbeat hook |
| 6 | `apps/cashier/src/app/api/terminals/activate/route.ts` | Activation API |
| 7 | `apps/cashier/src/app/api/terminals/heartbeat/route.ts` | Heartbeat API |
| 8 | `apps/cashier/src/app/api/terminals/me/route.ts` | Terminal info API |
| 9 | `apps/admin/src/lib/terminal-actions.ts` | Admin CRUD actions |
| 10 | `apps/admin/src/lib/terminal-queries.ts` | Admin queries |
| 11 | `apps/admin/src/components/terminals/add-terminal-dialog.tsx` | Add dialog |
| 12 | `apps/admin/src/components/terminals/terminal-detail.tsx` | Detail view |

## Modified Files (8)

| # | File | Change |
|---|------|--------|
| 1 | `packages/database/src/schema/enums.ts` | Add terminal_status enum |
| 2 | `packages/database/src/schema/index.ts` | Export terminals |
| 3 | `packages/database/src/schema/orders.ts` | Add terminal_id FK |
| 4 | `packages/database/src/schema/sessions.ts` | Add terminal_id FK |
| 5 | `packages/database/src/schema/shifts.ts` | Change terminal_id varchar→uuid FK |
| 6 | `apps/cashier/src/lib/auth-actions.ts` | Accept terminal_id in login |
| 7 | `apps/admin/src/app/(dashboard)/terminals/page.tsx` | Real data, wire actions |
| 8 | `apps/admin/src/components/dashboard/terminal-status-card.tsx` | Real data |

---

## Build Order

### Phase A: Database (Steps 1-4)
1. Add `terminalStatusEnum` to enums.ts
2. Create `terminals.ts` schema
3. Export from schema/index.ts + packages/database/src/index.ts
4. Write + run migration SQL (add terminal_id to orders/sessions/shifts)

### Phase B: Cashier Activation + Heartbeat (Steps 5-10)
5. Create `/api/terminals/activate` route
6. Create `/api/terminals/heartbeat` route
7. Create `/api/terminals/me` route
8. Create `/activate` page (Apple-style code entry)
9. Create `TerminalGuard` component
10. Create `useHeartbeat` hook, integrate into cashier layout

### Phase C: Auth Integration (Steps 11-12)
11. Update login actions to pass terminal_id into session
12. Update `createOrder()` to include terminal_id from session

### Phase D: Admin Management (Steps 13-18)
13. Create `terminal-actions.ts` (create, update, delete, regenerate code, set status)
14. Create `terminal-queries.ts` (getTerminals, getTerminalSummary)
15. Add ~20 i18n keys × 5 locales
16. Rewrite terminals page with real data
17. Build "Add Terminal" dialog with code display
18. Update dashboard terminal-status-card

### Phase E: Seed + Polish (Steps 19-20)
19. Add 3 sample terminals to seed.ts
20. Remove terminal mock data from mock.ts

---

## Verification

1. **DB**: `terminals` table exists with correct columns and FKs
2. **Admin create**: "Add Terminal" → generates 6-char code → shows prominently
3. **Cashier activate**: Fresh device → `/activate` screen → enter code → paired → login
4. **Invalid code**: Wrong code → error message, no pairing
5. **Already activated**: Re-entering same code → error (code cleared after use)
6. **Heartbeat**: Terminal shows "online" in admin within 2 min of opening cashier
7. **Offline**: Close cashier → terminal shows "offline" in admin after 3 min
8. **Disable**: Admin disables terminal → cashier shows "Terminal disabled" message
9. **Orders tagged**: Create order from paired terminal → `orders.terminal_id` set
10. **Per-terminal reporting**: Admin terminals page shows correct sales/revenue per device
11. **Multiple devices**: Two iPads paired to different terminals → independent tracking
