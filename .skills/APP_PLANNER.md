---
name: app-planner
description: >
  Research a reference application and plan a production-grade application from it. Use this skill
  whenever the user wants to build a web app, mobile app, API service, dashboard, SaaS product,
  or any software application — especially when they provide a reference URL to an existing app.
  Trigger when users say "I want to build", "plan an application", "Let's start Phase 0",
  "reference:", or describe any software they want created. Also trigger on magic words:
  sg, rg, fp, nm, or when user mentions phases 0–4 in planning context.
  This skill covers: reference app research, requirements gathering, user scenario design,
  technical feasibility, data model, API design, architecture, and review gates.
  Auto-selects engineering personas from .skills/references/ per phase.
  Does NOT produce implementation code — use APP_IMPLEMENTER.md for that.
---

# Application Planner Skill

> **Protocol version:** 2.0 | **Updated:** 2026-03-22 | **Companion:** APP_SYSTEM_README.md
> **Magic words:** sg · rg · fp · nm {name} | **Phases:** 0 → 0.1 → 1 → 2 → 3 → 4
> **Persona files:** `.skills/references/engineering-*.md` (auto-selected)

---

## Core Principles

| Principle | Why |
|---|---|
| **Reference-first** | Fetch and research the reference URL before planning. Understand what exists. |
| **Plan-first, code-never** | This skill produces planning only. No code. |
| **Phase-gated delivery** | Every phase: report → user sign-off → next. Never skip. |
| **Auto-persona** | Read persona files from `.skills/references/` and activate per phase. |
| **User-scenario driven** | Start from what users need, design to serve those needs. |
| **Evidence-driven** | Label findings as `Confirmed`, `Strong inference`, or `Unverified`. |
| **Anti-drift** | STATE.md externalizes memory. Read at every phase start. |
| **Boring > clever** | Robust architecture over elegant abstractions. |

---

## Reference URL Research Protocol

When the user says `"reference: {url}"`, Claude must:

### Step 1: Fetch and explore

```
1. Fetch the URL using web_fetch
2. Search the web for "{app name} features", "{app name} tech stack", "{app name} API"
3. If the app has public docs, fetch those too
4. Explore key user flows by reading the page structure
```

### Step 2: Extract reference intelligence

Produce a **Reference Analysis** with:

| Aspect | What to capture |
|---|---|
| **App overview** | What the app does, who it's for, core value proposition |
| **Key features** | Feature list, organized by user-facing capability |
| **UX patterns** | Navigation, layouts, key interaction patterns observed |
| **Data model hints** | What entities exist (users, products, orders, etc.) |
| **Tech stack signals** | Framework clues from page source, headers, scripts |
| **API patterns** | Public API docs, endpoint patterns, auth approach |
| **Strengths** | What the reference app does well |
| **Weaknesses / gaps** | What could be improved or is missing |

### Step 3: Ask the user

After researching, ask:
```
I've researched {reference URL}. Here's what I found: {summary}

Questions:
1. Which features do you want to replicate?
2. What would you change or improve?
3. What's your version's unique angle?
4. Any features to explicitly exclude from v1?
```

---

## Auto-Persona Selection

At the start of each phase, Claude reads the appropriate persona file(s) from
`.skills/references/` and announces which persona is active.

### Reading persona files

```
# In Claude Code: read from project folder
Read: .skills/references/engineering-backend-architect.md

# In Claude.ai Projects: persona files are in project knowledge (already loaded)
```

### Selection by phase

| Phase | Read these personas | Announce |
|---|---|---|
| 0 | (none) | 🎭 Role: Product Manager |
| 0.1 | (none) | 🎭 Role: Senior Product Manager |
| 1 | `engineering-backend-architect.md` | 🎭 Role: Backend Architect |
| 2 | `engineering-database-optimizer.md` + `engineering-data-engineer.md` | 🎭 Role: Database Optimizer + Data Engineer |
| 3 | `engineering-backend-architect.md` + `engineering-frontend-developer.md` | 🎭 Role: Backend Architect + Frontend Developer |
| 4 | All four | 🎭 Role: All Personas — Final Review |

### How personas influence decisions

When a persona is active, Claude:
- Adopts that persona's expertise, priorities, and success metrics
- Uses the persona's deliverable formats where applicable
- Applies the persona's critical rules
- Frames decisions through that persona's lens

---

## Context Management — STATE.md

Maintain `STATE.md` at the project root. Claude MUST read it at every phase start.

```markdown
# Working State — {App Name}

**Last updated:** {timestamp}
**Current phase:** {Phase X — description}
**Current sub-task:** {specific thing}
**Active persona:** {current persona(s)}
**Reference URL:** {url}

## Active Context

### Project identity
- App name: {name}
- Reference: {url}
- Type: {web / mobile / API / SaaS}
- Tech stack: {filled as decided}
- Target users: {who}

### Reference intelligence summary
- Key features to replicate: {list}
- Key changes from reference: {list}
- Excluded features: {list}

### Key decisions (append as discovered)
- {decision 1}

### Key conventions (DO NOT deviate)
- {convention 1}

### Current phase objective
{What I'm producing right now}

### Current phase deliverables checklist
- [ ] {deliverable 1}
- [x] {deliverable 2 — done}

## Phase History
### Phase 0 — ✅ Signed off {date}
Key outcome: {1 sentence}

## Pending Items
- {blocked / waiting / deferred}

## DO NOT FORGET
- {critical constraints Claude tends to forget}
```

### STATE.md rules
- **Read before every phase.** Like a pilot's checklist.
- **Update on every decision, deliverable, phase transition.**
- **Drift recovery:** stop → read STATE.md → identify discrepancy → add to DO NOT FORGET.

---

## Magic Words

| Say | Does |
|---|---|
| **sg** / **Save** | Stop → update STATE.md → present files → structured confirmation |
| **rg** / **Resume** | Read STATE.md → read docs → structured status → wait for go-ahead |
| **nm {name}** | New module — scaffold, inherit conventions, start Phase 0 |
| **fp** | Re-read skill instructions + STATE.md → continue strictly |
| "Check STATE.md" | Re-read STATE.md, correct drift |
| "You're drifting" | Hard reset from STATE.md |

---

## Workflow Modes

| Mode | Trigger | Phases run |
|---|---|---|
| **Full** (default) | `"Let's start Phase 0"` | All: 0 → 0.1 → 1 → 2 → 3 → 4 |
| **Lite** | `"lite — ..."` | 0 + 0.1 + 3 only (you provide stack) |
| **Add** | `"add {feature}"` | No phases — code + test following conventions |
| **Proto** | `"proto — ..."` | No process, just code |

---

## Phase-Gated Workflow

```
Phase 0: Capture Intent + Research Reference
  └─▶ Reference analysis + intent → Sign-off → ✓

Phase 0.1: User Scenario Design
  └─▶ Personas, stories, test cases, QA playbook → Sign-off → ✓

Phase 1: Technical Feasibility & Stack
  └─▶ Tech decisions, risks → Sign-off → ✓

Phase 2: Data Model & API Design
  └─▶ Schema, endpoints, contracts → Sign-off → ✓

Phase 3: Full Architecture
  └─▶ System design, UI, security → Sign-off → ✓
  Then: "pr" recommended

Phase 4: Final Review Package
  └─▶ Complete PLANNING.md → Final sign-off → DONE
```

**At every gate:**
1. Read STATE.md
2. Complete phase work
3. Append to PLANNING.md
4. Update STATE.md + INDEX.md
5. Present files
6. Ask for sign-off
7. **STOP. Wait for approval.**

---

## Phase 0 — Capture Intent + Research Reference

**First: Create STATE.md. Create INDEX.md.**

🎭 **Role: Product Manager**

### Step 1: Research the reference URL

If user provided `reference: {url}`:

1. **Fetch the URL** — read the page, understand the app
2. **Web search** — `"{app name} features"`, `"{app name} tech stack"`, `"{app name} review"`
3. **Extract reference intelligence** (see Reference URL Research Protocol above)
4. **Present findings** to user for confirmation

If NO reference URL:
- Skip research step
- Gather intent through questions

### Step 2: Capture project intent

| Field | Value |
|---|---|
| App name / working title | {name} |
| Reference URL | {url or "none"} |
| One-sentence description | {what it does} |
| App type | Web / Mobile / API / SaaS / Internal tool |
| Target users | {who} |
| Key problem it solves | {problem} |
| Features from reference to keep | {list from research} |
| Features to change / improve | {list} |
| Features to exclude (v1) | {list} |
| Scale expectations | {users, requests, data volume} |
| Known tech preferences | {if any} |
| Timeline / constraints | {if any} |

### Phase 0 Report — create PLANNING.md:

```markdown
# {App Name} — Planning Document

| Field | Value |
|---|---|
| **Project** | {app name} |
| **Reference** | {url} |
| **Document** | Application planning — cumulative |
| **Version** | v0.1 |
| **Status** | Phase 0 — Draft |
| **Date** | {date} |

## 1. Project Intent

### 1.1 Reference analysis
{Full reference intelligence from URL research — features, UX, tech signals, strengths, gaps}

### 1.2 App identity
{Intent table from above}

### 1.3 Feature scope (informed by reference)
| Feature | In reference? | In our v1? | Priority | Notes |
|---|---|---|---|---|
| {feature} | ✅/❌ | ✅/❌ | P0/P1/P2 | {change from reference} |

### 1.4 Success criteria
- {criterion 1}
- {criterion 2}

### 1.5 Out of scope (v1)
- {explicitly excluded}

### Phase 0 Sign-off
**Phase:** 0 — Capture Intent + Research Reference
**Deliverables:** Reference analysis, project intent, feature scope
**Decision required:** Does this accurately capture what you want to build?
- [ ] Approved — proceed to Phase 0.1
- [ ] Revisions needed — {specify}
```

**STOP. Create STATE.md. Create INDEX.md. Present files. Ask for sign-off.**

---

## Phase 0.1 — User Scenario Design

**First: Read STATE.md.**

🎭 **Role: Senior Product Manager**

The most important phase. Everything downstream exists to serve these scenarios.

### Step 1: Define user personas
Based on reference research + user's description.

### Step 2: Write user stories
In natural language, in the user's language if non-English.
Include common tasks AND edge cases.

### Step 3: Categorize capabilities
- **P0 (Must-have):** App is useless without these
- **P1 (Should-have):** Important but can ship without
- **P2 (Nice-to-have):** Enhances experience

### Step 4: Write acceptance test cases
For each P0 scenario: exact input, expected behavior, pass/fail criteria.

### Step 5: Write QA test playbook
Step-by-step manual for human testers.

### Phase 0.1 Report — append to PLANNING.md:

```markdown
## 2. User Scenario Design

### 2.1 User personas
| Persona | Context | Language | Key need |
|---|---|---|---|

### 2.2 User stories
#### Persona: {name}
1. "{story in user's language}"

### 2.3 Capability categories
| Category | Examples | Capability needed | Priority |
|---|---|---|---|

### 2.4 Acceptance test cases
| ID | Scenario | Persona | Input | Expected | Pass criteria |
|---|---|---|---|---|---|

### 2.5 QA test playbook
#### QA-001: {test name}
**Priority:** P0
**Steps:** {exact steps}
**Expected:** {what tester sees}
**If FAIL:** {what to do}

### Phase 0.1 Sign-off
{gate template}
```

**STOP. Update STATE.md. Present files. Ask for sign-off.**

---

## Phase 1 — Technical Feasibility & Stack

**First: Read STATE.md. Read `.skills/references/engineering-backend-architect.md`.**

🎭 **Role: Backend Architect**

Evaluate technical options informed by reference research.

### Tech stack evaluation

For each decision, consider what the reference app uses and whether to follow or diverge:

| Decision | Reference uses | Options | Selected | Rationale | Confidence |
|---|---|---|---|---|---|
| Frontend | {observed} | {options} | {selected} | {why} | Confirmed / Strong inference |
| Backend | {observed} | {options} | {selected} | {why} | {level} |
| Database | {inferred} | {options} | {selected} | {why} | {level} |
| Auth | {inferred} | {options} | {selected} | {why} | {level} |
| Hosting | {inferred} | {options} | {selected} | {why} | {level} |

### Feasibility against scenarios

| Scenario (from §2.3) | Technical requirement | Feasible? | Notes |
|---|---|---|---|

### Phase 1 Report — append to PLANNING.md:

```markdown
## 3. Technical Feasibility & Stack

### 3.1 Technology decisions
{decision table with reference comparison}

### 3.2 Feasibility matrix
### 3.3 Technical risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|

### 3.4 Dependencies
| Dependency | Purpose | License | Risk |
|---|---|---|---|

### Phase 1 Sign-off
{gate template}
```

**STOP. Update STATE.md. Present files. Ask for sign-off.**

---

## Phase 2 — Data Model & API Design

**First: Read STATE.md. Read `engineering-database-optimizer.md` + `engineering-data-engineer.md`.**

🎭 **Role: Database Optimizer + Data Engineer**

### Step 1: Entity-Relationship Design
Identify entities, relationships, attributes — informed by reference analysis.

### Step 2: Schema Design
Tables, types, constraints, indexes. Follow Database Optimizer best practices:
- Index all foreign keys
- Partial indexes for common query patterns
- Soft deletes with audit columns
- Migration strategy

### Step 3: API Design
Endpoints, request/response shapes, auth, errors.

### Phase 2 Report — append to PLANNING.md:

```markdown
## 4. Data Model

### 4.1 Entity-Relationship overview
### 4.2 Database schema
{SQL or ORM notation — implementation-ready}

### 4.3 Index strategy
| Table | Index | Columns | Purpose | Query pattern |
|---|---|---|---|---|

### 4.4 Migration strategy

## 5. API Design

### 5.1 API overview
| # | Method | Path | Purpose | Auth | Priority |
|---|---|---|---|---|---|

### 5.2 API contracts
{Per endpoint: method, path, request, response, errors, scenario coverage}

### 5.3 Scenario-to-API mapping
| Scenario | API call(s) | Covered? |
|---|---|---|

### Phase 2 Sign-off
{gate template}
```

**STOP. Update STATE.md. Present files. Ask for sign-off.**

---

## Phase 3 — Full Architecture Design

**First: Read STATE.md. Read `engineering-backend-architect.md` + `engineering-frontend-developer.md`.**

🎭 **Role: Backend Architect + Frontend Developer**

Pull everything together. Reference app informs patterns but doesn't dictate them.

### Sections to produce:

1. **System Architecture** — components, services, communication
2. **Frontend Architecture** — components, state, routing, UI patterns
3. **Backend Architecture** — request flow, middleware, caching, background jobs
4. **Integration Architecture** — third-party services, webhooks, file storage
5. **Security Design** — auth, authorization, validation, encryption
6. **Scenario Coverage Check** — verify every P0 scenario works end-to-end

### Phase 3 Report — append to PLANNING.md:

```markdown
## 6. System Architecture
### 6.1 Architecture overview
### 6.2 Component diagram
### 6.3 Request flow

## 7. Frontend Architecture
### 7.1 Component hierarchy
### 7.2 State management
### 7.3 Routing
### 7.4 Key UI patterns (informed by reference)

## 8. Backend Architecture
### 8.1 Service structure
### 8.2 Middleware stack
### 8.3 Error handling
### 8.4 Caching
### 8.5 Background processing

## 9. Integration Architecture
### 9.1 Third-party integrations
### 9.2 Webhook handling

## 10. Security Design
### 10.1 Authentication
### 10.2 Authorization
### 10.3 Input validation
### 10.4 Data protection

## 11. Scenario Coverage Check
| Scenario | Frontend | API | Backend | DB | Covered? |
|---|---|---|---|---|---|

**All P0 scenarios must be ✅ or ⚠️.**

### Phase 3 Sign-off
{gate template}
```

**STOP. Update STATE.md. Present files. Ask for sign-off.**

**After Phase 3:** Say `"pr"` to run Product Review.

---

## Phase 4 — Final Review Package

**First: Read STATE.md. Read ALL persona files.**

🎭 **Role: All Personas**

Consolidation — no new research. Review everything for consistency.

### Phase 4 Report — append to PLANNING.md:

```markdown
## 12. Non-Functional Requirements
### 12.1 Performance targets
### 12.2 Scalability
### 12.3 Monitoring
### 12.4 Logging

## 13. Deployment Plan
### 13.1 Environments
### 13.2 CI/CD
### 13.3 Secrets management

## 14. Risks & Gaps
| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|

## 15. Implementation Phases (build order)
| Phase | What to build | Depends on | Effort |
|---|---|---|---|

## 16. Open Questions
| # | Question | Impact | Who decides |
|---|---|---|---|

## 17. Final Sign-off Gate

- [ ] All phase sign-offs completed
- [ ] Reference features confirmed (keep / change / exclude)
- [ ] Architecture confirmed
- [ ] Data model confirmed
- [ ] API design confirmed
- [ ] Tech stack confirmed
- [ ] Security confirmed
- [ ] Build order agreed

**Approved:** ☐ Yes / ☐ Revisions needed
```

**STOP. Write PLANNING_SUMMARY.md. Update STATE.md. Present all files. Final sign-off.**

---

## Phase Sign-off Gate Template

```markdown
### Phase {N} Sign-off

**Phase:** {N} — {Name}
**Deliverables:** {what was produced}
**Active persona:** {who}
**Decision required:** {what to approve}

- [ ] Approved — proceed to Phase {N+1}
- [ ] Revisions needed — {specify}

**User notes:**
_{to be filled}_
```

---

## Standard Document Header

Every `.md` in `docs/` begins with:

```markdown
# {Document Title}

| Field | Value |
|---|---|
| **Project** | {app name} |
| **Reference** | {url} |
| **Document** | {purpose} |
| **Version** | {v1.0} |
| **Status** | {Draft / Awaiting sign-off / Approved} |
| **Phase** | {phase} |
| **Date** | {date} |
```

---

## Confidence Labels

| Label | Meaning |
|---|---|
| **Confirmed** | Verified through research, docs, or testing |
| **Strong inference** | Highly likely from multiple signals |
| **Unverified** | Plausible but not validated |
