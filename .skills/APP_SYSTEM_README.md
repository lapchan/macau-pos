# Application Development System — Operating Manual

> **Protocol version:** 2.0 | **Updated:** 2026-03-22
> **Files:** 4 skills + 4 persona references
> **Adapted from:** MCP Development System v1.0
>
> **What is this file?**
> Master guide for a skill system that takes you from "I want to build X, here's a reference app"
> all the way to production code — with structured planning, role-based expertise, and sign-off gates.
>
> **This file lives inside your project** and is always available to Claude.
> Claude reads it automatically when an application development task is detected.
>
> **Magic words:** sg · rg · fp · nm · pr

---

## How It Works

### The interaction pattern

```
You: "I want to build {app name}. reference: {url}. Let's start Phase 0."

Claude:
  1. Fetches and researches the reference URL
  2. Analyzes the app's features, UX, architecture patterns
  3. Asks clarifying questions about YOUR version
  4. Begins structured planning with the right engineering persona
```

### What "reference:" means

The URL is a **reference application** — an existing product Claude should research to understand:
- What features it has
- How the UX flows work
- What the data model likely looks like
- What technical patterns it uses
- What you'd want to replicate, improve, or change

Claude fetches the URL, explores the site, and uses its findings to inform the planning process.
The reference is **inspiration + research target**, not a spec to copy verbatim.

### Examples

```
"I want to build IntelliPay. reference: https://stripe.com/payments. Let's start Phase 0."
"I want to build a vending UI. reference: https://example-kiosk.com. Let's start Phase 0."
"I want to build a retail dashboard. reference: https://shopify.com/admin. Let's start Phase 0."
```

---

## System Architecture

```
┌─────────────────────────────────────────────────┐
│  SKILL 1: App Planner (APP_PLANNER.md)          │
│                                                  │
│  Input:  App description + reference URL         │
│  Output: Signed-off PLANNING.md                  │
│                                                  │
│  • Researches reference app via URL              │
│  • Designs requirements, architecture, data model│
│  • Auto-selects persona per phase                │
│  • NO code — planning only                       │
│                                                  │
│  Phases: 0 → 0.1 → 1 → 2 → 3 → 4              │
└──────────────────────┬──────────────────────────┘
                       │
            Phase 3 signed off
                       ▼
┌─────────────────────────────────────────────────┐
│  SKILL 2: Product Reviewer (APP_PRODUCT_REVIEW) │
│                                                  │
│  • Reviews design as Senior PM                   │
│  • Tests realistic user scenarios                │
│  • Rates: 🔴 Blocker / 🟡 Major / 🔵 Minor     │
│                                                  │
│  Optional but recommended before Phase 4         │
└──────────────────────┬──────────────────────────┘
                       │
            Fix findings → Phase 4
                       ▼
┌─────────────────────────────────────────────────┐
│  SKILL 3: App Implementer (APP_IMPLEMENTER.md)  │
│                                                  │
│  Input:  Signed-off PLANNING.md                  │
│  Output: Complete app with docs & tests          │
│                                                  │
│  Phases: A → B → C → D → E → F → G              │
└─────────────────────────────────────────────────┘
```

---

## Engineering Personas (Auto-Selected)

Persona files live in your project's `.skills/references/` folder. Claude reads them
automatically and selects the right one based on the current task phase.

### The four personas

| Persona | File | Expertise | Auto-activates when |
|---|---|---|---|
| **Backend Architect** | `engineering-backend-architect.md` | APIs, system design, security, scaling | Architecture, API design, backend code |
| **Database Optimizer** | `engineering-database-optimizer.md` | Schema, queries, indexing, migrations | Data model, schema design, query optimization |
| **Data Engineer** | `engineering-data-engineer.md` | Pipelines, ETL, data quality, observability | Data flow, test plans, validation |
| **Frontend Developer** | `engineering-frontend-developer.md` | React/Vue, UI/UX, performance, a11y | UI design, frontend code, components |

### Auto-selection rules

| Phase | Claude automatically reads | Why |
|---|---|---|
| Planner Phase 0–0.1 | (none — PM thinking) | Requirements don't need a tech persona |
| Planner Phase 1 | `backend-architect` | Tech stack decisions |
| Planner Phase 2 | `database-optimizer` + `data-engineer` | Data model + API design |
| Planner Phase 3 | `backend-architect` + `frontend-developer` | Full architecture |
| Planner Phase 4 | All | Cross-cutting review |
| Implementer Phase B | `backend-architect` + `database-optimizer` | Blueprint |
| Implementer Phase C | `data-engineer` | Test plan |
| Implementer Phase E | `backend-architect` + `frontend-developer` | Code |
| Implementer Phase F | `data-engineer` | Tests |

Claude states which persona it activated: `"🎭 Active: Backend Architect + Database Optimizer"`

---

## Project Setup

### Option A: Claude Code project

```bash
# 1. Create project folder
mkdir -p my-app/.skills/references

# 2. Copy skill files into the project
cp APP_SYSTEM_README.md    my-app/.skills/
cp APP_PLANNER.md          my-app/.skills/
cp APP_PRODUCT_REVIEW.md   my-app/.skills/
cp APP_IMPLEMENTER.md      my-app/.skills/

# 3. Copy persona references
cp engineering-backend-architect.md   my-app/.skills/references/
cp engineering-frontend-developer.md  my-app/.skills/references/
cp engineering-database-optimizer.md  my-app/.skills/references/
cp engineering-data-engineer.md       my-app/.skills/references/

# 4. Add to CLAUDE.md so Claude always loads the skill system
cat >> my-app/CLAUDE.md << 'EOF'

## Application Development Skills

This project uses a structured application development skill system.
When any app planning, architecture, or implementation task is detected,
read `.skills/APP_SYSTEM_README.md` first, then the relevant skill file.

Skill files:
- `.skills/APP_SYSTEM_README.md` — Master guide (read first)
- `.skills/APP_PLANNER.md` — Planning phases 0–4
- `.skills/APP_PRODUCT_REVIEW.md` — Product design review
- `.skills/APP_IMPLEMENTER.md` — Implementation phases A–G

Engineering personas (auto-selected per phase):
- `.skills/references/engineering-backend-architect.md`
- `.skills/references/engineering-frontend-developer.md`
- `.skills/references/engineering-database-optimizer.md`
- `.skills/references/engineering-data-engineer.md`

Magic words: sg (save) · rg (resume) · fp (follow prompt) · nm (new module) · pr (review)
EOF
```

Your folder now looks like:
```
my-app/
├── CLAUDE.md                          ← Claude Code reads this automatically
└── .skills/
    ├── APP_SYSTEM_README.md           ← Master guide
    ├── APP_PLANNER.md                 ← Planning skill
    ├── APP_PRODUCT_REVIEW.md          ← Review skill
    ├── APP_IMPLEMENTER.md             ← Implementation skill
    └── references/
        ├── engineering-backend-architect.md
        ├── engineering-frontend-developer.md
        ├── engineering-database-optimizer.md
        └── engineering-data-engineer.md
```

### Option B: Claude.ai Project

1. Create a new Claude.ai Project
2. In **Project Instructions**, paste the content of `APP_SYSTEM_README.md`
3. Upload the remaining skill files as **Project Knowledge**:
   - `APP_PLANNER.md`
   - `APP_PRODUCT_REVIEW.md`
   - `APP_IMPLEMENTER.md`
   - All 4 `engineering-*.md` persona files
4. Every conversation in the project automatically has the skills available

### Option C: Claude.ai chat (no project)

Upload all files at the start of each conversation:
```
Upload: APP_SYSTEM_README.md + APP_PLANNER.md + persona files
Say: "I want to build {app}. reference: {url}. Let's start Phase 0."
```

---

## Workflow

### Full workflow (new app from scratch)

```
Step 1 — Plan
  You: "I want to build IntelliPay. reference: https://stripe.com/checkout.
        Let's start Phase 0."

  Claude:
    → Reads .skills/APP_PLANNER.md
    → Fetches https://stripe.com/checkout, researches the app
    → Runs Phase 0 → 0.1 → 1 → 2 → 3 → 4
    → Each phase: report → you sign off → next
    → Output: docs/01-planning/PLANNING.md

Step 1.5 — Review (optional but recommended)
  You: "pr"

  Claude:
    → Reads .skills/APP_PRODUCT_REVIEW.md
    → Stress-tests the architecture with user scenarios
    → Output: docs/01-planning/PRODUCT_REVIEW.md
    → Fix findings if needed

Step 2 — Implement
  You: "Please begin Phase A"

  Claude:
    → Reads .skills/APP_IMPLEMENTER.md
    → Runs Phase A → B → C → D → E → F → G
    → Output: Complete app with docs, code, tests
```

### Lite mode (you know the stack)

```
You: "lite — I want to build a Next.js dashboard with Supabase.
      reference: https://vercel.com/dashboard"

Claude skips deep research, asks you to confirm stack, focuses on
scenarios + architecture + code.
```

### Add mode (new feature to existing app)

```
You: "add payment-history page"

Claude reads existing code conventions, writes the feature + tests.
```

### Prototype mode (just code it)

```
You: "proto — quick Stripe checkout integration"

No process, no docs, just code.
```

---

## Magic Words

| Command | Aliases | What it does |
|---|---|---|
| **SAVE GATE** | **sg**, **Save** | Stop → update STATE.md → present files |
| **RESUME GATE** | **rg**, **Resume** | Load STATE.md → show status → wait |
| **NEW MODULE** | **nm {name}** | Add feature/module to existing project |
| **PRODUCT REVIEW** | **pr** | Run senior PM review |
| **FOLLOW PROMPT** | **fp** | Re-read skill instructions strictly |
| "Check STATE.md" | — | Re-read STATE.md, correct drift |
| "You're drifting" | — | Hard reset from STATE.md |

---

## SAVE GATE / RESUME GATE

### 🛑 sg — Stop and save

Claude must:
1. Stop immediately
2. Update STATE.md with exact phase, sub-task, active persona, what's done/remaining
3. Update INDEX.md
4. Present all project files
5. Reply:

```
🛑 SAVE GATE — Work saved.

Phase: {current phase}
Sub-task: {what I was doing}
Active persona: {which persona}
Status: {done / remaining}

Files to keep for resume:
  1. STATE.md (required)
  2. INDEX.md (required)
  3. {other docs}

To resume: say "rg"
```

### ▶️ rg — Resume

Claude must:
1. Read STATE.md FIRST
2. Read INDEX.md
3. Read relevant phase docs
4. Reply:

```
▶️ RESUME GATE — Context loaded.

Project: {app name}
Reference: {url}
Last signed-off phase: {phase}
Resuming: {phase + sub-task}
Active persona: {which}

Quick status:
  ✅ {completed phases}
  🔄 {current phase}
  ☐ {remaining phases}

Shall I continue?
```

---

## Project Output Structure

```
{project}/
├── CLAUDE.md                          ← Claude Code auto-reads this
├── .skills/                           ← Skill files (always in memory)
│   ├── APP_SYSTEM_README.md
│   ├── APP_PLANNER.md
│   ├── APP_PRODUCT_REVIEW.md
│   ├── APP_IMPLEMENTER.md
│   └── references/
│       ├── engineering-backend-architect.md
│       ├── engineering-frontend-developer.md
│       ├── engineering-database-optimizer.md
│       └── engineering-data-engineer.md
│
├── STATE.md                           ← Claude's working memory
├── INDEX.md                           ← Document registry
├── README.md                          ← Project overview
│
├── docs/
│   ├── 01-planning/
│   │   ├── PLANNING.md               ← Cumulative planning doc
│   │   ├── PLANNING_SUMMARY.md       ← Executive summary
│   │   └── PRODUCT_REVIEW.md         ← PM review (if run)
│   ├── 02-implementation/
│   │   ├── IMPLEMENTATION.md         ← Full blueprint
│   │   ├── IMPLEMENTATION_SUMMARY.md
│   │   └── VALIDATION_REPORT.md
│   ├── 03-testing/
│   │   ├── TEST_PLAN.md
│   │   ├── TEST_PLAN_SUMMARY.md
│   │   ├── TEST_RESULTS.md
│   │   └── TEST_RESULTS_SUMMARY.md
│   ├── 04-signoff/
│   │   ├── SIGNOFF_LOG.md
│   │   └── IMPLEMENTATION_GATE.md
│   └── 05-delivery/
│       ├── DELIVERY_SUMMARY.md
│       └── CHANGELOG.md
│
├── src/                               ← Application code
├── tests/                             ← Test code
├── .env.example
└── package.json / pyproject.toml / etc.
```

---

## Key Principles

| Principle | What it means |
|---|---|
| **Reference-driven** | Research the reference URL to understand what to build |
| **Phase-gated** | Report → sign-off → next phase. No skipping. |
| **Docs before code** | Blueprint + test plan before any code |
| **Auto-persona** | Right engineering expertise activates at the right phase |
| **STATE.md is Claude's brain** | External memory. Read first, update often. |
| **User scenarios drive everything** | Start from what users need |
| **Boring > clever** | Maintainable code over elegant abstractions |
| **Always in memory** | Skills live in the project, no re-uploading |

---

## Quick Start Checklist

```
1. Create project folder
2. Copy .skills/ folder into it
3. Add CLAUDE.md entry (for Claude Code) or set up Project (for Claude.ai)
4. Say: "I want to build {name}. reference: {url}. Let's start Phase 0."
5. Work through phases, use sg/rg between sessions
6. Get signed-off PLANNING.md
7. Say: "pr" (optional review)
8. Say: "Please begin Phase A" (implementation)
9. Work through implementation phases
10. Receive complete app
```
