# Network Printer — Test Plan (Phase C)

| Field | Value |
|---|---|
| **Module** | Network Printer |
| **Phase** | C — Test Plan |
| **Persona** | 🎭 Data Engineer + Frontend Developer |
| **Date** | 2026-04-24 |
| **Blueprint** | `PLAN-12-network-printer.md` (Phase B, signed off) |
| **Planning** | `docs/01-planning/PLANNING_NETWORK_PRINTER.md` |
| **Status** | Awaiting sign-off to proceed to Phase D (Pre-coding gate) |

---

## 1. Test strategy

**Pyramid:**

```
            ┌─────────────────────┐
            │  E2E (QA playbook)  │   8 scenarios — QA-001…QA-008
            │   on real hardware  │   manual + scripted
            └─────────────────────┘
         ┌──────────────────────────┐
         │    Integration tests     │  ~15 tests — vitest in CI
         │   (multi-component)      │
         └──────────────────────────┘
      ┌────────────────────────────────┐
      │        Unit tests              │  ~60 tests — vitest in CI
      │   (package-level, fast)        │
      └────────────────────────────────┘
   ┌──────────────────────────────────────┐
   │      Byte-parity test (critical)     │  1 big test suite — prevents R11
   └──────────────────────────────────────┘
```

**Rule:** A bug should be caught at the lowest layer possible. Every AT-xx acceptance test has a unit / integration / E2E representative.

**What we DON'T test:**
- Cloudflare's own tunnel uptime (their SLO)
- Node.js runtime semantics
- Drizzle ORM correctness (covered by Drizzle's own tests)
- USB kernel driver behavior (we test the adapter surface, not the driver)

## 2. Tooling

| Tool | Purpose | Where |
|---|---|---|
| **Vitest** | Unit + integration test runner | Every package |
| **`happy-dom`** | Browser environment for cashier tests | `apps/cashier` + `@macau-pos/escpos-shared` byte-parity |
| **Playwright** | E2E browser tests | `apps/cashier` + `apps/admin` against dev server |
| **`msw`** (Mock Service Worker) | HTTP mocking (Cloudflare API, bridge endpoints) | Integration |
| **Postgres container** (testcontainers) | Real DB for integration | `apps/admin` + `packages/database` |
| **`supertest`** | HTTP assertion against bridge daemon | `printer-bridge` integration |
| **Physical USB printer** (N160II) | Final end-to-end + QA playbook | Manual dev + staging |
| **`vitest-mock-extended`** | Type-safe mocks | Where needed |

**Coverage target:** 80% statements on new code; 100% on security-critical paths (HMAC verify, bootstrap JWT, token rotation).

---

## 3. Unit tests

### 3.1 `@macau-pos/escpos-shared`

File: `packages/escpos-shared/tests/driver-generic.test.ts`

| # | Test | Expected output (first 8 bytes) |
|---|---|---|
| U-ESC-01 | `genericDriver.init()` | `1B 40` (ESC @) |
| U-ESC-02 | `genericDriver.align('center')` | `1B 61 01` |
| U-ESC-03 | `genericDriver.align('right')` | `1B 61 02` |
| U-ESC-04 | `genericDriver.emphasis(true)` | `1B 45 01` |
| U-ESC-05 | `genericDriver.doubleSize(true)` | `1B 21 30` |
| U-ESC-06 | `genericDriver.selectCodePage(0)` (CP437) | `1B 74 00` |
| U-ESC-07 | `genericDriver.selectCodePage(52)` (GB18030) | `1B 74 34` |
| U-ESC-08 | `genericDriver.feed(3)` | `1B 64 03` |
| U-ESC-09 | `genericDriver.cut('full')` | `1D 56 00` |
| U-ESC-10 | `genericDriver.cut('partial')` | `1D 56 01` |
| U-ESC-11 | `genericDriver.kickDrawer()` | `1B 70 00 19 19` |
| U-ESC-12 | `genericDriver.queryStatus()` | `10 04 04` (DLE EOT 4) |
| U-ESC-13 | `genericDriver.columns(58)` | `32` |
| U-ESC-14 | `genericDriver.columns(80)` | `48` |
| U-ESC-15 | `genericDriver.parseStatus(0x04)` | `{paperOut: true, coverOpen: false, error: false}` |

Repeat shape for `driver-star.test.ts` + `driver-epson.test.ts` — each validates the driver's unique overrides (Star partial-cut command, Epson partial-cut, codepage differences).

### 3.2 Codepage encoders

File: `packages/escpos-shared/tests/codepages.test.ts`

| # | Test | Input | Expected |
|---|---|---|---|
| U-CP-01 | CP437 encode "ABC" | `"ABC"` | `0x41 0x42 0x43` |
| U-CP-02 | Big5 encode "中文" | `"中文"` | `0xA4 0xA4 0xA4 0xE5` |
| U-CP-03 | GB18030 encode "中文" | `"中文"` | `0xD6 0xD0 0xCE 0xC4` |
| U-CP-04 | Shift_JIS encode "あいう" | `"あいう"` | `0x82 0xA0 0x82 0xA2 0x82 0xA4` |
| U-CP-05 | Big5 encode unknown char → `?` | `"中𠮷"` (rare char) | `0xA4 0xA4 0x3F` |
| U-CP-06 | Mixed ASCII + CJK round-trip | `"Order 123 中文"` | bytes decode back to original |
| U-CP-07 | Portuguese accents in CP437 | `"Olá"` | `0x4F 0x6C 0xA0` (`á` = 0xA0 in CP437) |
| U-CP-08 | Empty string | `""` | `Uint8Array(0)` |
| U-CP-09 | Long string (10KB) doesn't OOM | 10k ASCII chars | length = 10000 |

### 3.3 Receipt builder

File: `packages/escpos-shared/tests/build-receipt.test.ts`

| # | Test | Setup | Assertion |
|---|---|---|---|
| U-RCP-01 | 80mm generic Big5 fixture | `fixtures/receipt-80-big5.json` → `buildReceipt(...)` | Byte output matches `fixtures/receipt-80-big5.bin` (golden file) |
| U-RCP-02 | 58mm generic CP437 fixture | 58mm + English | Matches golden |
| U-RCP-03 | With discount line | Receipt with 10% discount | Discount row appears indented, amount right-aligned |
| U-RCP-04 | Cash payment + change | Receipt with cashReceived/change | Two extra lines after total |
| U-RCP-05 | Cash drawer kick appended | `kickDrawer: true` | Last bytes include `1B 70 00 19 19` |
| U-RCP-06 | Custom footer text | `footer: "Thanks!"` | Appears between total and cut |
| U-RCP-07 | Locale=ja renders JP thank-you | `locale: 'ja'` | `"ありがとうございました"` bytes present |
| U-RCP-08 | Empty items array | `items: []` | Still produces valid output (subtotal=0) |
| U-RCP-09 | Column count > paper width → wraps | Item name 50 chars on 58mm (32 cols) | Wraps to 2 lines |

Golden files live in `packages/escpos-shared/tests/fixtures/`. Regeneration: `pnpm -F escpos-shared test:update-fixtures`.

### 3.4 Test-page builder

File: `packages/escpos-shared/tests/build-test-page.test.ts`

| # | Test | Assertion |
|---|---|---|
| U-TP-01 | All 4 codepages produce test pages | No throws |
| U-TP-02 | Big5 test page contains 中文測試 encoded | Bytes for Chinese in Big5 present |
| U-TP-03 | Empty shop name doesn't crash | Still valid output |

### 3.5 `@macau-pos/printer-bridge`

File: `packages/print-server/tests/unit/bearer-auth.test.ts`

| # | Test | Setup | Expected |
|---|---|---|---|
| U-AUTH-01 | Valid token → true | Token hash matches | `true` written to res; next handler called |
| U-AUTH-02 | Invalid token → 401 | Hash doesn't match | Response 401, error code `unauthorized` |
| U-AUTH-03 | No Authorization header → 401 | missing header | 401 |
| U-AUTH-04 | Malformed Bearer header → 401 | `Bearer <spaces>` | 401 |
| U-AUTH-05 | HMAC verify timing is constant | 1000 iterations with valid + invalid | variance < 5% |
| U-AUTH-06 | Verify runs <50μs | Benchmark | p99 < 50μs |

File: `packages/print-server/tests/unit/idempotency.test.ts`

| # | Test | Assertion |
|---|---|---|
| U-IDEM-01 | First request, no cache entry → `hit: false` | |
| U-IDEM-02 | Repeat same `Idempotency-Key` within 5 min → `hit: true` with cached body | |
| U-IDEM-03 | After 5 min, cache miss again | Uses fake timers |
| U-IDEM-04 | LRU eviction at 10k entries | |
| U-IDEM-05 | Missing `Idempotency-Key` header → reject (400) | |

File: `packages/print-server/tests/unit/rate-limit.test.ts`

| # | Test | Assertion |
|---|---|---|
| U-RL-01 | 10 req/s within budget → all pass | |
| U-RL-02 | 11th req/s → 429 | |
| U-RL-03 | Burst of 20 allowed | |
| U-RL-04 | Refill at 10/sec | Wait 1s, 10 more allowed |
| U-RL-05 | Per-token isolation (different tokens don't cross-limit) | |

File: `packages/print-server/tests/unit/transports.test.ts`

| # | Test | Assertion |
|---|---|---|
| U-TX-01 | `LinuxLpAdapter.findLpDevice` scans lp0–lp3 | |
| U-TX-02 | `LinuxLpAdapter.write` with no device → `PrinterOfflineError` | |
| U-TX-03 | `LinuxLpAdapter.write` with timeout → `PrinterTimeoutError` | |
| U-TX-04 | `NodeUsbAdapter.probe` parses status byte correctly | Fake USB returns 0x04 → `paperOut: true` |
| U-TX-05 | `CupsAdapter.write` shells out to `lp` with correct args | Mock `child_process.spawn` |
| U-TX-06 | `detect()` on linux picks `LinuxLpAdapter` when lp exists | |
| U-TX-07 | `detect()` falls back to CUPS when node-usb throws on init | |

File: `packages/print-server/tests/unit/self-update.test.ts`

| # | Test | Assertion |
|---|---|---|
| U-UPD-01 | New version self-test passes → success | Mock npm + restart |
| U-UPD-02 | Self-test fails → rollback to previous | Previous version re-installed |
| U-UPD-03 | Rollback also fails → critical Sentry event | |
| U-UPD-04 | Install of same version → skip | No npm call |

File: `packages/print-server/tests/unit/commands.test.ts`

| # | Test | Assertion |
|---|---|---|
| U-CMD-01 | `rotate_token` applies → config.token updated, written atomically | |
| U-CMD-02 | `reload_config` re-reads disk | |
| U-CMD-03 | `force_update` invokes self-update | |
| U-CMD-04 | Unknown command → error logged, no ACK | Server re-sends next heartbeat |
| U-CMD-05 | Command failure → no ACK | Ensures re-delivery |

### 3.6 Admin server actions

File: `apps/admin/src/lib/__tests__/printer-actions.test.ts`

| # | Test | Assertion |
|---|---|---|
| U-ACT-01 | `getLocationPrinterSettings` respects tenant scope | Different tenant returns null |
| U-ACT-02 | `updateLocationPrinterSettings` rejects invalid driver | Zod validation |
| U-ACT-03 | `rotateLocationPrinterToken` sets `pending_token_hash` + overlap | DB assertions |
| U-ACT-04 | `rotateLocationPrinterToken` errors `command_pending` when another rotation in flight | |
| U-ACT-05 | `provisionLocationPrinter` calls CF API exactly once | MSW intercept |
| U-ACT-06 | `provisionLocationPrinter` idempotent-error on re-provision | `already_provisioned` |
| U-ACT-07 | `testLocationPrinter` fetches bridge `/test` with HMAC | |
| U-ACT-08 | `setLocationPrinterStatus → 'disabled'` removes tunnel if opts.destroyTunnelOnDisable | CF DELETE called |
| U-ACT-09 | `migrateLocationPrinterBridge` reuses tunnel_id | No CF create call |
| U-ACT-10 | `getFleetPrinterStatus` computes alert levels correctly | <4h = ok, 4–24h = warning, >24h = error |

### 3.7 Hash helpers

File: `apps/admin/src/lib/__tests__/printer-hash.test.ts`

| # | Test | Assertion |
|---|---|---|
| U-HASH-01 | `generateRawToken()` returns 43-char base64url | 32 bytes encoded |
| U-HASH-02 | `hashToken(same)` deterministic | Same input → same output |
| U-HASH-03 | `verifyToken(raw, hashedRaw)` → true | |
| U-HASH-04 | `verifyToken(raw, otherHash)` → false | |
| U-HASH-05 | Missing `APP_PEPPER` env → throws on hash | Clear error |
| U-HASH-06 | Constant-time comparison | Timing doesn't leak |

### 3.8 Bootstrap JWT

File: `apps/admin/src/lib/__tests__/printer-jwt.test.ts`

| # | Test | Assertion |
|---|---|---|
| U-JWT-01 | `signBootstrap` + `verifyBootstrap` round-trip | Claims intact |
| U-JWT-02 | Expired JWT → verifyBootstrap throws | |
| U-JWT-03 | Tampered signature → throws | |
| U-JWT-04 | Missing `aud: 'printer-bridge'` → throws | |
| U-JWT-05 | `jti` uniqueness — same `jti` twice in cache → second use rejected | With in-memory cache |

### 3.9 Cashier

File: `apps/cashier/src/lib/__tests__/printer.test.ts`

| # | Test | Assertion |
|---|---|---|
| U-CASH-01 | `sendPrintJob(config=null, ...)` → iframe fallback | `method: 'iframe'` |
| U-CASH-02 | `sendPrintJob` with healthy config → POSTs to endpoint | msw intercept |
| U-CASH-03 | Response `ok:true` → `{ok: true, durationMs, method: 'network'}` | |
| U-CASH-04 | Response `error:'no_paper'` → `{ok: false, error: 'no_paper', retryable: true}` | |
| U-CASH-05 | Fetch abort → `error: 'network_unreachable'` | |
| U-CASH-06 | Respects `copies` param | Body includes `copies: N` |
| U-CASH-07 | `kickDrawer` only on cash payment + cashDrawerEnabled=true | Assertions on body |
| U-CASH-08 | Generates fresh `Idempotency-Key` per call | UUIDs differ |

---

## 4. Byte-parity test (critical — prevents R11)

Single highest-value test in the suite. Asserts browser and Node produce identical ESC/POS bytes.

File: `packages/escpos-shared/tests/byte-parity.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { buildReceipt } from '../src/builder/build-receipt';
import fixtures from './fixtures/receipt-cases.json';

describe('byte parity: browser vs Node', () => {
  for (const fx of fixtures) {
    it(`fixture ${fx.name} produces deterministic bytes`, () => {
      // vitest environment is 'happy-dom' in this file's block
      const bytesA = buildReceipt(fx.options, fx.receipt);

      // Run same function in separate isolated context
      const bytesB = buildReceipt(fx.options, fx.receipt);

      expect(bytesA).toEqual(bytesB);
      expect(Buffer.from(bytesA).toString('hex')).toMatchSnapshot();
    });
  }
});
```

**Fixture set (10 cases):**
1. 80mm generic Big5 — Macau cash sale
2. 58mm generic CP437 — English receipt
3. 80mm star Big5 — uses partial cut
4. 80mm epson GB18030 — Simplified Chinese
5. 80mm generic Shift_JIS — Japanese
6. 58mm generic CP437 — Portuguese accents
7. 80mm generic with cash drawer kick
8. 80mm generic multi-copy (copies=3)
9. 80mm generic 50-item order (stress)
10. 58mm generic discount + tax + change

**Acceptance:** bytes match across (a) first Node run, (b) repeat Node run, (c) happy-dom browser run (same fixture, same code, different environment).

**Run in CI as a blocking check.**

---

## 5. Integration tests

### 5.1 Bridge daemon end-to-end

File: `packages/print-server/tests/integration/round-trip.test.ts`

Setup: spin up daemon in-process on random port; use a **mock transport** (writes to `Buffer` instead of `/dev/usb/lp0`); assert responses.

| # | Test | Assertion |
|---|---|---|
| I-BR-01 | POST /print with valid bytes → 200 + `ok:true` | Mock transport received bytes |
| I-BR-02 | POST /print with wrong token → 401 | |
| I-BR-03 | POST /print with replay `Idempotency-Key` → 200 (cached) + `X-Replay: true` | |
| I-BR-04 | POST /print with 64KB+1 body → 413 | |
| I-BR-05 | POST /test → test page bytes on transport | |
| I-BR-06 | GET /health with mock printer up → `printerUp: true` | |
| I-BR-07 | GET /health with mock printer offline → `printerUp: false`, `lastError` set | |
| I-BR-08 | GET /version → plain text version | |
| I-BR-09 | 11 requests/sec → last is 429 | |
| I-BR-10 | Concurrent 2× POST /print — semaphore serializes | Second waits, both complete |
| I-BR-11 | Token rotation command — daemon applies, config persists | Restart reads new token |

### 5.2 Admin heartbeat endpoint

File: `apps/admin/src/app/api/printers/heartbeat/__tests__/route.test.ts`

Setup: Postgres testcontainer, actual schema applied.

| # | Test | Assertion |
|---|---|---|
| I-HB-01 | Valid heartbeat → `last_seen_at` updated | DB read |
| I-HB-02 | Heartbeat with `ackedCommandId` → command cleared | |
| I-HB-03 | Pending `rotate_token` → returned in commands[] | Payload present |
| I-HB-04 | `status='disabled'` → 410 | |
| I-HB-05 | `status='maintenance'` → `mode: 'maintenance'` in response | |
| I-HB-06 | Token during overlap window → both primary + pending hashes accept | |
| I-HB-07 | ACK of rotate_token → primary becomes pending, pending cleared | |

### 5.3 Admin bootstrap endpoint

File: `apps/admin/src/app/api/printers/bootstrap/__tests__/route.test.ts`

| # | Test | Assertion |
|---|---|---|
| I-BS-01 | Valid JWT, not used → returns credentials | DB `bootstrap_used=true` |
| I-BS-02 | Expired JWT → 401 | |
| I-BS-03 | JWT already used → 410 | |
| I-BS-04 | Migrate JWT + existing row → reuses tunnel_id | |

### 5.4 Provisioning end-to-end

File: `apps/admin/src/lib/__tests__/provisioning.integration.test.ts`

Uses msw to mock Cloudflare API.

| # | Test | Assertion |
|---|---|---|
| I-PRV-01 | `provisionLocationPrinter` creates CF tunnel + DNS + DB row | MSW recorded calls + DB row exists |
| I-PRV-02 | CF API failure → rollback (no DB row) | |
| I-PRV-03 | DB row already exists → `already_provisioned` | |
| I-PRV-04 | Bootstrap token cached, retrievable within 1h | |
| I-PRV-05 | `migrateLocationPrinterBridge` reuses existing tunnel_id | No CF create call |

### 5.5 Cashier end-to-end (happy-dom)

File: `apps/cashier/src/components/receipt/__tests__/print-receipt.integration.test.tsx`

| # | Test | Assertion |
|---|---|---|
| I-CE-01 | Print with config → sends POST + shows success toast | |
| I-CE-02 | Print with null config → falls back to iframe | Iframe mounted |
| I-CE-03 | Print failure `no_paper` → red toast + button re-enabled | |
| I-CE-04 | Network timeout → toast within 4s | |
| I-CE-05 | Multiple copies → 1 POST with `copies: N` | |
| I-CE-06 | Cash payment + cashDrawerEnabled → `kickDrawer: true` in body | |

---

## 6. E2E tests (Playwright)

File: `apps/cashier/e2e/printer.spec.ts`

Runs against local dev server with mock printer-bridge on localhost:3901.

| # | Test | Maps to Planning AT |
|---|---|---|
| E-01 | Happy-path print after cash payment | AT-01 |
| E-02 | Reprint from history | AT-02 |
| E-03 | Network-down simulation → toast | AT-05 |
| E-04 | Multi-copy print | AT-08 |

File: `apps/admin/e2e/printer.spec.ts`

| # | Test | Maps to Planning AT |
|---|---|---|
| E-05 | Provision new location end-to-end (mock CF) | AT-13 (software portion) |
| E-06 | Test print from admin | AT-09 |
| E-07 | Rotate token workflow | — (new post-M1) |
| E-08 | Set location to maintenance | — (new post-M4) |
| E-09 | Fleet dashboard shows offline shops | — (new post-M5) |
| E-10 | Migrate bridge | AT-17 (software portion) |

---

## 7. QA playbook (real hardware)

Run by a human following `PLANNING §2.5` exactly. Each produces a signed paper/photo evidence log.

| ID | Test | Pass criteria |
|---|---|---|
| QA-001 | First-time install on Raspberry Pi 4 | Test print arrives ≤ 5s after button tap; CJK renders correctly; total installer time ≤ 30 min |
| QA-002 | Cashier print under normal conditions | All 3 item names render; Chinese + Portuguese + English all correct; cash drawer opens |
| QA-003 | Printer out of paper | Red toast within 5s; order remains paid; reprint works after refill |
| QA-004 | Bridge device unplugged | Red toast; admin shows offline >60s later; reprint works after power-up |
| QA-005 | Multi-location isolation | Each counter prints to its own printer; no cross-print |
| QA-006 | Remote triage via admin | 3 distinguishable error messages (success / printer-down / bridge-down) |
| QA-007 | Paper width change (58 ↔ 80mm) | Both widths render without truncation |
| QA-008 | Driver swap (Generic → Epson) | Partial-cut activates on Epson; clean tear |

**Hardware required (from Phase A audit):** iPad + N160II + dev Mac. QA-008 blocked on Epson hardware.

---

## 8. Performance tests

| Metric | Target | Test |
|---|---|---|
| Print latency (p95) | <2s | `E-01` with 100 iterations — p95 timer |
| Print latency (p99) | <3s | same — p99 timer |
| HMAC verify (p99) | <50μs | `U-AUTH-06` |
| Heartbeat payload | <1 KB | `I-HB-01` byte count assertion |
| Bridge RAM (idle) | <100 MB | `printer-bridge start` + `ps` check 60s later |
| Bridge CPU (idle) | <5% | same, top sample |
| Admin /api/printers/heartbeat (p95) | <100ms | Integration timing |
| Fleet dashboard load (100 shops) | <500ms | Load test with seed data |

**Benchmarks:** `pnpm -F escpos-shared bench`, `pnpm -F printer-bridge bench` — vitest bench mode, CI tracks regressions.

---

## 9. Security tests

| ID | Test | Passes if |
|---|---|---|
| S-01 | POST /print with expired bootstrap JWT | 401 |
| S-02 | POST /print with swapped token (other shop's) | 401 |
| S-03 | CF API token never appears in logs | grep -r 'cf_api' logs → empty |
| S-04 | HMAC pepper never in Sentry events | Sentry breadcrumb filter test |
| S-05 | Admin actions reject cross-tenant | Explicit test each action |
| S-06 | Bootstrap JWT `jti` replay rejected | S-03/04 integration |
| S-07 | Rate-limit hit after stolen token used | `U-RL-01` covers |
| S-08 | CSRF on admin test-print | Existing CSRF test extended |
| S-09 | SQL injection via driver field (Zod blocks) | `U-ACT-02` covers |
| S-10 | `printer-bridge` daemon runs as unprivileged user | Install script test |

---

## 10. Test execution plan

### 10.1 Per-phase

| Phase | What runs |
|---|---|
| A (escpos-shared) | U-ESC-*, U-CP-*, U-RCP-*, U-TP-*, byte-parity |
| B (migration) | Drizzle migrate up/down on testcontainer |
| C–G (bridge daemon) | U-AUTH-*, U-IDEM-*, U-RL-*, U-TX-*, U-UPD-*, U-CMD-*, I-BR-* |
| H–I (admin) | U-ACT-*, U-HASH-*, U-JWT-*, I-HB-*, I-BS-*, I-PRV-*, S-* |
| J–K (install scripts) | Smoke test on fresh VM (macOS + Pi 4) |
| L (self-update) | U-UPD-* (unit) + manual rollback validation |
| M (cashier) | U-CASH-*, I-CE-*, E-01 to E-04 |
| N (monitoring) | Fleet alert job unit test + manual alert fire |
| O (QA) | QA-001 to QA-008 on real hardware |

### 10.2 Per-commit CI

- All unit tests (fast, <30s total)
- Byte-parity (blocking)
- Type-check
- Lint
- Migrations up/down on ephemeral Postgres

### 10.3 Per-PR CI

- All of above + integration tests (~2 min)

### 10.4 Nightly

- Benchmarks (perf regression detection)
- E2E Playwright against staging

### 10.5 Pre-release

- Full QA playbook on staging tenant
- Security review checklist (§9)

---

## 11. Test data management

### 11.1 Fixtures

| Fixture | Location | Purpose |
|---|---|---|
| 10 receipt cases | `packages/escpos-shared/tests/fixtures/receipt-cases.json` | Byte-parity |
| Golden byte outputs | `packages/escpos-shared/tests/fixtures/*.bin` | Regression |
| Mock CF responses | `apps/admin/src/lib/__tests__/fixtures/cf-*.json` | MSW handlers |
| Mock bridge responses | `apps/cashier/src/lib/__tests__/fixtures/bridge-*.json` | MSW handlers |

### 11.2 DB fixtures

Use existing Drizzle seed pattern from `@macau-pos/database`. New seed: `seedPrinterSettings(tenantSlug)` inserts a healthy row.

### 11.3 Sensitive data

- No real tokens in fixtures (use obvious placeholders: `"token": "FAKE_TEST_TOKEN_DO_NOT_USE"`)
- No real CF credentials (MSW intercepts all CF API calls)
- No real tenant data (test tenant `qa-test-1` isolated)

---

## 12. Traceability — AT-xx to tests

| Planning AT | Primary test | Secondary |
|---|---|---|
| AT-01 happy-path print | E-01 | U-RCP-01, I-CE-01 |
| AT-02 reprint history | E-02 | U-CASH-*, I-CE-01 |
| AT-03 out of paper | QA-003 + U-TX-04 | I-BR-* |
| AT-04 bridge offline | QA-004 | I-CE-04 |
| AT-05 network down | QA-004 variant + I-CE-04 | |
| AT-06 CJK codepage | U-CP-02, U-CP-03 + QA-002 | |
| AT-07 cash drawer | QA-002 + U-ESC-11 | U-CASH-07 |
| AT-08 multi-copy | E-04 | U-CASH-06 |
| AT-09 admin test print | E-06 | U-ACT-07 |
| AT-10 printer swap | QA-005 (variation) | |
| AT-11 paper width change | QA-007 | U-RCP-09 |
| AT-12 multi-location | QA-005 | U-ACT-01 |
| AT-13 Pi install | QA-001 | E-05 (software) |
| AT-14 macOS install | Manual smoke | |
| AT-15 OpenWRT install | Manual smoke (P1) | |
| AT-16 Windows install | Manual smoke (P1) | |
| AT-17 bridge swap | E-10 + manual | U-ACT-09 |
| AT-18 uninstall/reinstall | Install script tests | |
| AT-19 bridge up, printer down | QA-006 step 2 | I-BR-07 |
| AT-20 bridge down | QA-006 step 3 | |
| AT-21 Epson driver | QA-008 | U-ESC-* (Epson) |
| AT-22 auto-update | U-UPD-01 to U-UPD-03 + manual break-a-version |

**Every P0 AT covered. Every P1 AT covered (some manually).**

---

## 13. Phase C Sign-off

**Deliverables:**
- Test strategy (§1) + tooling choices (§2)
- Unit test catalog (§3) — ~60 tests across 9 files
- Byte-parity critical test (§4)
- Integration test catalog (§5) — ~25 tests
- E2E test list (§6) — 10 Playwright tests
- QA playbook mapping (§7) — 8 manual tests
- Performance (§8), security (§9), execution plan (§10)
- Test data management (§11)
- AT-xx traceability (§12)

**Decision required:** Is this test plan comprehensive enough to validate the implementation?

- [ ] Approved — proceed to Phase D (Pre-coding gate)
- [ ] Revisions needed — _specify below_

**User notes:**
_(to be filled)_
