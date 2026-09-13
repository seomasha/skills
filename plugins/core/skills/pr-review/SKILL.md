---
name: pr-review
description: Use when the user asks to review a GitHub pull request — "/pr-review", "/pr-review 42", "review PR 42", "review this PR", "re-review", "check if they addressed the comments" — including follow-up runs on a PR already reviewed.
---

# PR Review

One pass that finds everything worth saying, verifies each claim by reading code, and posts only what is real. A second run on the same PR checks whether prior findings were actually fixed. Never drip-feed: a finding that could have been raised on run 1 must not first appear on run 2.

Runs from inside the repo checkout. Never switches branches, never modifies the working tree, never posts without the user's go-ahead. All subagents run on Opus.

## 1. Setup

```bash
N=${ARG:-$(gh pr view --json number -q .number)}     # arg (number or URL) or current branch's PR
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
ME=$(gh api user -q .login)
gh pr view "$N" --json state,isDraft,author,title,body,baseRefName,headRefOid,commits,reviews
git fetch -q origin "pull/$N/head"                   # read files with: git show FETCH_HEAD:path
gh pr diff "$N"
gh api "repos/$REPO/pulls/$N/comments"               # inline threads incl. replies
```

**Guards** — stop with a one-line reason if: state is MERGED/CLOSED; author is a bot (dependabot, renovate, `[bot]` suffix); a review by `$ME` containing `<!-- pr-review:v1 -->` exists and no commit is newer than it. Draft → review, say "draft" in the header.

**Prior run** — a review by `$ME` with the marker means re-review mode (§6). Extract its findings: the inline comments it created, each thread's replies, and whether the thread is resolved.

**Other reviewers** — unresolved inline threads by anyone else are also "already raised": no duplicate inline comment. A verified finding matches a thread when it has the same root cause, not merely the same lines; a different claim on the same lines is posted inline. Matches go in the summary under `Already raised by @login:` and still count toward the verdict.

**Draft** — reviewed and postable like any other PR; the post prompt is where the user decides.

**Spec** — the PR body. Empty or boilerplate-only → spec axis is skipped silently.

**Conventions** — root `CLAUDE.md` plus any `CLAUDE.md` in directories the diff touches; `CONTRIBUTING.md`/`CODING_STANDARDS.md` if present.

## 2. Specialists (5 in parallel)

Each gets: the full diff, commit list, PR body, the instruction to read callers/callees via `git show FETCH_HEAD:path` and `grep` on the checkout, and in re-review mode the prior findings list marked **already raised — do not re-raise, including won't-fix ones**. Each returns candidate findings in the finding format (§4), no prose around them, empty list allowed.

| Agent | Brief |
|---|---|
| bugs | Wrong behaviour on concrete input/state, in anything that runs: source, scripts, `package.json` commands, config. Read every caller of changed functions. Includes trust boundaries: unvalidated input, auth checks, secrets in logs. |
| spec | PR body vs diff: asked-for behaviour missing/partial, implemented behaviour that looks wrong, unrequested scope. Quote the body line. Skipped when no spec. |
| overbuilt | What to delete: reinvented stdlib/platform, abstraction with one implementation, config nobody sets, speculative flexibility. Replacement named. |
| silent | Swallowed errors, catch-and-continue, fallbacks that hide failure, missing surfacing of a failure the user needs to see. |
| conventions | Diff vs the CLAUDE.md/standards files. Only rules those files state explicitly; only lines the diff changed. |

Out of scope for every agent — do not report: merge conflicts or base drift, anything a linter/typechecker/compiler/CI catches, pre-existing issues on unchanged lines, missing tests, naming or formatting taste, praise.

## 3. Verify, sweep, synthesize

**Dedupe first** — two candidates with the same file range and the same root cause are one candidate; keep the more concrete write-up.

**Verifiers** — one subagent per remaining candidate, in parallel, each seeing only its own finding plus the diff. Brief: "Reproduce the failure path by reading the code (`git show FETCH_HEAD:path`, grep callers). Running an existing targeted test is allowed; building the project is not. Return REAL with the concrete input → wrong result trace, or DROP with the reason. Do not assign severity." Anything not REAL is dropped — no scores, no 'probably'.

**Sweep** — one subagent with the full diff, PR body, the list of REAL findings, and other reviewers' unresolved threads as leads. Brief: "These are already found. Read the whole diff and callers looking only for what is missing: a bug, spec gap, silent failure or over-engineering not in this list. Return new candidates only." New candidates go through verifiers.

**Synthesizer** — one subagent with all REAL findings. Merge same-root-cause findings, assign severity, pick the verdict, order by severity then file. A REAL finding that fits neither tier is dropped here with a reason. Returns the final list, the verdict, and its drops.

## 4. Finding format

```
<file>:<line-range> · blocking|should-fix
<claim — one line>
<why — at most three lines: concrete input/state → wrong result>
<fix — at most four lines of prose, or a ```suggestion block>
```

- `suggestion` block only when the replacement is ≤5 lines and confined to the commented range. A deletion is prose (`Delete L52-57.`), never an empty block.
- One fix per finding. If the fix needs a list of line ranges, the finding is too big: split it or name the principle and the first site.

- `blocking` — wrong behaviour, data loss/corruption, security, spec violation.
- `should-fix` — real and concrete, but the PR is merge-safe without it. Includes silent failures and over-engineering.
- No third tier. Something that wouldn't change what the code does or how it fails is not a finding.

## 5. Terminal, then post

Print, in this order:

1. Header: `PR #N — <title>` (+ `draft` / `re-review` when true).
2. Findings, numbered, in finding format.
3. Verdict — exactly one: `Ready to merge` (no findings) · `Merge after fixes` (only should-fix) · `Needs changes` (any blocking).
4. `Dropped:` one line per verifier or synthesizer drop — claim + reason. Omit the section if none.
5. Ask: `Post to GitHub? (all / except <numbers> / no)`. Wait.

Post as one review so it lands atomically:

```bash
gh api "repos/$REPO/pulls/$N/reviews" -X POST --input review.json
```

```json
{"commit_id":"<headRefOid>","event":"COMMENT",
 "body":"<!-- pr-review:v1 -->\n**Verdict: Needs changes**\n\n1. `src/x.ts:41` blocking — <claim>\n2. …",
 "comments":[{"path":"src/x.ts","line":41,"side":"RIGHT","body":"**blocking** — <claim>\n\n<why>\n\n<fix>"},
             {"path":"src/y.ts","start_line":52,"start_side":"RIGHT","line":57,"side":"RIGHT","body":"…"}]}
```

Multi-line findings anchor with `start_line`+`line`. The review body is the summary: marker, verdict, one line per posted finding, then `Already raised by @login:` lines if any. `Ready to merge` posts the review with body only.

## 6. Re-review

Run §2–§3 on the full current diff (not just new commits). Then, for each prior finding, a verifier checks the current code:

| State | Action |
|---|---|
| Fixed correctly | Reply in thread `Fixed in <sha>.` and resolve the thread (GraphQL below). |
| Partially fixed / fixed wrong | Reply in thread with what is still wrong. Leave open. Counts toward verdict. |
| Untouched | No thread reply. Listed in the summary under `Still open:`. Counts toward verdict. |
| Author replied won't-fix with reasoning that holds on the code | Reply `Agreed.` Leave thread open, does not count toward verdict. |
| Author replied won't-fix but the failure path still stands | Reply with the concrete trace. Leave open. Counts. |

Only resolve a thread when the verifier traced the fix. Uncertain → leave open.

```bash
# reply in thread
gh api "repos/$REPO/pulls/$N/comments/<comment_id>/replies" -f body='…'
# thread ids + resolve
gh api graphql -F o="${REPO%/*}" -F r="${REPO#*/}" -F n="$N" -f query='query($o:String!,$r:String!,$n:Int!){repository(owner:$o,name:$r){pullRequest(number:$n){reviewThreads(first:100){nodes{id isResolved comments(first:1){nodes{databaseId}}}}}}}'
gh api graphql -F id='<thread node id>' -f query='mutation($id:ID!){resolveReviewThread(input:{threadId:$id}){thread{isResolved}}}'
```

New findings on re-review are posted as a new review (same marker) with the summary listing `Fixed:` / `Still open:` / new findings, and the verdict computed over open + new.

## Common mistakes

| Mistake | Instead |
|---|---|
| One agent reviews and vouches for itself | Verifier per finding; the reviewer never grades its own claim. |
| "Minor / nits" or "What's good" sections | Two severities, no praise. Delete anything that changes nothing. |
| Merge conflicts, CI, lint, missing tests as findings | Out of scope. Tooling and the author handle those. |
| Re-review looks only at new commits | Full diff again; old-vs-new interactions are where second bugs live. |
| Resolving a thread because the author said "done" | Resolve only on a traced fix. |
| Posting straight away | Terminal first, then ask. The user trims before it goes out. |
