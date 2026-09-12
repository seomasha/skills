---
name: qa
description: Use when asked to QA, smoke-test, click through, or exercise a product/web app end-to-end like a real user in the browser — "/qa", "/qa <url>", "/qa <flow>", "test it like a user", "find bugs in the app". Not for unit/integration tests or code review.
---

# QA — test like a real user

Drive the product through the Chrome extension (`mcp__claude-in-chrome__*`) exactly as a first-time user would, and write `QA-REPORT.md`. Verdicts come from what the browser shows, never from reading source.

## 1. Target

- `/qa <url>` → use it. `/qa <flow>` → scope to that flow, same base URL rules.
- No URL: find a running dev server (`lsof -iTCP -sTCP:LISTEN -P | grep -E 'node|python|ruby|go'`), else start the project's dev script, else ask.
- Load tools in one `ToolSearch`: `tabs_context_mcp, tabs_create_mcp, tabs_close_mcp, navigate, computer, read_page, find, form_input, read_console_messages, read_network_requests, browser_batch`. New tab for this session.
- Call `read_network_requests` once *before* the first navigate — recording only starts on first call, so page-load 404s are missed otherwise.

## 2. Inventory

List every flow before testing any. Sources, in order: what the UI exposes (nav, buttons, forms, links), then README / route list if in a repo. Reading source to *find* features is fine; reading source to *decide if something works* is not.

## 3. Exercise every flow

For each flow, in this order:

| Probe | What to do |
|---|---|
| Happy path | Do what the UI invites, with realistic data |
| Empty | Submit with nothing filled |
| Invalid | Wrong format, too long, script tags, unicode |
| Repeat | Double-click submit, resubmit same data |
| Navigation | Back, refresh, deep-link to the page directly, leave and return — does state survive? |
| Links | Click every link once; 404s and dead buttons count |

After each flow: `read_console_messages` (errors/warnings) and `read_network_requests` (4xx/5xx, missing requests where one was expected). Element refs go stale after any navigate/reload — re-run `read_page`/`find` before clicking again.

Evidence per bug: the console/network line, or a screenshot when the failure is visual. Screenshots land in a temp dir — copy them to `qa-screens/` next to the report.

Double-submit is a bug only when it causes a duplicate side effect the user did not intend (two orders, two emails); two clicks on "Add to cart" adding two items is correct.

Stop and ask before: logging in with real credentials, paying, sending email/messages, or anything that reaches a third-party service with real data. Use obviously fake data (`qa+test@example.com`) elsewhere.

## 4. Report

Write `QA-REPORT.md` in the project root (scratchpad if no project). Overwrite. Shape:

```markdown
# QA report — <url> — <date>

| # | Severity | Bug |
|---|---|---|
| 1 | blocker / major / minor / cosmetic | one line |

## Bugs
### 1. <title>  (severity)
- Repro: numbered steps
- Expected:
- Actual:
- Evidence: console/network line or `qa-screens/<name>.jpg`

## Tested
bullet per flow, with outcome

## Not tested
bullet per gap (viewport sizes, auth roles, browsers, backend, …) and why
```

Severity: **blocker** = user cannot complete a core task; **major** = wrong result or data loss; **minor** = works with friction; **cosmetic** = visual only.

End your reply with the bug table and the report path. Do not fix bugs — report them.

## Red flags

- "It probably works" — you didn't click it. Click it.
- Marking a flow passed without checking console + network.
- Reading a handler to conclude the button works.
- Report with no "Not tested" section.
