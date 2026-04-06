# /Users/lapchan/Projects/proof-of-concept/macau-pos

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
- `.skills/references/engineering-code-reviewer.md`
- `.skills/references/engineering-security-engineer.md`
- `.skills/references/engineering-senior-developer.md`
- `.skills/references/engineering-software-architect.md`

Testing personas:
- `.skills/references/testing-accessibility-auditor.md`
- `.skills/references/testing-api-tester.md`
- `.skills/references/testing-evidence-collector.md`
- `.skills/references/testing-performance-benchmarker.md`
- `.skills/references/testing-reality-checker.md`
- `.skills/references/testing-test-results-analyzer.md`
- `.skills/references/testing-tool-evaluator.md`
- `.skills/references/testing-workflow-optimizer.md`

Magic words: sg (save) · rg (resume) · fp (follow prompt) · nm (new module) · pr (review)

## Session State Management

This project uses a two-file system for tracking state across sessions:

- **`STATE.md`** — Current project state only. Kept slim. Updated (overwritten) each session.
- **`SESSION_LOG.md`** — Append-only history. Each session appends an entry at the bottom.

### Rules for all sessions:

1. **On resume (`rg`):** Read `STATE.md` first, then `SESSION_LOG.md` if you need historical context.
2. **On save (`sg`):** Update `STATE.md` with current state, AND append a new entry to `SESSION_LOG.md`.
3. **Parallel sessions:** Multiple sessions may run concurrently. `SESSION_LOG.md` is append-only so there are no conflicts — just append your entry at the bottom. For `STATE.md`, read it first and merge carefully if it changed since you last read it.
4. **SESSION_LOG.md format:** Each entry starts with `## Session Title (YYYY-MM-DD)` followed by a summary of what was done. Keep entries concise but complete.
5. **STATE.md keeps:** Current phase, active context, key decisions, conventions, pending items, and a compact phase history table (one line per session). No detailed session logs — those go in SESSION_LOG.md.
6. **Always log work** at the end of each session, even if the user doesn't say `sg`.
