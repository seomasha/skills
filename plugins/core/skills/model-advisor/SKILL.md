---
name: model-advisor
description: >
  Reads an implementation plan and recommends the best LLM model for each task.
  Brutally honest — recommends local Ollama models when they can genuinely handle
  the task, Claude only when the task actually needs it. Triggers on: "/model-advisor",
  "which model should I use", "model recommendation", "what model for this task",
  "recommend model for plan".
allowed-tools: Read Glob Grep Bash
---

# Model Advisor

Read the implementation plan and produce a brutally honest model recommendation for each task.

Do NOT default to Claude. If a local model can handle the task, say so. Recommend the cheapest, fastest model that can genuinely succeed.

---

## Step 1: Understand the Project

Read `CLAUDE.md` (project-level) if it exists. Extract:
- The tech stack and architecture patterns
- Any security-sensitive domains called out (auth, encryption, payments, PII, multi-tenancy, compliance, etc.)
- Coding standards and conventions

This context shapes which tasks are truly "mechanical" vs. which carry hidden risk.

---

## Step 2: Find the Plan

If the user invoked this right after `writing-plans`, the plan is in `docs/superpowers/plans/`. Find the most recently modified plan file:

```bash
ls -t docs/superpowers/plans/*.md 2>/dev/null | head -1
```

Read it in full. Extract every task with its description and scope.

If no plan file is found, ask the user to paste or point to the plan.

---

## Step 3: Score Each Task

For each task, evaluate three dimensions:

### Scope
- **Narrow** — touches 1–2 files, changes are localized, clear before/after
- **Broad** — touches 3+ files or requires coordinating across modules

### Judgment required
- **None** — the spec completely determines the output; a smart autocomplete could do it
- **Low** — needs to follow existing patterns, minor decisions but no design
- **High** — requires reasoning about trade-offs, domain knowledge, or ambiguous requirements

### Risk profile
- **Low** — reversible, no security/data implications, easy to catch mistakes in review
- **High** — security-sensitive, financial logic, encryption, authentication, compliance, data integrity, or any domain flagged in CLAUDE.md as critical

---

## Step 4: Apply the Decision Matrix

| Scope | Judgment | Risk | Recommended Model |
|-------|----------|------|-------------------|
| Narrow | None | Low | **Ollama** |
| Narrow | Low | Low | **Ollama** |
| Narrow | None | High | **Claude Sonnet** |
| Broad | Low | Low | **Claude Haiku** |
| Broad | Low | High | **Claude Sonnet** |
| Broad | High | Low | **Claude Sonnet** |
| Any | High | High | **Claude Sonnet** or **Claude Opus** |

**Ollama** = local model (e.g., qwen2.5-coder:7b). Fast, free, no token cost.  
**Claude Opus** only when: novel architecture with no clear pattern, highly ambiguous requirements where wrong choices are expensive and hard to reverse, or complex multi-constraint reasoning with no precedent in the codebase.

---

## Step 5: Apply Project-Specific Risk Signals

Using the context from CLAUDE.md, identify categories of work that carry elevated risk in THIS project. These override the matrix upward (never downward).

Examples of what to look for (do not hardcode these — derive them from the actual CLAUDE.md):
- If the project has multi-tenancy → any task touching tenant isolation → minimum Sonnet
- If the project handles payments or financial calculations → domain logic tasks → minimum Sonnet
- If the project has encryption or PII → any crypto or data handling task → minimum Sonnet
- If the project has compliance requirements → audit or reporting tasks → minimum Sonnet
- If the project has strict auth flows → any auth-touching task → minimum Sonnet

If no CLAUDE.md exists or no elevated-risk domains are identified, skip this step.

---

## Step 6: Output the Recommendation Table

Present one row per task. Be specific about WHY. If recommending Claude over Ollama, explain what specifically requires it — don't just say "complex".

---

### Model Recommendations

| # | Task | Model | Why |
|---|------|-------|-----|
| 1 | [task name] | **Ollama** | Single file, complete spec, no judgment needed |
| 2 | [task name] | **Claude Haiku** | Multi-file but mechanical, follows existing patterns |
| 3 | [task name] | **Claude Sonnet** | Touches [security domain]; bugs here are silent and costly |
| 4 | [task name] | **Claude Opus** | Novel architecture with no existing pattern to follow |

**Estimated token savings vs. running everything on Sonnet:** [rough estimate based on task count and complexity]

---

After the table, add a short summary (3–5 sentences): which tasks are safe to delegate locally, which genuinely need Claude, and any ordering considerations (e.g., "complete task 3 on Sonnet first — its output shapes what task 1 needs to implement").

---

## Honest Calibration

If you find yourself recommending Sonnet or Opus for every task, stop and reconsider. A well-specified plan should have at least 30–50% of tasks executable by Ollama or Haiku. If your recommendations skew all-Claude, either the plan has under-specified tasks (the spec should define those more tightly) or you're being overly cautious.

Conversely, do not recommend Ollama for tasks with security, financial, or integrity implications just to save tokens. Getting those wrong is expensive.
