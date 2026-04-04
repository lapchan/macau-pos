# Planning Document Validation — Online Storefront

| Field | Value |
|---|---|
| **Project** | Macau POS — Online Storefront |
| **Document** | Planning Validation — Phase A |
| **Phase** | A — Validate Planning |
| **Date** | 2026-04-05 |

## Result: ✅ Ready

The planning document is comprehensive and implementation-ready. Product Review has been conducted and all blockers resolved.

## Checklist

| Check | Status | Notes |
|---|---|---|
| Reference analysis present (§1.1) | ✅ | Shopline + Shopify analyzed with confidence labels |
| User scenarios complete (§2) | ✅ | 4 personas, 27 stories, 30 acceptance tests, 9 QA scenarios |
| Tech stack confirmed (§3) | ✅ | Next.js 16, same monorepo, no new deps |
| Data model defined (§4) | ✅ | 9 new tables + 3 modified, full SQL, 16 indexes |
| API contracts defined (§5) | ✅ | 39 endpoints with input/output types |
| Architecture designed (§6–10) | ✅ | System, frontend (50+ components), backend, integration, security |
| Security addressed (§10) | ✅ | Cookie separation, Zod validation, PCI, rate limiting |
| P0 scenario coverage (§11) | ✅ | 30/30 covered (payments simulated Phase 1) |
| Build order defined (§15) | ✅ | 16 steps, ~22 days, critical path identified |
| Product Review conducted | ✅ | 🟢 All 2 blockers + 3 major issues resolved |

## Gaps

| # | Gap | Severity | Impact | Recommendation |
|---|---|---|---|---|
| 1 | Rich text editor library not specified | Low | Need to pick one for custom pages | Use `@tiptap/react` (MIT, headless, works with Next.js) or simple textarea with markdown for v1 |
| 2 | Product slug backfill script not yet written | Low | Existing 102 products need slugs | Write during S15 (Seed data + slug backfill) |
| 3 | Storefront i18n keys not yet defined | Low | Will be created during implementation | Define as we build each component |

## Assumptions

| # | Assumption | Based on | Risk if Wrong |
|---|---|---|---|
| 1 | Payments are simulated in Phase 1 | Planning §3.3 Risk #1 | Low — UI is built, only gateway wiring deferred |
| 2 | Email verification only (no SMS) in v1 | Planning §3.3 Risk #3 | Low — Brevo handles email. Dev mode shows code on screen |
| 3 | Single ECS handles 4th Next.js app | Planning §14 Risk #10 | Low — each app ~150MB, 2GB ECS is sufficient |
| 4 | Existing admin app unchanged for Phase 1 storefront | Build order S12-S13 | Medium — admin needs "Online Store" section + fulfillment UI. Can be Phase 2 of storefront |

### Phase A Decision: Defer Admin Additions

Build order steps S12 (Admin: Online Store section) and S13 (Admin: Fulfillment management) are important but can be deferred to a follow-up sprint. For Phase 1, merchants can:
- Use existing admin pages (products, orders already work)
- Manage storefront config via seed data (not ideal but functional)
- See online orders in existing orders page (channel column added)

**Revised build focus:** S1–S11 + S14–S16 first. S12–S13 as fast follow.
