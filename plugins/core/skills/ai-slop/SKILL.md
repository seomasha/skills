---
name: ai-slop
description: Use when the user runs /ai-slop to check whether a website project looks vibe-coded or AI-generated instead of properly engineered (missing 404, privacy policy, robots.txt, OG image, template copy, default purple gradients, leftover placeholders).
disable-model-invocation: true
allowed-tools: Read Glob Grep Bash Write Edit
---

# AI Slop

Audit a website project for everything that separates an engineered site from a prompt-and-deploy one, score it, then offer to generate the missing pieces. All check tables and fix templates live in `checks.md` in this skill's directory; read it before Step 2.

Scope is the shipped website only. Build config, lockfiles, dependency versions, formatting, and code style are out of scope even if broken. Do not report them.

## Step 1: Detect stack

Read `package.json` and the top-level dirs, pick one stack from the detection table in `checks.md`. Note the source root (`src/` or not).

## Step 2: Hygiene scan (scored)

Run every check in the six hygiene tables (Errors, Legal & trust, Metadata, Security & ops, Accessibility, Leftovers). For each check record `pass`, `fail`, or `n/a`, plus the path or `file:line` evidence. Every table row appears in the report; a row is never skipped because it seems unlikely to matter.

Score = weighted pass % over applicable checks, as defined in `checks.md`, rounded to an integer.

## Step 3: Design and copy signals (unscored)

Grep for every pattern in the Design signals and Copy signals tables. Report each signal that has ≥ 1 hit with its count and up to 3 `file:line` locations. Zero-hit signals are omitted. These are never fixed by this skill.

## Step 4: Report

Output exactly this structure, nothing before it:

```
# /ai-slop: <project name>   stack: <stack>   hygiene score: <n>/100

## Hygiene
### Errors
- [pass|FAIL|n/a] Custom 404 — <evidence>
- ...
### Legal & trust
...
### Metadata
...
### Security & ops
...
### Accessibility
...
### Leftovers
...
Score: <passed weight>/<applicable weight>

## Design signals (<n> found)
- <signal>: <count> — file:line, file:line

## Copy signals (<n> found)
- <signal>: <count> — "<sample>" file:line

## Fixable now
1. <check> → <file that will be created/edited>
2. ...
Needs your input first: <site URL, company name, contact email, postal address, language, one-sentence site description, target for each dead CTA; only the ones the chosen fixes need>
Needs a human (not fixable here): <design/copy signals, placeholder copy, and every failed hygiene check that has no row in the Fix templates table>

Apply fixes? all / list numbers / none
```

Then stop and wait for the answer.

## Step 5: Fix

On `all` or a list of numbers: for each chosen item generate the file from the Fix templates table in `checks.md`, in the detected stack's idiom, reusing the project's own layout, header, footer, and fonts so the new page matches the site. Ask for the "needs your input" values in one question before writing anything; a value the user declines to give is left as `{TODO-copy}` (or the link removed, for a CTA) and listed under needs a human. After writing, print the list of files created or edited, and repeat the "needs a human" list so placeholder copy and legal review are not forgotten.

Legal pages are stubs with a `REVIEW: not legal advice` marker at the top. Placeholder copy is replaced with a `{TODO-copy}` marker, never with invented marketing text. Design and copy signals are never touched.

## Common mistakes

| Mistake                                                 | Fix                                                                                    |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Reporting only what is visible in the source files read | Hygiene checks are mostly about files that are _missing_; walk the table, not the repo |
| Grading build config, lockfile, versions, formatting    | Out of scope; the skill judges the shipped site                                        |
| Folding design/copy signals into the score              | Score is hygiene only; signals are listed, unscored                                    |
| Inventing copy, testimonials, or legal text during fix  | Markers only; the human writes those                                                   |
| Fixing before the user answers                          | Report ends with the question; wait                                                    |
