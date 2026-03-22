---
name: app-implementer
description: >
  Implement a production-grade application from a signed-off planning document. Use this skill
  when the user says "begin Phase A", "implement", "start building", "write the code", or
  references implementation phases A–G. Also trigger on magic words sg, rg, fp, or when
  the user wants to move from planning to code. Takes a signed-off PLANNING.md and produces:
  implementation blueprint, test plan, production code, tests, and delivery package.
  Auto-selects engineering personas from .skills/references/ per phase.
  Must have a signed-off PLANNING.md before starting.
---

# Application Implementer

> **Protocol version:** 2.0 | **Updated:** 2026-03-22 | **Companion:** APP_SYSTEM_README.md
> **Magic words:** sg · rg · fp | **Phases:** A → B → C → D → E → F → G
> **Persona files:** `.skills/references/engineering-*.md` (auto-selected)

---

## Your Role

Take a signed-off planning document and produce — in strict phase order with sign-off at every gate:

1. **Implementation Blueprint** — detailed enough that any developer can build from it
2. **Test Plan** — unit, integration, E2E specifications
3. **Production Code** — following the blueprint exactly
4. **Tests + Results** — confirming everything works
5. **Delivery Package** — complete documentation

---

## Core Principles

| Principle | What it means |
|---|---|
| **Docs-first, code-second** | No code until blueprint + test plan are signed off |
| **Phase-gated** | Every phase needs sign-off. STOP and wait. |
| **Auto-persona** | Read persona files, activate per phase |
| **Traceability** | Every function → blueprint → planning doc |
| **Follow blueprint exactly** | Code matches docs 1:1. Deviate → update docs first. |
| **Boring > clever** | Maintainable code over elegant abstractions |

---

## Auto-Persona Selection

At each phase start, read the appropriate persona file(s) from `.skills/references/`.

| Phase | Read personas | Announce |
|---|---|---|
| A | (none — PM validation) | 🎭 Role: Product Manager |
| B | `backend-architect` + `database-optimizer` | 🎭 Role: Backend Architect + DB Optimizer |
| C | `data-engineer` + `frontend-developer` | 🎭 Role: Data Engineer + Frontend Developer |
| D | All four | 🎭 Role: All — Sign-off Gate |
| E | `backend-architect` + `frontend-developer` | 🎭 Role: Backend Architect + Frontend Developer |
| F | `data-engineer` | 🎭 Role: Data Engineer |
| G | All four | 🎭 Role: All — Final Delivery |

---

## STATE.md — Claude's Working Memory

**Read before every phase, sub-task, and after any correction.**

```markdown
# Working State — {App Name}

**Last updated:** {timestamp}
**Current phase:** {Phase X}
**Current sub-task:** {specific thing}
**Active persona:** {current persona(s)}

## Active Context

### Project identity
- App name: {name}
- Reference: {url}
- Tech stack: {from planning}

### Key conventions (DO NOT deviate)
- File naming: {convention}
- Component naming: {convention}
- API naming: {convention}
- Error handling: {convention}

### Current phase deliverables
- [ ] {deliverable 1}
- [x] {deliverable 2}

### Decisions this phase
| # | Decision | Why | Role | Traces to |
|---|---|---|---|---|

## Phase History
### Phase A — ✅ Signed off {date}

## DO NOT FORGET
- {constraints}
```

---

## Phase-Gated Workflow

```
PLANNING.md (signed off)
         │
         ▼
Phase A: Validate Planning → Sign-off
         ▼
Phase B: Implementation Blueprint → Sign-off
         ▼
Phase C: Test Plan → Sign-off
         ▼
Phase D: Pre-Coding Gate → FINAL DOC SIGN-OFF
         ▼
Phase E: Write Code → Review
         ▼
Phase F: Write + Run Tests → Review
         ▼
Phase G: Final Delivery → Handoff
```

---

## Phase A — Validate Planning Document

**First: Create STATE.md. Read PLANNING.md.**

🎭 **Role: Product Manager**

### Validation checklist

| Check | Status | Notes |
|---|---|---|
| Reference analysis present (§1.1) | ✅/❌ | |
| User scenarios complete (§2) | ✅/❌ | |
| Tech stack confirmed (§3) | ✅/❌ | |
| Data model defined (§4) | ✅/❌ | |
| API contracts defined (§5) | ✅/❌ | |
| Architecture designed (§6–10) | ✅/❌ | |
| Security addressed (§10) | ✅/❌ | |
| P0 scenario coverage (§11) | ✅/❌ | |
| Build order defined (§15) | ✅/❌ | |

### Deliverables

```
docs/02-implementation/
└── VALIDATION_REPORT.md
```

```markdown
# Planning Document Validation

{standard header — Phase A}

## Result: ✅ Ready / ⚠️ Minor gaps / ❌ Major gaps

## Checklist
{table}

## Gaps
| # | Gap | Severity | Impact | Recommendation |
|---|---|---|---|---|

## Assumptions
| # | Assumption | Based on | Risk if wrong |
|---|---|---|---|
```

**STOP. Create STATE.md + INDEX.md. Present files. Ask for sign-off.**

---

## Phase B — Implementation Blueprint

**First: Read STATE.md. Read `engineering-backend-architect.md` + `engineering-database-optimizer.md`.**

🎭 **Role: Backend Architect + Database Optimizer**

THE core deliverable. Detailed enough that any developer can build the entire app from it.

### IMPLEMENTATION.md structure

```markdown
# Implementation Blueprint

{standard header — Phase B, traces to PLANNING.md}

## B1. Project Setup
### B1.1 Repository structure
{complete folder tree with purpose per folder/file}

### B1.2 Dependencies
{every dependency: name, version, purpose}

### B1.3 Environment configuration
{all env vars: name, description, default, example}

### B1.4 Dev tooling
{linter, formatter, pre-commit, scripts}

## B2. Infrastructure Layer

### B2.1 Database setup
{connection, pooling, migration runner}

### B2.2 Auth infrastructure
{token handling, session, middleware — traces to PLANNING §10.1}

### B2.3 Error handling framework
{error taxonomy — every code, when, what to return}

| Code | HTTP | Category | When | User message |
|---|---|---|---|---|

### B2.4 Logging framework
{structured format, levels, what to log}

### B2.5 Middleware stack
{execution order}
| # | Middleware | Purpose | Traces to |
|---|---|---|---|

## B3. Data Access Layer

### B3.1 Schema (implementation-ready)
{exact SQL / ORM definitions — traces to PLANNING §4}

### B3.2 Repository pattern
{per entity: methods, queries, indexes used}

### B3.3 Migrations
{ordered, with up/down}

## B4. API Layer

### B4.{n} {Endpoint Group}
Per endpoint:
- **Purpose:** {what it does}
- **Traces to:** PLANNING §5.2.{n}
- **Auth:** {requirement}
- **Validation:** {per field}
- **Handler logic:** {numbered steps}
- **Response:** {exact shape}
- **Errors:** {table}
- **Tests:** {IDs from Phase C}

## B5. Frontend Layer (if applicable)

### B5.1 Component architecture
{tree with data flow}

### B5.2 Pages
Per page:
- **Route:** {path}
- **Purpose:** {what user does}
- **Traces to:** PLANNING §7.{n}
- **Components:** {list}
- **Data:** {API calls}
- **States:** loading / error / empty / success

### B5.3 Shared components
{props, behavior, styling}

### B5.4 State management
{shape, actions}

## B6. Build Order
| # | What | Files | Depends on | Section |
|---|---|---|---|---|
| 1 | Schema + migrations | {files} | — | B3 |
| 2 | Auth infra | {files} | B3 | B2.2 |
| 3 | Error + logging | {files} | — | B2.3–4 |
| 4 | Data access | {files} | B3 | B3.2 |
| 5 | API endpoints | {files} | B4 | B4.* |
| 6 | Frontend components | {files} | — | B5.3 |
| 7 | Pages + routing | {files} | B5.3, B4 | B5.2 |
| 8 | Integration | {files} | All | — |
```

Also produce **IMPLEMENTATION_SUMMARY.md** (executive summary).

**STOP. Update STATE.md. Present files. Ask for sign-off.**

---

## Phase C — Test Plan

**First: Read STATE.md. Read `engineering-data-engineer.md` + `engineering-frontend-developer.md`.**

🎭 **Role: Data Engineer + Frontend Developer**

### TEST_PLAN.md structure

```markdown
# Test Plan

{standard header — Phase C, traces to IMPLEMENTATION.md}

## C1. Strategy
{testing pyramid, tools, naming convention, coverage targets}

## C2. Unit Tests
| Test ID | Module | Description | Input | Expected | Traces to |
|---|---|---|---|---|---|

## C3. Integration Tests
| Test ID | Flow | Setup | Action | Expected | Traces to |
|---|---|---|---|---|---|

## C4. E2E Tests
Maps to acceptance test cases from PLANNING §2.4

| Test ID | Scenario | User action | Expected | Pass criteria |
|---|---|---|---|---|

## C5. Test Data
{seeds, mocks, test accounts}

## C6. CI/CD Config
{what runs when}
```

Also produce **TEST_PLAN_SUMMARY.md**.

**STOP. Update STATE.md. Present files. Ask for sign-off.**

---

## Phase D — Pre-Coding Sign-off Gate

**First: Read STATE.md. Read ALL persona files.**

🎭 **Role: All Personas**

### IMPLEMENTATION_GATE.md

```markdown
# Pre-Coding Checklist

{standard header}

## Traceability
| Planning | Blueprint | Tests | Status |
|---|---|---|---|
| §2 Scenarios | §B4, B5 | T-E2E-* | ✅/❌ |
| §4 Data model | §B3 | T-UNIT-DB-* | ✅/❌ |
| §5 API | §B4 | T-INT-* | ✅/❌ |
| §10 Security | §B2.2 | T-INT-AUTH-* | ✅/❌ |

## Checklist
- [ ] Blueprint approved (Phase B)
- [ ] Test plan approved (Phase C)
- [ ] Traceability complete
- [ ] User confirms ready for code

**Approved for coding:** ☐ Yes / ☐ Revisions needed
```

**STOP. Present files. FINAL gate before code.**

---

## Phase E — Code Implementation

**First: Read STATE.md. Read `engineering-backend-architect.md` + `engineering-frontend-developer.md`.
Re-read STATE.md before EVERY file.**

🎭 **Role: Backend Architect + Frontend Developer**

### Rules

1. **Follow blueprint exactly.** Deviate → update blueprint first.
2. **Traceability comments:** `// Blueprint: §B{x} | Planning: §{n}`
3. **Error handling** per §B2.3 taxonomy
4. **No undocumented behavior**
5. **Comments explain "why"** not "what"

### Build order

Follow §B6 from blueprint:
1. Project scaffold (§B1)
2. Infrastructure (§B2)
3. Database + migrations (§B3)
4. Data access (§B3.2)
5. API endpoints (§B4) — one group at a time
6. Frontend components (§B5.3)
7. Pages (§B5.2)
8. Integration wiring
9. Configuration

### Code quality

- **TypeScript:** strict, no `any`, explicit returns
- **Python:** type hints, docstrings
- **React:** functional + hooks
- **SQL:** parameterized only
- **All:** input validation on all boundaries

**STOP after all files. Update STATE.md. Ask for review.**

---

## Phase F — Tests

**First: Read STATE.md. Read `engineering-data-engineer.md`.**

🎭 **Role: Data Engineer**

### Steps
1. Implement unit tests (§C2) — all must pass
2. Implement integration tests (§C3) — all must pass
3. Implement E2E tests (§C4) — map to acceptance TCs from §2.4
4. Run all tests, capture results
5. Produce TEST_RESULTS.md

### TEST_RESULTS.md

```markdown
# Test Results

{standard header — Phase F}

## Unit + Integration
| Type | Total | Passed | Failed | Skipped |
|---|---|---|---|---|

## E2E
| Type | Total | Passed | Failed | Skipped |
|---|---|---|---|---|

## Acceptance Test Coverage
| TC ID (§2.4) | E2E Test | Result | Notes |
|---|---|---|---|

## Failures
| Test ID | Expected | Actual | Impact | Action |
|---|---|---|---|---|

## Coverage
| Layer | Coverage | Target | Status |
|---|---|---|---|
```

**STOP. Update STATE.md. Present files. Ask for sign-off.**

---

## Phase G — Final Delivery

**First: Read STATE.md. Verify all phases complete. Read ALL persona files.**

🎭 **Role: All Personas**

### Deliverables

1. **README.md** (finalized)
2. **DELIVERY_SUMMARY.md**
3. **CHANGELOG.md**

### README.md

```markdown
# {App Name}

{description}

**Reference:** {url}

## Quick start
1. Clone
2. `cp .env.example .env` — fill values
3. `{install}`
4. `{migrate}`
5. `{start}`

## Tech stack
| Layer | Technology |
|---|---|

## Testing
- `{unit}` — Unit tests
- `{integration}` — Integration
- `{e2e}` — E2E

## Documentation
- [Planning](docs/01-planning/PLANNING_SUMMARY.md)
- [Implementation](docs/02-implementation/IMPLEMENTATION_SUMMARY.md)
- [Testing](docs/03-testing/TEST_PLAN_SUMMARY.md)
```

### DELIVERY_SUMMARY.md

```markdown
# Delivery Summary

{standard header — Phase G}

## Built
{app name, type, features, stack}

## Run
{quick start}

## Test
{commands}

## Maintain
{key tasks}

## Known limitations
{not yet implemented, known issues}
```

**Update STATE.md (complete). Update INDEX.md (all done). Present full package. Done.**

---

## Traceability Chain

```
PLANNING.md
  §1 Reference analysis
  §2 User scenarios ──────────────────┐
  §4 Data model ────────────────┐     │
  §5 API design ──────────┐     │     │
  §6–10 Architecture ─┐   │     │     │
                       │   │     │     │
IMPLEMENTATION.md      │   │     │     │
  §B2 Infrastructure ◄┘   │     │     │
  §B3 Data access ◄───────┘     │     │
  §B4 API layer ◄───────────────│─────┘
  §B5 Frontend ◄────────────────│
       │       │                 │
       ▼       ▼                 │
  TEST_PLAN.md                   │
    Unit: §B3, B4                │
    E2E: §2 scenarios ───────────┘
       │
       ▼
  Code (Phase E)
    cites §B sections
       │
       ▼
  Tests + Results (Phase F)
    cites §C IDs + §2.4 TCs
       │
       ▼
  STATE.md + INDEX.md
```

---

## Standard Document Header

```markdown
# {Title}

| Field | Value |
|---|---|
| **Project** | {app name} |
| **Reference** | {url} |
| **Document** | {purpose} |
| **Version** | {v1.0} |
| **Status** | {Draft / Approved} |
| **Phase** | {A–G} |
| **Date** | {date} |
| **Traces to** | {parent doc} |
```
