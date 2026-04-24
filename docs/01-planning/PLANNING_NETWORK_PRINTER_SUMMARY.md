# Network Printer Module — Planning Summary

| Field | Value |
|---|---|
| **Project** | Macau POS |
| **Module** | Network Printer |
| **Full planning doc** | `PLANNING_NETWORK_PRINTER.md` |
| **Product review** | `PRODUCT_REVIEW_NETWORK_PRINTER.md` |
| **Status** | Phase 4 — Final review, awaiting approval to start implementation |
| **Last updated** | 2026-04-24 |

---

## One-paragraph TL;DR

Cashier iPads on Safari can't reach USB thermal printers directly (no Web USB, no Web Bluetooth, no raw TCP, HTTPS mixed-content wall). This module adds a **shop-side bridge device** (customer's Mac / Pi / mini PC / router — any Node-capable host) that runs `@retailai/printer-bridge`, reachable from the cashier via Cloudflare Tunnel at `print-<slug>.hkretailai.com`. The cashier builds ESC/POS bytes in the browser using `@retailai/escpos-shared`, POSTs them over HTTPS with a bearer token, the bridge writes to USB, printer outputs paper. Router-agnostic. Any USB ESC/POS thermal works. Admin configures + tests from `apps/admin`. Heartbeats + commands channel enable remote ops, token rotation, and auto-update with rollback.

---

## Hardware bundle (reseller SKU)

| Component | HKD (cost) | Notes |
|---|---|---|
| iPad 10th gen Wi-Fi 64GB | 2,800 | Cashier device |
| Xprinter N160II (or any USB ESC/POS thermal) | 500 | Interchangeable stock; customer can swap brands freely |
| **Bridge device** (customer's choice) | 0–1,500 | Mac, Pi, mini PC, OpenWRT router — any Node-capable host with USB + network |
| Cash drawer + stand + cables | 950 | Standard |
| Router | 0 | Customer's existing router, any brand |
| **Total per shop** | **~HKD 4,250–5,750** | |
| **Sell price** | **HKD 7,500–10,500** | Margin HKD 2,750–5,250/unit |

---

## Architecture at a glance

```
iPad Safari ──HTTPS──▶ Cloudflare Tunnel ──▶ Bridge device ──USB──▶ USB thermal printer
(pos.hkretailai.com)    (print-<slug>...)     (Node daemon)         (Xprinter / any ESC/POS)
                                                  │
                                                  └─heartbeat──▶ admin.hkretailai.com
                                                                 (last_seen + commands)
```

**Single source of truth for ESC/POS bytes:** `@retailai/escpos-shared` package. Browser builds bytes client-side, bridge just forwards. CI byte-parity test prevents drift.

---

## Delivered features (v1)

**Cashier (P0):**
- Print after payment (≤3s end-to-end)
- Reprint from history
- Cash drawer kick
- Multi-copy print
- CJK codepage support (Big5, GB18030, Shift_JIS)
- Graceful failure toasts — never blocks order completion
- Fallback to existing `window.print()` iframe when printer not configured

**Admin (P0):**
- Per-location printer config (driver / paper / codepage / copies / cash drawer)
- One-click server-side provisioning (CF API token stays on ECS)
- Bootstrap JWT flow for installer (1-hour TTL, one-time use)
- Test print button
- Bridge migration (swap hardware without changing cashier config)
- Three-state status: `enabled` / `disabled` / `maintenance`
- Token rotation via heartbeat commands (no bridge SSH required)
- Fleet dashboard + offline alerting

**Bridge (P0):**
- Cross-platform daemon (macOS / Linux / OpenWRT / Windows)
- Transport adapters: `linux-lp` / `node-usb` / `cups` with auto-detect
- HMAC-SHA256 bearer-token verify (<10μs per request)
- Rate limiting (10 req/s per token)
- Idempotency cache (5-min window)
- Heartbeat every 60s with command channel
- Auto-update with self-test + automatic rollback
- One-command install per platform

---

## Security model

- TLS end-to-end (CF edge + tunnel)
- Bearer token: 32-byte random, HMAC-SHA256 hashed with server-side pepper
- Token rotation via heartbeat `commands[]` with 10-minute overlap (no downtime)
- CF API token lives only on admin ECS; installers never see it
- Bootstrap JWT (1h TTL, one-time use) for installer exchange
- Bridge daemon runs as unprivileged user
- Per-token rate limiting + idempotency protects against replay
- Admin RBAC scopes provisioning to tenant

---

## What's explicitly out of scope (v1)

- ❌ Kitchen printer / category routing
- ❌ Label printer (CPCL / TSC)
- ❌ Laser / inkjet printer support
- ❌ Offline print queue (tunnel outage = fall back to iframe)
- ❌ Auto-detection of printer model via USB VID/PID
- ❌ CloudPRNT-style polling
- ❌ Print-job audit log (v1.1)
- ❌ Keyboard shortcut (v1.1)
- ❌ iOS native app wrapper

---

## Build plan (16 phases, A→P)

| # | Phase | Days | Parallel with |
|---|---|---|---|
| A | escpos-shared package | 1.5 | B |
| B | Migration 0006 | 0.5 | A |
| C | Bridge daemon skeleton | 2.0 | — |
| D | Transport adapters (usb, cups) | 1.5 | — |
| E | /print + /test handlers | 1.5 | — |
| F | Heartbeat loop + endpoint | 1.5 | — |
| G | Command channel | 1.5 | — |
| H | Admin UI + actions + fleet dashboard | 2.5 | J |
| I | Server-side CF provisioning | 1.5 | — |
| J | Install scripts per platform | 2.0 | H |
| K | Bridge migration (--migrate) | 0.5 | — |
| L | Self-update + rollback | 1.0 | — |
| M | Cashier integration + i18n | 2.0 | N |
| N | Sentry alerts + monitoring | 0.5 | M |
| O | End-to-end QA on CountingStars | 1.0 | — |
| P | Documentation / SOP | 0.5 | — |

**Serial total:** 22 days. **2-dev parallel:** ~14 days.

---

## Product review outcome

See `PRODUCT_REVIEW_NETWORK_PRINTER.md`.

| Severity | Original | Remaining after fixes |
|---|---|---|
| 🔴 Blocker | 0 | 0 |
| 🟡 Major | 5 | 0 (all fixed) |
| 🔵 Minor | 5 | 4 (1 folded into v1: m4) |
| 💡 Suggestion | 5 | 5 (v1.1 backlog) |

Scenario coverage: **19/19 ✅** after fixes.

---

## Open questions needing user answer before Phase A

1. `@retailai/*` npm scope — OK to use pre-rename?
2. Existing or new Cloudflare account?
3. Windows 11 support — keep P1 or drop?
4. Audit log promotion v1.1 → v1?
5. Force-update command — include in v1?
6. Epson TM-T20 for AT-21 testing — available?
7. First-shop rollout order (CountingStars dev → 853mask)?

---

## Files produced

- `docs/01-planning/PLANNING_NETWORK_PRINTER.md` — full 17-section planning doc
- `docs/01-planning/PRODUCT_REVIEW_NETWORK_PRINTER.md` — review findings
- `docs/01-planning/PLANNING_NETWORK_PRINTER_SUMMARY.md` — this file

Ready for sign-off to proceed to implementation (Phase A).
