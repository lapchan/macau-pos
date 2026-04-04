# Product Design Review — Cashier App Onboarding & Auth

| Field | Value |
|---|---|
| **Project** | Macau POS — Cashier App |
| **Reference** | YP SHOPS (yp.mo/shops), iPhone unlock model |
| **Reviewer** | Claude (Senior PM Review) |
| **Review scope** | Terminal activation → Login → Screen lock → Shift-ready architecture |
| **Review date** | 2026-04-03 |
| **Overall verdict** | 🟡 Proceed with fixes — focused scope, shift logic deferred |

---

## Executive Summary

The cashier app has a solid terminal activation flow (localStorage-based device linking, one-time activation codes, heartbeat monitoring) and the `shifts` schema is already deployed and ready. However, the current authentication treats the POS like a consumer app — a user-picker grid with PIN-only login. This needs to become a **proper workstation login** with full credentials, while keeping the architecture shift-ready for Phase 2.

**Current scope (this sprint):**
- Fix login: password-based, no user picker
- Add screen lock: iPhone security model (PIN unlocks active session, reboot requires full login)
- Enforce single session per terminal
- Wire `cashierId` into orders
- Leave `shiftId` null for now — shift open/close/handoff is Phase 2

**Explicitly deferred to Phase 2 (PLAN-07):**
- Shift open/close flows, cash count UI, shift change ceremony
- Manager force-close, shift approval workflow
- Payment breakdown tracking, shift settlement reports
- Admin shift management page

---

## Severity Summary

| Severity | Count |
|---|---|
| 🔴 Blocker | 2 |
| 🟡 Major | 2 |
| 🔵 Minor | 3 |
| 💡 Suggestion | 2 |

---

## Blockers

### B1. Login uses PIN-only via user picker — no real authentication

**Dimension:** Security
**Finding:** The current flow shows an avatar grid of all POS-authorized users, then accepts a 4-digit PIN. This is two problems:
1. **User picker exposes who has system access** — anyone looking at the screen sees all staff names/roles
2. **PIN-only is too weak** for the primary login — PINs are easily shoulder-surfed, and a 4-digit PIN has only 10,000 combinations

**Impact:** Can't reliably attribute cash responsibility. User picker is an information leak.

**Recommendation:**

Remove the user picker grid entirely. Replace with a clean login form:
```
┌─────────────────────────┐
│     [CS Logo]           │
│     CountingStars       │
│                         │
│  Phone or Email         │
│  ┌───────────────────┐  │
│  │                   │  │
│  └───────────────────┘  │
│  Password               │
│  ┌───────────────────┐  │
│  │                   │  │
│  └───────────────────┘  │
│                         │
│  [       Sign In      ] │
│                         │
└─────────────────────────┘
```

Standard phone/email + password. Same `loginWithPhonePassword()` that already exists. `hasPosAccess()` check already works.

---

### B2. No single-session enforcement per terminal

**Dimension:** Security
**Finding:** Nothing prevents two users from having active sessions on the same terminal. The middleware only checks cookie existence — not whether someone else is already logged in.

**Impact:** Two users on one terminal = ambiguous cash responsibility. When shifts are added later, this becomes a blocker.

**Recommendation:**

At session creation, check for existing active sessions on the terminal:
```typescript
async function createSession(userId, terminalId) {
  if (terminalId) {
    const existing = await db.select()
      .from(sessions)
      .where(and(
        eq(sessions.terminalId, terminalId),
        gt(sessions.expiresAt, new Date())
      ));

    if (existing.length > 0 && existing[0].userId !== userId) {
      return { error: "Terminal in use by another user." };
    }

    // Same user re-logging in (e.g. session expired) → clean up old session
    if (existing.length > 0 && existing[0].userId === userId) {
      await deleteSession(existing[0].token);
    }
  }

  // Create new session...
}
```

This is shift-ready: when we add shifts in Phase 2, we add "and has open shift" to the check.

---

## Major Issues

### M1. No screen lock / PIN unlock

**Dimension:** UX
**Finding:** There's no way for a cashier to step away without fully logging out. In a real store, cashiers lock the screen (bathroom break, helping on floor) and unlock when they return.

**Recommendation — iPhone security model:**

| Situation | Behavior |
|---|---|
| **Lock screen** (manual or idle timeout) | PIN to unlock — session stays alive |
| **Session expired** (7-day TTL or cookie cleared) | Full password login required |
| **Browser closed and reopened** | Cookie still valid → PIN unlock. Cookie gone → full login |
| **Terminal rebooted / localStorage cleared** | Re-activate terminal → full login |

Implementation:
- **Lock trigger**: Manual button in POS header + auto-lock after idle (configurable, default 5 min)
- **Lock state**: Client-side only (`useState`). Session and cookie untouched.
- **Unlock**: PIN pad verifying against current user's hashed PIN via server action
- **Failed PINs**: After 5 failures → force full logout (password required)

This reuses the existing blurred `POSBackground` component and PIN keypad — just wired differently.

---

### M2. Orders don't carry cashierId

**Dimension:** Data Integrity
**Finding:** `createOrder()` in `apps/cashier/src/lib/actions.ts` sets `shiftId: null` (correct for now) but should already be setting `cashierId: session.userId`. The `cashier_id` column exists on orders but isn't populated.

**Impact:** Can't attribute orders to cashiers even without full shift management. Reports can't show "orders by cashier."

**Recommendation:** Wire `cashierId` from the active session into `createOrder()`. This is a one-line fix that makes the data shift-ready.

---

## Minor Issues

### m1. `shifts.terminal_id` is varchar(100) instead of UUID FK

**Finding:** The shifts table has `terminal_id varchar(100)` but terminals use UUID PKs. Should be a proper FK for when shifts are wired up in Phase 2.

**Recommendation:** Migration to fix the type. Do it now while the table has no data.

---

### m2. Login page API endpoint leaks user list

**Finding:** `GET /api/terminals/users` returns all POS-authorized users for a terminal. This was built for the user picker grid. Since we're removing the grid, this endpoint should be removed too.

**Recommendation:** Delete `/api/terminals/users/route.ts`. No client code should need it.

---

### m3. Activation code race condition

**Finding:** Tiny window where the same activation code could be consumed by two concurrent requests.

**Recommendation:** `SELECT ... FOR UPDATE` lock during activation. Low priority — unlikely in practice.

---

## Suggestions

### S1. Show current user in POS header

Even without shifts, the POS header should show who's logged in. A small avatar + name is enough. This helps managers see who's on which terminal.

```
[CS Logo] [Search...]     [Wong Ah Ming] [🔒 Lock] [↪ Logout]
```

---

### S2. "Remember me" for phone/email field

Since a terminal is typically used by a few people, the login form could remember the last-used phone/email in localStorage. Pre-fills on next login. Just the identifier — never the password.

---

## Scenario Walkthroughs

### W1: First-time terminal setup

```
User: Chan Siu Man (merchant_owner)
Terminal: New iPad at Counter 3

1. Open cashier app URL → no pos_terminal_id in localStorage
2. TerminalGuard redirects to /activate
3. Admin creates terminal in dashboard → gets activation code "X7K2M9"
4. Enter code → POST /api/terminals/activate
5. Terminal activated: pos_terminal_id stored in localStorage
6. Redirect to /login → clean phone/email + password form
7. Chan enters phone + password → session created
8. POS loads (no shift prompt yet — that's Phase 2)

Verdict: ✅ Activation works. Login needs rewrite (B1).
```

### W2: Daily login — cashier starts work

```
User: Wong Ah Ming (store_manager)
Terminal: Counter 1, already activated

1. Browser opened → cookie expired overnight
2. TerminalGuard: pos_terminal_id exists, terminal valid ✅
3. Middleware: no pos_session cookie → redirect to /login
4. Wong enters phone + password → loginWithPhonePassword()
5. hasPosAccess() → ✅ (posRole = store_manager)
6. Single-session check: no other active session on terminal → ✅
7. Session created, cookie set → redirect to POS
8. (Phase 2: shift open prompt would appear here)

Verdict: ⚠️ Login form not yet password-based (B1). Session check not enforced (B2).
```

### W3: Screen lock and unlock (iPhone model)

```
User: Wong Ah Ming (logged in, active session)

1. Wong taps "Lock" button in header (or idle timeout fires)
2. Client state: locked = true
3. Screen shows blurred POS + Wong's avatar + "Enter PIN"
4. Wong returns, enters 4-digit PIN
5. Server action verifies PIN against Wong's bcrypt hash
6. Success → locked = false, POS resumes (cart, everything intact)
7. Session never touched — cookie still valid

After 5 failed PINs:
8. Force logout → session deleted → redirect to /login
9. Wong must enter full password to get back in

Verdict: ❌ Not yet implemented (M1).
```

### W4: Unauthorized user tries to log in

```
User: Ho Ka Wai (accountant, no posRole)

1. Login form → enters email + password
2. loginWithPhonePassword() → valid credentials ✅
3. hasPosAccess(session) → false (no posRole, role = accountant)
4. Session deleted, error: "This account does not have POS access"

Verdict: ✅ Already working correctly.
```

### W5: Second user tries to log in while terminal is in use

```
User A: Wong Ah Ming (active session on Counter 1)
User B: Lei Mei Ling (tries to log in on same terminal)

1. Lei opens the same terminal URL in another tab
2. Middleware: Wong's pos_session cookie exists → POS loads (as Wong)
3. Lei can't get to login page while Wong's cookie is active
4. If cookie is cleared somehow and Lei tries to log in:
5. createSession() detects Wong's active session on this terminal
6. Error: "Terminal in use by another user"

Verdict: ⚠️ Session enforcement not implemented (B2). Tab scenario handled by cookie.
```

### Scenario Coverage

| Scenario | Priority | Verdict | Notes |
|---|---|---|---|
| W1: Terminal setup | P0 | ✅ Works | Activation flow solid |
| W2: Daily login | P0 | ⚠️ Partial | Needs password form + session check |
| W3: Lock/unlock | P1 | ❌ Missing | iPhone-model lock screen needed |
| W4: Unauthorized access | P0 | ✅ Works | posRole check in place |
| W5: Concurrent users | P1 | ⚠️ Partial | Cookie helps, explicit check needed |

---

## Architecture — What to Build Now

### State Machine (Current Scope)

```
  ┌──────────┐     ┌──────────┐    ┌──────────┐
  │ ACTIVATE │────▶│  LOGIN   │───▶│   POS    │
  │(one-time)│     │(phone/   │    │  ACTIVE  │
  └──────────┘     │ email +  │    │          │
                   │ password)│    └────┬─────┘
                   └──────────┘         │
                        ▲          ┌────▼─────┐
                        │          │  LOCKED  │
                        │          │ (PIN to  │
                        │          │  unlock) │
                        │          └────┬─────┘
                        │               │
                        │          POS resumes
                        │               │
                        └───────────────┘
                     (logout or session expiry)
```

**Phase 2 adds:** SHIFT OPEN (after login) and SHIFT CLOSE (before logout) states.

### iPhone Security Model

| Situation | Auth required | Why |
|---|---|---|
| Screen locked (manual / idle) | PIN | Fast unlock, session alive |
| Session expired (7 days) | Full password | Re-prove identity |
| Cookie cleared (browser reset) | Full password | No session to resume |
| Terminal reset (localStorage cleared) | Re-activate + password | Device unlinked |
| 5 failed PIN attempts | Full password | Brute-force protection |

### Shift-Ready Hooks (for Phase 2)

These are **NOT built now** but the architecture accommodates them:

```typescript
// After successful login (Phase 2 will add):
// const shift = await getActiveShift(userId, terminalId);
// if (!shift) → show shift open prompt
// else → resume shift

// Before logout (Phase 2 will add):
// const shift = await getActiveShift(userId, terminalId);
// if (shift) → must close shift first (block logout)

// In createOrder() — already wired:
// shiftId: activeShift?.id ?? null  (null for now, populated in Phase 2)
// cashierId: session.userId          (wire this NOW)
```

---

## Implementation Checklist

### Build now

| # | Task | Files | Effort |
|---|------|-------|--------|
| 1 | Replace login page: remove user picker, clean password form | `cashier/app/login/page.tsx` | S |
| 2 | Enforce single session per terminal | `packages/database/src/auth.ts` | S |
| 3 | Add screen lock state + PIN unlock to POS | `cashier/app/pos-client.tsx` | M |
| 4 | Auto-lock on idle timeout | `cashier/app/pos-client.tsx` | S |
| 5 | Force logout after 5 failed PIN attempts | `cashier/app/pos-client.tsx` | S |
| 6 | Wire `cashierId` into createOrder() | `cashier/lib/actions.ts` | XS |
| 7 | Delete user-picker API endpoint | `cashier/app/api/terminals/users/` | XS |
| 8 | Show current user in POS header | `cashier/app/pos-client.tsx` | S |

### Fix now (cleanup)

| # | Task | Files |
|---|------|-------|
| 9 | Fix shifts.terminal_id type (varchar→uuid FK) | Migration |
| 10 | Remove unused loginWithPin brute-force fallback | `packages/database/src/auth.ts` |

### Defer to Phase 2 (PLAN-07)

- Shift open/close flows
- Cash count UI + variance calculation
- Shift change ceremony (close → login → open)
- Manager force-close (admin override)
- Payment breakdown tracking
- Shift settlement reports
- Admin shift management page

---

## Review Sign-off

| Item | Status |
|---|---|
| Blockers identified (B1, B2) | ✅ |
| Scope confirmed with user | ✅ |
| Shift logic explicitly deferred | ✅ |
| User approves implementation | ☐ Pending |
