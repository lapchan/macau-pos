# Product Design Review — Network Printer Module

| Field | Value |
|---|---|
| **Project** | Macau POS |
| **Reference** | YP SHOPS |
| **Module under review** | Network Printer |
| **Planning doc** | `docs/01-planning/PLANNING_NETWORK_PRINTER.md` (Phases 0 → 3, 2026-04-23) |
| **Reviewer** | Claude (Senior PM Review) |
| **Review date** | 2026-04-23 |
| **Overall verdict** | 🟡 **Proceed with fixes** |

---

## Executive Summary

The architecture is **sound in shape** and well-suited to the reseller-product goal: it correctly identifies the iPad Safari constraints, picks a defensible bridge-device pattern, and solves the HTTPS mixed-content wall via Cloudflare Tunnel. Decoupling from router brand + making `packages/print-server` a proper cross-platform artifact was a strong revision in Phase 0 that pays dividends in Phase 3's clean component boundaries.

**Three real problems need fixing before Phase 4**, all in the "auth/lifecycle" cluster:
1. Token rotation has no push path to the bridge (`commands[]` in heartbeat response is marked "empty in v1") — rotating a token silently breaks printing until someone SSHes into the bridge.
2. Bearer token uses argon2id (a password hash) for every `/print` request — unnecessary 50–200ms latency on small bridges; eats into the 3-second print budget.
3. Installer provisioning relies on the reseller's CF API token being present on the installer's laptop; the scoped-token language in §9.2 is right but the end-to-end flow doesn't describe how that token gets there safely.

Plus several architectural gaps around **ops and diagnostics** — no alerting when a shop goes offline, no print-job audit log (even small is fine), no "temporarily disable" workflow for a stuck printer, no force-update path for a critical bug fix.

**Reference comparison:** YP SHOPS and comparable Macau POS systems ship LAN-only printers with manual pairing. Our architecture is materially more advanced (cloud-addressable, remote diagnostics, any-printer). This is the right move for a reseller product — but it means the setup pattern is unfamiliar to customers coming from YP SHOPS. UX onboarding (Phase 4 deliverable) needs to anticipate "why is this more complicated than my last POS?" with clear runbooks.

**Recommendation:** Address the 5 Major issues before starting Phase A. Minor items can be absorbed during implementation. The core architecture does not need a redesign.

---

## Severity Summary

| Severity | Count |
|---|---|
| 🔴 Blocker | 0 |
| 🟡 Major | 5 |
| 🔵 Minor | 5 |
| 💡 Suggestion | 5 |

---

## Major Issues

### M1. Token rotation has no delivery path to the bridge

**Dimension:** API Design + Security + UX completeness
**Section:** §5.3.1 (B3 rotate), §5.4.1 (heartbeat `commands[]`), §10.2 (rotation story)

**Finding:** Phase 2 defines admin action `rotateLocationPrinterToken` → returns raw token, stores new hash, "invalidates all outstanding tokens with a 5-min grace." Phase 3 §5.4.1 says "`commands[]` is forward-looking — empty in v1." The planning doc **does not explain how the bridge receives the rotated token**.

After rotation: admin has the new token. Cashier session (via context) will pick up the new token on next fetch. **But the bridge daemon still has the OLD token on disk** and will reject every request with 401 until:
- Someone SSHes into the bridge and edits `/etc/printer-bridge/config.json`, or
- The `cloudflared-setup.sh` script is re-run (not designed for this), or
- A support call + site visit

This is a silent time-bomb. Any admin who clicks "Rotate token" will break their shop's printing.

**Impact:** Any rotation in v1 breaks printing until manual ops intervention. The rotate-token button becomes a footgun. Scenario I4 (bridge swap) and S1 (remote triage) both assume rotation works remotely.

**Recommendation:**
- Implement `commands[]` in v1 with exactly one command type: `rotate_token`. Bridge, on heartbeat response, applies and ACKs in next heartbeat.
- Admin rotation flow: set new hash in DB + a 10-min overlap where both hashes are accepted; bridge picks up new token on next heartbeat (≤60s); old hash discarded after overlap.
- Until rotation-via-heartbeat works, hide the "Rotate token" button in admin with a "Rotation requires bridge version ≥ 0.2" message.

### M2. argon2id for machine-to-machine token is wrong hash

**Dimension:** Security / Performance
**Section:** §4.2 (schema), §8.5 (heartbeat endpoint), §10.4 (secret storage)

**Finding:** The daemon/admin verify the bearer token on every `/print` and `/heartbeat` call using argon2id, a deliberately slow password hash (tuned for 50–500ms per verify on consumer hardware). This is correct for low-entropy user passwords; **wrong for high-entropy machine tokens**.

Impact:
- On a Pi Zero 2W (low-end bridge): argon2id verify ≈ 150–250ms per request. That's 5–8% of the 3-second print budget just to check auth.
- Admin heartbeat endpoint in Next.js: 50–100ms per heartbeat × N shops × 60s = non-trivial backend CPU on ECS.
- Zero security benefit: attacker with 32-byte random token (~256 bits entropy) can't brute-force regardless of hash function; the point of argon2id is defeating dictionary attacks on weak passwords.

**Impact:** Wastes latency budget (scenario C1), wastes ECS CPU (scale constraint for reseller at 100+ shops).

**Recommendation:**
- Use **HMAC-SHA256** with a server-side pepper. Store `sha256_hmac(pepper, raw_token)` in `token_hash`. Verify: compute the same and compare in constant time. ~2μs per verify vs ~150ms.
- Alternative: plain `sha256(salt || raw_token)` — still safe at 256-bit entropy.
- Keep argon2id for the existing user-password column (unchanged). This is a new column; use the right tool.

### M3. Installer provisioning flow leaks CF API token trust

**Dimension:** Security / Operations
**Section:** §9.1 (tunnel provisioning), §9.2 (token scope)

**Finding:** §9.1 says the install script calls Cloudflare API with `CF_API_TOKEN` held by the "reseller operator." §9.2 scopes this to `Zone:DNS:Edit` + `Account:Tunnel:Edit`. But the planning does not describe **where the installer runs the script**:

- If the installer is a reseller field technician, they need the CF token on their laptop (or pipe it to the bridge) → distributed trust
- If a stolen laptop can create arbitrary `print-*.hkretailai.com` subdomains and tunnels, the reseller's whole CF account is exposed
- A rotating token every 90 days (§9.2) doesn't help if the attacker uses it before rotation

**Impact:** Security incident risk grows linearly with installer count. For a reseller at 10+ field staff, this is untenable.

**Recommendation:**
- Add a **provisioning service** to `apps/admin` at `/api/printers/provision`:
  - Installer logs into admin as themselves
  - Calls `provisionLocationPrinter(locationId, shopSlug)` server action
  - Server-side (owning the CF token) creates the tunnel + DNS record + returns `{endpointUrl, bootstrapToken, tunnelCredentials}`
  - Installer pastes a single short-lived **bootstrap token** into the bridge install script
  - Bridge exchanges bootstrap token for tunnel credential + bearer token, writes config, self-registers
- CF API token never leaves ECS. Installer has admin credentials only (which are already scoped per-tenant).

### M4. No "temporarily disable printer" UX; disable = full re-provision

**Dimension:** UX completeness
**Section:** §5.3 (B7 `disableLocationPrinter`), §7.3 (admin UI)

**Finding:** Scenario: printer breaks, waiting for replacement. Admin wants to say "stop sending prints there, cashier should fall back to iframe." Current design: `B7 disableLocationPrinter` flips `enabled=false`. OK so far. But **re-enabling** requires?
- Does `enabled=true` restore the previous endpoint + token? ✅ (row is still there)
- Does the heartbeat endpoint return 410 during disable? ✅ per §5.4.1
- So bridge stops heartbeating → last_seen_at goes stale → admin dashboard shows offline for the wrong reason → support gets confused

**Impact:** Three different "offline" states conflate (disabled / bridge down / printer unplugged). Support scenario S2 breaks.

**Recommendation:**
- Add `status` field to `location_printer_settings`: `'enabled' | 'disabled' | 'maintenance'`
  - `enabled`: normal operation
  - `disabled`: cashier falls back to iframe, bridge stops; admin doesn't expect heartbeats
  - `maintenance`: cashier shows "Printer in maintenance" toast and falls back to iframe; bridge still heartbeats; admin can test
- Admin UI: separate "Disable" and "Pause/Maintenance" buttons with distinct semantics
- Reflects in `/api/printers/heartbeat` response: `{ok: true, mode: 'maintenance'}` tells the bridge to keep running but not accept prints

### M5. No alerting path when a shop goes offline for extended period

**Dimension:** Missing pieces / Reseller ops
**Section:** No section covers this

**Finding:** Heartbeats update `last_seen_at`; admin dashboard shows offline when > 5 min. But:
- No active alerting: support only knows when customer calls
- A 10-hour gap (shop closes, opens) looks identical to a 10-hour outage
- Fleet of 50 shops → support has no way to spot "which 3 are broken today"

**Impact:** Against scenario S1, S2 — support is reactive-only. Violates success criterion §1.5.6 ("installer can remotely see status").

**Recommendation:**
- Add a simple fleet-status view to admin (§7.3 already has `status-card.tsx` per-location — add a `/fleet/printers` page)
- Alerting channel (v1.1 fine): email/webhook when `last_seen_at > 4 hours` during a location's configured business hours (requires adding business-hours to location schema — or just `>24h` dumb threshold for v1)
- Sentry already has alerting plumbing — can push a custom event when heartbeat missed > threshold

---

## Minor Issues

### m1. No print-job audit log (v1 F18 deferred)

**Section:** §4.3 (deprecated fields), §11 (scenario coverage)

Planning defers audit log to v1.1. Acceptable, but record retention matters for disputes ("I never asked for this receipt"). A tiny table `print_jobs (jobId, locationId, byteCount, status, createdAt)` — write-only, ~100 bytes/row, prunable — adds maybe half a day of work. Recommend promoting to v1 P1 since the data is already generated (bridge knows every job by jobId for idempotency).

### m2. Admin printer-setup has no codepage auto-detect

**Section:** §7.3 (admin form), §11 (O1 coverage — marked ⚠️ in my read-through)

Admin picks `printer_code_page` from a dropdown (`cp437 / gb18030 / big5 / shift_jis`). How does a non-technical shop owner know? Most shops should default based on `tenants.currency`/locale: MOP → Big5, CNY → GB18030, JPY → Shift_JIS. Provide a smart default + a "detect" button that prints test glyphs on each codepage for visual confirmation.

### m3. Bridge log rotation unspecified

**Section:** §3.1, §8.1 (daemon structure)

Daemon logs to stdout → systemd journald (Linux) rotates automatically. But on macOS (launchd → `/var/log/printer-bridge.log`) and OpenWRT (procd → `/var/log/messages`), without explicit rotation config, disk fills over months. Install script should configure logrotate per platform. Minor because it's far-future breakage.

### m4. `Idempotency-Key` header + `jobId` body field duplicate

**Section:** §5.2.2 (wire format)

Both carry the same UUID. Pick one, per HTTP standards. RFC 9457's `Idempotency-Key` header is the modern choice; drop `jobId` from the body (but keep returning it in the response for audit correlation).

### m5. Reference comparison is thin

**Section:** §1.1 (reference URL: YP SHOPS)

YP SHOPS isn't publicly documented and is a cosmetic reference anyway. Worth a single line in Phase 4 explaining we're intentionally exceeding the reference's printer pattern (LAN-only, per-device manual config) because it doesn't serve a multi-tenant reseller product.

---

## Suggestions

### S1. Cashier keyboard shortcut for print + reprint

Receipt printing is the most-frequent cashier action in the shop. A `P` keyboard shortcut on the completion screen (cashier uses external keyboards on iPad often) would shave a second off every order. Already fits the app's existing keyboard-shortcut pattern.

### S2. Fleet-wide printer status dashboard

`/admin/printers` page: one row per shop × location showing green/amber/red, last-seen, jobs-today, version. Great for support and account management. ~1 day.

### S3. Print-job replay endpoint

With audit log in place (m1), add `POST /api/printers/replay/:jobId` to re-send a past job. Useful for "customer lost their receipt" calls. Server-side, uses admin auth. ~0.5 day on top of audit.

### S4. Bridge self-reports hardware inventory

Heartbeat could include `/proc/cpuinfo` or `sw_vers` snippet so support knows "oh, they're on a Pi Zero 2W" before asking. No privacy concern, meaningful diagnostic win. ~1 hour of work.

### S5. Force-update command via heartbeat

Once `commands[]` exists (per M1 fix), add `force_update` command for pushing emergency patches. Operator triggers from admin fleet view. Pairs with auto-update's daily check.

---

## Scenario Walkthroughs

### W1. C1 — Print after payment (happy path)
```
Cashier: taps Print
  → apps/cashier/src/lib/printer.ts:sendPrintJob
  → escpos-shared.buildBytes({driver, paperWidth, codePage, receipt}) → Uint8Array
  → fetch(endpointUrl) with Bearer token
  → CF edge → tunnel → bridge daemon
  → bearer verify (HMAC-SHA256 after M2 fix) ~2μs
  → transport.write(/dev/usb/lp0, bytes, 3000ms)
  → printer ejects paper
  → response: {ok, durationMs: 420}
Cashier: green toast, move on
```
**Verdict:** ✅ (after M2 fix)

### W2. C4 — Out of paper
```
Cashier: taps Print (paper actually empty)
  → fetch succeeds, bridge writes to /dev/usb/lp0
  → kernel buffer accepts (<10ms return)
  → bridge doesn't know paper is out, returns ok: true
  → paper remains empty
  → Cashier assumes it worked, hands imaginary receipt to customer
```
**Verdict:** ❌ for Linux/OpenWRT (raw `/dev/usb/lp0` path) in the common case
**Why:** §11 marks this ⚠️ with a heuristic, but the heuristic described (write-timeout + inactivity) doesn't trigger in the "kernel buffered, printer silent" case. Only triggers on hard USB failure.
**Recommendation:** Use `node-usb` `getDeviceStatus()` query before declaring ok — works on every platform where we can link libusb (macOS, Linux with libusb-1.0, Windows). Linux/OpenWRT without libusb falls back to the heuristic. Document that budget printers without status query are best-effort.

### W3. O1 — First-time setup
```
Admin: Locations → Counter 1 → Printer tab
  → Form: endpoint URL (?) + driver + paper + codepage + enable
  → Click "Test print"
  → testLocationPrinter server action → fetches bridge /test
  → Success: receipt with shop name + "Big5 Test: 中文測試"
Admin: Save, done
```
**Verdict:** ⚠️ Admin needs to know the endpoint URL. Where does it come from? Per §9.1 step 10, the install script prints it. So installer must share it to admin. No in-admin way to learn it.
**Recommendation:** per M3, make provisioning an admin server action — URL is generated in admin, never needs to be typed.

### W4. I1 — First-time shop install (reseller field tech)
```
Installer: unboxes, plugs in
  → runs install.sh
  → prompts tenant slug (e.g. "countingstars")
  → script downloads cloudflared, calls CF API (needs CF_API_TOKEN)
  → creates tunnel + DNS
  → prints endpoint URL + initial token
  → installer opens admin, pastes URL + token
  → tests from admin → OK
```
**Verdict:** ⚠️ Bootstrapping security (M3). Installer holds CF API token.

### W5. I4 — Bridge swap (replace Pi with mini PC)
```
Installer: new mini PC at shop, install script runs
  → creates NEW tunnel (different UUID)
  → new endpoint URL (different subdomain? or updated CNAME?)
  → old bridge still has old credentials and keeps sending heartbeats
  → admin sees two locations sharing a locationId (or collides)
```
**Verdict:** ❌ Scenario not cleanly handled
**Recommendation:** Install script has a `--migrate-from <old-bridge-endpoint>` flag. Or admin B1/B2 actions support swapping endpoint URL without re-provisioning the whole row. Explicitly documented in Phase 4 deployment plan.

### W6. AT-22 — Auto-update
```
Bridge: daily systemd timer
  → npm outdated -g @retailai/printer-bridge
  → if new: npm install -g @retailai/printer-bridge@latest
  → systemctl restart printer-bridge
```
**Verdict:** ⚠️ No rollback if new version is broken — shop is stuck offline. What if the new version has an argon2id → HMAC migration bug and rejects all old tokens?
**Recommendation:** Keep last-known-good version pinned; on daemon startup, self-test against known-good token; if self-test fails, revert to previous. Pairs with S5 "force update" for operator override.

### Scenario coverage summary

| Scenario | Priority | Verdict | Notes |
|---|---|---|---|
| C1 print happy | P0 | ✅ (after M2) | |
| C2 reprint | P0 | ✅ | |
| C3 cash drawer | P0 | ✅ | |
| C4 out of paper | P0 | ❌ | Need getDeviceStatus, not heuristic |
| C5 network down | P0 | ✅ | |
| C6 multi-copy | P0 | ✅ | |
| C7 codepage | P0 | ✅ (after m2 default) | |
| O1 first-time setup | P0 | ⚠️ | URL-sharing UX (M3 fix) |
| O2 printer swap | P0 | ✅ | |
| O3 paper width | P0 | ✅ | |
| O4 multi-location | P0 | ✅ | |
| I1 first install | P0 | ⚠️ | CF token exposure (M3) |
| I2 macOS install | P0 | ✅ | |
| I3 OpenWRT install | P1 | ⚠️ | Node on OpenWRT varies by arch |
| I4 bridge swap | P1 | ❌ | No migration flow (W5) |
| S1 remote triage | P0 | ⚠️ | No alerting (M5) |
| S2 distinguish failure | P0 | ⚠️ | Disabled-vs-offline conflate (M4) |
| D1 dev reproduction | P0 | ✅ | |
| AT-22 auto-update | P1 | ⚠️ | No rollback (W6) |

**Count:** ✅ 11/19 | ⚠️ 6/19 | ❌ 2/19

Two ❌ for P0 scenarios = not blockers (fixable with Major issue fixes), but requires 🔴 attention before v1 ships.

---

## Reference Comparison

| Aspect | YP SHOPS (reference) | Our design | Verdict |
|---|---|---|---|
| Printer connection | LAN + manual IP config | Cloud tunnel + auto-DNS | ✅ Better (scale + remote ops) |
| Printer brand support | Vendor-locked | Any USB ESC/POS | ✅ Better |
| Printer setup UX | Printer IP in a field | Paste endpoint URL (⚠️ M3) | ✅ Same complexity if M3 fixed |
| Multi-location | Per-shop local | Per-location cloud | ✅ Better |
| Reseller diagnostics | Not really | Heartbeat + `/health` + admin fleet view | ✅ Better (after M5 fix) |
| Offline resilience | LAN works without internet | Fails offline (cloud-dependent) | ⚠️ Worse but accepted (§1.6) |
| Onboarding friction | Probably similar (setup docs) | More technical (tunnel, token) | ⚠️ Worse — document well |

**Overall:** Architecturally superior for the reseller's business model. UX friction is a fair trade; Phase 4 should document onboarding carefully.

---

## Architecture Assessment

| Component | Soundness | Scalability | Security | Verdict |
|---|---|---|---|---|
| `@retailai/escpos-shared` | ✅ Clean boundary | ✅ Stateless code | ✅ No secrets | ✅ |
| `@retailai/printer-bridge` daemon | ✅ Single process, clear | ✅ Per-shop isolated | ⚠️ M2 hashing | 🟡 after M2 |
| Transport adapters | ✅ Right pattern | ✅ | ✅ | ✅ |
| Cloudflare Tunnel | ✅ Right choice | ✅ Free tier ample | ⚠️ M3 API token | 🟡 after M3 |
| Bearer-token auth | ⚠️ Right idea, wrong hash | ✅ | ⚠️ M1 rotation | 🟡 after M1+M2 |
| Admin printer actions | ✅ | ✅ | ✅ | ✅ |
| Heartbeat endpoint | ✅ Pattern match to terminals | ✅ | ⚠️ M2 hashing | 🟡 after M2 |
| DB schema | ✅ Minimal, correct | ✅ | ✅ | ✅ |
| Install scripts | ⚠️ Per-platform variance | ✅ | ⚠️ M3 provisioning | 🟡 after M3 |
| Auto-update | ⚠️ No rollback (W6) | ✅ | 🔵 npm supply chain | 🔵 after W6 fix |

---

## Recommendations Summary

### Must do before Phase 4

1. **M1 — Implement `commands[]` + `rotate_token` command.** Without this, rotation is a silent footgun.
2. **M2 — Replace argon2id with HMAC-SHA256 for machine tokens.** Latency + backend CPU cost.
3. **M3 — Move CF provisioning to an admin server action.** Don't ship installer with CF API token.
4. **Fix C4 out-of-paper heuristic** — add `getDeviceStatus()` query where available; document Linux-raw-lp as best-effort.
5. **Fix W5 bridge-swap flow** — document how to migrate a bridge device without re-provisioning.

### Should do before Phase 4

6. **M4 — Three-state status (`enabled / disabled / maintenance`).**
7. **M5 — Fleet status view + simple alerting threshold.**
8. **W6 — Auto-update rollback on self-test failure.**

### Can do during implementation

9. m1 (audit log promotion)
10. m2 (codepage default + detect)
11. m3 (log rotation)
12. m4 (collapse `Idempotency-Key` and `jobId`)

### Suggestions to consider for v1.1

13. S1–S5 (keyboard shortcut, fleet dashboard, job replay, hardware inventory, force-update)

---

## Review Sign-off

| Item | Status |
|---|---|
| Blockers resolved | ✅ None found |
| Major issues resolved or accepted | ☐ Pending |
| Scenario ❌ count addressed | ☐ Pending (C4, W5) |
| User approves Phase 4 | ☐ Pending |
