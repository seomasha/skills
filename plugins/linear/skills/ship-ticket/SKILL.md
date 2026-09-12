---
name: ship-ticket
description: Use when user says /ship-ticket or wants to ship a Linear ticket from backlog to merged PR — orchestrates branch, brainstorm, parallel subagents, CI, PR creation, and Linear update
---

# Ship Ticket

## Overview

Full end-to-end workflow: Linear ticket → feature branch from `dev` → design brainstorm → local spec + plan → model recommendation → parallel subagent implementation → CI validation → structured PR → Linear update. Enforces commit format and prevents spec doc commits at every step.

## Invocation

Extract the ticket ID (e.g. `HRA-15`) from: the user's message, `$ARGUMENTS`, or the current branch name. If not found, ask the user once before proceeding.

---

## Phase 1: Ticket Intake

Fetch the ticket from Linear:
```
Use mcp__plugin_linear_linear__get_issue with the ticket ID.
Extract: title, description, labels, priority, assignee, parent epic if any.
```

Derive the branch name using CLAUDE.md conventions:
- Feature work: `feature/{module}/{kebab-description}`
- Bug fix: `fix/{module}/{kebab-description}`
- Infrastructure: `infra/{module}/{kebab-description}`

Module comes from the ticket label or parent epic (e.g. `payroll`, `auth`, `employees`). Description is a 2-4 word kebab-case summary of the ticket title.

---

## Phase 2: Branch Setup

Create an isolated feature branch from the latest `dev`:

```bash
git checkout dev
git pull origin dev
git checkout -b {branch-name}
git status  # must show nothing staged
```

If the working tree is dirty before branching, stash or commit the changes first — never branch with uncommitted changes.

Verify the branch is clean before proceeding (`git status` must show nothing staged or modified).

---

## Phase 3: Brainstorm

**REQUIRED:** Invoke `superpowers:brainstorming` before any design or implementation decisions.

The brainstorm agent should produce:
- Clarifying questions about scope and edge cases
- Proposed component/module breakdown
- Risks and unknowns
- Questions about BiH-specific rules (FBiH vs RS, contribution rates, JMBG handling) if payroll-related

**Wait for user answers** before proceeding. Do not proceed to Phase 4 until all blocking questions are resolved.

---

## Phase 3.5: SDD Evaluation

After brainstorming, evaluate whether this ticket introduces a **living spec** — a config, registry, rule set, or schema that future tickets will extend or modify over time.

**Ask:** Does this ticket introduce something that multiple future tickets will need to extend?

**Strong SDD signals (go with SDD):**
- Configuration registry that future tickets add entries to (nav modules, module activation flags, rate tables)
- Rule sets tied to legislation that will change (contribution rates, tax thresholds, statutory limits)
- Data schemas or type systems that accumulate entries (permission matrices, report templates, form schemas)
- Anything where the answer to "how will ticket X change this?" is "add a row/entry to the config"

**Against SDD (skip it):**
- Pure UI rendering with no evolving configuration
- Bug fixes or refactors
- One-off migrations
- Single-use logic with no future extension points
- Features that change rarely or never (e.g., a static help page)

**If SDD is appropriate:**
- **REQUIRED:** Invoke `opsx:propose` with a descriptive change name (e.g., `nav-modules-registry`, `payroll-rate-tables`)
- Let the openspec flow generate `proposal.md`, `design.md`, `specs/`, and `tasks.md`
- The openspec change becomes part of the planning artifacts for this ticket
- Reference the openspec change name in the implementation plan so future tickets know to use `opsx:propose` when extending it

**If SDD is not appropriate:**
- Skip Phase 3.5 entirely and proceed to Phase 4

**Present your evaluation to the user in one sentence** before deciding — e.g. "This ticket introduces a nav module registry that 8+ future tickets will extend — SDD is a good fit here." Give the user a chance to override.

---

## Phase 4: Spec & Plan Generation

**REQUIRED:** Invoke `superpowers:writing-plans` after brainstorm answers are collected.

Store output in `docs/superpowers/specs/` (gitignored):
- `docs/superpowers/specs/{TICKET_ID}-spec.md` — requirements, scope, acceptance criteria
- `docs/superpowers/specs/{TICKET_ID}-plan.md` — implementation tasks, file-level breakdown, dependency order

**GUARDRAIL — Never commit plan docs:**
Before any git operation, verify:
```bash
git check-ignore -q docs/superpowers/specs/ && echo "docs/superpowers/specs/ is gitignored" || echo "WARNING: docs/superpowers/specs/ is NOT gitignored — add it now"
```
If `docs/superpowers/specs/` is not gitignored, add it to `.gitignore` and commit that change first.

Also run:
```bash
git status --short | grep "docs/superpowers/specs/" && echo "BLOCKED: plan docs are staged — unstage them" || echo "OK"
```
Block any commit that includes files from `docs/superpowers/specs/`.

---

## Phase 4.5: Model Recommendation

After the plan is written, read the tasks and recommend which model to use for each subagent dispatch. Present this to the user before proceeding to implementation.

**Available models:**

| Model | Type | Best for |
|-------|------|----------|
| `haiku` | Cloud (fast/cheap) | Simple, isolated, mechanical tasks — 1-2 files, clear spec, standard patterns |
| `sonnet` | Cloud (standard) | Integration tasks — multi-file, wiring layers, adapting existing patterns |
| `opus` | Cloud (most capable) | Architecture, complex business logic, cross-cutting concerns, BiH payroll rules |

**Model selection signals:**

- Config file change, single-function add, stub pages, string replacements → `haiku`
- Connecting frontend ↔ backend, multi-layer change, adapting patterns → `sonnet`
- New domain model, payroll engine logic, security-sensitive, broad codebase judgment → `opus`

**Present recommendation as a table:**

```
Task 1: [title] → haiku — [one-line reason]
Task 2: [title] → sonnet — [one-line reason]
Task 3: [title] → opus — [one-line reason]
```

Ask the user to confirm or adjust before dispatching. This is the last checkpoint before implementation begins.

---

## Phase 5: Parallel Implementation

**REQUIRED:** Invoke `superpowers:dispatching-parallel-agents` to dispatch one subagent per independent task from the plan.

Use the model confirmed in Phase 4.5 for each subagent.

### Subagent Instructions Template

Pass these instructions to EVERY subagent verbatim — do not summarize or shorten:

```
You are implementing task: {TASK_DESCRIPTION}

Working directory: {BRANCH_PATH}
Ticket: {TICKET_ID}

IMPLEMENT DIRECTLY. Do not ask clarifying questions. If something is ambiguous, make the most reasonable choice and note it in the commit message. The user's answers from brainstorming are in the spec at docs/superpowers/specs/{TICKET_ID}-spec.md.

COMMIT FORMAT — enforced, no exceptions:
  <type>({TICKET_ID}): <short description>
  Types: feat, fix, refactor, test, infra, chore
  Example: feat(HRA-15): add bruto-neto calculation for RS entity

Do NOT include Co-Authored-By lines.
Do NOT commit any files under docs/superpowers/specs/.
Do NOT commit any files matching: *.spec.md, *.plan.md, *-design.md, summary.md

After implementing, run:
  cd apps/web && npx tsc --noEmit
  cd apps/api && npx tsc --noEmit
  npm run lint --workspace=apps/web
  npm run lint --workspace=apps/api
  npm test

If lint fails, auto-fix with:
  npm run lint:fix --workspace={failing_app}
Then re-run lint to confirm clean. If still failing after one fix pass, commit what passes and leave a TODO comment — do not stall.

If tests fail, investigate root cause. Fix the code, not the test, unless the test assertion is clearly wrong.
```

### After Each Subagent Completes

Run the full CI suite on the branch:
```bash
npx tsc --noEmit -p apps/web/tsconfig.json
npx tsc --noEmit -p apps/api/tsconfig.json
npm run lint
npm test
npm run build
```

If build fails, fix before proceeding to Phase 6.

### Infrastructure Cleanup Guardrail

If the ticket involved local infrastructure (LocalStack S3, Docker Compose services, test databases), verify they are stopped and removed:
```bash
docker ps --filter "name=localstack" --filter "name=minio" --filter "name=mailhog"
# Stop any lingering containers started for this ticket
```

---

## Phase 6: Verification

**REQUIRED:** Invoke `superpowers:verification-before-completion` before opening the PR.

Checklist:
- [ ] TypeScript: zero errors across `apps/web` and `apps/api`
- [ ] Lint: zero warnings or errors
- [ ] Tests: all pass, no skipped tests added for this ticket
- [ ] No PII logged (grep for JMBG, IBAN, names in new log statements)
- [ ] No raw SQL string concatenation in new code
- [ ] No hardcoded tax rates or contribution percentages
- [ ] No `docs/superpowers/specs/` files staged or committed
- [ ] All commits follow `<type>({TICKET_ID}): <description>` format

Verify commits:
```bash
git log dev..HEAD --oneline | grep -vE "^[a-f0-9]+ (feat|fix|refactor|test|infra|chore)\(HRA-[0-9]+\): " && echo "BAD COMMITS FOUND" || echo "All commits OK"
```

If bad commits are found, use `git rebase -i dev` to reword them before opening the PR.

---

## Phase 7: PR & Linear Update

### Open PR

```bash
gh pr create \
  --title "{type}({TICKET_ID}): {ticket title}" \
  --base dev \
  --body "$(cat <<'EOF'
## Linear Ticket
{TICKET_ID}: {ticket title}
{Linear ticket URL}

## Summary
{3-5 bullet points of what changed}

## Implementation Notes
{Any non-obvious decisions made during brainstorm or implementation}

## Test Plan
- [ ] TypeScript: zero errors
- [ ] Lint: clean
- [ ] Unit tests pass
- [ ] {Feature-specific manual test steps}

## BiH Compliance (if applicable)
- [ ] Tested with FBiH rule set
- [ ] Tested with RS rule set
- [ ] No PII in logs
EOF
)"
```

### Update Linear Ticket

```
Use mcp__plugin_linear_linear__save_issue to update:
  - status: "In Review" (or equivalent in-progress status for the team)
  - Add a comment with the PR URL using mcp__plugin_linear_linear__save_comment
```

---

## Failure Mode Guardrails

| Failure mode | Guardrail |
|---|---|
| Wrong commit format | Subagent instructions include exact format + example. Phase 6 verifies all commits before PR. Rebase-reword if needed. |
| Spec docs committed | Phase 4 checks gitignore. Phase 6 grep checks `docs/superpowers/specs/` not in any commit. Subagent instructions forbid it explicitly. |
| Subagents stalling on clarifications | Template says "IMPLEMENT DIRECTLY. Do not ask clarifying questions." Make the call, note it in commit. |
| LocalStack/infra not cleaned up | Phase 5 explicit cleanup step after all subagents complete. |
| Parallel subagents conflicting | Only dispatch truly independent tasks in parallel. Sequential tasks (schema migration → API → frontend) must be ordered. |
| Tests fail after subagents | Full CI run in Phase 5 after each subagent before proceeding. Fix before PR. |
| Dirty working tree before branch | Check `git status` before `git checkout -b`. Stash or commit first. |

---

## Quick Reference

```
Phase 1    →  Fetch Linear ticket, derive branch name
Phase 2    →  git checkout dev && git pull && git checkout -b {branch}
Phase 3    →  Brainstorm design questions, wait for answers (superpowers:brainstorming)
Phase 3.5  →  SDD evaluation: does this ticket introduce a living spec?
               → YES: opsx:propose {change-name} → full openspec artifacts
               → NO: skip
Phase 4    →  Write spec + plan to docs/superpowers/specs/ (superpowers:writing-plans), verify gitignored
Phase 4.5  →  Model recommendation per task (haiku / sonnet / opus), user confirms
Phase 5    →  Dispatch parallel subagents (superpowers:dispatching-parallel-agents)
               → each: implement directly, commit format enforced, CI run after
Phase 6    →  Full verification (superpowers:verification-before-completion)
Phase 7    →  gh pr create --base dev + Linear status update
```
