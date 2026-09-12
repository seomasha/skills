---
name: prompt-engineer
description: Use when /prompt-engineer is invoked, or when the user wants to craft, improve, or review a prompt for any LLM or system (Claude, GPT, Gemini, CLAUDE.md, agent skills, commands, etc.)
---

# Prompt Engineer

Full prompt engineering workflow. Works for any prompt type (instruction, system, few-shot, chain-of-thought, role-based) targeting any model or system.

## Phase 1 — Intake

Determine the entry point:

**From a goal** (user wants a prompt drafted from scratch):
Ask these questions — one at a time, only if not already answered:
1. What should the prompt accomplish? What does a successful response look like?
2. What is the target? (Claude API, Claude Code CLAUDE.md/skill/command, GPT, Gemini, other)
3. Any constraints? (tone, length, output format, persona, audience, things to avoid)

**From an existing prompt** (user pastes one):
1. Infer the intent from the prompt's content
2. Confirm your inferred intent: "It looks like this prompt is trying to [X]. Is that right?"
3. Identify the target model/system from context or ask if unclear

Do not ask questions you can infer. Move to Phase 2 once you have intent + target.

## Phase 2 — Analyze & Draft

1. Identify the prompt type: instruction, system, few-shot, chain-of-thought, role-based, or hybrid
2. Identify the target: Claude API, Claude Code (CLAUDE.md / skill / command), GPT, Gemini, other
3. Load `techniques.md` and select the techniques most applicable to this prompt type and target — do not apply all of them
4. Draft (or rewrite) the prompt applying those techniques

Show the draft to the user before moving to Phase 3:
> "Here's the draft. I'll now critique it — want to make any changes first, or should I go straight to the critique?"

## Phase 3 — Critique

Read the draft as the target model would receive it — adversarially. Check for:

- **Ambiguity**: Instructions that could be interpreted multiple ways
- **Underspecification**: Missing context, examples, or constraints the model needs to behave correctly
- **Conflicting instructions**: Rules that contradict each other
- **Jailbreak surface** (system prompts only): Overly broad permissions, easily-bypassed constraints
- **Scope problems**: Too constraining (model can't do useful things) or too permissive (model will go off-script)

List the issues found, then apply all fixes in Phase 4. Do not ask for user approval between Phase 3 and 4 — just fix and deliver.

## Phase 4 — Refine & Output

Apply all Phase 3 findings. Deliver the final output in this exact format:

---

### Final Prompt

```
[The complete, copy-ready prompt. Use a fenced code block so it's easy to copy.]
```

### Rationale

Techniques applied:
- **[Technique name]**: [One sentence — why this technique was chosen for this specific prompt]
- (repeat for each technique applied)

### Test Plan

Scenarios to verify the prompt behaves as intended:

| # | Input / Scenario | Expected behavior |
|---|---|---|
| 1 | [Happy path — most common, straightforward input] | [What a correct response looks like] |
| 2 | [Edge case — empty, very long, or unusual input] | [Expected behavior] |
| 3 | [Adversarial — input designed to make the model go off-script] | [Expected refusal or fallback] |
| 4 | [Boundary test — input at a constraint edge] | [Expected behavior] |
| 5 | [Format stress test — complex input that tests output format] | [Output format holds up] |

---

After delivering the output, ask:
> "Want to iterate on any part of this — the prompt, the rationale, or the test plan?"
```

Then verify the frontmatter is intact:
```bash
head -5 ~/.claude/plugins/local/prompt-engineer/skills/prompt-engineer/SKILL.md
```
Expected: Lines 1-5 start with `---`, `name: prompt-engineer`, `description: Use when...`

Note: ~/.claude is NOT a git repo, skip any git steps.

Reply with:
- **DONE** — file created and verified
- **BLOCKED: [reason]** — if something went wrong
