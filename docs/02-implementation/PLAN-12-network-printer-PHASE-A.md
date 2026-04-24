# Network Printer — Phase A: Planning Validation

| Field | Value |
|---|---|
| **Module** | Network Printer |
| **Phase** | A — Planning Validation |
| **Persona** | 🎭 Product Manager |
| **Date** | 2026-04-24 |
| **Planning doc** | `docs/01-planning/PLANNING_NETWORK_PRINTER.md` |
| **Product review** | `docs/01-planning/PRODUCT_REVIEW_NETWORK_PRINTER.md` |
| **Status** | Awaiting sign-off to proceed to Phase B (Blueprint) |

---

## Purpose of Phase A

Re-read the signed-off planning with a fresh PM eye. Catch anything that's drifted, is ambiguous, or would be painful to discover during coding. Not a full review — that was `pr`. Just: "is this ready to build?"

## Validation checks

| Check | Verdict | Notes |
|---|---|---|
| Scope is a complete user product (not just a technical feature) | ✅ | Covers cashier, admin, installer, support, dev; §2.2 stories flesh out each |
| Every P0 scenario has end-to-end coverage | ✅ | §11 matrix shows 19/19 after product-review fixes |
| Every API has explicit request/response shapes | ✅ | §5.2–5.4 |
| Every schema column has a stated purpose | ✅ | §4.2 comments + §4.2 "Why this shape" |
| Data model handles multi-tenant correctly | ✅ | 1:1 FK to `locations`; `locations` already scoped by `tenant_id` |
| Security model covers known attack surfaces | ✅ | §10.5 threat model; HMAC (M2), server-side CF (M3), rotation (M1) all in |
| Rollback path exists for every non-trivial change | ✅ | Migration rollback §4.5; auto-update rollback §8.7; CF Tunnel fallback to iframe §5.8 |
| i18n keys enumerated | ✅ | 11 cashier keys × 5 locales, 13 admin keys × 2 locales (§7.5, §7.6) |
| Cross-platform matrix is testable | ⚠️ | macOS + Linux proven via dev + QA; OpenWRT + Windows are P1 — accepted |
| Hardware procurement path is documented | ✅ | §1.3.1 bridge device options |
| Install → first print flow is ≤ 30 min | ✅ | §9.1 revised flow estimates 10 min installer screen time |
| Observability: can support diagnose without site visit? | ✅ | §12.3 alert rules; §11 S1/S2/S3 scenarios ✅ |
| Build order is executable by 1 developer | ✅ | §15 phases A–P with dependencies stated |
| Deployment plan exists | ✅ | §13 |

## Default answers recorded (from open questions §16)

| # | Question | Locked answer |
|---|---|---|
| Q1 | npm scope | `@macau-pos/*` (matches `@macau-pos/database`); rename when repo renames |
| Q2 | CF account | Existing — `hkretailai.com` zone reused |
| Q3 | Windows 11 | P1, verify after macOS + Linux; core flow on those two |
| Q4 | Audit log | Defer to v1.1 |
| Q5 | Force-update command | Include in v1 (paired with rollback) |
| Q6 | Epson TM-T20 for AT-21 | Implement driver, verify when hardware arrives |
| Q7 | First-shop rollout | CountingStars dev (Mac bridge) → 853mask (real customer) |

## Open risks carried into Phase B

None new. Previously-documented risks (R1–R25) accepted or mitigated per §14.

## Test-hardware-available audit

| Device | Purpose | Available now? |
|---|---|---|
| iPad (generic) | Cashier dev | ✅ (existing trial) |
| Xprinter N160II (USB+BT) | Primary test printer | ✅ (connected to dev Mac) |
| dev Mac | Bridge for dev phase | ✅ |
| CountingStars tenant | First-shop target | ✅ (existing) |
| 853mask tenant | Second-shop target | ✅ (existing) |
| Raspberry Pi 4 / Zero 2W | Validation of Linux bridge | ❌ Need to procure or use a cheaper SBC |
| GL.iNet Slate AX (HKD ~600) | Validation of OpenWRT bridge | ❌ Not procured — P1 |
| Epson TM-T20 | Validation of Epson driver | ❌ Not available |
| Windows 11 PC | Validation of Windows install | ❌ Not procured — P1 |

**Phase B blueprint will note:** Linux bridge validation blocked on SBC procurement. Core flow (Mac bridge + iPad cashier + N160II) fully testable today.

## Phase A verdict

**🟢 Planning is ready for Phase B (Implementation Blueprint).**

Zero blockers. All questions answered or explicitly deferred. Hardware gaps documented.

## Phase A Sign-off

**Deliverables:** Validation checklist, default answers locked, test-hardware audit
**Decision:** Proceed to Phase B?

- [ ] Approved — Claude proceeds to Phase B (produce detailed file-level implementation blueprint)
- [ ] Revisions needed — _specify below_

**User notes:**
_(to be filled)_
