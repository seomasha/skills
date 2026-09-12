# ai-slop reference tables

## Stack detection

Read `package.json` deps and top-level dirs. First match wins.

| Stack        | Signal                                                 |
| ------------ | ------------------------------------------------------ |
| `next-app`   | `next` dep + `app/` (or `src/app/`) dir                |
| `next-pages` | `next` dep + `pages/` (or `src/pages/`) dir, no `app/` |
| `astro`      | `astro` dep                                            |
| `sveltekit`  | `@sveltejs/kit` dep                                    |
| `vite-spa`   | `vite` dep, no framework above (React/Vue/Svelte SPA)  |
| `static`     | no `package.json`, or only `*.html` at root            |
| `generic`    | none of the above; search every column                 |

## Hygiene checks (scored)

`Weight`: 3 = a visitor or crawler hits it directly; 2 = trust/discoverability; 1 = polish. Score = sum(weight of passed) / sum(weight of applicable) × 100. `n/a` cells mean the check does not apply to that stack.

### Errors

| Check            | W   | next-app                                 | next-pages                           | astro                 | sveltekit                  | vite-spa                                   | static     |
| ---------------- | --- | ---------------------------------------- | ------------------------------------ | --------------------- | -------------------------- | ------------------------------------------ | ---------- |
| Custom 404       | 3   | `app/not-found.tsx`                      | `pages/404.tsx`                      | `src/pages/404.astro` | `src/routes/+error.svelte` | catch-all route (`path="*"` / `[...slug]`) | `404.html` |
| Custom error/500 | 2   | `app/error.tsx` + `app/global-error.tsx` | `pages/500.tsx` + `pages/_error.tsx` | n/a                   | `src/error.html`           | React `ErrorBoundary` in root              | n/a        |

### Legal & trust

Search routes/pages for a path or filename matching (case-insensitive) the name. Any stack.

| Check          | W   | Match                                                                                                                                             |
| -------------- | --- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Privacy policy | 3   | `privacy`, `privacy-policy`, `datenschutz`                                                                                                        |
| Terms          | 2   | `terms`, `tos`, `terms-of-service`, `agb`                                                                                                         |
| Contact        | 2   | `contact`, `kontakt` route, or a real email (plain text or `mailto:`, domain not `example.com/.org/.net`), phone, or postal address in the footer |
| About          | 1   | `about`, `team`, `impressum`                                                                                                                      |
| Cookie consent | 1   | only if analytics/tracking script present; look for `consent`, `cookie` component                                                                 |

### Metadata

| Check                 | W   | next-app                                                                                                                                            | next-pages                                       | astro / sveltekit / vite-spa / static                                                                                |
| --------------------- | --- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| robots.txt            | 3   | `app/robots.ts` or `public/robots.txt`                                                                                                              | `public/robots.txt`                              | `public/robots.txt` (static: `robots.txt`)                                                                           |
| sitemap               | 2   | `app/sitemap.ts` or `public/sitemap.xml` or `next-sitemap` dep                                                                                      | same                                             | `@astrojs/sitemap` dep, `public/sitemap.xml`, or `sitemap.xml`                                                       |
| Non-default favicon   | 2   | `app/icon.*`, `app/favicon.ico`, or `public/favicon.ico` exists, `file` reports image data, and it is not the create-next-app default (25931 bytes) | `public/favicon.ico` same rule                   | `public/favicon.*` is image data and not the scaffold default (`vite.svg`, Astro/Svelte `favicon.svg`/`favicon.png`) |
| Web manifest          | 1   | `app/manifest.ts` or `public/site.webmanifest`                                                                                                      | `public/site.webmanifest` / `manifest.json`      | same                                                                                                                 |
| Apple touch icon      | 1   | `app/apple-icon.*` or `public/apple-touch-icon.png`                                                                                                 | `public/apple-touch-icon.png`                    | same                                                                                                                 |
| OG image + tags       | 2   | `openGraph` in `metadata` export, or `app/opengraph-image.*`                                                                                        | `og:image` meta in `_app`/`_document`/`next-seo` | `og:image` meta in layout/head                                                                                       |
| Unique title per page | 2   | `metadata.title` (or `generateMetadata`) in ≥ 2 routes, none equal to `Create Next App`                                                             | `<Head><title>` in ≥ 2 pages                     | `<title>` per page, not identical                                                                                    |
| Meta description      | 2   | `metadata.description` not `Generated by create next app`                                                                                           | `<meta name="description">`                      | same                                                                                                                 |
| Canonical URL         | 1   | `alternates.canonical` or `metadataBase`                                                                                                            | `<link rel="canonical">`                         | same                                                                                                                 |
| Structured data       | 1   | any `application/ld+json`                                                                                                                           | same                                             | same                                                                                                                 |
| `lang` on `<html>`    | 1   | `app/layout.tsx` has `<html lang=`                                                                                                                  | `_document.tsx`                                  | root html                                                                                                            |

### Security & ops

| Check                | W   | Where                                                                                                                        |
| -------------------- | --- | ---------------------------------------------------------------------------------------------------------------------------- |
| security.txt         | 1   | `public/.well-known/security.txt` (static: `.well-known/security.txt`)                                                       |
| Security headers     | 2   | `headers()` in `next.config.*`, `vercel.json` `headers`, `_headers` (Netlify/CF), `hooks.server.ts`                          |
| No secrets in client | 3   | grep `NEXT_PUBLIC_`/`VITE_`/`PUBLIC_` values that look like secret keys (`sk_`, `secret`, `private`); `.env*` not gitignored |
| Error tracking       | 1   | `@sentry/*`, `posthog`, `bugsnag`, `highlight.run` dep                                                                       |
| Analytics            | 1   | `@vercel/analytics`, `plausible`, `umami`, `gtag`, `posthog`                                                                 |
| Rate limiting on API | 1   | only if `app/api/**` or `pages/api/**` exists: `@upstash/ratelimit`, `rate-limit`, or middleware check                       |

### Accessibility

| Check                                 | W   | Grep                                                                                                                                                |
| ------------------------------------- | --- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Images have alt                       | 2   | `<img` / `<Image` without `alt=`, or `alt=""` without `aria-hidden` / `role="presentation"` (that combination is the only accepted decorative form) |
| Buttons/links have text or aria-label | 2   | `<button>` / `<a>` whose only child is an icon component and no `aria-label`                                                                        |
| Skip link                             | 1   | `href="#main"` / `skip to content`                                                                                                                  |
| Reduced motion                        | 1   | `prefers-reduced-motion` or `motion-safe:`/`motion-reduce:` if any animation classes present                                                        |
| Heading order                         | 1   | no `h3` without a preceding `h2` in the same file                                                                                                   |

### Leftovers

Any hit fails the check. Grep source (exclude `node_modules`, `.next`, `dist`, lockfiles).

| Check                | W   | Pattern                                                                                                                                                             |
| -------------------- | --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Placeholder text     | 3   | `lorem ipsum`, `\[Your `, `Your Company`, `example\.(com                                                                                                            | org                                              | net)`, `as an AI`, `TODO: replace` |
| Dead links           | 3   | `href="#"`, `href=""`, `mailto:example`, `tel:123`                                                                                                                  |
| Empty/broken images  | 2   | `src=""`, `src="#"`, `placeholder\.(com                                                                                                                             | co)`, `via\.placeholder`, `unsplash\.com/random` |
| Builder fingerprints | 2   | `lovable`, `bolt\.new`, `v0\.dev`, `base44`, `replit\.app`, `Made with`, `Built with v0`                                                                            |
| Framework defaults   | 2   | `Vite \+ React`, `next.svg`, `vercel.svg`, `Welcome to SvelteKit`, `Astro Basics` still referenced (scaffold title/description are scored under Metadata, not here) |
| Debug debris         | 1   | `console\.log(` outside tests/scripts, `debugger`                                                                                                                   |

## Design signals (unscored)

Use `rg` (ripgrep) with `-P` for `\b`/`\w` patterns, or `perl -ne`; BSD `grep -E` lacks both and is not UTF-8 safe for `—` and emoji. Grep `*.tsx *.jsx *.vue *.svelte *.astro *.html *.css *.scss`. Report count + up to 3 file:line per signal.

| Signal                      | Pattern                                                                                                                           |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Inter/Geist as only font    | `Inter\|Geist` imported and no other font family defined                                                                          |
| Indigo→violet gradient      | `from-indigo-\|to-purple-\|to-violet-\|#6366F1\|#8B5CF6\|#7C3AED`, `bg-gradient-to-r` with two purples                            |
| Gradient text               | `bg-clip-text text-transparent`                                                                                                   |
| Glow / glassmorphism        | `backdrop-blur`, `shadow-[color]-500/`, `blur-3xl`, `glow`                                                                        |
| Badge above H1              | `rounded-full` pill immediately before `<h1`                                                                                      |
| Left/top accent stripe      | `border-l-4\|border-t-4` on a card                                                                                                |
| Icon-topped identical cards | 3+ siblings with same class string each containing an icon component + `<h3`; one `.map` template over 3+ items counts as one hit |
| Emoji as icons              | `[✨🚀⚡🎯💡🔥]` in JSX text                                                                                                      |
| All-caps labels             | `uppercase tracking-wid`                                                                                                          |
| Pulsing dot                 | `animate-pulse` on a `rounded-full`                                                                                               |
| Marquee                     | `marquee`, `animate-scroll`, `animate-marquee`                                                                                    |
| Nested cards                | `rounded-*` + `border` element directly inside another                                                                            |
| Dark-mode only              | `bg-slate-950\|bg-gray-950\|bg-zinc-950` on body/main with no light variant                                                       |

## Copy signals (unscored)

Grep `*.tsx *.jsx *.mdx *.md *.astro *.svelte *.vue *.html *.json` (content files). Report count + samples.

| Signal               | Pattern                                                                                                                                                    |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Em-dash density      | count `—` in source; words = source with tags, JSX expressions and class strings stripped (approximate is fine); flag if > 1 per 100 words                 |
| Buzzwords            | `seamless\|effortless\|elevate\|unlock\|empower\|supercharge\|world-class\|all-in-one\|leverage\|synergy\|cutting-edge\|game-chang\|next-gen\|revolutioni` |
| Triads               | `\b\w+\. \w+\. \w+\.` e.g. `Fast. Simple. Secure.`                                                                                                         |
| Forced contrast      | `Not a \w+\. A \w+\.`                                                                                                                                      |
| Generic headline     | `future of \w+\|without limits\|built for teams\|your all-in-one`                                                                                          |
| Generic testimonials | `(Sarah                                                                                                                                                    | John | Emily | Michael | Jessica | David) (Johnson | Smith | Davis | Chen | Williams)`, `CEO at \w+Corp` |
| Sentence-case-averse | headline ending with `—` clause                                                                                                                            |

## Fix templates

Only hygiene checks have fixes. Generate in the stack's idiom. Use the project's existing layout/components (import the real header/footer if one exists) so the file matches the site. Placeholders in `{braces}` must be filled from `package.json` name, the detected domain (`metadataBase`, `vercel.json`, `.env` `NEXT_PUBLIC_SITE_URL`) or asked from the user. Markers: `{TODO-copy}` is written as a string literal in JSX/Svelte/Vue templates (`{"{TODO-copy}"}`) and as plain text elsewhere. Legal stubs start with `REVIEW: not legal advice` in a comment in the file's own syntax (`//` for TS/JS, `<!-- -->` for HTML/Astro/Svelte) and are listed as "needs human review" in the final summary.

| Check            | next-app                                                                                                                                                                                                                                                                                                                            | next-pages                                          | astro                        | sveltekit                         | vite-spa                                  | static                     |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- | ---------------------------- | --------------------------------- | ----------------------------------------- | -------------------------- |
| 404              | `app/not-found.tsx`: site layout, "Page not found", link home, link to 2–3 top nav items                                                                                                                                                                                                                                            | `pages/404.tsx` same                                | `src/pages/404.astro`        | `src/routes/+error.svelte`        | catch-all `<Route path="*">` → `NotFound` | `404.html`                 |
| Error            | `app/error.tsx` + `app/global-error.tsx` (both `'use client'`, `reset()` button)                                                                                                                                                                                                                                                    | `pages/500.tsx`                                     | skip                         | `src/error.html`                  | `ErrorBoundary` wrapper                   | skip                       |
| robots           | `app/robots.ts` (`rules: { userAgent: '*', allow: '/' }, sitemap: '{url}/sitemap.xml'`)                                                                                                                                                                                                                                             | `public/robots.txt`                                 | `public/robots.txt`          | same                              | same                                      | `robots.txt`               |
| sitemap          | `app/sitemap.ts` listing static routes found under `app/**/page.tsx`                                                                                                                                                                                                                                                                | `public/sitemap.xml` from `pages/`                  | add `@astrojs/sitemap`       | `public/sitemap.xml`              | same                                      | same                       |
| manifest         | `app/manifest.ts` (name, short_name, icons from existing icon files)                                                                                                                                                                                                                                                                | `public/site.webmanifest` + `<link rel="manifest">` | same                         | same                              | same                                      | same                       |
| security.txt     | `public/.well-known/security.txt`: `Contact: mailto:{email}`, `Expires: {+1y}`                                                                                                                                                                                                                                                      | same                                                | same                         | same                              | same                                      | `.well-known/security.txt` |
| OG / metadata    | extend root `metadata`: `metadataBase`, `title.template`, `description` (user-supplied), `openGraph { title, description, url, siteName }`, `twitter { card: 'summary_large_image' }`; add `app/opengraph-image.tsx` (ImageResponse, site name on brand colour; do not also set `openGraph.images`, the file convention injects it) | `next-seo` `DefaultSeo` in `_app`                   | `<meta>` in `BaseHead.astro` | `<svelte:head>` in root layout    | `index.html` `<head>`                     | `<head>`                   |
| lang             | `<html lang="{lang}">`                                                                                                                                                                                                                                                                                                              | `_document.tsx`                                     | `<html lang>`                | `app.html`                        | `index.html`                              | each html                  |
| Security headers | `headers()` in `next.config.*`: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`, `Strict-Transport-Security: max-age=63072000; includeSubDomains`                                                    | same                                                | `vercel.json` / `_headers`   | `hooks.server.ts`                 | `vercel.json` / `_headers`                | `_headers`                 |
| Privacy / Terms  | `app/privacy/page.tsx`: what we collect, why, retention, third parties, your rights, contact. `app/terms/page.tsx`: acceptance, permitted use, liability, changes, contact. Site layout, REVIEW marker, `{TODO-copy}` bodies                                                                                                        | `pages/privacy.tsx` etc.                            | `src/pages/privacy.astro`    | `src/routes/privacy/+page.svelte` | route + component                         | `privacy.html`             |
| Contact          | add real `mailto:` + address block to footer; ask user for the values                                                                                                                                                                                                                                                               | same                                                | same                         | same                              | same                                      | same                       |
| Leftovers        | `href="#"`: use the CTA target from the input question, or remove the link and list it under needs a human; `src=""`/placeholder images: remove the element and list it; delete `console.log`/`debugger`; replace placeholder copy with `{TODO-copy}` and list it (never invent marketing copy)                                     | same                                                | same                         | same                              | same                                      | same                       |
| Skip link        | first child of `<body>` in the root layout: `<a href="#main" class="sr-only focus:not-sr-only">Skip to content</a>`; `id="main"` on `<main>` wherever it lives (layout or page)                                                                                                                                                     | same                                                | same                         | same                              | same                                      | same                       |
