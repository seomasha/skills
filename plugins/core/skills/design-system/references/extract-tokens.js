// Run in-page via javascript_tool. Stores tokens on window.__ds (most frequent first) and returns the key list.
// javascript_tool output truncates ~1.5KB, so read slices afterwards:
//   JSON.stringify([__ds.color, __ds.backgroundColor])   JSON.stringify([__ds.fontFamily, __ds.fontSize, __ds.headings])   etc.
(() => {
  const count = (m, k) => { if (k && k !== 'none' && k !== 'normal' && k !== '0s' && k !== 'rgba(0, 0, 0, 0)') m.set(k, (m.get(k) || 0) + 1); };
  const top = (m, n = 10) => [...m].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => `${k} (${v})`);
  const maps = {}; const keys = ['color','backgroundColor','fontFamily','fontSize','fontWeight','lineHeight','letterSpacing',
    'borderRadius','boxShadow','transitionDuration','transitionTimingFunction','transitionProperty','animationDuration','animationTimingFunction',
    'paddingTop','marginTop','gap','maxWidth'];
  keys.forEach(k => maps[k] = new Map());
  const els = [...document.querySelectorAll('body *')].slice(0, 4000);
  for (const el of els) {
    const cs = getComputedStyle(el);
    for (const k of keys) count(maps[k], cs[k]);
  }
  const out = {}; for (const k of keys) out[k] = top(maps[k]);
  // CSS custom properties on :root (design tokens if the site exposes them)
  const vars = {}; const rootCS = getComputedStyle(document.documentElement);
  for (const ss of document.styleSheets) { try {
    for (const r of ss.cssRules) {
      if (r.selectorText === ':root' || r.selectorText === 'html') for (const p of r.style) if (p.startsWith('--')) vars[p] = rootCS.getPropertyValue(p).trim();
      if (r.media) count(out.breakpoints ||= new Map(), r.media.mediaText);
    }
  } catch (e) {} }
  out.cssVars = Object.fromEntries(Object.entries(vars).slice(0, 40));
  out.breakpoints = out.breakpoints ? top(out.breakpoints, 12) : [];
  out.headings = ['h1','h2','h3','p','a','button'].map(t => { const e = document.querySelector(t); if (!e) return null; const c = getComputedStyle(e);
    return `${t}: ${c.fontFamily.split(',')[0]} ${c.fontSize}/${c.lineHeight} w${c.fontWeight} ls${c.letterSpacing} color ${c.color}`; }).filter(Boolean);
  window.__ds = out; return Object.keys(out).join(', ');
})();
