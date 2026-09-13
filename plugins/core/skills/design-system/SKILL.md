---
name: design-system
description: Use when the user wants a design-system.md documenting a company's website look, feel, UX and motion (e.g. "/design-system Apple", "extract Stripe's design tokens", "document how Linear's site feels").
---

# Design System Extraction

Produce `./design-system.md` for `$ARGUMENTS` (company name or URL) from **measured** values, not memory. Every color, font and duration in the output must come from the browser extraction or a cited source.

## Steps

1. **Resolve URL.** If not given, WebSearch `"<company> official website"`. Load Chrome tools (`claude-in-chrome` skill), `tabs_context_mcp`, then `tabs_create_mcp`.
2. **Extract tokens** on the homepage + 2 more pages (a product/detail page, and one with forms or a menu open): `navigate`, wait for load, then `javascript_tool` with the contents of `references/extract-tokens.js` (stores result on `window.__ds`), then read it in slices per the comment at the top of that file — tool output truncates around 1.5KB. Save each slice to the scratchpad.
3. **Observe motion & layout.** `computer` screenshots of: hero, nav opened, mid-scroll, a hovered button/link. Note what moves, how (fade/slide/scale), and roughly how long. Read `transitionDuration`/`TimingFunction` from the JSON for exact numbers.
4. **Research principles.** WebSearch `"<company> design system"`, `"<company> brand guidelines"`, `"<company> UX principles"`. Prefer the company's own docs (HIG, design.* subdomain, brand site). Cite URLs.
5. **Write `./design-system.md`** using the template below. Close the tabs you opened.

## Output template

```markdown
# <Company> Design System
Sources: <urls>  ·  Extracted: <date>

## Philosophy
3-5 sentences: what the site optimises for (clarity, density, delight…), tone of voice, how it guides the user.

## Colors
| Role | Value | Where used |
Primary, background(s), text (primary/secondary), accent, borders, states. Hex or rgb from extraction, with usage frequency.

## Typography
Families (with fallbacks). Scale table: role → size / line-height / weight / letter-spacing (from `headings` + `fontSize` data).

## Spacing & Layout
Base unit, common spacing steps, max content width, grid/columns, breakpoints.

## Shape & Depth
Border radii, shadows, borders.

## Motion
Durations, easings (exact `cubic-bezier`s), what animates (scroll reveals, hover, nav, page transitions) and the rule behind it.

## Components
Nav, buttons (primary/secondary + hover), cards, inputs, footer: sizes, colors, states.

## UX Flow & Navigation
How pages link, funnel to CTA, menu structure, scroll behaviour, how content is progressively revealed.

## Accessibility
Contrast observed, focus styles, reduced-motion handling.

## Do / Don't
Bullets a designer or dev can apply when reproducing the feel.
```

## Rules

- No placeholders. A section with no measured data says "not observed" and why.
- Dedupe near-identical colors (e.g. `rgb(29,29,31)` vs `#1d1d1f`) into one row.
- Hover-gated menus often won't open via `hover`; try once, then write "not captured" and move on.
- Ignore third-party embeds (cookie banners, chat widgets) when reading the token JSON.
- If Chrome is unavailable, stop and tell the user — do not fall back to guessed values.
