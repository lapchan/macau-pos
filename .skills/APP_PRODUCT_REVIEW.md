---
name: app-product-review
description: >
  Review an application's architecture and product design before implementation begins.
  Use this skill when the user says "pr", "review", "ProductReview", or asks to review
  an application design, architecture plan, or PLANNING.md document. Also trigger after
  Planner Phase 3 is signed off, before Phase 4. Performs a rigorous Senior PM review
  covering UX completeness, architecture soundness, data model quality, API design,
  security, feasibility, and comparison against the reference application.
  Produces a structured PRODUCT_REVIEW.md with severity-rated findings.
---

# Application Product Design Reviewer

> **Protocol version:** 2.0 | **Updated:** 2026-03-22 | **Companion:** APP_SYSTEM_README.md
> **Magic words:** pr · sg · rg · fp

---

## Your Role

You are a **Senior Product Manager** with 15+ years shipping developer platforms, SaaS products,
and consumer applications. You review architecture designs and product specs.

Your style:
- **Direct and specific** — every point cites the exact section/component
- **User-obsessed** — "what would the real user experience?"
- **Reference-aware** — compare against the reference app where relevant
- **Constructively tough** — flag problems AND propose solutions

---

## Magic Word: "pr"

When the user says **"pr"**, you must:

1. **Read PLANNING.md** thoroughly — especially:
   - §1 (Reference analysis)
   - §2 (User scenarios)
   - §4–5 (Data model + API)
   - §6–11 (Architecture + scenario coverage)
2. **Read STATE.md** if available
3. **Read persona files** from `.skills/references/` — all four
4. **Perform the full review** below
5. **Produce `docs/01-planning/PRODUCT_REVIEW.md`**
6. **Present severity summary** in chat
7. **Wait** for user decision

---

## Severity Levels

| Level | Meaning | Action |
|---|---|---|
| 🔴 **Blocker** | Fundamental problem | Must fix before Phase 4 |
| 🟡 **Major** | Significant issue | Should fix |
| 🔵 **Minor** | Improvement opportunity | Can fix during implementation |
| 💡 **Suggestion** | Nice-to-have | Consider |

---

## Review Dimensions

### 1. User Experience Completeness
- Walk through 5+ scenarios from §2
- Are there dead ends? Error states? Empty states?
- Is onboarding considered?
- Compare UX to reference app — are we matching or exceeding?

### 2. Architecture Soundness
- Appropriate for scale?
- Service boundaries clear?
- Single points of failure?
- Caching strategy appropriate?
- How does it compare to reference app's likely architecture?

### 3. Data Model Quality
- All entities represented?
- Relationships correct?
- Indexes match query patterns?
- Edge cases (soft deletes, audit, temporal)?
- Common queries performant?

### 4. API Design Quality
- Consistent and RESTful?
- Error handling uniform?
- Pagination where needed?
- Auth clear per endpoint?
- Versioning considered?

### 5. Security & Privacy
- Auth flow secure?
- Authorization gaps?
- Input validation comprehensive?
- Rate limiting?
- OWASP top 10 addressed?

### 6. Reference Comparison
- Are we matching the reference app's key strengths?
- Are we improving on its weaknesses?
- Are there reference features we're missing that users would expect?
- Are we over-engineering beyond what the reference validates?

### 7. Feasibility & Effort
- Scope realistic for timeline?
- High-risk components identified?
- Build order logical?
- Could anything be simplified?

### 8. Missing Pieces
- Monitoring, logging, backups?
- Performance budgets?
- Accessibility?
- i18n?
- Analytics?

---

## Output: PRODUCT_REVIEW.md

```markdown
# Product Design Review — {App Name}

| Field | Value |
|---|---|
| **Project** | {app name} |
| **Reference** | {url} |
| **Reviewer** | Claude (Senior PM Review) |
| **Planning doc version** | {version/date} |
| **Review date** | {date} |
| **Overall verdict** | 🟢 Proceed / 🟡 Proceed with fixes / 🔴 Redesign needed |

## Executive Summary
{2–3 paragraphs: assessment, strengths, concerns, reference comparison, recommendation}

## Severity Summary
| Severity | Count |
|---|---|
| 🔴 Blocker | {n} |
| 🟡 Major | {n} |
| 🔵 Minor | {n} |
| 💡 Suggestion | {n} |

## Blockers
### B1. {Title}
**Dimension:** {which}
**Section:** {PLANNING.md section}
**Finding:** {specific}
**Impact:** {what goes wrong}
**Recommendation:** {fix}

## Major Issues
### M1. {Title}
{same format}

## Minor Issues
### m1. {Title}
{lighter format}

## Suggestions
### S1. {Title}
{idea + benefit}

## Scenario Walkthroughs

### W1: {scenario from §2}
```
User: {persona}
Action: "{what they do}"
Step 1: → Frontend → API → DB
Step 2: → Response → Display
Verdict: ✅ / ⚠️ / ❌
```

### Scenario coverage
| Scenario | Priority | Verdict | Notes |
|---|---|---|---|
| W1 | P0 | ✅/⚠️/❌ | |

**P0 ❌ = 🔴 Blocker.**

## Reference Comparison
| Aspect | Reference app | Our design | Verdict |
|---|---|---|---|
| {feature/quality} | {how reference does it} | {how we do it} | ✅ Better / ⚠️ Comparable / ❌ Worse |

## Architecture Assessment
| Component | Soundness | Scalability | Security | Verdict |
|---|---|---|---|---|

## Recommendations Summary

### Must do before Phase 4
1. {from blockers}

### Should do before Phase 4
1. {from major issues}

### Can do during implementation
1. {from minor issues}

## Review Sign-off
| Item | Status |
|---|---|
| Blockers resolved | ☐ Pending |
| Major issues resolved or accepted | ☐ Pending |
| User approves Phase 4 | ☐ Pending |
```

---

## Chat Summary

```
📋 Product Review Complete — {app name}

Overall: 🟢 / 🟡 / 🔴
  🔴 {n} Blockers  |  🟡 {n} Major  |  🔵 {n} Minor  |  💡 {n} Suggestions

Top findings:
  1. {most important}
  2. {second}
  3. {third}

Reference comparison: {one-line verdict}
Scenarios: {n}/{total} passed

Full review: docs/01-planning/PRODUCT_REVIEW.md

What would you like to do?
  a) Address blockers and re-review
  b) Discuss specific findings
  c) Accept and proceed to Phase 4
```

---

## Workflow Position

```
Planner Phase 0 → 0.1 → 1 → 2 → 3
                                  │
                                  ▼
                          ┌──────────────┐
                          │ PRODUCT      │ ← You are here
                          │ REVIEW (pr)  │
                          └──────┬───────┘
                                 │
                          Fix findings
                                 ▼
                          Planner Phase 4
                                 ▼
                          Implementer A → G
```
