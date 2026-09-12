# skills

My Claude Code marketplace. Only skills I wrote live here. Everything else is pulled from its own source (see [Third-party](#third-party)).

## Install

```
/plugin marketplace add seomasha/skills
/plugin install core@smasetic          # always on
/plugin install linear@smasetic        # per project — enable in <repo>/.claude/settings.json
```

Update: `/plugin update` (or `/plugin marketplace update smasetic`).

## Plugins

| Plugin   | Skills                                                                                                                                                                                                                                                                                                                      | Scope                  |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| `core`   | `/ai-workflow-analyzer` audit MCPs/skills/hooks/plugins for redundancy, duplicates, scope, unused · `/ai-slop` score a website for vibe-coded tells (missing 404/privacy/robots/OG, placeholder copy, purple gradients) and generate the missing files · `/model-advisor` cheapest model per plan task · `/prompt-engineer` · `/qa` click through a running app in Chrome like a first-time user, write QA-REPORT.md with severity-ranked bugs | user                   |
| `linear` | `/ship-ticket` Linear ticket → branch → plan → parallel subagents → CI → PR → Linear update                                                                                                                                                                                                                                 | project (needs Linear) |

## Third-party

Not vendored here — each has its own updater.

| Source                                                                                                                       | Installed via                         | Update                 |
| ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | ---------------------- |
| [superpowers](https://github.com/obra/superpowers), [ponytail](https://github.com/DietrichGebert/ponytail), official plugins | `/plugin`                             | `/plugin update`       |
| [mattpocock/skills](https://github.com/mattpocock/skills) → `~/.agents/skills`, symlinked into `~/.claude/skills`            | `npx skills add mattpocock/skills -g` | `npx skills update -g` |
| [claude-obsidian](https://github.com/AgriciDaniel/claude-obsidian) wiki skills → `~/obsidian/skills`, symlinked              | `git pull` in the vault               | same                   |

Reproducing the whole setup on a new machine = `~/.claude/settings.json` (`extraKnownMarketplaces` + `enabledPlugins`) and `~/.agents/.skill-lock.json`.

## How the sets fit together

**superpowers is the spine.** It auto-triggers; don't call it.
brainstorming → writing-plans → subagent-driven-development → verification-before-completion → finishing-a-development-branch. Bugs → systematic-debugging. Isolation → using-git-worktrees.

**Matt Pocock's are tools you call by name** for what superpowers doesn't do:

| When                                                   | Skill                                                                            |
| ------------------------------------------------------ | -------------------------------------------------------------------------------- |
| Idea is fuzzy, want it torn apart first                | `/grill-me` (`/grill-with-docs` to also write ADRs + glossary)                   |
| Answer must come from someone else                     | `to-questionnaire`                                                               |
| Work belongs in Linear/GitHub issues, not a plan file  | `to-spec`, `to-tickets`, `triage` (run `setup-matt-pocock-skills` once per repo) |
| Bigger than one session                                | `wayfinder`                                                                      |
| "Where does the seam go / is this module deep enough"  | `codebase-design`, `domain-modeling`, `improve-codebase-architecture`            |
| Review a branch against repo standards + original spec | `code-review`                                                                    |
| Human-only steps (dashboards, secrets)                 | `wizard`                                                                         |
| Prose                                                  | `writing-fragments` → `writing-beats` → `writing-shape`                          |
| After a session                                        | `retro`                                                                          |
| Not sure which                                         | `ask-matt`                                                                       |

Typical chain: `/grill-me` → `to-tickets` → per ticket `/ship-ticket` (superpowers runs inside) → `code-review` → `retro`.

**Dropped as duplicates of superpowers:** `tdd`, `diagnosing-bugs`, `implement`, `implement-spec`, `writing-for-agents`.

**Ponytail** sits on top of all of it: lazy-senior-dev mode, always on via hook.
