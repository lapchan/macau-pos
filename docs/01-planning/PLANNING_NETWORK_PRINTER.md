# Network Printer Module — Planning Document

| Field | Value |
|---|---|
| **Project** | Macau POS |
| **Reference** | YP SHOPS (Macau Yellow Pages POS) |
| **Module** | Network Printer — cashier-driven thermal receipt printing via LAN bridge |
| **Document** | Module planning — cumulative across phases |
| **Version** | v0.1 |
| **Status** | Phase 0 — Draft, awaiting sign-off |
| **Phase** | 0 |
| **Date** | 2026-04-23 |

---

## 1. Project Intent

### 1.1 Context

The cashier app (`apps/cashier`, Next.js PWA, served from `pos.hkretailai.com` over HTTPS) currently prints receipts via `window.print()` into a hidden iframe. This works only with AirPrint-class printers on iPad Safari, which is a closed market (Star TSP100IV, Epson TM-m30 — ~HKD 2,000/unit).

The reseller strategy requires supporting **any USB thermal receipt printer** (Xprinter, Rongta, Munbyn, NetumScan class — HKD 400–600/unit) so the printer becomes interchangeable stock and the bundle price drops.

iPad Safari cannot reach a USB or LAN ESC/POS printer directly (no Web Bluetooth, no Web USB, no raw TCP, mixed-content wall blocks LAN HTTP). **A LAN-side HTTPS→USB bridge is architecturally required**.

The bridge runs on a **shop-side bridge device** — any device capable of running Node.js with USB printer access (Mac, Linux PC, mini PC, Raspberry Pi, or OpenWRT router with Node). **The shop's router is NOT part of our stack** — it's treated as generic network infrastructure. Customers may use any router (TP-Link, Asus, Xiaomi, Netgear, the ISP-provided modem/router, whatever they have).

### 1.2 Module identity

| Field | Value |
|---|---|
| **Module name** | Network Printer |
| **Working title** | `network-printer` module |
| **One-sentence description** | Thermal-receipt printing from iPad Safari to any USB ESC/POS printer via a per-shop LAN bridge (GL.iNet OpenWRT router) exposed over HTTPS by Cloudflare Tunnel. |
| **Integration points** | `apps/cashier` (print trigger + ESC/POS byte builder in browser), `apps/admin` (per-location config + test print), `packages/database` (`shop_settings` extensions), `packages/print-server` (the shipped cross-platform Node daemon that runs on the bridge device in production). |
| **Users** | Cashier (end-user), shop owner (admin config), reseller installer (per-shop rollout). |
| **Key problem solved** | Removes the AirPrint-only limitation and unlocks a ~HKD 1,000–1,500 hardware cost reduction per shop, at the cost of a one-time HKD ~600 per-shop bridge device and ~15 min of per-shop setup. |
| **Target scale** | 1–100 shops during trial/early-reseller phase; architecture must scale to 1,000+ without structural change. |

### 1.3 Hardware (reference bundle)

The cashier + printer components are standard. The **bridge device** is the customer's/reseller's choice — see §1.3.1.

| Component | Model (reference) | HKD (cost) |
|---|---|---|
| Cashier device | iPad 10th gen Wi-Fi 64GB | 2,800 |
| Receipt printer | Xprinter N160II (or any USB ESC/POS thermal) | 500 |
| Bridge device | **See §1.3.1 — varies HKD 0–1,500** | 0–1,500 |
| Cash drawer | Generic 16" 24V RJ11 | 450 |
| iPad stand + cables + PSU | | 500 |
| Router | **Customer's choice — any brand, any model, not part of our SKU** | 0 |
| **Hardware cost/shop (bridge excluded)** | | **~HKD 4,250** |
| **Hardware cost/shop (with typical bridge)** | | **~HKD 4,650–5,750** |
| Suggested sell price | | **HKD 7,500–10,500** |

#### 1.3.1 Supported bridge devices

The print-server daemon ships as a cross-platform Node.js service. **Any device that can run Node.js and access USB** qualifies. Tested/supported:

| Bridge device | HKD | OS | Notes |
|---|---|---|---|
| **Customer's existing laptop/PC** (Mac, Windows, Linux) | 0 | any | Cheapest — uses whatever is already on site |
| **Developer's Mac** (dev/trial only) | 0 | macOS | For development and initial shop trials |
| **Used Mac Mini (M1)** | 800–2,000 | macOS | Reliable, silent, good for premium tier |
| **Mini PC** (Beelink / GMKtec / Mele N100) | 900–1,500 | Linux / Win | Most compatible via CUPS, can run other services |
| **Raspberry Pi 4 2GB** kit | 500–700 | Raspberry Pi OS | Standard hobbyist path, works well |
| **Raspberry Pi Zero 2W** kit | 300–400 | Raspberry Pi OS | Smallest footprint |
| **Orange Pi Zero 3** kit | 300–400 | Armbian | Pi alternative |
| **GL.iNet router** (Beryl AX, Slate AX, Flint 2) | 500–1,100 | OpenWRT + Node | Doubles as the shop's router if desired; not required |
| **Other OpenWRT-capable routers** (TP-Link C9, Asus RT-AX58U, Xiaomi flashed) | 300–900 | OpenWRT + Node | Supported if Node installs cleanly; customer/reseller responsible for flashing |

Requirements for any bridge device:
- Node.js 20+ runtime
- USB host port (USB-A or USB-C with adapter)
- Network connectivity (Wi-Fi or Ethernet) with outbound HTTPS for Cloudflare Tunnel
- Always-on during shop hours
- USB printer class support at OS level (macOS CUPS / Linux `usblp` kernel module / Windows printer driver / OpenWRT `kmod-usb-printer`)

**Dev phase:** the developer's Mac is the bridge. Same Node daemon, same architecture, same code. Production deployment differs only in deployment target (Mac → Linux/OpenWRT).

### 1.4 Feature scope

| # | Feature | In v1? | Priority | Notes |
|---|---|---|---|---|
| F1 | Print receipt from cashier to shop's USB thermal printer | ✅ | P0 | Core use case |
| F2 | Test-print button in admin for configuring printer | ✅ | P0 | Needed for installation |
| F3 | Printer driver selection (Generic ESC/POS / Star / Epson) | ✅ | P0 | Covers brand differences without forking UI |
| F4 | Paper width config (58mm / 80mm) | ✅ | P0 | Common SKU variance |
| F5 | Code page config (CP437 / GB18030 / Big5 / Shift_JIS) | ✅ | P0 | Required for CJK characters |
| F6 | Per-location printer config (not per-tenant) | ✅ | P0 | Multi-location tenants need independent printers |
| F7 | Browser-side ESC/POS byte builder | ✅ | P0 | Runs in cashier; driver logic in JS shipped with PWA |
| F8 | Cloudflare Tunnel per shop | ✅ | P0 | Solves HTTPS mixed-content wall; runs on bridge device |
| F9 | Cross-platform Node print-server daemon | ✅ | P0 | `packages/print-server` — runs on Mac / Linux / OpenWRT / Windows, exposes `POST /print` → USB printer |
| F10 | Print-job success/failure toast in cashier | ✅ | P0 | UX feedback |
| F11 | Automatic retry on transient failure (1–2 retries) | ✅ | P1 | Network flicker tolerance |
| F12 | Keep existing `window.print()` iframe path as fallback | ✅ | P1 | For AirPrint-bundle customers if we ever offer a premium tier |
| F13 | Print-preview before send (on-screen receipt) | ✅ | P1 | Already exists in current code |
| F14 | Cash drawer kick command (pulse-on-print) | ✅ | P1 | Standard ESC/POS `ESC p 0` sequence |
| F15 | Star-mode driver overrides (cutter, logo-store) | ✅ | P1 | For premium customers |
| F16 | Epson-mode driver overrides | ✅ | P1 | For premium customers |
| F17 | Admin dashboard: printer status per shop (last-seen) | ⚠️ | P2 | Useful for reseller support; defer if time-constrained |
| F18 | Print-job audit log (who printed what receipt when) | ⚠️ | P2 | Useful for disputes; defer |
| F19 | Kitchen printer (secondary printer for specific categories) | ❌ | — | Explicitly out of v1 |
| F20 | Label printer support (CPCL / TSC) | ❌ | — | Out of scope — use ESC/POS-only thermal receipt printers |
| F21 | Offline print queue (job survives shop internet outage) | ❌ | — | Deferred; P2 at earliest |
| F22 | Multiple receipt copies / duplicate button | ✅ | P1 | Existing feature; must continue working |
| F23 | Printer brand auto-detection via USB VID/PID | ⚠️ | P2 | Nice-to-have; for v1 admin picks driver manually |
| F24 | Bridge-device deployment docs for each supported platform | ✅ | P0 | Per-OS setup guide: macOS (dev + prod), Linux (Raspberry Pi OS / Ubuntu / Debian), OpenWRT, Windows |
| F25 | Bridge-device health check endpoint | ✅ | P0 | `GET /health` on print-server reports: daemon up, last print job, printer status (via USB probe) — used by cashier and admin dashboard |
| F26 | Printer transport abstraction (USB / CUPS / serial) | ✅ | P1 | Adapter pattern in print-server: USB (libusb default), CUPS (macOS/Linux fallback for MFi-class printers or systems where libusb is blocked), raw network (TCP:9100 for future LAN-printer support) |
| F27 | One-command install script per bridge platform | ✅ | P1 | `curl … \| sh` or `brew install` / `.deb` — reseller runs one command, daemon installs + starts + self-registers with Cloudflare Tunnel |

### 1.5 Success criteria

1. **Receipt prints in ≤3 seconds** from "Print" tap to first character printing on paper, on shop Wi-Fi (< 50 Mbps), with healthy Cloudflare Tunnel.
2. **Per-shop setup time ≤ 30 minutes** for a reseller installer following the SOP, with no prior knowledge of OpenWRT or Cloudflare.
3. **Works with ≥ 5 distinct USB thermal printers** without code changes, proven by driver testing (Xprinter N160II, Rongta RP80, Munbyn ITPP068, Star TSP143 in ESC/POS mode, Epson TM-T20 in ESC/POS mode).
4. **Zero-cost incremental scale**: adding the 100th shop requires only a Cloudflare DNS record + tunnel credential, no new code, no per-tenant engineering.
5. **Graceful degradation**: if printer is offline / out of paper / tunnel down, cashier shows a clear error toast within 5 seconds and does NOT block the order flow — the order is already paid and saved; reprint is possible later via history.
6. **Reseller diagnostics**: when a customer calls about a printer issue, the installer can remotely (from admin UI) see the last-seen timestamp from that shop's tunnel and test-print.
7. **Bridge-device portability**: the same print-server daemon installs on at least 4 platforms (macOS, Raspberry Pi OS / Debian-based Linux, OpenWRT, Windows 11). Switching from one bridge device to another takes ≤ 30 min without changing any cashier or admin code.
8. **Router-agnostic**: deployment does NOT require a specific router brand/model. Any consumer router that provides Wi-Fi + internet to the bridge device suffices.

### 1.6 Out of scope (v1)

- ❌ Kitchen printer / secondary printer routing by category
- ❌ Label printer / barcode-label support (requires CPCL, separate command set)
- ❌ Laser / inkjet printer support (would require CUPS on bridge, different dependency)
- ❌ Offline print queue that survives shop internet outage (printer depends on Cloudflare Tunnel being up)
- ❌ Printer auto-detection via USB VID/PID (admin picks manually)
- ❌ CloudPRNT / printer-polls-cloud architecture (printer-dependent; we're building printer-agnostic)
- ❌ AirPrint replacement (keep existing `window.print()` iframe code as an orthogonal fallback; do not port to this module)
- ❌ iOS native app wrapper (architecturally unnecessary once this module exists)
- ❌ Android tablet variant (same cashier code should work on Chrome Android with Web Bluetooth as a bonus, but not a v1 requirement)

### 1.7 Key constraints (DO NOT FORGET)

1. **iPad Safari is the primary client** — no Web Bluetooth, no Web USB, no raw TCP, no self-signed cert acceptance at scale.
2. **Multi-tenant SaaS** — printer config must be keyed by `tenantId + locationId`, never global.
3. **Currency / brands / categories** already multi-tenant in existing codebase; follow those conventions.
4. **Mixed-content rule** — all cashier → printer traffic must go over valid-cert HTTPS. Cloudflare Tunnel is the chosen mechanism.
5. **Router-agnostic** — the shop's router is NOT part of our stack. Customer provides any router with internet + Wi-Fi. Our software lives on a separate bridge device (Mac / Linux / Pi / mini PC / OpenWRT-with-Node).
6. **ESC/POS byte building happens in the cashier browser** — driver logic (generic / Star / Epson overrides) lives in JS, shipped in the PWA bundle. The bridge daemon is a dumb forwarder from HTTPS to USB.
7. **USB cable, not Bluetooth** — between bridge device and printer. BT SPP works on Linux but is less reliable; USB is the standard path.
8. **Dev uses Mac as bridge** — developer's Mac runs `cloudflared` + print-server Node daemon during development. Production swaps only the deployment target (Mac → Linux / OpenWRT); same code, same architecture.
9. **Cross-platform Node daemon** — `packages/print-server` is the shipped production artifact. It MUST install and run on macOS, Debian/Ubuntu/Raspberry Pi OS, OpenWRT (with Node), and Windows 11. Dependencies (e.g., libusb vs CUPS) abstracted behind a transport adapter.

### 1.8 Dependencies on existing code

| Area | Current state | This module's impact |
|---|---|---|
| `apps/cashier/src/components/receipt/print-receipt.tsx` | HTML iframe + `window.print()` | Branch: when `printerType === 'network'`, build ESC/POS bytes and POST to tunnel endpoint. Keep iframe path as fallback. |
| `apps/cashier/src/components/receipt/receipt-template.tsx` | JSX receipt template | Keep for preview + fallback; extract data contract to a shared type reused by ESC/POS builder. |
| `apps/cashier/src/lib/receipt-queries.ts` | Defines `ReceiptData` type | Reuse as the input to the new ESC/POS builder. |
| `packages/database/src/schema/shop-settings.ts` | Has `printMode` (default "browser") + `printServerUrl` stubs, unused | Repurpose and extend: add `printerDriver`, `paperWidth`, `codePage`, `printerEndpoint`. |
| `apps/admin/src/lib/location-actions.ts` | `updateLocationReceipt` updates header/footer/flags | Add `updateLocationPrinter` action for the new config fields. |
| `apps/admin` settings UI | Location edit form (per-location receipt settings) | Add a "Printer" section with driver / paper / codepage / endpoint / test-print button. |
| `packages/print-server/` | Node/Express service with USB ESC/POS via `escpos-usb`, never wired up | **Kept and extended as the production shipped artifact.** Becomes the cross-platform daemon deployed to every shop's bridge device. Add: transport adapter (libusb / CUPS), cloudflared integration, `/health` endpoint, per-platform install scripts, systemd/launchd service units, printer driver registry (though driver logic also mirrored in browser for ESC/POS byte building). |
| `apps/cashier/src/i18n/locales.ts` | Receipt keys exist | Add ~6 new keys: `printerOffline`, `printerSending`, `printerSuccess`, `printerError`, `printerTestButton`, `printerNotConfigured` × 5 locales. |

### 1.9 Phase 0 Sign-off

**Phase:** 0 — Capture Intent + Feature Scope
**Deliverables:** Context, module identity, hardware (with flexible bridge device), feature scope (F1–F27), success criteria (8), out-of-scope list, constraints (9), codebase-dependency map
**Active persona:** 🎭 Role: Product Manager
**Decision required:** Does this accurately capture what to build?

**Key decisions locked in this revision:**
- ✅ Router-agnostic: shop uses any router; not part of our SKU
- ✅ `packages/print-server` is the production shipped artifact (cross-platform Node daemon)
- ✅ Bridge device is customer/reseller choice: Mac, Linux PC, Pi, mini PC, OpenWRT router — all supported
- ✅ Dev = Mac, Production = same code on chosen bridge platform

- [x] Approved — proceeding to Phase 0.1 (user scenarios) — 2026-04-23
- [ ] Revisions needed — _specify below_

**User notes:**
Approved 2026-04-23. Router decoupling + cross-platform print-server locked in.

---

## 2. User Scenario Design

🎭 **Role: Senior Product Manager**

This is the load-bearing phase. Every downstream design decision exists to serve one of the scenarios below.

### 2.1 User personas

| Persona | Context | Language | Key need |
|---|---|---|---|
| **Cashier** (shop-floor staff) | iPad at the counter, serving customers, volume-focused | TC / SC / PT / EN / JP (per shop) | Press "Print" and get paper in ≤3 seconds; clear signal when something's wrong; never blocks the checkout |
| **Shop owner / manager** (admin user) | Admin web app (`admin.hkretailai.com`) on laptop/desktop | EN / TC (typical) | Configure printer for each location once; confirm it works; forget about it |
| **Reseller installer** (field technician) | On-site at customer shop, physically deploying hardware | EN / TC | Plug devices in, run one command, see a successful test print, leave — total time ≤ 30 min |
| **Reseller support** (phone/chat support) | Office, helping shops with "printer doesn't work" calls | EN / TC | See shop status remotely from admin; distinguish network/printer/app failures without visiting the shop |
| **Developer / ops** (our internal team) | Dev machines, CI, production monitoring | EN | Reproduce any shop's setup on a Mac; debug without SSH into customer devices; ship updates without re-visiting shops |

### 2.2 User stories

#### Cashier — P0 scenarios

1. **C1. Print a receipt after successful payment.** "I just took payment. I tap 'Print receipt'. Within 3 seconds, paper starts coming out of the printer behind me. I hand it to the customer and move to the next one."
2. **C2. Reprint a receipt from order history.** "A customer asks for a duplicate receipt for their expense claim. I open history, find the order, tap 'Reprint'. Same 3 seconds, same receipt, no fuss."
3. **C3. Open the cash drawer.** "Customer pays cash. I tap something (print button or a separate drawer-kick button). The cash drawer under the counter opens with a clunk." *(Implemented as a pulse command in the same ESC/POS stream as the receipt.)*
4. **C4. Printer is out of paper.** "I tap 'Print'. I hear nothing from the printer. The screen shows a clear red toast: 'Printer out of paper — please refill'. The order is still marked paid. I refill, tap 'Reprint', receipt prints."
5. **C5. Internet drops.** "Shop WiFi is down. I tap 'Print'. Toast says: 'Printer unreachable — check network'. The order is still saved. When WiFi is back, I reprint from history."
6. **C6. Print multiple copies.** "For a corporate customer I need two copies. I tap 'Print' twice, or I tap a '2 copies' option. Two receipts come out."
7. **C7. Language on receipt matches my locale.** "I've set the cashier to Portuguese. The receipt prints in Portuguese — item names, totals, headers — not in the default language of the shop config." *(Note: locale is tenant config, not cashier-UI-locale; this matters for CJK codepage.)*

#### Cashier — P1 scenarios

8. **C8. Test print from cashier without a real order.** "I'm training a new staff member. I want to print a test receipt without creating a fake order. A 'Test print' button somewhere prints a short diagnostic page with the shop name, timestamp, and codepage test."
9. **C9. Cancel a print job mid-send.** "I hit Print by accident on a huge order. Can I cancel before it prints?" *(Likely not supported in v1 — print is a fire-and-forget POST; mention as known limitation.)*

#### Shop owner / manager — P0 scenarios

10. **O1. Configure the printer for the first time.** "I just bought the POS bundle. In admin → Locations → Counter 1 → Printer, I set: printer driver = Generic ESC/POS, paper width = 80mm, codepage = Big5, endpoint = https://print-mystore.hkretailai.com/print. I click 'Test print'. A test page prints immediately."
11. **O2. Swap a dead printer.** "Printer died, I bought a new Xprinter XP-T80Q. I unplug the old one, plug in the new one via USB. The admin 'Test print' still works — no config change needed because both are Generic ESC/POS 80mm."
12. **O3. Upgrade to an 80mm from a 58mm printer.** "I had a tiny 58mm printer; customers complain receipts are too narrow. I bought an 80mm. I unplug old, plug new, change paper width in admin from 58 to 80, test print. Works."
13. **O4. Multi-location — each counter prints to its own printer.** "My shop has 2 counters with 2 iPads and 2 printers. Each location in admin has its own printer config. Orders on Counter 1 print on Counter 1's printer."

#### Shop owner / manager — P1 scenarios

14. **O5. See if a printer is offline before customers complain.** "I open admin dashboard in the morning. Printer at Counter 2 shows red 'offline' — I know to check before opening." *(Requires F17 — P2 in Phase 0; promote to P1 if approved.)*
15. **O6. Change the receipt header/footer.** *(Already exists in `updateLocationReceipt`; not this module's job, but must keep working.)*

#### Reseller installer — P0 scenarios

16. **I1. First-time shop install.** "I arrive at the customer's shop. I have: 1 iPad (pre-enrolled), 1 Xprinter N160II, 1 bridge device (customer chose a Raspberry Pi 4 kit). I unbox everything, plug the printer into the Pi via USB, plug the Pi into power + ethernet, SSH in from my laptop, run `curl https://install.hkretailai.com/printer-bridge | sh`. The script: (a) installs Node + print-server, (b) creates a Cloudflare Tunnel, (c) DNS-registers `print-{shop-slug}.hkretailai.com`, (d) prints a URL to the screen. I go to admin, paste the URL into the location's Printer Endpoint field. Test print works. I'm done. Total time: 25 minutes."
17. **I2. Install on customer's existing Mac mini instead.** "Customer already has a Mac mini at the counter for stock-taking. They don't want new hardware. I plug the printer into the Mac mini, run the macOS install script (`brew install retailai-printer-bridge` or equivalent). Same subsequent steps. Total time: 30 minutes (Mac has more OS variance)."
18. **I3. Install on an existing GL.iNet router the customer already owns.** "Customer has a GL.iNet Beryl AX as their shop router already. I SSH in, `opkg install node`, run the OpenWRT-variant install script. Same flow. Total time: 35 minutes (OpenWRT is slightly more niche)."

#### Reseller installer — P1 scenarios

19. **I4. Swap bridge device.** "The Pi in shop 12 is flaky — customer wants to move to a mini PC. I install print-server on the mini PC, copy over the Cloudflare Tunnel credentials (or regenerate the tunnel and update the DNS CNAME), plug the printer into the mini PC. Done in ≤ 30 min, customer's iPad continues working with no config change (endpoint URL unchanged if tunnel regenerated to same subdomain)."
20. **I5. Rollback a failed install.** "Install script errors out halfway through. There's a clean uninstall path: `printer-bridge uninstall` removes the daemon, the cloudflared tunnel, and the DNS record. Re-run the install cleanly."

#### Reseller support — P0 scenarios

21. **S1. Shop calls: 'printer not working'.** "I ask for the shop slug. In admin, I look at the location's printer panel: 'Bridge last seen: 3 minutes ago' (healthy) or 'Bridge last seen: 2 days ago' (dead). If healthy, I ask: 'press test print in admin — does paper come out?' If not, I tell them to check paper + USB cable. If bridge is dead, I ask: 'is the device plugged in and its lights on?' Remote triage without visiting."
22. **S2. Diagnose whether it's network, bridge, or printer.** "I click 'Test print' in admin. Response: 'Tunnel reached bridge, bridge says printer timeout' → printer issue. Response: 'Tunnel unreachable' → shop's internet or bridge-device is down. Response: 'Success, receipt printed' → customer's problem is elsewhere (maybe cashier-side UX)."

#### Developer / ops — P0 scenarios

23. **D1. Reproduce a shop's problem locally.** "Shop 7 reports 'Chinese characters print as ???'. I set up my local Mac to use the exact same printer driver + paper width + codepage in admin, connect my own N160II via USB, trigger a print from cashier dev build. Reproduced. I fix, ship, customer updates via print-server auto-update."
24. **D2. Ship a bug fix without site visits.** "I fix a driver bug. I push a new release of `@retailai/printer-bridge`. Each shop's bridge device runs `printer-bridge update` (or auto-updates via systemd timer / cron). No per-shop engineering time."

### 2.3 Capability categories

| Category | Example stories | Capability needed | Priority |
|---|---|---|---|
| **Print happy path** | C1, C2, C3, C6 | Cashier → tunnel → bridge → printer, ≤ 3 sec | P0 |
| **Print failure modes** | C4, C5, S1, S2 | Clear error toasts; don't block order; admin diagnostics | P0 |
| **Locale + codepage** | C7 | Per-location codepage config; browser-side ESC/POS page-select | P0 |
| **Printer admin config** | O1, O2, O3 | Driver / paper / codepage / endpoint fields; test-print button | P0 |
| **Multi-location** | O4 | Printer config keyed by `tenantId + locationId`; cashier reads from location session | P0 |
| **Reseller install** | I1, I2, I3 | Per-platform install scripts; Cloudflare Tunnel automation | P0 |
| **Bridge portability** | I4 | Tunnel credentials portable; endpoint URL stable across device swaps | P1 |
| **Clean uninstall** | I5 | Install script has uninstall subcommand | P1 |
| **Remote diagnostics** | S1, S2 | `/health` endpoint; last-seen tracking in admin; test-print RPC | P0 |
| **Developer reproduction** | D1 | Same daemon runs on Mac; same config schema | P0 |
| **Fleet updates** | D2 | Auto-update mechanism in bridge; versioned releases | P1 |
| **Cash drawer** | C3 | ESC p 0 pulse in ESC/POS byte stream | P1 |
| **Training / diagnostics** | C8 | Test-print button in cashier (not just admin) | P1 |

### 2.4 Acceptance test cases

P0 — must pass for v1 release. P1 — must pass by v1.1.

| ID | Scenario | Persona | Input | Expected | Pass criteria | Priority |
|---|---|---|---|---|---|---|
| **AT-01** | Happy-path print | Cashier | Completed order, tap Print | Printer outputs correct receipt | Paper ejects within 3 sec; contents match preview; no toast errors | P0 |
| **AT-02** | Reprint from history | Cashier | Open order from history, tap Reprint | Same receipt prints | Same as AT-01 | P0 |
| **AT-03** | Printer out of paper | Cashier | Remove paper roll, tap Print | Red toast "out of paper"; order remains paid; Print button re-enabled | Toast visible ≥ 4 sec; cashier can retry; checkout unblocked | P0 |
| **AT-04** | Bridge-device offline | Cashier | Unplug bridge power, tap Print | Red toast "printer unreachable"; order saved | Toast visible; order status unchanged; reprint works after bridge returns | P0 |
| **AT-05** | Tunnel offline (internet down at shop) | Cashier | Disable shop WiFi, tap Print | Red toast "network unreachable" | Toast ≤ 5 sec; order saved; reprint after network returns | P0 |
| **AT-06** | CJK text on 58mm / 80mm Big5 | Cashier | Order with Traditional Chinese item names | Characters print correctly, not as `?` or tofu | Visual check: Chinese renders; alignment preserved | P0 |
| **AT-07** | Cash drawer kick | Cashier | Cash payment → Print | Receipt prints AND drawer opens | Drawer audibly opens within 2 sec of print | P1 |
| **AT-08** | Multi-copy print | Cashier | Order with copies=2 | 2 identical receipts print | Both complete, no corruption | P1 |
| **AT-09** | First-time admin setup | Shop owner | Fill printer config, click Test print | Test page prints | Test page visible with shop name + timestamp + codepage glyph test | P0 |
| **AT-10** | Printer swap (same driver/paper) | Shop owner | Unplug old printer, plug new, Test print | Test page prints | No admin config change required | P0 |
| **AT-11** | Paper width change | Shop owner | Change 58 → 80, Test print | Receipt adapts width | Layout uses full 80mm; no truncation | P0 |
| **AT-12** | Multi-location isolation | Shop owner (multi-counter shop) | Each counter has own printer config | Orders print only on their counter's printer | No cross-print | P0 |
| **AT-13** | Install from scratch (Raspberry Pi) | Installer | Fresh Pi 4, run install script | Daemon running, tunnel live, DNS registered, admin Test print works | End-to-end ≤ 30 min; no manual steps beyond running the script + pasting endpoint URL | P0 |
| **AT-14** | Install on macOS | Installer | Fresh Mac, run install script | Same as AT-13 | ≤ 30 min | P0 |
| **AT-15** | Install on OpenWRT (GL.iNet) | Installer | GL.iNet with Node installed, run script | Same as AT-13 | ≤ 35 min | P1 |
| **AT-16** | Install on Windows 11 | Installer | Fresh Win 11, run install script | Same as AT-13 | ≤ 35 min | P1 |
| **AT-17** | Bridge swap with endpoint continuity | Installer | Replace bridge device, keep tunnel credentials | Endpoint URL unchanged; cashier needs no reconfig | Same DNS, new host behind tunnel | P1 |
| **AT-18** | Uninstall and reinstall | Installer | Run uninstall, verify clean, reinstall | Clean state; reinstall succeeds | No stale configs; no dangling DNS; no orphaned cloudflared | P1 |
| **AT-19** | Remote diagnosis: bridge up, printer down | Support | Bridge running, printer unplugged, support clicks Test print | Admin shows "Bridge OK, printer unreachable" | Error message distinguishes bridge-vs-printer | P0 |
| **AT-20** | Remote diagnosis: bridge down | Support | Bridge powered off, support clicks Test print | Admin shows "Bridge unreachable" (or last-seen > 60 sec) | Last-seen is accurate within ±30 sec | P0 |
| **AT-21** | Driver swap (Generic → Epson mode) | Shop owner | Replace printer with an Epson TM-T20, change driver dropdown | Test print works with Epson-specific cutter/feed commands | Epson-specific behavior (e.g., partial cut) activates | P1 |
| **AT-22** | Auto-update to new print-server version | Ops | Publish new release | Bridge device fetches + restarts within 24h | Version string in `/health` reflects new | P1 |

### 2.5 QA test playbook

This section is for a human tester. Steps are explicit; no "follow your intuition."

#### QA-001: First-time installation happy path (Raspberry Pi 4)
**Priority:** P0 · **Persona:** Reseller installer
**Prereqs:** A fresh Raspberry Pi 4 2GB with Raspberry Pi OS, N160II printer, USB-A cable, a laptop with SSH access, admin access to a test tenant.
**Steps:**
1. Plug N160II printer into Pi via USB-A.
2. Plug Pi into power and Ethernet (router with internet).
3. SSH from laptop: `ssh pi@<pi-ip>`.
4. Run install script: `curl -fsSL https://install.hkretailai.com/printer-bridge | sh`.
5. When prompted, enter test-tenant slug: `qa-test-1`.
6. Wait for script to complete. Note the endpoint URL it prints.
7. In admin, go to Locations → Default Location → Printer.
8. Paste endpoint URL into "Printer endpoint" field.
9. Set: Driver = Generic ESC/POS, Paper = 80mm, Codepage = Big5.
10. Click **Test print**.

**Expected:**
- Pi script completes in ≤ 5 min with no errors.
- Test print arrives within 5 sec of clicking the button.
- Receipt shows shop name, current timestamp, a block of "Big5 Test: 中文測試" that renders correctly (not as `?`).

**If FAIL:**
- Script fails before completion → capture full log output; file bug with `bridge-install` tag.
- Test print arrives but CJK is broken → codepage mismatch; check `Printer driver page select` in bridge logs.
- No paper output → check printer power, paper loaded, USB cable; `/health` endpoint via `curl https://print-qa-test-1.hkretailai.com/health` shows printer status.

#### QA-002: Cashier print under normal conditions
**Priority:** P0 · **Persona:** Cashier
**Prereqs:** QA-001 passed. Cashier logged in at test tenant.
**Steps:**
1. Add 3 items to cart, one with a Chinese name, one with Portuguese accents, one standard English.
2. Apply 10% discount.
3. Pay with cash (MOP 100 tendered on MOP 87 total).
4. Tap **Complete payment**.
5. On completion screen, tap **Print receipt**.

**Expected:**
- Print arrives within 3 sec of tap.
- Receipt shows: all 3 item names rendered correctly, discount line, subtotal/tax/total, cash received + change, timestamp, shop header/footer.
- Cash drawer opens (if configured).

**If FAIL:** record which element is wrong, take photo of receipt, capture cashier console logs.

#### QA-003: Printer out of paper
**Priority:** P0 · **Persona:** Cashier
**Prereqs:** QA-002 passed.
**Steps:**
1. Open the printer cover, remove paper roll, close cover.
2. In cashier, take payment on a small order.
3. Tap **Print receipt**.

**Expected:**
- Within 5 sec, red toast appears: "Printer out of paper" (or localized equivalent).
- Order remains in paid state (visible in history).
- Print button is re-enabled after toast dismissal.

**Recovery:**
4. Reload paper roll.
5. In history, open the order, tap **Reprint**.

**Expected:** Receipt prints successfully.

#### QA-004: Bridge device unplugged
**Priority:** P0 · **Persona:** Cashier + Support
**Prereqs:** QA-002 passed.
**Steps:**
1. Unplug the bridge device's power.
2. Wait 90 seconds (to allow heartbeat / last-seen to expire).
3. In cashier, tap **Print receipt** on a paid order.

**Expected (cashier):**
- Red toast: "Printer unreachable — check network".
- Order remains paid.

**Steps (support side):**
4. In admin, open the location's printer panel.

**Expected (admin):**
- Bridge status shows "Offline" with last-seen timestamp > 60 sec.

**Recovery:**
5. Re-plug bridge. Wait 60 sec.
6. Cashier taps **Reprint** from history.

**Expected:** Receipt prints successfully; admin status returns to "Online".

#### QA-005: Multi-location isolation
**Priority:** P0 · **Persona:** Shop owner with 2 counters
**Prereqs:** 2 bridge devices each with own N160II, 2 location records in admin, each pointing to its own tunnel endpoint.
**Steps:**
1. Log cashier in at Counter 1.
2. Take a paid order.
3. Tap Print.

**Expected:**
- Receipt prints **only** on Counter 1's printer.
- Counter 2's printer is silent.

**Repeat:** Counter 2 cashier, new order. Receipt prints only on Counter 2. Counter 1 silent.

#### QA-006: Remote triage via admin
**Priority:** P0 · **Persona:** Support
**Prereqs:** Test shop has bridge online, printer plugged in.
**Steps:**
1. In admin, location printer panel, click **Test print**.

**Expected:** Green toast "Test print succeeded" within 5 sec; paper prints at shop.

2. Physically unplug the printer's USB cable (simulate printer failure).
3. Wait 10 sec.
4. Click **Test print** again.

**Expected:** Red toast "Bridge OK, printer unreachable — check USB/power".

5. Re-plug printer USB.
6. Physically unplug bridge power.
7. Wait 90 sec.
8. Click **Test print**.

**Expected:** Red toast "Bridge unreachable — check device power and network"; distinguishable from step 4.

#### QA-007: Paper width change (58 ↔ 80mm)
**Priority:** P0 · **Persona:** Shop owner
**Prereqs:** QA-001 passed; have both a 58mm and 80mm printer available.
**Steps:**
1. With 58mm connected: admin set paper=58mm, Test print. Receipt uses narrow layout.
2. Unplug 58mm, plug in 80mm. Admin set paper=80mm. Test print. Receipt uses wide layout.

**Expected:** No text truncation on either; text alignment respects configured width.

#### QA-008: Driver swap (Generic ESC/POS → Epson mode)
**Priority:** P1
**Prereqs:** Have an Epson TM-T20 (or equivalent Epson ESC/POS).
**Steps:**
1. With N160II (Generic): take a paid order, print. Partial-cut command is silently ignored (or full cut — depending on N160II).
2. Unplug, plug in Epson TM-T20. Admin set driver=Epson.
3. Take a paid order, print.

**Expected:** Epson-mode partial-cut activates; receipts tear cleanly without tugging.

### 2.6 Scope & language notes

- **Cashier UI strings:** all new toasts (`printerOffline`, `printerSending`, `printerSuccess`, `printerError`, `printerTestButton`, `printerNotConfigured`, `printerOutOfPaper`, `bridgeUnreachable`) must have translations in TC, SC, EN, PT, JP. Add to `apps/cashier/src/i18n/locales.ts`.
- **Admin UI strings:** new printer-config field labels, test-print button, last-seen status. Add to `apps/admin/src/i18n/locales.ts`.
- **Install-script output:** English only (resellers / developers read these).
- **QA receipts:** include printed text `Big5 Test: 中文測試` as a visual codepage check.

### Phase 0.1 Sign-off

**Phase:** 0.1 — User Scenario Design
**Deliverables:** 5 personas, 24 user stories (C1–C9, O1–O6, I1–I5, S1–S2, D1–D2), capability categories, 22 acceptance tests (AT-01 to AT-22), 8 QA playbooks (QA-001 to QA-008), i18n scope note
**Active persona:** 🎭 Role: Senior Product Manager
**Decision required:** Do the scenarios capture real cashier + reseller behavior? Anything missing?

- [x] Approved — proceeding to Phase 1 — 2026-04-23
- [ ] Revisions needed — _specify below_

**User notes:**
Approved 2026-04-23.

---

## 3. Technical Feasibility & Stack

🎭 **Role: Backend Architect**

### 3.1 Technology decisions

| Decision | Options considered | Selected | Rationale | Confidence |
|---|---|---|---|---|
| **Bridge runtime** | Node 20 LTS / Node 22 / Go / Rust / Python | **Node 20 LTS** | Matches existing monorepo runtime; shares types with `apps/cashier` and existing `packages/print-server`; cross-platform; familiar to our team | Confirmed |
| **HTTP framework on bridge** | Fastify / Express / native `http` | **Native `http` + minimal routing** | Daemon has ~4 endpoints (`POST /print`, `GET /health`, `POST /test`, `GET /version`). Fastify/Express add deps without benefit. Smaller binary, fewer CVE surfaces | Strong inference |
| **ESC/POS byte builder** | `@node-escpos/core` / `node-thermal-printer` / custom | **Custom TypeScript builder** | Zero deps, identical code runs in browser + Node, full control of driver extensions (Star/Epson overrides), no library abandonment risk. ~300 LOC based on existing `packages/print-server/src/printer.ts` | Strong inference |
| **USB transport (primary)** | `node-usb` (libusb) / CUPS shell-out / raw `/dev/usb/lp0` | **Raw `/dev/usb/lp0` on Linux/OpenWRT; `node-usb` on macOS/Windows** | On Linux the kernel's `usblp` module exposes a simple file device — write bytes, done, no userspace driver. Matches OpenWRT's `kmod-usb-printer` exactly. macOS/Windows need `node-usb` (libusb) because they lack `usblp`. Transport adapter abstracts the difference | Confirmed (Linux/OpenWRT); Strong inference (macOS/Windows) |
| **USB transport (fallback)** | CUPS / IPP / lp shell command | **CUPS (`lp -d <printer> -o raw`) on macOS/Linux** | Activated when libusb can't claim interface (macOS Gatekeeper, managed corporate devices). Printer appears in `Printers & Scanners`, daemon shells out to `lp` | Strong inference |
| **Tunnel provider** | Cloudflare Tunnel / ngrok / Tailscale Funnel / WireGuard self-hosted / frp | **Cloudflare Tunnel (`cloudflared`)** | Free tier suits fleet scale (unlimited tunnels per account); no per-tunnel auth token rotation; integrates with our existing `hkretailai.com` zone; TLS termination at edge; well-documented systemd/launchd units. Alternatives: ngrok free tier has URL randomization + session limits; Tailscale Funnel is quotaed; self-hosted adds ops burden | Confirmed |
| **Service manager** | systemd / launchd / procd / NSSM / pm2 | **Native per-platform** | systemd on Linux (Raspberry Pi OS, Debian, Ubuntu, Armbian); launchd on macOS (.plist in `/Library/LaunchDaemons`); procd init.d on OpenWRT; NSSM on Windows 11. Keeps deployment native, no pm2 runtime overhead on small devices | Strong inference |
| **Packaging / distribution** | npm global / `pkg` static binary / Docker / `.deb`/`.pkg` | **npm-published package + install script per platform** | `@retailai/printer-bridge` on npm. Install script: `curl install.hkretailai.com/printer-bridge.sh \| sh` — detects OS, installs Node via nvm/brew/opkg if absent, runs `npm i -g @retailai/printer-bridge`, configures service. One source of truth, multiple install entry points. Docker ruled out for OpenWRT (no runtime) | Strong inference |
| **Auto-update** | Built-in self-update / systemd timer + npm / manual | **systemd timer (or equivalent) running `@retailai/printer-bridge upgrade` daily** | Tiny deployment unit: check npm for newer version, if yes download + restart. On failure, roll back. Avoids self-modifying running process (risky). Roll-forward-only; ops can pause via config | Strong inference |
| **Inter-service auth** (cashier → bridge) | Shared bearer token / HMAC signed payload / mTLS / Cloudflare Access | **Bearer token in `Authorization: Bearer <token>` header**; server-side hash via **HMAC-SHA256(pepper, token)** | Simplest path. Token: 32 random bytes (base64url, ~256 bits entropy). Hashed with HMAC-SHA256 not argon2id — token is high-entropy machine credential, not a human password; argon2id would add 150–250ms per request on low-end bridges (Pi Zero 2W) and eat ~5–8% of the 3-second print budget for zero security benefit. Pepper held in `APP_PEPPER` env on admin server; compromised DB without pepper still can't verify tokens. Per-shop pepper not needed (pepper is per-deployment, not per-token). v1.1 can add HMAC payload signing if replay attacks become a concern | Confirmed (revised per product review M2) |
| **Heartbeat / liveness** | Bridge pushes to admin / admin polls bridge / both | **Bridge pushes to admin every 60s** | Matches existing terminal-heartbeat pattern (`POST /api/terminals/heartbeat`). New endpoint `POST /api/printers/heartbeat` reuses the same auth pattern (terminal + printer share the location scope). Admin shows `lastSeenAt` timestamp | Strong inference |
| **Print transport (cashier → bridge)** | Direct HTTPS POST / polling via CloudPRNT-style / queued via admin | **Direct HTTPS POST to bridge endpoint** | Lowest latency (≤ 500ms edge-round-trip). Simplest. Failures surface immediately to cashier. Queue would introduce opaque delays and extra state | Confirmed |
| **Offline behavior** | Local queue on bridge / local queue on cashier / no queue | **No queue in v1 (fail loud, cashier retries from history)** | Matches scenario C5 / AT-05. Keeps bridge stateless (no disk persistence, easy container/host swaps). Adding a queue is v1.1 if real-world failure rates justify | Strong inference |
| **Printer driver registry** | Enum in code / JSON config file / DB | **Enum + driver module in shared TS package** | `@retailai/escpos-shared` exports `type PrinterDriver = 'generic' \| 'star' \| 'epson' \| 'custom'` + `const drivers: Record<PrinterDriver, DriverDef>`. Same module used by cashier (builds bytes) and bridge (metadata for `/health`, logging) | Strong inference |
| **Cloudflare account model** | One account for all shops / account per reseller / account per tenant | **One reseller-owned Cloudflare account for v1** | Reseller manages the CF zone (`hkretailai.com`), all tunnels live under it. Simpler ops, shared rate limits (generous). If a customer insists on their own CF, they bring their own account + zone — supported but not default | Strong inference |
| **DNS naming** | `print-<slug>.hkretailai.com` / `<slug>.print.hkretailai.com` / random UUID | **`print-<tenant-slug>.hkretailai.com`** per tenant; multi-location adds `-<location-slug>` if needed | Human-readable; resellers can type them in admin without mistakes; matches existing `pos.hkretailai.com` naming | Strong inference |
| **Config storage on bridge** | `.env` / JSON / YAML | **`/etc/printer-bridge/config.json`** (or platform equivalent) | JSON is universally parseable, doesn't need extra deps. Platform paths: `/etc/printer-bridge/` (Linux/OpenWRT), `~/Library/Application Support/printer-bridge/` (macOS), `%PROGRAMDATA%\printer-bridge\` (Windows) | Strong inference |
| **Observability** | structured JSON logs / syslog / Datadog / Sentry | **Structured JSON to stdout → journald/syslog** + **errors to our Sentry** (same DSN as cashier) | Print-server errors go to same Sentry project as cashier for unified incident view. Verbose logs to the local system log | Strong inference |
| **Browser ESC/POS library** | Build in-repo / `esc-pos-encoder-ibuki` / fork of existing | **Build in-repo as `@retailai/escpos-shared`** | Shared with bridge daemon, zero-dep, no supply-chain surprises, tailored to our drivers. Port from existing `packages/print-server/src/printer.ts` | Strong inference |

### 3.2 Feasibility matrix (vs §2 scenarios)

| Scenario ID | Technical requirement | Feasible? | Blockers | Notes |
|---|---|---|---|---|
| C1, C2, AT-01, AT-02 | Browser builds ESC/POS → HTTPS POST → daemon writes USB | ✅ | None | 50–200ms edge + ~50ms USB write well inside 3s budget |
| C3, AT-07 | Cash drawer kick via ESC p 0 | ✅ | Drawer must be wired to printer's RJ11 port | Standard thermal-printer feature; included in our ESC/POS builder |
| C4, AT-03 | Printer out-of-paper detection | ⚠️ | USB status query varies per printer | `node-usb` can query status on libusb-backed path; `/dev/usb/lp0` on Linux does not surface status — we treat write-timeout as out-of-paper heuristic. Good-enough for v1; full status is P1 |
| C5, AT-05 | Network-down error surfacing | ✅ | None | `fetch` timeout + retry handles cleanly |
| C6, AT-08 | Multi-copy | ✅ | None | Cashier sends same bytes N times, or ESC/POS `ESC c 5` (buffer repeat) |
| C7, AT-06 | CJK codepage support | ✅ | Must be tested per printer firmware | GB18030/Big5/Shift_JIS tables in ESC/POS builder; set via `ESC t <n>` command |
| O1, AT-09 | Admin test-print | ✅ | None | Admin action builds bytes via shared lib, POSTs to shop's bridge |
| O2, AT-10 | Printer swap with same driver | ✅ | USB `usblp` on Linux reassigns `/dev/usb/lp0` | Cold-plug handling: scan `/dev/usb/lp*` at write time |
| O4, AT-12 | Multi-location isolation | ✅ | None | Each location has own `printerEndpoint`; cashier uses session's `locationId` |
| I1, AT-13 | Pi install ≤ 30 min | ✅ | None | Install script: Node setup + npm install + cloudflared pairing + service enable; ≤ 5 min |
| I2, AT-14 | macOS install | ✅ | libusb needs `brew install libusb`; Gatekeeper may block kext unload | Script handles; if fails, auto-fallback to CUPS |
| I3, AT-15 | OpenWRT install | ⚠️ | Requires router with ≥ 128MB flash + Node package available | Most GL.iNet / flashed mid-tier routers qualify. Rejected at install time if not |
| S1, S2, AT-19, AT-20 | Remote triage distinguishing bridge vs printer | ✅ | None | `/health` endpoint returns `{bridgeUp: true, printerUp: <bool>, lastError: <string>}`; admin polls/caches |
| D1 | Developer-Mac reproduction | ✅ | Same install script on macOS | Matches I2 |
| D2, AT-22 | Auto-update | ✅ | None | systemd timer + `npm outdated -g @retailai/printer-bridge` + `npm install -g @retailai/printer-bridge@latest` |

### 3.3 Technical risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | **macOS Gatekeeper / kext removal blocks `node-usb`** — claim fails because USB printer class driver holds interface | Medium | Medium | Fallback to CUPS (`lp -d <name> -o raw`). Install script detects failure on first test-print and flips config to CUPS mode |
| R2 | **Windows WinUSB driver requires Zadig** first-time to expose USB-class device to userspace | High (for Windows bridges) | Medium | Document in install guide; optional: ship signed driver installer. Low priority since Windows bridges are rare in our segment |
| R3 | **Printer firmware varies codepage mappings** — cheap Xprinters have non-standard Big5 tables | Medium | Medium | QA suite includes visual CJK check; per-driver override in `@retailai/escpos-shared`. If a vendor has known bugs, ship a tiny patch driver entry |
| R4 | **`/dev/usb/lp0` index shifts** when multiple USB devices are plugged/unplugged | Low | Low | Enumerate `/dev/usb/lp*` and pick first printer-class device each write; ~10 LOC |
| R5 | **Cloudflare Tunnel rate limits / account ban** — spam or abuse from one tenant poisons the whole reseller account | Low | High | Per-tenant bearer token with rate limiting at the daemon (e.g., 10 req/sec per token). Reseller-owned CF account isolated from customer accounts |
| R6 | **Bearer token leak** — stolen token lets attacker print arbitrary content | Medium | Low (nuisance, not data loss) | HTTPS in transit (CF); token stored encrypted in DB; rotate-token button in admin; per-token rate limit. Consider HMAC payload signing in v1.1 |
| R7 | **Node.js removal from OpenWRT package repo** for a specific architecture (happens occasionally with MIPS 24kc) | Low | Medium (for those routers) | Document the supported OpenWRT architectures; fallback install instructions using nvm-for-OpenWRT or cross-compile |
| R8 | **Bridge crashes and service manager doesn't restart** | Low | Medium | All service managers have restart policies configured by install script. Add crash-signal alerts via Sentry |
| R9 | **DNS propagation delay** on `print-<slug>.hkretailai.com` first-time | Low | Low | Cloudflare DNS propagates in < 60s globally; install script waits for DNS to resolve before returning |
| R10 | **Install script fails partway through** leaving inconsistent state | Medium | Medium | Idempotent install: every step checks "already done?"; `uninstall` subcommand for clean removal (AT-18) |
| R11 | **Browser ESC/POS builder drifts from daemon builder** | Medium | High | Single source of truth: both import from `@retailai/escpos-shared`; CI test compares byte output of same input across both entry points |
| R12 | **Cashier PWA is served on-shore in Macau but CF edge may route via distant POP** adding latency | Low | Low | Cloudflare has Hong Kong + Taipei POPs; tunnel runs from shop's ISP directly to nearest POP. Measured at < 100ms expected |
| R13 | **Printer damage from concurrent writes** if multiple iPads hit the same bridge simultaneously | Low | Medium | Bridge queues writes (in-memory semaphore); second request waits until first completes or times out (3s) |
| R14 | **Bridge clock skew** affects log timestamps, tunnel TLS | Low | Low | systemd/chrony keeps time synced; OpenWRT uses NTP by default |
| R15 | **Security: admin-panel CSRF could trigger test prints** | Low | Low | Admin routes already use CSRF tokens; test-print endpoint inherits |

### 3.4 Dependencies

#### 3.4.1 Runtime dependencies

| Dependency | Version | Purpose | License | Risk |
|---|---|---|---|---|
| Node.js | 20 LTS | Bridge daemon runtime | MIT | Low — LTS until Apr 2026 [sic, check]; well-supported on all target platforms |
| `cloudflared` | 2025+ | Tunnel daemon (vendor-provided binary) | Apache-2.0 | Low — stable, widely deployed |
| `usb` (node-usb) | 2.x | libusb binding for macOS/Windows | MIT | Medium — native dep, occasional platform breakage; mitigated by CUPS fallback |
| libusb-1.0 | system | Required by `usb` on macOS (brew) / Linux (distro) / Windows (Zadig / WinUSB) | LGPL-2.1 | Medium (Windows) |
| `@retailai/escpos-shared` | in-monorepo | Driver registry + byte builder | MIT (ours) | Low |
| systemd / launchd / procd / NSSM | OS-native | Service supervision | OS | Low |

#### 3.4.2 Build dependencies

| Dependency | Purpose |
|---|---|
| TypeScript 5.x | same as rest of monorepo |
| pnpm | workspace-wide package manager |
| esbuild / tsup | bundle daemon for single-binary deploy (if we go that route v1.1) |

#### 3.4.3 External services

| Service | Usage | Quota concern |
|---|---|---|
| **Cloudflare (Zero Trust / Tunnel)** | per-shop tunnels | Free tier: no tunnel count limit; practical fleet limit ~500 per account before ops-friction; scale by splitting accounts later |
| **Cloudflare DNS** | `*.hkretailai.com` records | Unlimited on free plan |
| **npm registry** | `@retailai/printer-bridge` distribution | Unlimited downloads |
| **Sentry** | error reporting | Existing project; adds ~10% volume |

### 3.5 Infrastructure changes

| Change | Environment | Owner |
|---|---|---|
| Create Cloudflare Zero Trust organization (if not already) | Cloudflare dashboard | Ops |
| Enable Tunnel feature on reseller CF account | Cloudflare | Ops |
| Publish first release of `@retailai/printer-bridge` to npm | npm registry | Dev |
| Create `install.hkretailai.com` static host serving install scripts | Cloudflare Pages | Ops |
| New Postgres column: `shop_settings.printer_token` (encrypted) | DB migration | Dev |
| New Postgres column: `shop_settings.printer_endpoint`, `printer_driver`, `printer_paper_width`, `printer_code_page` | DB migration | Dev |
| New Postgres table: `printer_heartbeats (tenantId, locationId, lastSeenAt, version, printerStatus)` | DB migration | Dev |
| Admin UI section: Location → Printer settings + test-print | `apps/admin` | Dev |
| Cashier print path branch (network vs iframe fallback) | `apps/cashier` | Dev |

### 3.6 Security design summary

```
┌─────────────┐     HTTPS (CF edge cert)     ┌──────────────┐
│    iPad     │ ──────────────────────────▶  │ Cloudflare   │
│  (cashier)  │     Authorization: Bearer    │   Tunnel     │
└─────────────┘     <per-shop token>         └──────┬───────┘
                                                    │
                                                    │ encrypted tunnel (QUIC/HTTP2)
                                                    │
                                             ┌──────▼───────┐
                                             │ cloudflared  │
                                             │ on bridge    │
                                             └──────┬───────┘
                                                    │ localhost:3901
                                                    │
                                             ┌──────▼───────┐
                                             │ print-server │
                                             │ daemon       │
                                             │ - verifies   │
                                             │   Bearer     │
                                             │   token      │
                                             │ - rate-limit │
                                             │ - rejects    │
                                             │   unknown    │
                                             │   drivers    │
                                             └──────┬───────┘
                                                    │ USB
                                             ┌──────▼───────┐
                                             │   Xprinter   │
                                             └──────────────┘
```

**Security principles:**

1. **Least privilege**: bridge daemon runs as a dedicated non-root user (`printer-bridge`). Needs `dialout` or equivalent group for USB. No shell, no home directory.
2. **Defense in depth**: valid-cert HTTPS + Cloudflare Tunnel encryption + per-shop bearer token + per-token rate limit + driver allowlist.
3. **Secrets never in URLs**: token in header only; never in query string, never in logs.
4. **Token rotation**: admin button "Rotate printer token" regenerates + pushes to bridge via next heartbeat response. Old token valid for 5-min grace period.
5. **No outbound from bridge to arbitrary hosts**: bridge only connects to CF tunnel (outbound 443) + Sentry DSN (outbound 443) + npm registry (only during updates).
6. **No cashier → bridge direct LAN calls**: always via tunnel to force TLS. Closes the "rogue device on shop WiFi" threat.

### 3.7 Performance design

| Metric | Target | Budget allocation |
|---|---|---|
| **Tap → paper output (C1 success criterion ≤ 3s)** | 95p < 2s; 99p < 3s | Browser builds bytes 50ms + fetch 100ms + CF edge 50ms + tunnel 100ms + daemon parse 10ms + USB write 200ms + printer buffer-to-paper 500ms = ~1s typical |
| Bridge heartbeat interval | 60s | Same as terminal heartbeat |
| Heartbeat payload | < 1 KB | Version + printer status |
| Print request payload | < 8 KB typical (80mm receipt, ~40 lines) | Fits in single TCP packet |
| Concurrent print capacity | 1 per bridge (semaphore) | One printer per bridge; concurrent requests queue |
| Daemon memory footprint | < 100 MB resident | Runs on Pi Zero 2W (512MB RAM) |
| Daemon CPU footprint | < 5% idle, < 50% during print | Negligible on any modern bridge |

### 3.8 Deployment topology

```
Dev:    dev Mac → cloudflared → local daemon → printer
QA:     QA tenant + dedicated test bridge
Staging: staging tenant + staging tunnel subdomain
Prod:   one bridge per customer location
```

Each environment uses its own `tenantSlug-<env>` naming (e.g., `print-qa-test-1.hkretailai.com`).

### Phase 1 Sign-off

**Phase:** 1 — Technical Feasibility & Stack
**Deliverables:** Tech-stack decisions (20+), feasibility matrix covering all P0/P1 scenarios, 15 identified risks with mitigations, runtime/build/service dependencies, infra change list, security design, performance budget, deployment topology
**Active persona:** 🎭 Role: Backend Architect
**Decision required:** Do the stack choices + risk register accurately capture the engineering reality?

**Key decisions to confirm:**
- ✅ Custom TypeScript ESC/POS builder in `@retailai/escpos-shared` (shared browser + daemon)
- ✅ Raw `/dev/usb/lp0` on Linux/OpenWRT; `node-usb` + libusb on macOS/Windows; CUPS fallback
- ✅ Cloudflare Tunnel (`cloudflared`) — reseller-owned CF account, `print-<slug>.hkretailai.com` naming
- ✅ npm-distributed `@retailai/printer-bridge` package + per-platform install scripts
- ✅ Bearer-token auth (rotatable, rate-limited); heartbeat every 60s reusing terminal pattern
- ✅ No offline queue in v1 — cashier reprints from history on failure
- ✅ systemd / launchd / procd / NSSM for service supervision per-platform
- ✅ Structured JSON logs + Sentry for errors

- [x] Approved — proceeding to Phase 2 — 2026-04-23
- [ ] Revisions needed — _specify below_

**User notes:**
Approved 2026-04-23.

---

## 4. Data Model

🎭 **Role: Database Optimizer + Data Engineer**

### 4.1 Entity-Relationship overview

```
┌──────────────┐     1:N    ┌──────────────────────────────┐
│   tenants    │ ─────────▶ │          locations           │
└──────────────┘            └──────────┬───────────────────┘
                                       │ 1:1 (optional)
                                       ▼
                            ┌──────────────────────────────┐
                            │ location_printer_settings    │  ◀── primary config + last-seen state
                            │ (config + ephemeral status)  │
                            └──────────────────────────────┘

                            ┌──────────────────────────────┐
                            │       print_jobs             │  ◀── P2, audit log only (deferred)
                            │  (deferred to v1.1)          │
                            └──────────────────────────────┘
```

**Scoping principle:** printer config is **per-location**, not per-tenant. A multi-counter shop has multiple `locations` rows and one `location_printer_settings` row per counter. The existing per-tenant `shop_settings` table stays focused on tenant-wide receipt header/footer content; printer transport config moves to the new table.

### 4.2 Database schema (Drizzle)

```ts
// packages/database/src/schema/location-printer-settings.ts
import { pgTable, uuid, text, smallint, boolean, timestamp, pgEnum, index } from 'drizzle-orm/pg-core';
import { locations } from './locations';

export const printerDriverEnum = pgEnum('printer_driver', [
  'generic',
  'star',
  'epson',
  'custom',
]);

export const printerCodePageEnum = pgEnum('printer_code_page', [
  'cp437',
  'gb18030',
  'big5',
  'shift_jis',
]);

export const printerStatusEnum = pgEnum('printer_status', [
  'ok',
  'offline',
  'out_of_paper',
  'error',
  'unknown',
]);

// Location-level printer status (admin UX): separates "disabled" from "bridge-unreachable"
// per product review M4. Solves scenario S2 (distinguish failure modes).
export const printerLocationStatusEnum = pgEnum('printer_location_status', [
  'disabled',     // no network printer for this location; cashier uses iframe fallback
  'enabled',      // normal operation
  'maintenance',  // admin flagged; cashier falls back to iframe but bridge keeps heartbeating
]);

export const locationPrinterSettings = pgTable(
  'location_printer_settings',
  {
    // identity
    locationId: uuid('location_id')
      .primaryKey()
      .references(() => locations.id, { onDelete: 'cascade' }),

    // config (admin sets these)
    status: printerLocationStatusEnum('status').notNull().default('disabled'), // enabled / disabled / maintenance — see §7.3
    endpointUrl: text('endpoint_url').notNull(), // e.g. https://print-countingstars.hkretailai.com/print
    tunnelId: text('tunnel_id').notNull(), // Cloudflare tunnel UUID (provisioned by admin)
    driver: printerDriverEnum('driver').notNull().default('generic'),
    paperWidth: smallint('paper_width').notNull().default(80), // 58 or 80
    codePage: printerCodePageEnum('code_page').notNull().default('big5'),
    defaultCopies: smallint('default_copies').notNull().default(1),
    cashDrawerEnabled: boolean('cash_drawer_enabled').notNull().default(false),

    // auth — HMAC-SHA256(pepper, raw_token), hex-encoded (32 bytes → 64 chars)
    tokenHash: text('token_hash').notNull(),
    // during rotation, bridge is still running with old token; accept both for `rotation_overlap_until`
    pendingTokenHash: text('pending_token_hash'),         // nullable; set during rotation
    rotationOverlapUntil: timestamp('rotation_overlap_until', { withTimezone: true }),
    pendingCommandType: text('pending_command_type'),      // 'rotate_token' | 'force_update' | null
    pendingCommandPayload: jsonb('pending_command_payload'), // command args
    tokenRotatedAt: timestamp('token_rotated_at', { withTimezone: true }).notNull().defaultNow(),

    // ephemeral status (updated by bridge heartbeats)
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }),
    bridgeVersion: text('bridge_version'),
    printerStatus: printerStatusEnum('printer_status').notNull().default('unknown'),
    lastError: text('last_error'),
    lastPrinterModel: text('last_printer_model'), // USB VID:PID or human string when known
    jobsServedTotal: integer('jobs_served_total').notNull().default(0),

    // audit
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    // partial index for admin "which shops are offline?" dashboard
    offlineIdx: index('location_printer_offline_idx')
      .on(t.lastSeenAt)
      .where(sql`${t.status} = 'enabled'`),
    // for finding all enabled printers (fleet reports + alerting)
    statusIdx: index('location_printer_status_idx').on(t.status),
    // for fleet alert job — find enabled rows with stale heartbeat
    staleAlertIdx: index('location_printer_stale_idx')
      .on(t.lastSeenAt)
      .where(sql`${t.status} = 'enabled'`),
  }),
);

export type LocationPrinterSettings = typeof locationPrinterSettings.$inferSelect;
export type NewLocationPrinterSettings = typeof locationPrinterSettings.$inferInsert;
```

**Why this shape:**

- **`location_id` as primary key** — enforces 1:1, and foreign-key cascade from `locations` drops the row cleanly when a location is deleted.
- **`token_hash` not raw token** — HMAC-SHA256 of raw token using server-side pepper; raw shown once on rotate. Fast to verify (~2μs), safe because raw token has 256 bits entropy. Matches §3.1 revision per M2.
- **Three-state `status` (not boolean)** — distinguishes `disabled` (no network printer, iframe fallback) from `maintenance` (bridge is reachable but admin wants to pause printing) from `enabled` (normal). Fixes M4.
- **`pending_token_hash` + `rotation_overlap_until`** — during token rotation, server accepts BOTH old and new hash for a 10-minute overlap so bridge has time to fetch the new token on its next heartbeat (max 60s). Fixes M1.
- **`pending_command_type` / `pending_command_payload`** — server-queued commands for the bridge (rotate_token, force_update). Bridge fetches and applies on next heartbeat; server clears after ACK. Fixes M1.
- **`tunnel_id`** — stored explicitly so admin can migrate bridge devices (W5) without losing the CF tunnel identifier.
- **Ephemeral status on same row** — heartbeats update `last_seen_at` / `printer_status` / `bridge_version` / `jobs_served_total`. Simpler than a separate status table for 1:1 cardinality.
- **`staleAlertIdx`** — supports fleet alerting job (M5): `WHERE status='enabled' AND last_seen_at < now() - interval '1 hour'`.

### 4.3 Deprecated fields (kept for backwards compat, no longer used)

| Table.Column | Status | Plan |
|---|---|---|
| `shop_settings.print_mode` | DEPRECATED (was `'browser' \| 'escpos' \| 'both'`) | Keep column, ignore value. Drop in migration `0007` after 1 release cycle |
| `shop_settings.print_server_url` | DEPRECATED | Same as above |
| `packages/print-server/*` (existing Node code) | REWRITTEN, not deleted | Extend into cross-platform daemon per Phase 1 §3.1 |

### 4.4 Index strategy

| Table | Index | Columns | Purpose | Query pattern |
|---|---|---|---|---|
| `location_printer_settings` | PK | `location_id` | Identity lookup | `SELECT * WHERE location_id = $1` — cashier mount, admin load |
| `location_printer_settings` | `location_printer_offline_idx` | `last_seen_at WHERE enabled = true` | Offline dashboard | `WHERE enabled AND last_seen_at < now() - interval '5 min'` |
| `location_printer_settings` | `location_printer_enabled_idx` | `enabled` | Fleet size / billing reports | `SELECT count(*) WHERE enabled` |

No additional indexes needed — the table has O(shops) rows (hundreds to low thousands), not a high-write path.

### 4.5 Migration strategy

**Migration `0006_add_location_printer_settings.sql`** (additive, zero data loss):

```sql
-- Add enum types
CREATE TYPE printer_driver AS ENUM ('generic', 'star', 'epson', 'custom');
CREATE TYPE printer_code_page AS ENUM ('cp437', 'gb18030', 'big5', 'shift_jis');
CREATE TYPE printer_status AS ENUM ('ok', 'offline', 'out_of_paper', 'error', 'unknown');
CREATE TYPE printer_location_status AS ENUM ('disabled', 'enabled', 'maintenance');

-- Create table
CREATE TABLE location_printer_settings (
  location_id UUID PRIMARY KEY REFERENCES locations(id) ON DELETE CASCADE,
  status printer_location_status NOT NULL DEFAULT 'disabled',
  endpoint_url TEXT NOT NULL,
  tunnel_id TEXT NOT NULL,
  driver printer_driver NOT NULL DEFAULT 'generic',
  paper_width SMALLINT NOT NULL DEFAULT 80 CHECK (paper_width IN (58, 80)),
  code_page printer_code_page NOT NULL DEFAULT 'big5',
  default_copies SMALLINT NOT NULL DEFAULT 1 CHECK (default_copies BETWEEN 1 AND 10),
  cash_drawer_enabled BOOLEAN NOT NULL DEFAULT FALSE,

  -- Auth: HMAC-SHA256 hashed tokens
  token_hash TEXT NOT NULL,
  pending_token_hash TEXT,
  rotation_overlap_until TIMESTAMPTZ,
  pending_command_type TEXT CHECK (pending_command_type IN ('rotate_token', 'force_update')),
  pending_command_payload JSONB,
  token_rotated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Ephemeral heartbeat state
  last_seen_at TIMESTAMPTZ,
  bridge_version TEXT,
  printer_status printer_status NOT NULL DEFAULT 'unknown',
  last_error TEXT,
  last_printer_model TEXT,
  jobs_served_total INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX location_printer_offline_idx
  ON location_printer_settings (last_seen_at)
  WHERE status = 'enabled';

CREATE INDEX location_printer_status_idx
  ON location_printer_settings (status);

CREATE INDEX location_printer_stale_idx
  ON location_printer_settings (last_seen_at)
  WHERE status = 'enabled';

-- Updated-at trigger (matches existing convention in the repo)
CREATE TRIGGER update_location_printer_settings_updated_at
  BEFORE UPDATE ON location_printer_settings
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
```

**No backfill.** Existing locations don't auto-get a row; admin inserts when provisioning. Cashier code treats "no row" OR `status='disabled'` OR `status='maintenance'` = "use iframe fallback".

**Rollback:**
```sql
DROP TABLE location_printer_settings;
DROP TYPE printer_location_status;
DROP TYPE printer_status;
DROP TYPE printer_code_page;
DROP TYPE printer_driver;
```

---

## 5. API Design

### 5.1 API surface

Three distinct surfaces:

| # | Surface | Consumer | Server | Transport |
|---|---|---|---|---|
| **A** | **Bridge API** | iPad cashier + admin test-print | `@retailai/printer-bridge` daemon on shop's bridge device | HTTPS via Cloudflare Tunnel (`print-<slug>.hkretailai.com`) |
| **B** | **Admin server actions** | `apps/admin` UI | `apps/admin/src/lib/printer-actions.ts` (new) | Next.js server actions (in-process) |
| **C** | **Heartbeat API** | Bridge daemon | `apps/admin` (existing) | HTTPS `admin.hkretailai.com/api/printers/heartbeat` |

### 5.2 Surface A — Bridge API (`print-<slug>.hkretailai.com`)

#### 5.2.1 Overview

| # | Method | Path | Purpose | Auth | Priority |
|---|---|---|---|---|---|
| A1 | POST | `/print` | Send ESC/POS bytes to the printer | Bearer | P0 |
| A2 | POST | `/test` | Run a diagnostic self-test (bridge builds the test page) | Bearer | P0 |
| A3 | GET | `/health` | Bridge + printer status snapshot | Bearer | P0 |
| A4 | GET | `/version` | Daemon version | None (public) | P0 |

#### 5.2.2 A1 — `POST /print`

**Headers:**
```
Authorization: Bearer <per-shop-token>
Content-Type: application/json
Idempotency-Key: <job-uuid>         ← the ONLY source of truth for jobId (m4 fix)
```

**Request body:**
```json
{
  "bytesBase64": "G0AbYQAbLwA...",  // ESC/POS payload as base64
  "copies": 1,                       // default 1, max 10
  "kickDrawer": true,                // optional, appends ESC p 0 pulse
  "driver": "generic",               // informational; bridge doesn't rebuild
  "timeoutMs": 3000                  // client-declared upper bound
}
```

**Success response (200):**
```json
{
  "ok": true,
  "jobId": "8b7f3e9c-...",           // echoed from Idempotency-Key header
  "durationMs": 420,
  "printerStatus": "ok"
}
```

**Error response shape:**
```json
{
  "ok": false,
  "jobId": "8b7f3e9c-...",
  "error": "no_paper",
  "message": "Printer did not respond within 3000ms (possible out-of-paper or offline)",
  "retryable": true
}
```

**Error codes:**
| HTTP | `error` | Meaning | Retryable? |
|---|---|---|---|
| 400 | `invalid_payload` | Malformed JSON or missing required fields | No |
| 400 | `payload_too_large` | bytes > 64 KiB | No |
| 401 | `unauthorized` | Missing/invalid bearer token | No |
| 409 | `duplicate_job` | Same `jobId` already completed within 5 min | No (return the original result) |
| 413 | `payload_too_large` | Same as above, for proxy-layer detection | No |
| 429 | `rate_limited` | > 10 req/s per token | Yes (backoff) |
| 502 | `no_paper` | Write timeout or printer-signal | Yes (after refill) |
| 502 | `printer_timeout` | USB write didn't complete | Yes |
| 503 | `printer_offline` | Printer device not found | Yes |
| 500 | `bridge_internal` | Unexpected daemon error | Yes |

**Idempotency:** same `jobId` within 5 minutes returns the original response (409 with embedded original payload). Protects against cashier-network retries double-printing.

#### 5.2.3 A2 — `POST /test`

Bridge builds a canonical test page (shop name, timestamp, codepage glyph test) using the supplied driver/paper/codepage. Used by admin's "Test print" button so admin doesn't need to duplicate receipt-building logic.

**Request body:**
```json
{
  "jobId": "...",
  "driver": "generic",
  "paperWidth": 80,
  "codePage": "big5",
  "shopName": "CountingStars",
  "locationName": "Counter 1",
  "kickDrawer": false
}
```

**Response:** same shape as A1.

#### 5.2.4 A3 — `GET /health`

**Response (200):**
```json
{
  "ok": true,
  "bridgeUp": true,
  "printerUp": true,
  "printerStatus": "ok",
  "printerModel": "USB VID:04b8 PID:0202 (likely Epson TM-T20)",
  "lastError": null,
  "uptimeSec": 12345,
  "version": "0.1.0",
  "jobsServedTotal": 4821,
  "jobsToday": 156
}
```

If printer is offline:
```json
{
  "ok": true,
  "bridgeUp": true,
  "printerUp": false,
  "printerStatus": "offline",
  "lastError": "No USB printer-class device found at /dev/usb/lp* (checked at 2026-04-23T08:23:11Z)",
  "uptimeSec": 12345,
  "version": "0.1.0",
  "jobsServedTotal": 4821,
  "jobsToday": 156
}
```

Admin uses this on `updateLocationPrinter` save to pre-verify reachability.

#### 5.2.5 A4 — `GET /version`

```
0.1.0
```

Plain-text, no auth. Used by monitoring to confirm the tunnel is live without a token.

### 5.3 Surface B — Admin server actions

File: `apps/admin/src/lib/printer-actions.ts` (new).

| # | Action | Purpose |
|---|---|---|
| B1 | `getLocationPrinterSettings(locationId)` | Load config for a location |
| B2 | `updateLocationPrinterSettings(locationId, patch)` | Update driver / paper / codepage / copies / cash drawer. Does NOT touch auth or endpoint |
| B3 | `rotateLocationPrinterToken(locationId)` | Generate new 32-byte token, HMAC-SHA256-hash it, save as `pending_token_hash` with 10-min overlap, queue `rotate_token` command. Returns raw once. Bridge picks up new token on next heartbeat (≤60s) |
| **B4** | **`provisionLocationPrinter(locationId, shopSlug)`** | **Server-side CF provisioning (M3 fix). Admin server holds `CF_API_TOKEN`; installer never sees it. Creates CF tunnel + DNS + initial token; returns `{endpointUrl, tunnelCredentials, bootstrapToken, initialToken}` for the installer to paste into `printer-bridge install`** |
| B5 | `testLocationPrinter(locationId)` | Server fetches bridge `/test` with admin's auth credential |
| B6 | `getLocationPrinterStatus(locationId)` | Returns cached heartbeat row + latest `/health` fetch |
| B7 | `setLocationPrinterStatus(locationId, 'enabled'\|'disabled'\|'maintenance')` | M4 three-state transition. `disabled`: destroys tunnel (optional), row remains for re-provision. `maintenance`: tunnel stays up, cashier falls back to iframe |
| **B8** | **`migrateLocationPrinterBridge(locationId)`** | **W5 fix: generate new `bootstrapToken` bound to existing `tunnel_id` + `endpointUrl`. Installer runs `printer-bridge install --migrate <bootstrap>` on NEW hardware. Tunnel UUID preserved → endpoint URL unchanged → cashier continues with no config change** |
| **B9** | **`getFleetPrinterStatus(tenantId)`** | **M5 fix: returns all locations' printer status for a tenant, for fleet dashboard** |

All actions are `"use server"` and filter by `tenantId` from session per existing convention.

#### 5.3.1 B3 — `rotateLocationPrinterToken` contract (M1 fix)

```ts
type RotateResult =
  | {
      ok: true;
      rawToken: string;        // show once, copy-to-clipboard
      rotatedAt: Date;
      overlapUntil: Date;      // old token still valid until this time
      bridgeWillUpdateWithin: number; // seconds, ≤ 60 (next heartbeat)
    }
  | { ok: false; error: 'not_found' | 'unauthorized' | 'command_pending' };
```

**Rotation flow:**
1. Generate `newToken` (32 random bytes, base64url)
2. Compute `newHash = hmac_sha256(pepper, newToken)`
3. `UPDATE location_printer_settings SET pending_token_hash = newHash, rotation_overlap_until = now() + interval '10 min', pending_command_type = 'rotate_token', pending_command_payload = '{"newToken": "..."}'`
4. Return `rawToken` to admin UI (shown once)
5. Bridge's next heartbeat (≤60s) receives `commands: [{type: 'rotate_token', newToken}]`
6. Bridge: writes new token to config, reloads, sends next heartbeat with `acked_command_id`
7. Server: on ACK, `UPDATE ... SET token_hash = pending_token_hash, pending_token_hash = NULL, rotation_overlap_until = NULL, pending_command_type = NULL`
8. During overlap, `/print` accepts EITHER old or new hash

If `command_pending` error returned: a previous rotation hasn't been ACKed yet; admin must wait or force-revert.

#### 5.3.2 B4 — `provisionLocationPrinter` contract (M3 fix — key change)

```ts
type ProvisionResult =
  | {
      ok: true;
      endpointUrl: string;           // https://print-<slug>.hkretailai.com/print
      tunnelId: string;              // CF tunnel UUID
      tunnelCredentials: string;     // base64-encoded cloudflared credentials JSON
      bootstrapToken: string;        // short-lived (1 hour), used by bridge installer to fetch initial bearer token
      initialToken: string;          // 32-byte raw bearer token, shown once
    }
  | { ok: false; error: 'already_provisioned' | 'cf_api_error' | 'unauthorized' };
```

**Server-side flow** (runs inside admin ECS, holds `CF_API_TOKEN`):
1. Generate tunnel name `print-<tenantSlug>-<locationSlug>` (or just `<tenantSlug>` for single-location)
2. `POST /accounts/{account_id}/cfd_tunnel` → tunnel_id + credentials_file
3. `POST /zones/{zone_id}/dns_records` → CNAME to `<tunnel_id>.cfargotunnel.com`
4. Generate `bootstrapToken` (JWT, 1-hour TTL, signed with admin server secret, scoped to `locationId`)
5. Generate `initialToken` (32 random bytes), hash, save row with `status='enabled'`, `tunnel_id`, `endpoint_url`
6. Return all credentials + tokens to admin UI
7. Admin installer runs: `printer-bridge install --bootstrap <bootstrapToken>`
8. Bridge exchanges bootstrap at `admin.hkretailai.com/api/printers/bootstrap` → receives cloudflared credentials + first bearer token
9. Bridge self-starts; first heartbeat confirms provisioning

`CF_API_TOKEN` never leaves ECS.

#### 5.3.3 B7 — `setLocationPrinterStatus` contract (M4 fix)

```ts
type StatusTransition = 'enabled' | 'disabled' | 'maintenance';

async function setLocationPrinterStatus(
  locationId: string,
  nextStatus: StatusTransition,
  opts?: { destroyTunnelOnDisable?: boolean }
): Promise<{ ok: true } | { ok: false; error: string }>;
```

**Semantics:**

| From → To | DB update | Tunnel | Bridge behavior | Cashier behavior |
|---|---|---|---|---|
| `*` → `enabled` | `status='enabled'` | Keep/create | Heartbeat + accept prints | Uses network printer |
| `*` → `maintenance` | `status='maintenance'` | Keep | Heartbeat, refuse `/print` (returns 503 `maintenance`) | Falls back to iframe, shows "Printer in maintenance" toast |
| `*` → `disabled` | `status='disabled'`; if `opts.destroyTunnelOnDisable`: also CF API tunnel delete + DNS delete | Destroy optional | Heartbeat returns 410 `disabled`, bridge exits gracefully | Falls back to iframe (no toast — silent) |

Soft disable (`destroyTunnelOnDisable=false`) allows fast re-enable without re-provisioning. Full disable cleans up CF resources.

### 5.4 Surface C — Heartbeat API (bridge → admin)

#### 5.4.1 C1 — `POST /api/printers/heartbeat`

**Mounted at:** `apps/admin/src/app/api/printers/heartbeat/route.ts` (new).

**Headers:**
```
Authorization: Bearer <per-shop-token>
```

**Request body:**
```json
{
  "locationId": "...",
  "bridgeVersion": "0.1.0",
  "printerStatus": "ok",
  "printerModel": "USB VID:04b8 PID:0202",
  "lastError": null,
  "uptimeSec": 12345,
  "jobsServedTotal": 4821,
  "ackedCommandId": "cmd_8b7f3e9c"    // if applying a command from previous heartbeat response
}
```

**Response (200):**
```json
{
  "ok": true,
  "nextHeartbeatIn": 60,
  "serverTime": "2026-04-23T08:23:11Z",
  "mode": "enabled",                   // 'enabled' | 'maintenance' — bridge's behavior
  "commands": [
    {
      "id": "cmd_8b7f3e9c",            // unique ID; bridge ACKs by id in next heartbeat
      "type": "rotate_token",
      "payload": {
        "newToken": "Vx9Kp7qLmN...",   // raw token (only sent once; server deleted after ACK)
        "effectiveAt": "2026-04-23T08:23:11Z"
      }
    }
  ]
}
```

**`commands[]` in v1 (M1 fix):**
- `{type: 'rotate_token', payload: {newToken, effectiveAt}}` — bridge updates config with new token, next heartbeat ACKs
- `{type: 'force_update', payload: {targetVersion}}` — S5 / W6: bridge runs `npm install -g @retailai/printer-bridge@<version>`, restarts. Paired with rollback (§8.7)
- `{type: 'reload_config'}` — bridge re-reads config from disk (used by admin's rare manual changes)

Server-side lifecycle: command written to `pending_command_type` / `pending_command_payload` at creation. Returned on next heartbeat. Cleared when bridge's next heartbeat includes `ackedCommandId`.

**`mode` field (M4 fix):** mirrors DB `status` minus `disabled` (disabled rows return 410). Bridge honors `mode='maintenance'` by refusing prints with 503 while still running.

**Errors:**
| HTTP | `error` | Meaning |
|---|---|---|
| 401 | `unauthorized` | Token doesn't match any location; verify via HMAC against `token_hash` OR `pending_token_hash` during overlap window |
| 404 | `location_not_found` | `locationId` invalid |
| 410 | `printer_disabled` | `status='disabled'` — bridge should exit gracefully |

### 5.5 Scenario → API mapping

| Scenario ID | API calls | Notes |
|---|---|---|
| C1 (print after payment) | A1 `POST /print` | Primary path |
| C2 (reprint from history) | A1 `POST /print` | Same endpoint, different jobId |
| C3 (cash drawer) | A1 `POST /print` with `kickDrawer=true` | Same stream |
| C4 (out of paper) | A1 `POST /print` → 502 `no_paper` | Cashier toast |
| C5 (network down) | A1 fetch timeout | Browser network error |
| C6 (multi-copy) | A1 with `copies=N` | Bridge iterates, single job |
| C7 (codepage) | A1 bytes already have codepage select | Browser driver sets `ESC t` |
| C8 (cashier test print) | A2 `POST /test` | Same as admin |
| O1 (first-time setup) | B4 `provisionLocationPrinter` + B3 `rotateLocationPrinterToken` + A2 `POST /test` | Chained in admin UI |
| O2 (printer swap) | No API — replug and reprint | |
| O3 (paper width change) | B2 `updateLocationPrinterSettings` + A2 `POST /test` | |
| O4 (multi-location) | N rows in `location_printer_settings` | Cashier reads own location |
| I1–I3 (installs) | Install script → `provisionLocationPrinter` via admin UI | Bootstrap only; no runtime API |
| I4 (bridge swap) | B3 rotate token, B2 update endpoint URL if tunnel UUID changed | |
| I5 (uninstall) | B7 `disableLocationPrinter` | Optional |
| S1 (remote triage) | B5 `testLocationPrinter` + B6 `getLocationPrinterStatus` | |
| S2 (distinguish failure) | A3 `/health` response discriminates | |
| AT-22 (auto-update) | No API — bridge handles locally | |
| Bridge heartbeat | C1 every 60s | Forward channel |

### 5.6 Wire-format example — full round-trip for a print

Cashier (pseudo-code):
```ts
const bytes = buildEscPosBytes({
  receipt: receiptData,
  driver: location.printer.driver,
  paperWidth: location.printer.paperWidth,
  codePage: location.printer.codePage,
});

const res = await fetch(`${location.printer.endpointUrl}`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${location.printer.token}`,
    'Content-Type': 'application/json',
    'Idempotency-Key': jobId,
  },
  body: JSON.stringify({
    jobId,
    bytesBase64: toBase64(bytes),
    copies: receiptData.copies ?? 1,
    kickDrawer: receiptData.paymentMethod === 'cash' && location.printer.cashDrawerEnabled,
    driver: location.printer.driver,
    timeoutMs: 3000,
  }),
  signal: AbortSignal.timeout(4000), // slight buffer over server-side timeout
});

const result = await res.json();
if (!result.ok) showToast(errorToastFor(result.error));
```

### 5.7 Rate limits

| Endpoint | Limit | Enforcement |
|---|---|---|
| A1 `/print` | 10 req/sec per token; 1000/hour | Bridge daemon (in-memory token bucket); 429 on exceed |
| A2 `/test` | 30/hour per token | Bridge daemon |
| A3 `/health` | Unlimited (cheap) | None |
| A4 `/version` | Unlimited | None |
| C1 `/api/printers/heartbeat` | 2 req/min per token (bridge sends 1/min) | Admin API middleware |

### 5.8 Backward compatibility

- Cashier code checks: if `location.printer` row absent OR `enabled=false` → fall back to existing `window.print()` iframe (pre-this-module behavior). No breaking change to existing shops.
- Admin UI introduces a new section; doesn't alter existing `updateLocationReceipt`.
- No API removed. `shop_settings.print_mode` / `print_server_url` left in place, marked deprecated; ignored by new code.

### Phase 2 Sign-off

**Phase:** 2 — Data Model + API Design
**Deliverables:** ER overview, Drizzle schema for `location_printer_settings`, index strategy (2 custom indexes), migration `0006`, 3 API surfaces with 11 endpoints + contracts, rate limits, scenario-to-API mapping, wire-format example, backward-compat plan
**Active persona:** 🎭 Role: Database Optimizer + Data Engineer
**Decision required:** Is the schema + API contract right? Any scenarios not covered?

**Key decisions to confirm:**
- ✅ One new table `location_printer_settings`, per-location, 1:1 FK to `locations`
- ✅ Token stored as argon2id hash, raw shown once at rotate
- ✅ Ephemeral status (last_seen_at, printer_status, jobs_served) on same row — not a separate history table (audit log deferred to v1.1)
- ✅ Bridge endpoints: `/print`, `/test`, `/health`, `/version`
- ✅ Admin actions: 7 server actions (provision, update, rotate, test, status, disable)
- ✅ Heartbeat pattern at `/api/printers/heartbeat` mirrors terminal heartbeat
- ✅ Idempotency via `Idempotency-Key` + `jobId` matching; 5-min replay window
- ✅ Soft deprecation of `shop_settings.print_mode` / `print_server_url` — drop in 0007

- [x] Approved — proceeding to Phase 3 — 2026-04-23
- [ ] Revisions needed — _specify below_

**User notes:**
Approved 2026-04-23.

---

## 6. System Architecture

🎭 **Role: Backend Architect + Frontend Developer**

### 6.1 Architecture overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                               CUSTOMER SHOP                              │
│                                                                          │
│   ┌──────────────┐                                                       │
│   │     iPad     │                                                       │
│   │   (cashier)  │                                                       │
│   └──────┬───────┘                                                       │
│          │ shop Wi-Fi                                                    │
│          │                                                               │
│   ┌──────▼────────────────────────────────────────────────────────┐     │
│   │                  BRIDGE DEVICE (Mac / Pi / Mini PC / Router)   │     │
│   │                                                                 │     │
│   │   ┌────────────────┐        ┌───────────────────────────┐     │     │
│   │   │  cloudflared   │        │   @retailai/printer-      │     │     │
│   │   │  (outbound     │◀──────▶│   bridge daemon           │     │     │
│   │   │   to CF edge)  │        │   - bearer-token check    │     │     │
│   │   └────────────────┘        │   - rate limiter          │     │     │
│   │           ▲                 │   - idempotency cache     │     │     │
│   │           │                 │   - transport adapter     │     │     │
│   │           │                 │     (raw lp / node-usb /  │     │     │
│   │           │                 │      CUPS)                │     │     │
│   │           │                 └──────────┬────────────────┘     │     │
│   │           │                            │                       │     │
│   │           │                            │ USB write             │     │
│   │           │                            ▼                       │     │
│   │           │                    ┌───────────────┐                │     │
│   │           │                    │   Xprinter    │                │     │
│   │           │                    │    N160II     │                │     │
│   │           │                    └───────────────┘                │     │
│   │           │                                                    │     │
│   │           │ heartbeat every 60s (outbound 443)                 │     │
│   └───────────┼────────────────────────────────────────────────────┘     │
│               │                                                          │
└───────────────┼──────────────────────────────────────────────────────────┘
                │
                │ encrypted QUIC/HTTP2
                ▼
┌───────────────────────────────────────────────────────────────────────┐
│                     CLOUDFLARE EDGE (global)                           │
│                                                                        │
│  Tunnel ingress:                                                       │
│   - print-countingstars.hkretailai.com → tunnel → shop-1 bridge        │
│   - print-853mask.hkretailai.com       → tunnel → shop-2 bridge        │
│   - print-<slug>.hkretailai.com        → tunnel → shop-N bridge        │
│                                                                        │
│  TLS terminated here; headers forwarded.                               │
└───────────────────────────────────────────────────────────────────────┘
                ▲
                │ HTTPS
                │
┌───────────────┼───────────────────────────────────────────────────────┐
│     RESELLER CLOUD (existing infra on ECS 47.83.141.219)               │
│                                                                        │
│   ┌──────────────────┐        ┌──────────────────────┐                 │
│   │  apps/admin      │        │   apps/cashier       │                 │
│   │  (Next.js)       │        │   (Next.js PWA)      │                 │
│   │                  │        │                      │                 │
│   │  - location      │        │   - build ESC/POS    │                 │
│   │    printer UI    │        │     in browser       │                 │
│   │  - test print    │        │   - POST /print      │                 │
│   │  - fleet status  │        │   - toast on error   │                 │
│   └────────┬─────────┘        └──────────┬───────────┘                 │
│            │                             │                             │
│            │      ┌──────────────────────┘                             │
│            │      │                                                    │
│            │      ▼                                                    │
│    ┌───────▼─────────────────┐      ┌────────────────────────────┐   │
│    │  /api/printers/         │      │ @retailai/escpos-shared    │   │
│    │  heartbeat              │      │ (shared monorepo package)  │   │
│    │  - validates bearer     │      │ - driver registry          │   │
│    │  - UPSERT last_seen_at  │      │ - byte builder (Uint8Array)│   │
│    │  - returns commands[]   │      │ - codepage encoders        │   │
│    └────────┬─────────────────┘      └────────────────────────────┘   │
│             │                                                          │
│             ▼                                                          │
│    ┌─────────────────────┐                                             │
│    │   PostgreSQL        │                                             │
│    │   location_         │                                             │
│    │   printer_settings  │                                             │
│    └─────────────────────┘                                             │
└───────────────────────────────────────────────────────────────────────┘
```

### 6.2 Components

| Component | Location | Owner | Purpose |
|---|---|---|---|
| `@retailai/escpos-shared` | `packages/escpos-shared/` (new) | Frontend + Backend | Driver registry + byte builder; shared between cashier browser and bridge daemon |
| `@retailai/printer-bridge` | `packages/print-server/` (rewritten) | Backend | Node daemon: HTTP server, auth, rate-limit, USB transport, heartbeat, install scripts |
| Cashier print branch | `apps/cashier/src/components/receipt/print-receipt.tsx` (edited) + `apps/cashier/src/lib/printer.ts` (new) | Frontend | Decide network-vs-fallback; build bytes; POST to bridge |
| Admin printer panel | `apps/admin/src/app/(dashboard)/locations/[id]/printer/*` (new) + `apps/admin/src/lib/printer-actions.ts` (new) | Frontend + Backend | Config UI, test-print button, live status display |
| Heartbeat endpoint | `apps/admin/src/app/api/printers/heartbeat/route.ts` (new) | Backend | Receive heartbeats, update DB, return commands |
| Migration `0006` | `packages/database/drizzle/0006_add_location_printer_settings.sql` (new) | Backend | DB schema changes |
| Install scripts | `packages/print-server/install/*.sh`, `*.ps1` (new) | DevOps | One-command installers per platform |
| Cloudflare Pages site | `install.hkretailai.com` | DevOps | Hosts install scripts (served from `packages/print-server/install/`) |
| Cloudflare Tunnel (per shop) | CF account | DevOps | Creates `print-<slug>.hkretailai.com` subdomain + routing |

### 6.3 Request flow — happy-path print

```
1. Cashier taps "Print receipt"
     │
2.   │ apps/cashier/src/lib/printer.ts:sendPrintJob(orderId, location)
     │   ├─ Load printer config from React context (populated at shop load)
     │   ├─ If !location.printer.enabled → fall back to iframe path, return
     │   ├─ Build ReceiptData via existing receipt-queries.ts (unchanged)
     │   ├─ Call escposShared.buildBytes({driver, paperWidth, codePage, receipt})
     │   │    → returns Uint8Array (raw ESC/POS)
     │   ├─ Generate jobId = crypto.randomUUID()
     │   └─ fetch(location.printer.endpointUrl, {
     │         method: 'POST',
     │         headers: {Authorization: `Bearer ${token}`, Idempotency-Key: jobId},
     │         body: JSON.stringify({jobId, bytesBase64, copies, kickDrawer, driver})
     │       })
     │
3.   ▼ HTTPS → Cloudflare edge (closest POP, typically HK/TW/SG)
     │   TLS termination, verify `print-<slug>.hkretailai.com` certificate
     │   Forward request through persistent tunnel to shop's cloudflared
     │
4.   ▼ cloudflared on bridge device receives over QUIC/HTTP2
     │   Forwards to localhost:3901 (print-server daemon)
     │
5.   ▼ printer-bridge daemon
     │   ├─ Middleware: parse JSON (max 64 KiB body)
     │   ├─ Middleware: verify Bearer token against argon2id hash in local config
     │   ├─ Middleware: token-bucket rate limit (10/s per token)
     │   ├─ Middleware: idempotency cache (5 min, keyed by jobId)
     │   ├─ Handler: /print
     │   │   ├─ Base64-decode bytesBase64 → Buffer
     │   │   ├─ Acquire write semaphore (max 1 concurrent print)
     │   │   ├─ Transport adapter write:
     │   │   │   - Linux/OpenWRT: fs.writeFile('/dev/usb/lp0', bytes, {timeout: 3000})
     │   │   │   - macOS/Windows primary: usb.write(vendorId, productId, bytes)
     │   │   │   - macOS/Windows fallback: spawn('lp', ['-d', name, '-o', 'raw'])
     │   │   ├─ Repeat for copies > 1
     │   │   ├─ Append cash-drawer-kick bytes if kickDrawer
     │   │   ├─ Release semaphore
     │   │   └─ Return {ok: true, jobId, durationMs, printerStatus: 'ok'}
     │
6.   ▼ Response travels back tunnel → CF edge → Safari
     │
7.   ▼ apps/cashier shows green toast "Receipt printed ✓"
     │   Logs success to Sentry breadcrumb (not error)
```

### 6.4 Failure flows

**Printer offline / unplugged (AT-04):**
```
5.   Handler /print
     ├─ Transport adapter write fails (ENOENT on /dev/usb/lp0)
     ├─ Return {ok: false, error: 'printer_offline', retryable: true}
     │
6.   ▼ Cashier receives 503, shows red toast "Printer offline — check connection"
     │   Does NOT retry automatically (user-initiated retry only)
     │   Order state unchanged — still paid
```

**Bridge unreachable (AT-04 / AT-05):**
```
3.   Cloudflare edge attempts tunnel forward
     ├─ Tunnel not established (bridge down)
     ├─ CF returns 502 or fetch times out at cashier
     │
4.   Cashier fetch catches network error
     │   AbortSignal fires at 4000ms
     │   Shows red toast "Printer unreachable — check network"
```

**Out of paper (AT-03):**
```
5.   Transport adapter writes bytes successfully to USB
     ├─ /dev/usb/lp0 accepts write (kernel buffer) but printer buffer doesn't drain
     ├─ Heuristic: if write returns in < 10ms AND /sys/class/usb-printer reports no activity after 3s → suspect out-of-paper
     ├─ Return {ok: false, error: 'no_paper', retryable: true}
```

_Note:_ genuine out-of-paper detection requires USB status query, which varies per printer. v1 uses write-timeout + printer-not-advancing heuristic; good-enough signal for cashier UX.

### 6.5 Heartbeat flow

Runs every 60s on the bridge daemon via `setInterval`:

```
Bridge daemon
  │ every 60s
  ▼
1. Collect snapshot: {bridgeVersion, printerStatus, lastError, uptimeSec, jobsServedTotal}
2. fetch('https://admin.hkretailai.com/api/printers/heartbeat', {
     headers: {Authorization: Bearer <token>, X-Location-Id: <uuid>},
     body: JSON.stringify(snapshot)
   })
3. Admin endpoint:
   ├─ Verify token by looking up token_hash for locationId
   ├─ UPSERT location_printer_settings SET last_seen_at = now(),
   │     bridge_version, printer_status, last_error, jobs_served_total
   └─ Return {ok, nextHeartbeatIn: 60, commands: []}
4. Bridge applies commands (none in v1), sleeps 60s
```

Missed heartbeats → admin dashboard shows "Offline" when `last_seen_at < now() - 5 min`.

---

## 7. Frontend Architecture

### 7.1 Cashier — component hierarchy changes

```
apps/cashier/src/
├── lib/
│   ├── printer.ts                        [NEW]  sendPrintJob(), loadPrinterConfig(), handleResult()
│   ├── receipt-queries.ts                [UNCHANGED]
│   └── escpos/                           [NEW]  wraps @retailai/escpos-shared with cashier-specific glue
│       ├── build-receipt.ts              builds ESC/POS from ReceiptData
│       └── build-test-page.ts            cashier-side test print (C8)
├── components/
│   ├── receipt/
│   │   ├── print-receipt.tsx             [EDITED]  branches: network vs iframe
│   │   ├── receipt-template.tsx          [UNCHANGED]  still used for preview + iframe fallback
│   │   └── printer-status-indicator.tsx  [NEW, P1]  small LED-style widget in app shell
│   └── shared/
│       └── printer-toast.tsx             [NEW]  typed toasts for printer success/error states
├── contexts/
│   └── printer-context.tsx               [NEW]  loads per-location printer config at mount, provides hook
└── i18n/
    └── locales.ts                        [EDITED]  +11 new keys × 5 locales (see §7.5)
```

### 7.2 Key UI patterns

**Loading state:** when `Print` is tapped, button enters `isPending` state (existing pattern from elsewhere in cashier, e.g., `startTransition` for refresh buttons per STATE.md). Timeout: 4 seconds.

**Toast hierarchy:**
- Green: `Receipt printed ✓` (2s, auto-dismiss)
- Amber: `Sending…` (only if > 1s — avoids flicker on fast prints)
- Red: `Printer offline | Out of paper | Network unreachable` (manual dismiss, action button "Reprint")

**No modal interruption.** Print failure does not block checkout completion screen — order is already paid and saved. Cashier can continue; reprint via history.

**Cash-drawer awareness:** if `cashDrawerEnabled=true` AND `paymentMethod==='cash'`, drawer-kick bytes appended automatically. Cashier isn't aware; it "just opens."

### 7.3 Admin — component hierarchy

```
apps/admin/src/
├── app/(dashboard)/locations/[id]/
│   ├── page.tsx                          [EDITED]  add "Printer" tab
│   └── printer/
│       ├── page.tsx                      [NEW]     printer settings screen
│       ├── printer-form.tsx              [NEW]     form fields + validation
│       ├── token-rotate-dialog.tsx       [NEW]     "Copy once" modal
│       ├── test-print-button.tsx         [NEW]     client island, calls testLocationPrinter
│       └── status-card.tsx               [NEW]     last-seen, version, errors
├── lib/
│   └── printer-actions.ts                [NEW]     7 server actions (§5.3)
├── app/api/printers/heartbeat/route.ts   [NEW]     §5.4 endpoint
└── i18n/
    └── locales.ts                        [EDITED]  +8 new keys × 2 locales (EN/TC — admin is EN/TC only)
```

### 7.4 State management

- **Cashier printer config** — React context populated at session load (one fetch per session, cached in `@tanstack/react-query` with stale-time 5 min). Invalidated when admin pushes config update (could use existing heartbeat WS or just rely on cashier re-fetch on next shift).
- **Token** — stored in context, never in localStorage (kept in-memory only; fetched from server on each cashier auth).
- **Admin printer settings form** — React Hook Form + Zod, standard pattern used elsewhere in admin.
- **Last-seen timestamp** — server-rendered initially; auto-refreshed every 30s via SWR/polling.

### 7.5 Cashier i18n keys (5 locales: TC, SC, EN, PT, JP)

| Key | Example (EN) |
|---|---|
| `printerSending` | Sending to printer… |
| `printerSuccess` | Receipt printed |
| `printerErrorOffline` | Printer offline — check power and USB |
| `printerErrorNetwork` | Network unreachable — check shop Wi-Fi |
| `printerErrorNoPaper` | Out of paper — please refill |
| `printerErrorTimeout` | Printer didn't respond — please retry |
| `printerErrorRateLimit` | Too many print requests — please wait |
| `printerNotConfigured` | No printer set up — contact support |
| `printerTestButton` | Test print |
| `printerReprintFromHistory` | Reprint from history |
| `printerConfirmReprint` | Print this receipt again? |

### 7.6 Admin i18n keys (EN + TC)

| Key | Example (EN) |
|---|---|
| `printerSectionTitle` | Printer |
| `printerEnabledLabel` | Enabled |
| `printerDriverLabel` | Driver |
| `printerPaperWidthLabel` | Paper width (mm) |
| `printerCodePageLabel` | Character set |
| `printerEndpointLabel` | Printer endpoint URL |
| `printerRotateTokenButton` | Rotate security token |
| `printerTestPrintButton` | Test print |
| `printerStatusOnline` | Online |
| `printerStatusOffline` | Offline |
| `printerLastSeenLabel` | Last seen |
| `printerRotateTokenWarning` | Copy this token now — it won't be shown again. |
| `printerUninstallConfirm` | Disable the printer for this location? |

---

## 8. Backend Architecture

### 8.1 `@retailai/printer-bridge` daemon — directory layout

```
packages/print-server/
├── package.json                 # name: @retailai/printer-bridge
├── bin/
│   └── printer-bridge.ts        # CLI entry (start | stop | install [--bootstrap <token>] [--migrate <bootstrap>] | uninstall | upgrade | status)
├── src/
│   ├── daemon.ts                # main HTTP server + lifecycle
│   ├── config.ts                # load/save /etc/printer-bridge/config.json; atomic writes; previous-version backup
│   ├── bootstrap.ts             # M3: exchange bootstrap-JWT → CF creds + bearer token via admin API
│   ├── handlers/
│   │   ├── print.ts             # A1 POST /print
│   │   ├── test.ts              # A2 POST /test
│   │   ├── health.ts            # A3 GET /health
│   │   └── version.ts           # A4 GET /version
│   ├── middleware/
│   │   ├── bearer-auth.ts       # HMAC-SHA256 verify (M2); accepts primary + pending during rotation overlap
│   │   ├── rate-limit.ts        # token-bucket
│   │   ├── idempotency.ts       # 5-min cache keyed by Idempotency-Key header
│   │   └── logging.ts           # structured JSON to stdout
│   ├── transport/
│   │   ├── adapter.ts           # interface { write(bytes, opts): Promise<Result> }
│   │   ├── linux-lp.ts          # writes to /dev/usb/lp* (Linux, OpenWRT); fallback printer-status heuristic
│   │   ├── node-usb.ts          # libusb via `usb` package (macOS, Windows); supports getDeviceStatus() (C4 fix)
│   │   ├── cups.ts              # shells out to `lp` command (fallback for macOS Gatekeeper)
│   │   └── detect.ts            # selects best adapter at startup
│   ├── commands/                # M1: server command handlers
│   │   ├── apply.ts             # dispatcher called from heartbeat response
│   │   ├── rotate-token.ts      # write new token, reload config, ACK next heartbeat
│   │   ├── force-update.ts      # run upgrade, restart, self-test (see self-update.ts)
│   │   └── reload-config.ts     # re-read disk config
│   ├── self-update.ts           # W6: upgrade + self-test + rollback on failure
│   ├── heartbeat.ts             # 60s loop → admin; sends ackedCommandId on success
│   ├── update-check.ts          # daily npm outdated → enqueue local force_update
│   └── test-page.ts             # canonical test-page builder (uses escpos-shared)
├── install/
│   ├── install.sh               # shared entry: detects OS, routes to per-platform
│   ├── linux-systemd.sh
│   ├── macos-launchd.sh
│   ├── openwrt-procd.sh
│   ├── windows-nssm.ps1
│   ├── uninstall.sh
│   └── cloudflared-setup.sh     # creates tunnel + DNS record via CF API
└── tests/
    ├── unit/
    │   ├── transport-adapters.test.ts
    │   ├── bearer-auth.test.ts
    │   └── idempotency.test.ts
    └── integration/
        ├── round-trip.test.ts   # runs mock cloudflared → daemon → mock USB
        └── byte-parity.test.ts  # asserts browser + daemon build identical bytes for same input
```

### 8.2 Request handler (detailed, `POST /print`)

```ts
// src/handlers/print.ts
export async function handlePrint(req: IncomingMessage, res: ServerResponse, ctx: BridgeContext) {
  const body = await readJsonBody(req, 64_000);
  const parsed = PrintRequestSchema.safeParse(body);
  if (!parsed.success) return sendError(res, 400, 'invalid_payload', parsed.error.message);

  const { jobId, bytesBase64, copies, kickDrawer, driver, timeoutMs } = parsed.data;

  // Idempotency check
  const cached = ctx.idempotency.get(jobId);
  if (cached) {
    res.setHeader('X-Replay', 'true');
    return sendJson(res, cached.status, cached.body);
  }

  const bytes = Buffer.from(bytesBase64, 'base64');
  if (bytes.length > 64_000) return sendError(res, 413, 'payload_too_large', null);

  // Append cash-drawer pulse if requested
  const finalBytes = kickDrawer ? Buffer.concat([bytes, CASH_DRAWER_KICK]) : bytes;

  // Acquire write semaphore — only 1 concurrent print per bridge
  await ctx.writeLock.acquire();
  const started = Date.now();

  try {
    for (let i = 0; i < copies; i++) {
      await ctx.transport.write(finalBytes, { timeoutMs });
    }
    const result = {
      ok: true as const,
      jobId,
      durationMs: Date.now() - started,
      printerStatus: 'ok' as const,
    };
    ctx.idempotency.set(jobId, { status: 200, body: result });
    ctx.metrics.jobsServedTotal++;
    return sendJson(res, 200, result);
  } catch (err) {
    const mapped = mapTransportError(err);
    const result = { ok: false as const, jobId, ...mapped };
    ctx.idempotency.set(jobId, { status: mapped.httpStatus, body: result });
    return sendJson(res, mapped.httpStatus, result);
  } finally {
    ctx.writeLock.release();
  }
}
```

### 8.3 Transport adapter interface

```ts
// src/transport/adapter.ts
export interface TransportAdapter {
  readonly name: 'linux-lp' | 'node-usb' | 'cups';
  write(bytes: Buffer, opts: { timeoutMs: number }): Promise<void>;
  probe(): Promise<PrinterProbeResult>; // for /health
  init(): Promise<void>;
  shutdown(): Promise<void>;
}

export interface PrinterProbeResult {
  up: boolean;
  model?: string;    // e.g. "USB VID:04b8 PID:0202"
  lastError?: string;
}
```

Detection logic in `detect.ts`:
```ts
export async function detectBestAdapter(config: Config): Promise<TransportAdapter> {
  if (config.transport !== 'auto') return loadAdapter(config.transport);

  const platform = process.platform;
  if (platform === 'linux') {
    if (await pathExists('/dev/usb/lp0')) return new LinuxLpAdapter();
  }
  try {
    const usbAdapter = new NodeUsbAdapter(config);
    await usbAdapter.init();
    return usbAdapter;
  } catch (e) {
    log.warn('node-usb unavailable, falling back to CUPS', e);
  }
  return new CupsAdapter(config);
}
```

### 8.4 Heartbeat implementation

```ts
// src/heartbeat.ts
export function startHeartbeat(ctx: BridgeContext) {
  const run = async () => {
    try {
      const probe = await ctx.transport.probe();
      const body = {
        locationId: ctx.config.locationId,
        bridgeVersion: PACKAGE_VERSION,
        printerStatus: probe.up ? 'ok' : 'offline',
        printerModel: probe.model ?? null,
        lastError: probe.lastError ?? null,
        uptimeSec: Math.floor((Date.now() - ctx.startedAt) / 1000),
        jobsServedTotal: ctx.metrics.jobsServedTotal,
      };
      const res = await fetch(ctx.config.heartbeatUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ctx.config.token}`,
          'Content-Type': 'application/json',
          'X-Location-Id': ctx.config.locationId,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) log.warn('heartbeat rejected', { status: res.status });
      else {
        const reply = await res.json();
        await applyCommands(ctx, reply.commands ?? []);
      }
    } catch (e) {
      log.warn('heartbeat failed', e);
    }
  };
  run(); // fire immediately
  setInterval(run, 60_000);
}
```

### 8.5 Admin heartbeat endpoint (revised for M1 + M2 + M4)

```ts
// apps/admin/src/app/api/printers/heartbeat/route.ts
import { createHmac, timingSafeEqual } from 'crypto';

function hashToken(raw: string): string {
  return createHmac('sha256', process.env.APP_PEPPER!).update(raw).digest('hex');
}

function verifyTokenConstantTime(candidateHash: string, storedHash: string | null): boolean {
  if (!storedHash) return false;
  const a = Buffer.from(candidateHash, 'hex');
  const b = Buffer.from(storedHash, 'hex');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')?.replace(/^Bearer\s+/, '');
  const locationId = req.headers.get('x-location-id');
  if (!auth || !locationId) return problem(401, 'unauthorized');

  const row = await db.query.locationPrinterSettings.findFirst({
    where: eq(locationPrinterSettings.locationId, locationId),
  });
  if (!row) return problem(404, 'location_not_found');
  if (row.status === 'disabled') return problem(410, 'printer_disabled');

  // M2: HMAC-SHA256 verify (~2μs). M1: accept pending_token_hash during overlap window.
  const candidateHash = hashToken(auth);
  const primaryOk = verifyTokenConstantTime(candidateHash, row.tokenHash);
  const overlapOk =
    row.pendingTokenHash &&
    row.rotationOverlapUntil &&
    row.rotationOverlapUntil > new Date() &&
    verifyTokenConstantTime(candidateHash, row.pendingTokenHash);
  if (!primaryOk && !overlapOk) return problem(401, 'unauthorized');

  const body = HeartbeatSchema.parse(await req.json());

  // M1: process command ACK
  if (body.ackedCommandId) {
    await handleCommandAck(row, body.ackedCommandId);
  }

  // Update heartbeat state
  await db.update(locationPrinterSettings).set({
    lastSeenAt: new Date(),
    bridgeVersion: body.bridgeVersion,
    printerStatus: body.printerStatus,
    lastError: body.lastError ?? null,
    lastPrinterModel: body.printerModel ?? null,
    jobsServedTotal: body.jobsServedTotal,
    updatedAt: new Date(),
  }).where(eq(locationPrinterSettings.locationId, locationId));

  // Re-fetch (after ACK) to get the current pending command, if any
  const currentRow = await db.query.locationPrinterSettings.findFirst({
    where: eq(locationPrinterSettings.locationId, locationId),
  });

  const commands: HeartbeatCommand[] = [];
  if (currentRow?.pendingCommandType && currentRow.pendingCommandPayload) {
    commands.push({
      id: `cmd_${currentRow.locationId}_${currentRow.updatedAt.getTime()}`,
      type: currentRow.pendingCommandType,
      payload: currentRow.pendingCommandPayload,
    });
  }

  return NextResponse.json({
    ok: true,
    nextHeartbeatIn: 60,
    serverTime: new Date().toISOString(),
    mode: currentRow?.status === 'maintenance' ? 'maintenance' : 'enabled',  // M4
    commands,
  });
}

async function handleCommandAck(row: LocationPrinterSettings, commandId: string) {
  if (row.pendingCommandType === 'rotate_token') {
    // Promote pending token to primary; clear overlap
    await db.update(locationPrinterSettings).set({
      tokenHash: row.pendingTokenHash!,
      pendingTokenHash: null,
      rotationOverlapUntil: null,
      pendingCommandType: null,
      pendingCommandPayload: null,
      tokenRotatedAt: new Date(),
    }).where(eq(locationPrinterSettings.locationId, row.locationId));
  } else if (row.pendingCommandType === 'force_update') {
    // Bridge restarted on target version; clear command
    await db.update(locationPrinterSettings).set({
      pendingCommandType: null,
      pendingCommandPayload: null,
    }).where(eq(locationPrinterSettings.locationId, row.locationId));
  }
}
```

### 8.6 Command application on bridge (M1)

```ts
// src/commands/apply.ts
export async function applyCommands(ctx: BridgeContext, commands: HeartbeatCommand[]) {
  for (const cmd of commands) {
    try {
      switch (cmd.type) {
        case 'rotate_token':
          await applyRotateToken(ctx, cmd);
          break;
        case 'force_update':
          await applyForceUpdate(ctx, cmd);
          break;
        case 'reload_config':
          await applyReloadConfig(ctx, cmd);
          break;
      }
      ctx.pendingAck = cmd.id; // sent in next heartbeat
    } catch (err) {
      log.error(`command failed: ${cmd.type}`, err);
      Sentry.captureException(err, { tags: { command: cmd.type, commandId: cmd.id } });
      // Don't ACK; server re-sends on next heartbeat
    }
  }
}

// src/commands/rotate-token.ts
async function applyRotateToken(ctx: BridgeContext, cmd: HeartbeatCommand) {
  const { newToken, effectiveAt } = cmd.payload;
  const nextConfig = { ...ctx.config, token: newToken };
  await ctx.configStore.writeAtomic(nextConfig); // writes temp + rename for crash safety
  ctx.config = nextConfig;
  log.info('token rotated', { effectiveAt, commandId: cmd.id });
}
```

### 8.7 Self-update with rollback (W6 fix)

```ts
// src/self-update.ts
export async function performUpdate(targetVersion: string): Promise<UpdateResult> {
  const currentVersion = ctx.config.version;

  // 1. Install target
  try {
    await run(`npm install -g @retailai/printer-bridge@${targetVersion}`);
  } catch (err) {
    return { ok: false, reason: 'install_failed', error: err };
  }

  // 2. Restart daemon via service manager
  await restartDaemon();  // systemd/launchd/procd/nssm
  await sleep(5000);      // wait for daemon to come up

  // 3. Self-test: verify daemon responds, can auth, can probe printer
  const testResult = await runSelfTest();
  if (!testResult.ok) {
    // 4. Rollback
    log.error('self-test failed after update, rolling back', testResult);
    await run(`npm install -g @retailai/printer-bridge@${currentVersion}`);
    await restartDaemon();
    Sentry.captureMessage(`Auto-update rolled back: ${targetVersion} → ${currentVersion}`, {
      level: 'warning',
      tags: { targetVersion, currentVersion, reason: testResult.reason },
    });
    return { ok: false, reason: 'self_test_failed', rolledBackTo: currentVersion };
  }

  return { ok: true, newVersion: targetVersion };
}

async function runSelfTest(): Promise<SelfTestResult> {
  // a. Can daemon respond to /version?
  const v = await fetchLocal('/version', { timeout: 5000 });
  if (!v.ok) return { ok: false, reason: 'daemon_unresponsive' };

  // b. Can we verify our own token? (catches HMAC secret mismatch after update)
  const h = await fetchLocal('/health', {
    timeout: 5000,
    headers: { Authorization: `Bearer ${ctx.config.token}` },
  });
  if (!h.ok) return { ok: false, reason: 'auth_broken' };

  // c. Is the printer probe still working?
  const health = await h.json();
  if (!health.bridgeUp) return { ok: false, reason: 'bridge_internal_error' };

  return { ok: true };
}
```

Daily update timer in systemd:
```ini
# /etc/systemd/system/printer-bridge-update.timer
[Unit]
Description=Daily printer-bridge update check
[Timer]
OnCalendar=daily
RandomizedDelaySec=1h
[Install]
WantedBy=timers.target

# /etc/systemd/system/printer-bridge-update.service
[Unit]
Description=printer-bridge update check
[Service]
Type=oneshot
ExecStart=/usr/bin/printer-bridge upgrade --auto
```

`--auto` mode skips if current version == latest. `--force <version>` bypasses check (used by `force_update` command).

### 8.6 Cashier print implementation (detailed)

```ts
// apps/cashier/src/lib/printer.ts
import { buildReceipt } from '@retailai/escpos-shared';

export type PrintResult =
  | { ok: true; durationMs: number }
  | { ok: false; error: PrinterErrorCode; retryable: boolean };

export async function sendPrintJob(params: {
  config: LocationPrinterConfig;
  receipt: ReceiptData;
  copies?: number;
}): Promise<PrintResult> {
  const { config, receipt, copies = 1 } = params;

  if (!config.enabled) {
    // fall back to iframe window.print()
    return fallbackIframePrint(receipt);
  }

  const bytes = buildReceipt({
    driver: config.driver,
    paperWidth: config.paperWidth,
    codePage: config.codePage,
    receipt,
  });

  const jobId = crypto.randomUUID();

  try {
    const res = await fetch(config.endpointUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.token}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': jobId,
      },
      body: JSON.stringify({
        jobId,
        bytesBase64: toBase64(bytes),
        copies,
        kickDrawer:
          receipt.paymentMethod === 'cash' && config.cashDrawerEnabled,
        driver: config.driver,
        timeoutMs: 3000,
      }),
      signal: AbortSignal.timeout(4000),
    });

    const body = await res.json();
    if (body.ok) return { ok: true, durationMs: body.durationMs };
    return { ok: false, error: body.error, retryable: body.retryable };
  } catch (err) {
    // Network error / abort
    Sentry.captureException(err, { tags: { component: 'printer' } });
    return { ok: false, error: 'network_unreachable', retryable: true };
  }
}
```

---

## 9. Integration Architecture

### 9.1 Cloudflare Tunnel provisioning — server-side (M3 fix)

**Key change:** CF API token lives ONLY on admin server (ECS). Installer never touches it. Installer authenticates as an admin user and the admin server performs CF operations on their behalf.

**New bootstrap endpoint on admin:**

```ts
// apps/admin/src/app/api/printers/bootstrap/route.ts
export async function POST(req: NextRequest) {
  const jwtToken = req.headers.get('authorization')?.replace(/^Bearer\s+/, '');
  if (!jwtToken) return problem(401, 'unauthorized');

  // Verify the bootstrap JWT issued by provisionLocationPrinter (B4)
  const claims = verifyBootstrapJwt(jwtToken);  // throws on expired/invalid
  if (!claims) return problem(401, 'invalid_bootstrap');

  // One-time exchange: bootstrap JWT → cloudflared credentials + initial bearer token
  const row = await db.query.locationPrinterSettings.findFirst({
    where: eq(locationPrinterSettings.locationId, claims.locationId),
  });
  if (!row || row.bootstrapUsed) return problem(410, 'bootstrap_used');

  // Generate the ORIGINAL bearer token (created during B4 provision)
  // We cached it in a short-TTL Redis/memory cache since we don't persist raw
  const originalToken = bootstrapTokenCache.get(claims.locationId);
  if (!originalToken) return problem(410, 'bootstrap_expired');

  await db.update(locationPrinterSettings)
    .set({ bootstrapUsed: true })
    .where(eq(locationPrinterSettings.locationId, claims.locationId));
  bootstrapTokenCache.delete(claims.locationId);

  return NextResponse.json({
    tunnelId: row.tunnelId,
    tunnelCredentials: await loadTunnelCredentials(row.tunnelId),  // from CF or secure storage
    bearerToken: originalToken,
    endpointUrl: row.endpointUrl,
    heartbeatUrl: 'https://admin.hkretailai.com/api/printers/heartbeat',
  });
}
```

**Revised provisioning flow** (installer perspective):

```
1. In admin, operator or installer opens Locations → Counter 1 → Printer
2. Clicks "Provision network printer"
3. Admin server (holds CF_API_TOKEN in env):
   a. POST /accounts/{account_id}/cfd_tunnel → tunnel_id + credentials
   b. POST /zones/{zone_id}/dns_records → CNAME print-<slug>.hkretailai.com → <tunnel_id>.cfargotunnel.com
   c. INSERT location_printer_settings row: status='enabled', tunnel_id, endpoint_url, token_hash
   d. Generate 1-hour bootstrap JWT, signed with admin server secret
   e. Cache raw bearer token in memory (bootstrapTokenCache) for 1 hour
   f. Return {bootstrapToken} to admin UI
4. Admin UI shows: "Run this on the bridge device:"
     printer-bridge install --bootstrap <jwt>
5. Installer copies command, SSHes to bridge device
6. Runs `printer-bridge install --bootstrap <jwt>`
7. Bridge:
   a. POST https://admin.hkretailai.com/api/printers/bootstrap with Authorization: Bearer <jwt>
   b. Receives {tunnelCredentials, bearerToken, endpointUrl, heartbeatUrl}
   c. Writes cloudflared.json + config.json to /etc/printer-bridge/
   d. Installs systemd unit (or equivalent), starts daemon
   e. Waits for first heartbeat to succeed
8. Bridge first heartbeat: admin UI shows "Connected ✓"
9. Installer clicks "Test print" in admin; verifies paper
10. Done. Total installer screen time at shop: ~10 min
```

**Bootstrap JWT claims:**
```json
{
  "iss": "admin.hkretailai.com",
  "sub": "bootstrap",
  "aud": "printer-bridge",
  "locationId": "uuid",
  "tenantId": "uuid",
  "exp": "<iat + 3600>",
  "jti": "<nonce>"
}
```

One-time use enforced via `bootstrapUsed` flag in DB + in-memory cache clear. Expired JWT → 410.

### 9.2 CF API token scope (M3 refined)

The reseller's `CF_API_TOKEN` now lives **only** on admin ECS:
- `Zone:DNS:Edit` on `hkretailai.com`
- `Account:Cloudflare Tunnel:Edit` on reseller account

Rotation: 90-day cadence, coordinated by ops. Token rotation requires NO bridge-device action — provisioning just gets a new CF token on the next deploy of admin.

Compromised admin ECS is a separate (and larger) concern; CF token compromise there is just one of many problems.

**Installer trust model:** installer only needs admin login credentials (scoped to their tenant per existing RBAC). They cannot create tunnels outside their tenant's locations. Lost installer laptop = disable their admin user, no CF blast radius.

### 9.3 Bridge migration flow (W5 fix)

Scenario: swap bridge device (e.g., Pi → mini PC) without changing cashier config.

```
1. In admin, operator opens Locations → Counter 1 → Printer
2. Clicks "Migrate bridge to new device"
3. Admin server (B8 migrateLocationPrinterBridge):
   a. Reuses existing tunnel_id + endpoint_url (no CF API call)
   b. Generates new bootstrap JWT (same claims as provision, existing locationId)
   c. Caches current bearer token in memory for 1 hour
   d. Returns {bootstrapToken, migrationInstructions} to admin UI
4. Admin UI shows: "Set up new bridge with:"
     printer-bridge install --bootstrap <jwt> --migrate
5. Installer on NEW bridge device runs the command
6. Bridge:
   a. POST /api/printers/bootstrap → receives SAME tunnel credentials + bearer token
   b. Writes config, starts daemon + cloudflared
   c. cloudflared connects to CF with existing tunnel_id → tunnel becomes reachable via existing URL
   d. OLD bridge (still running) now shares the tunnel with NEW bridge; CF routes to whichever connects first
7. Installer stops old bridge: `printer-bridge stop` on old device
8. CF routes exclusively to new bridge (only one cloudflared connection remains)
9. Cashier: zero config change; endpoint URL unchanged; bearer token unchanged
10. OPTIONAL: rotate bearer token via admin (B3) after migration for hygiene
```

**Key property:** endpoint URL and bearer token are stable across migrations. Cashier never notices the swap.

### 9.4 Install script hosting

`install.hkretailai.com` is a Cloudflare Pages site serving:
- `/printer-bridge.sh` → universal entry (detects OS, re-fetches per-platform script)
- `/printer-bridge-linux.sh`
- `/printer-bridge-macos.sh`
- `/printer-bridge-openwrt.sh`
- `/printer-bridge-windows.ps1`
- `/printer-bridge-uninstall.sh`

Scripts checksum-validated: header line `# sha256: <hash>` + installer verifies before running remote include.

Source of truth: `packages/print-server/install/*` in the main repo. CI publishes to Pages on merge to `main`.

### 9.5 npm publishing

On tagged release of `packages/print-server`:
- CI runs `pnpm publish` → pushes `@retailai/printer-bridge@<version>` to public npm
- Version format: semver, starting `0.1.0`
- Every shop's bridge runs `printer-bridge upgrade` daily (systemd timer / launchd / cron); fetches latest compatible minor, restarts daemon
- Breaking changes bump major → shops stay on old major until operator pushes upgrade (opt-in)

### 9.6 Existing integrations untouched

- **Intellipay** — not affected by this module
- **Barcode lookup** (BarcodePlus, GDS, Rakuten) — not affected
- **Catalog sync (IndexedDB)** — not affected
- **Sentry** — extended (new tag `component: printer`); uses existing project/DSN

---

## 10. Security Design

### 10.1 Authentication layers

| Layer | Protection | Mechanism |
|---|---|---|
| **TLS** | Transit encryption | Cloudflare edge cert, TLS 1.3 |
| **Tunnel** | Authenticate bridge to CF | `cloudflared` JWT, rotated by Cloudflare |
| **Bearer token** | Authenticate cashier to bridge | 32-byte random, argon2id-hashed at rest, sent in `Authorization` header |
| **Rate limiting** | Abuse protection | 10/s per token, 1000/hour — bridge-enforced |
| **Idempotency** | Replay protection | jobId cache, 5 min window |
| **Origin checking** | Weak CSRF protection | Bridge accepts only `Origin: https://pos.hkretailai.com` and `https://admin.hkretailai.com` |
| **Body size limit** | DoS protection | 64 KiB max |

### 10.2 Authorization

- Cashier holds a **per-location token**. Cannot print to another location's printer.
- Admin test-print runs **server-side** in admin app, loads token from DB, never exposes to browser.
- Token rotation (B3) invalidates all outstanding tokens for that location with a 5-min grace.
- Multi-tenant isolation: admin server actions filter by `tenantId`; impossible to rotate another tenant's token.

### 10.3 Input validation

- All JSON bodies parsed through Zod schemas (shared types in `@retailai/escpos-shared`)
- `bytesBase64` validated as base64; decoded length ≤ 64 KiB
- Enums enforced: `driver`, `codePage`, `paperWidth ∈ {58, 80}`
- UUID format checked for `jobId`, `locationId`

### 10.4 Secret storage

| Secret | Where stored | Protection |
|---|---|---|
| Bearer token (raw) | Never persisted server-side | Shown once during provision/rotate; cached briefly (≤1h) only during bootstrap exchange |
| Bearer token hash | `location_printer_settings.token_hash` + `pending_token_hash` | HMAC-SHA256(pepper, raw_token), hex-encoded (M2 fix) |
| HMAC pepper | `APP_PEPPER` env on admin ECS | Standard env-var hygiene; rotating the pepper requires re-hashing all tokens (ops runbook) |
| Bootstrap JWT | Cached in admin memory + shown to installer | 1-hour TTL, one-time use, signed with admin server JWT secret (M3) |
| Cashier session | Existing session store | HTTP-only cookie, Secure, SameSite=Lax |
| `cloudflared` tunnel credential | Bridge local disk `/etc/printer-bridge/cloudflared.json` | File perms 600, owned by `printer-bridge` user; delivered via bootstrap JWT exchange, never via installer laptop |
| CF API token | **Admin ECS env only** (M3) | Never on shops, never on installer laptops; rotated every 90 days |
| Admin server JWT signing key | Admin ECS env | Used to sign bootstrap JWTs; rotation invalidates outstanding bootstraps (acceptable) |

### 10.5 Threat model

| Threat | Mitigation |
|---|---|
| Attacker sniffs shop Wi-Fi | TLS end-to-end; shop LAN doesn't see plaintext |
| Rogue device on shop Wi-Fi | No LAN-local print path; all traffic goes out Wi-Fi → CF → tunnel back — rogue device can't sniff |
| Stolen token | Rate-limited; admin can rotate immediately; restricted to one location's printer |
| DNS hijack | CF-issued cert only valid for CF-controlled DNS; hijack visible to client |
| Bridge compromised | Daemon runs as unprivileged user; no shell, no SSH listener; attacker can print but not exfiltrate data |
| Tenant enumeration | `print-<slug>.hkretailai.com` is discoverable; but printing requires valid per-shop token |
| Rogue PWA clone tries to print | Needs tenant's token (only in tenant's cashier session) — doesn't help |
| Auto-update pushes malicious code | npm publish gated by CI + reviewer; consider signing in v1.1 |

---

## 11. Scenario Coverage Check

Every P0 scenario from §2.2 must be ✅ or have ⚠️ mitigation noted.

| # | Scenario | Frontend | API | Backend | DB | Covered? |
|---|---|---|---|---|---|---|
| C1 | Print after payment | `sendPrintJob` in printer.ts + toast | A1 `/print` | transport.write + semaphore; HMAC-SHA256 verify (M2) | read config | ✅ |
| C2 | Reprint from history | Same `sendPrintJob`, different jobId | A1 | Same | — | ✅ |
| C3 | Cash drawer | `kickDrawer=true` in payload | A1 appends pulse | CASH_DRAWER_KICK bytes | — | ✅ |
| **C4** | **Out of paper** | Red toast `printerErrorNoPaper` | A1 → 502 | **node-usb/CUPS: ESC/POS `GS r 1` or `DLE EOT 4` status-byte query returns paper-end bit. Raw `/dev/usb/lp0`: post-write status probe via `ioctl LPGETSTATUS` where supported; else write-timeout heuristic** | — | ✅ (C4 fix) |
| C5 | Network down | Red toast `printerErrorNetwork` | fetch aborts | — | — | ✅ |
| C6 | Multi-copy | `copies=N` | A1 | loop in handler | — | ✅ |
| C7 | CJK codepage | Built into bytes | A1 | — | codepage config | ✅ |
| C8 | Cashier test print | `build-test-page.ts` | A2 `/test` | same as /print | — | ✅ |
| O1 | First-time setup | Admin clicks "Provision" button | B4 server-side | CF API (server only), INSERT row, generate bootstrap | INSERT | ✅ (M3 fix) |
| O2 | Printer swap, same config | — | — | `/dev/usb/lp0` re-enumerates | — | ✅ |
| O3 | Paper width change | form edit + test | B2 + A2 | update row | UPDATE | ✅ |
| O4 | Multi-location | Per-location config read | — | — | per-locationId row | ✅ |
| **O5** | **Temporary maintenance** | "Pause printer" button | B7 transition to `maintenance` | heartbeat returns `mode: 'maintenance'`; `/print` returns 503 | UPDATE status | ✅ (M4 fix) |
| **I1** | **First-time shop install** | Admin "Provision" button; installer runs `install --bootstrap <jwt>` | B4 (server-side CF) + bootstrap endpoint | CF API stays server-side | INSERT | ✅ (M3 fix) |
| I2 | macOS install | Same as I1 | same | transport=node-usb or CUPS | same | ✅ |
| I3 | OpenWRT install | Same as I1 | same | transport=linux-lp | same | ✅ |
| **I4** | **Bridge swap / migration** | Admin "Migrate bridge"; installer runs `install --bootstrap <jwt> --migrate` | B8 + bootstrap endpoint | Reuse tunnel_id + endpoint_url; bearer unchanged | no DB change except pending_command_type=null | ✅ (W5 fix) |
| S1 | Remote triage (bridge up, printer down) | status-card.tsx | B6 + B5 (triggers A2) | HTTP fetch to bridge `/health`; printer_status discriminates | read row | ✅ |
| S2 | Distinguish failure modes (disabled vs offline vs printer-fault) | toast copy + status-card shows 3-state | B6 + B9 fleet view | `status` enum + last_seen_at + printer_status | read row | ✅ (M4 + M5 fix) |
| **S3** | **Fleet offline alerting** | `/admin/printers` fleet dashboard (B9) | Background job polls `staleAlertIdx` | Sentry alert when `status='enabled' AND last_seen_at < now() - 1 hour` | staleAlertIdx | ✅ (M5 fix) |
| D1 | Developer reproduces on Mac | same code paths | same | same | same | ✅ |
| **AT-22** | **Auto-update with rollback** | — | npm registry | `self-update.ts` installs target, restarts, runs self-test, rolls back on failure | — | ✅ (W6 fix) |

**All P0 scenarios now ✅.** C4, O1, I1, I4, S1, S2 all upgraded to ✅ as a result of product review fixes (M1–M5, W5, W6).

### Phase 3 Sign-off

**Phase:** 3 — Full Architecture Design
**Deliverables:** System overview diagram, component inventory, happy-path + failure flows, heartbeat flow, cashier frontend architecture, admin frontend architecture, i18n key list, daemon directory layout, handler/adapter/heartbeat code, integration architecture (CF Tunnel provisioning, install hosting, npm publishing), security design (7-layer auth, authorization, validation, secret storage, threat model), full scenario coverage check
**Active persona:** 🎭 Role: Backend Architect + Frontend Developer
**Decision required:** Is the architecture coherent and sufficient to start building?

**Key decisions locked this phase:**
- ✅ One shared `@retailai/escpos-shared` package for browser + daemon byte building (CI byte-parity test prevents drift)
- ✅ Transport adapter pattern: `linux-lp` / `node-usb` / `cups` with auto-detect
- ✅ Out-of-paper: `getDeviceStatus()` ESC/POS status byte on node-usb/CUPS paths (C4 fix); raw-lp falls back to heuristic (documented limitation for low-end Linux/OpenWRT routers without libusb)
- ✅ Install script per platform, hosted at `install.hkretailai.com` (CF Pages)
- ✅ Cloudflare Tunnel provisioning server-side only (M3) — installer uses 1-hour bootstrap JWT, never touches CF API token
- ✅ Bridge migration path documented (W5): `printer-bridge install --migrate` preserves tunnel_id + bearer token
- ✅ Bridge daemon structure: 4 handlers, 4 middleware, 3 transports, heartbeat, 3 command handlers, self-update with rollback, test-page builder
- ✅ Command channel via heartbeat `commands[]` (M1): `rotate_token` / `force_update` / `reload_config` with ACK tracking
- ✅ Auth: HMAC-SHA256 hash of high-entropy bearer tokens with server-side pepper (M2) — ~2μs verify instead of ~150ms with argon2id
- ✅ Three-state status (`disabled` / `enabled` / `maintenance`) with distinct semantics (M4); admin fleet view + stale-heartbeat alerting (M5)
- ✅ Auto-update with self-test + automatic rollback (W6)
- ✅ Cashier fallback: if printer config absent OR `status !== 'enabled'`, continue using existing iframe `window.print()` — zero regression risk for existing shops

**✅ Product review fixes applied** (see `PRODUCT_REVIEW_NETWORK_PRINTER.md`):
M1 · M2 · M3 · M4 · M5 · C4 · W5 · W6 · m4 — all addressed in this Phase 3 revision. Every P0 scenario coverage upgraded to ✅.

**⚠️ Remaining architectural risks (acceptable):**
- Raw `/dev/usb/lp0` path (cheapest OpenWRT routers) falls back to heuristic out-of-paper detection — documented limitation
- Browser/daemon byte drift (R11) → CI test suite covers
- CF Tunnel single point of failure — acceptable tradeoff for v1 (cashier falls back to `window.print()` iframe when tunnel fails)

- [x] Approved (with product review fixes applied) — proceeding to Phase 4 — 2026-04-24
- [ ] Revisions needed — _specify below_

**User notes:**
Product review findings incorporated 2026-04-24. All P0 scenarios now ✅ in §11 coverage matrix.

---

## 12. Non-Functional Requirements

🎭 **Role: All Personas — Final Review**

### 12.1 Performance targets (reiterated from §3.7 with post-review context)

| Metric | Target | How measured |
|---|---|---|
| Print latency (tap → paper) | 95p < 2s, 99p < 3s | Sentry performance transaction `cashier.print`; end-to-end timer from button click to `ok` response |
| Bridge auth verify | <10μs per request | Unit-test benchmark for HMAC-SHA256 (M2); prevents regression |
| Heartbeat interval | 60s | systemd/launchd timer; jitter ±5s per shop to smooth backend load |
| Command delivery latency | ≤ 60s (next heartbeat) | From `rotateLocationPrinterToken` admin action to bridge ACK |
| Auto-update detection | ≤ 24h | Daily timer with 1h jitter; critical pushes via `force_update` command (same 60s SLO) |
| Bridge RAM footprint | <100 MB resident | Works on Pi Zero 2W (512 MB) |
| Bridge CPU idle | <5% | Daemon idles between heartbeats + print requests |
| Fleet dashboard load | <500ms for 100 shops | Partial index `staleAlertIdx` + single aggregation query |

### 12.2 Scalability targets

| Dimension | v1 target | v1.1 target | Notes |
|---|---|---|---|
| Shops per reseller | 500 | 5,000 | Single CF account; split accounts beyond 500 practical |
| Concurrent prints per bridge | 1 | 1 | In-memory semaphore; one printer |
| Heartbeat ingest rate | ~8/sec @ 500 shops | ~80/sec @ 5k shops | Light DB write |
| Admin dashboard users | 20 concurrent | 100 | SWR polling 30s |

### 12.3 Monitoring & logging

| Layer | What's captured | Where | Retention |
|---|---|---|---|
| Bridge daemon | Structured JSON to stdout | journald / syslog / launchd log | 30 days local (with logrotate) |
| Bridge errors | Exceptions | Sentry (existing project, tag `component=printer`) | Sentry retention (90 days) |
| Admin API | Request logs | Existing Vercel/Next logs + ECS CloudWatch | 30 days |
| Heartbeat stream | `last_seen_at` column | Postgres (no separate time-series) | Overwrites latest |
| Print jobs (v1.1 audit log) | Job metadata | `print_jobs` table | 90 days, then archive |

**Alerting rules (M5):**
| Condition | Severity | Channel |
|---|---|---|
| `status='enabled' AND last_seen_at < now() - 4 hours` during shop's business hours | warning | Sentry custom event → email to reseller ops |
| `status='enabled' AND last_seen_at < now() - 24 hours` (any time) | error | Sentry + email + reseller dashboard red badge |
| Sustained `printer_status='offline'` > 15 min | info | Dashboard warning only |
| Failed self-update rollback (would mean bridge is stuck) | error | Sentry + email |
| HMAC pepper mismatch (daemon can't verify any tokens) | critical | Sentry + email + PagerDuty |

### 12.4 Privacy & data protection

- Print payloads contain order details (item names, prices, customer name if loyalty). Classified **PII-adjacent**.
- Bytes in transit: TLS (CF edge + tunnel)
- Bytes at rest on bridge: NOT persisted (stateless, written to USB then discarded)
- Audit log (v1.1): redact customer name + item line details; keep only jobId + byteCount + timestamp
- Existing Macau PDPO compliance story covers receipts; this module doesn't add new data categories

---

## 13. Deployment Plan

### 13.1 Environments

| Env | Purpose | Tunnel naming | Admin URL |
|---|---|---|---|
| `dev` | Developer's Mac as bridge | `print-dev-<devname>.hkretailai.com` (staging CF account or same CF + noindex) | `http://localhost:3000` |
| `qa` | QA tenant(s), dedicated test bridges | `print-qa-<slug>.hkretailai.com` | `qa.admin.hkretailai.com` |
| `staging` | Pre-release, internal users | `print-staging-<slug>.hkretailai.com` | `staging.admin.hkretailai.com` |
| `prod` | Customer shops | `print-<slug>.hkretailai.com` | `admin.hkretailai.com` |

Each environment has its own:
- `APP_PEPPER` secret (so tokens don't cross environments)
- `CF_API_TOKEN` (scoped to same zone; separate rotation)
- `BOOTSTRAP_JWT_SECRET` (admin server)
- Postgres schema (migrations applied per env)

### 13.2 CI/CD

**Monorepo package: `@retailai/printer-bridge`**

| Step | When | Tool |
|---|---|---|
| TypeScript build | Every PR | `pnpm build` |
| Unit tests | Every PR | `vitest` |
| Byte-parity test (browser vs daemon) | Every PR | `vitest` in CI |
| Integration test (mock USB + mock tunnel) | Every PR | `vitest` |
| Publish to npm | On tag `printer-bridge-v*` | GitHub Actions |
| Publish install scripts to Pages | On main merge | GitHub Actions |

**Existing apps:**

| App | Changes delivered | Method |
|---|---|---|
| `apps/admin` | New routes + actions | Existing Next.js deploy |
| `apps/cashier` | New printer module | Existing Next.js deploy + buildId-driven reload banner |
| `packages/database` | Migration `0006` | Drizzle migrate on deploy |
| Install scripts | At `install.hkretailai.com` | CF Pages deploy from repo |

### 13.3 Secrets management

| Secret | Env var | Scope | Rotation |
|---|---|---|---|
| `APP_PEPPER` | admin ECS | Per env | Requires re-hash of all `token_hash` (documented runbook) |
| `CF_API_TOKEN` | admin ECS | Per env | 90 days (CF policy) |
| `BOOTSTRAP_JWT_SECRET` | admin ECS | Per env | On-demand; invalidates outstanding bootstrap JWTs |
| `SENTRY_DSN` | admin + cashier + bridge | Shared (existing) | No rotation |
| Tunnel credentials | Bridge local disk + admin DB (encrypted) | Per shop | Only on re-provision |
| Bearer token | Bridge config + admin DB (hashed) | Per shop | Admin-initiated |

Never logged, never in Sentry breadcrumbs, never in git. `.env.example` lists names only.

### 13.4 First deploy checklist

1. Run migration `0006` on dev → qa → staging → prod
2. Set `APP_PEPPER`, `CF_API_TOKEN`, `BOOTSTRAP_JWT_SECRET` in each env
3. Deploy admin app with new `printer-actions.ts` + `/api/printers/heartbeat` + `/api/printers/bootstrap`
4. Deploy cashier app with new `printer.ts` + i18n keys + context
5. Publish `@retailai/printer-bridge@0.1.0` to npm
6. Deploy install scripts to `install.hkretailai.com`
7. Provision first test shop (CountingStars dev bridge = developer's Mac)
8. Run QA-001 through QA-008 end-to-end
9. Enable for a single real customer as closed beta
10. Roll out to remaining tenants after 1 week stability

### 13.5 Rollback plan

| Failure mode | Detection | Rollback action |
|---|---|---|
| Auto-update breaks a shop | Self-test fails → rolls back automatically | Built-in (§8.7) |
| Auto-update breaks fleet (10+ shops regress) | Sentry alert spike within 1 hour of publish | Force-downgrade via admin: B-action that enqueues `force_update` to previous version across all shops |
| Migration `0006` breaks | Drizzle migrate CI check | `DROP TABLE location_printer_settings; DROP TYPE …` |
| CF Tunnel outage | Sentry alerts from cashiers | Cashier already falls back to iframe `window.print()` — no rollback needed, just wait |
| HMAC pepper leaked | Incident | Rotate pepper, re-hash all tokens, force-rotate all shops via `commands[]` |

---

## 14. Risks & Gaps (Consolidated)

Combining Phase 1 §3.3 + product review + new items from this phase.

| # | Risk | Likelihood | Impact | Mitigation | Status |
|---|---|---|---|---|---|
| R1 | macOS libusb blocked by Gatekeeper | Medium | Medium | CUPS fallback auto-detect | Mitigated |
| R2 | Windows WinUSB driver requires Zadig | High on Windows | Medium | Document install guide; Windows is P1, not P0 | Accepted |
| R3 | Printer firmware codepage variance | Medium | Medium | Per-driver override in `@retailai/escpos-shared` + visual CJK QA | Mitigated |
| R4 | `/dev/usb/lp0` index shifts | Low | Low | Enumerate `/dev/usb/lp*` on each write | Mitigated |
| R5 | CF Tunnel rate limits | Low | High | Per-token rate limit + reseller-owned account | Mitigated |
| R6 | Bearer token leak | Medium | Low (nuisance) | Rotation via `commands[]` (M1) + rate limiting + HTTPS | Mitigated |
| R7 | OpenWRT Node package unavailable for some archs | Low | Medium | Document supported archs; GL.iNet + major routers qualify | Documented |
| R8 | Bridge crashes + service manager fails | Low | Medium | systemd/launchd restart policies + Sentry | Mitigated |
| R9 | DNS propagation delay | Low | Low | Provisioning waits for DNS resolution | Mitigated |
| R10 | Install script fails mid-way | Medium | Medium | Idempotent install + `uninstall` subcommand | Mitigated |
| R11 | Browser/daemon byte drift | Medium | High | CI byte-parity test (mandatory) | Mitigated |
| R12 | Cashier PWA distant CF POP | Low | Low | CF HK + TW + SG POPs, <100ms in practice | Documented |
| R13 | Concurrent writes damage printer | Low | Medium | In-memory semaphore | Mitigated |
| R14 | Bridge clock skew | Low | Low | NTP/chrony | Mitigated |
| R15 | Admin CSRF triggers test prints | Low | Low | CSRF tokens on existing admin routes | Mitigated |
| **R16** | **Token rotation silently breaks shops** | — | — | M1 fix — `commands[]` + overlap | **Resolved** |
| **R17** | **argon2id verify latency on small bridges** | — | — | M2 fix — HMAC-SHA256 | **Resolved** |
| **R18** | **Installer laptop holds CF API token** | — | — | M3 fix — server-side provisioning + bootstrap JWT | **Resolved** |
| **R19** | **Single boolean `enabled` conflates disabled vs offline** | — | — | M4 fix — three-state `status` | **Resolved** |
| **R20** | **No alerting for offline shops** | — | — | M5 fix — fleet dashboard + stale index + Sentry alert rules | **Resolved** |
| **R21** | **Auto-update has no rollback** | — | — | W6 fix — self-test + automatic revert | **Resolved** |
| **R22** | **Bridge migration flow undefined** | — | — | W5 fix — `migrateLocationPrinterBridge` + `--migrate` install flag | **Resolved** |
| R23 | Bootstrap JWT leaked (1-hour TTL, one-time use) | Low | Low | Short TTL + `bootstrapUsed` flag | Mitigated by design |
| R24 | HMAC pepper leak | Low | High | ECS secret management + rotation runbook | Operational |
| R25 | `commands[]` ACK lost → command re-sent → double-applied | Low | Low | Rotate/update commands idempotent by `id`; bridge dedupes | Mitigated |

---

## 15. Implementation Phases (build order)

Sequenced for incremental validation — each phase produces something testable.

| Phase | Deliverable | Depends on | Effort | Acceptance |
|---|---|---|---|---|
| **A** | `@retailai/escpos-shared` package with driver registry, generic + star + epson drivers, codepage encoders, test-page builder | — | 1.5 days | Unit tests cover byte output; browser + Node produce identical bytes (byte-parity test) |
| **B** | Migration `0006` + Drizzle schema + seed for test tenant | A | 0.5 days | `drizzle migrate` up/down clean; test row inserts |
| **C** | `@retailai/printer-bridge` daemon skeleton: HTTP server, `/health`, `/version`, HMAC-SHA256 middleware, linux-lp transport | A, B | 2 days | On Pi 4 or Mac, `curl /health` returns; POST with bad token → 401; USB write to N160II produces blank paper |
| **D** | Transport adapters: node-usb + cups; auto-detect logic | C | 1.5 days | macOS install prints; Mac with Gatekeeper fallback prints via CUPS |
| **E** | `/print` + `/test` handlers with idempotency + rate limit | C, D | 1.5 days | Integration test: send ESC/POS bytes, paper prints |
| **F** | Heartbeat loop + `/api/printers/heartbeat` endpoint on admin + DB writes | B, C | 1.5 days | Bridge heartbeats show in DB `last_seen_at` |
| **G** | Command channel: `rotate_token`, `reload_config`, `force_update` + bridge command handlers | F | 1.5 days | Admin rotate → bridge picks up within 60s → prints still work |
| **H** | Admin actions (B1–B9) + printer settings UI + test-print button + fleet dashboard | B, F | 2.5 days | QA-001, QA-006, QA-007 pass |
| **I** | Server-side CF provisioning (B4) + `/api/printers/bootstrap` + bootstrap JWT | H | 1.5 days | Provisioning flow end-to-end on QA tenant |
| **J** | Install scripts per platform (macOS, Linux, OpenWRT, Windows) + `install.hkretailai.com` | I | 2 days | I1, I2, I3 pass on fresh hardware |
| **K** | Bridge migration flow (`--migrate`) + admin B8 action | I, J | 0.5 days | I4 passes; cashier sees no config change |
| **L** | Self-update + rollback + systemd/launchd timers | J | 1 day | AT-22 passes; break a version intentionally, verify rollback |
| **M** | Cashier integration: printer context + `sendPrintJob` + toasts + i18n (5 locales) | A, E | 2 days | C1–C6 pass on real iPad |
| **N** | Sentry alerts + fleet dashboard monitoring | H | 0.5 days | S3 (M5 fix) passes; offline shop triggers email |
| **O** | End-to-end QA on trial tenant (CountingStars) | all | 1 day | Full QA-001 through QA-008 pass |
| **P** | Documentation: reseller SOP + operator runbook + migration playbook | O | 0.5 days | Installer can follow cold |

**Total: ~22 engineering days** (vs the ~5 days originally scoped before "any USB printer" + product review fixes). This is a real reseller-grade delivery, not a one-shop MVP.

Critical-path parallelism opportunities:
- A + B can run in parallel (2 developers)
- H + J can run in parallel once F is done
- N can start in parallel with M

With 2 developers in parallel: **~14 elapsed days**. With 1 developer: ~22 days.

---

## 16. Open Questions

| # | Question | Impact | Who decides | Needed by |
|---|---|---|---|---|
| Q1 | `@retailai/*` npm scope — OK to use pre-rename? STATE.md lists `macau-pos → retailai` repo rename as a deferred item | Package naming | User | Phase A |
| Q2 | Reseller's Cloudflare account: existing or new for this module? | Provisioning setup | User / Ops | Phase I |
| Q3 | Windows 11 support — keep P1 or drop? Requires Zadig for first-time USB claim | Scope | User | Phase D |
| Q4 | Audit log (print_jobs table) — promote from v1.1 to v1? Adds ~0.5 days | Scope | User | Phase E |
| Q5 | Force-update command (S5) — include in v1 or defer? Adds ~0.5 days | Scope | User | Phase G |
| Q6 | AppArmor/SELinux profile for bridge daemon on Linux? | Hardening | Security review | Post-v1 |
| Q7 | Physical hardware for QA: do we have Epson TM-T20 for Epson-driver testing (AT-21)? | Test coverage | User | Phase A |
| Q8 | What's the first-shop target? CountingStars (Mac dev bridge) then 853mask? | Rollout | User | Phase O |

---

## 17. Final Sign-off Gate

- [ ] All phase sign-offs completed (0, 0.1, 1, 2, 3, product review, 4)
- [ ] Reference features confirmed (keep / change / exclude) — §1.4
- [ ] Architecture confirmed — §6–§11
- [ ] Data model confirmed — §4
- [ ] API design confirmed — §5
- [ ] Tech stack confirmed — §3
- [ ] Security confirmed — §10 + §13.3
- [ ] Build order agreed — §15
- [ ] Open questions (§16) answered or accepted as deferred
- [ ] Product review fixes verified — §11 all-✅ + review doc updated

**Approved:** ☐ Yes — proceed to Implementer (Phase A) / ☐ Revisions needed

**User notes:**
_(to be filled)_
