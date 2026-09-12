---
name: ai-workflow-analyzer
description: Use when the user runs /ai-workflow-analyzer to check whether their Claude Code setup (MCPs, agents, skills, hooks, CLAUDE.md, rules, plugins) is redundant, duplicated, mis-scoped, or under-used for the current project.
disable-model-invocation: true
allowed-tools: Read Glob Grep Bash
---

# AI Workflow Analyzer

Inventory every Claude Code extension visible from the current project, then report what is redundant, duplicated, mis-scoped, or worth enabling. Report only. Never edit config.

## Step 1: Inventory

Collect from both scopes. Record `name`, `scope` (user/project/plugin), `path`, and a one-line purpose (from frontmatter `description` or first heading).

| Kind | User scope | Project scope |
|------|-----------|---------------|
| Skills | `~/.claude/skills/*/SKILL.md`, `~/.claude/commands/*.md` | `.claude/skills/*/SKILL.md`, `.claude/commands/*.md` |
| Agents | `~/.claude/agents/*.md` | `.claude/agents/*.md` |
| Hooks | `~/.claude/settings.json` → `hooks` | `.claude/settings.json`, `.claude/settings.local.json` → `hooks` |
| CLAUDE.md | `~/.claude/CLAUDE.md` | `./CLAUDE.md`, `./**/CLAUDE.md`, `.claude/CLAUDE.md` |
| Rules | — | `.claude/rules/*.md` |
| MCPs | `~/.claude.json` → `mcpServers` and `projects[<cwd>].mcpServers` | `.mcp.json` |
| Plugins | `~/.claude/settings.json` → `enabledPlugins` (true/false) | `.claude/settings.json` → `enabledPlugins` |

Plugin contents: `~/.claude/plugins/installed_plugins.json` gives `installPath`; list `<installPath>/skills/*/SKILL.md`, `agents/*.md`, `hooks/`, `.mcp.json`.

## Step 1b: Usage

Skills: `~/.claude.json` → `skillUsage` has `{ "<name>": { usageCount, lastUsedAt } }` (plugin skills keyed `plugin:skill`, epoch ms). A skill absent from the map has never been invoked.

```bash
python3 -c "import json,datetime;u=json.load(open('$HOME/.claude.json'))['skillUsage'];[print(k,v['usageCount'],datetime.date.fromtimestamp(v['lastUsedAt']/1000)) for k,v in sorted(u.items())]"
```

Agents and MCP servers are not tracked there — grep session transcripts and take the newest matching file's mtime as last-used:

```bash
cd ~/.claude/projects
# agents          grep -l '"subagent_type":"NAME"' */*.jsonl
# mcp servers     grep -l '"name":"mcp__SERVER__' */*.jsonl
# last used       ... | xargs ls -t | head -1 | xargs stat -f '%Sm'
```

Hooks, CLAUDE.md, and rules leave no usage trace — never classify them as unused; judge by relevance only.

Thresholds: 0 matches = **never used**; last use > 90 days = **stale**.

## Step 2: Understand the project

Read `./CLAUDE.md`, `package.json` / `pyproject.toml` / `Cargo.toml` / `go.mod`, and top-level dirs. Note stack, hosting (Vercel/Cloudflare/Supabase/etc.), and tooling (git hosting, issue tracker, test framework). This is the ground truth for "relevant to this project".

## Step 3: Classify

For every item decide exactly one:

- **Redundant** — irrelevant to this project's stack (e.g. Supabase plugin in a project with no Supabase).
- **Duplicate** — overlaps another item's workflow. Compare descriptions + trigger phrases; same verb + same object = duplicate (e.g. two "grill" skills, `tdd` vs `superpowers:test-driven-development`, a user hook and a plugin hook doing the same thing). Name the pair and pick which to keep.
- **Mis-scoped** — user-scoped but only this project uses it → should be project-scoped; project-scoped but stack-agnostic → should be user-scoped.
- **Enable** — installed but disabled plugin, or disabled MCP, that matches the project's stack.
- **Remove** — never used or stale (Step 1b) AND not relevant to any project the user has (`~/.claude.json` → `projects` keys show them all). Never used but relevant → list under Unused instead, not Remove.
- **Keep** — relevant, unique, correctly scoped. Do not list these.

Scoping rule: project-agnostic process (writing, planning, review, wiki) → user. Stack/tool-specific (framework, hosting, DB, tracker) → project or plugin toggled per project.

## Step 4: Report

Output only this, nothing else:

```
## Redundant for this project
- <name> (<scope>, <kind>) — why

## Duplicates
- <A> vs <B> — overlap; keep <X> because <reason>

## Mis-scoped
- <name>: <current scope> → <suggested scope> — why

## Enable for this project
- <plugin/mcp> — why it fits

## Unused / stale
- <name> (<scope>, <kind>) — never used | last used <date>

## Safe to remove
- <name> (<scope>, <kind>) — <path> — never used | last used <date>; no project needs it

## Suggested settings
enabledPlugins: { ... }   # only entries that change
```

Empty section → write "none". Do not apply changes; the user decides.
