# Security Audit — RRULE Configuration Builder

_Date: 2026-06-02 · Scope: all of `src/`, `index.html`, build config, dependencies._

## TL;DR

The application code **cannot inject JavaScript or steal cookies**. It sets no
cookies, has no HTML-injection sinks, and every user input is either rendered as
auto-escaped React text or validated against an allowlist.

**Deployment decision (made):** this will be **bundled into the host's pages at
the same origin** (the host's CSS is controlled by the same team). That choice —
not this code — is what determines whether a hypothetical flaw here could reach
the host's cookies, so the recommendations below are written for it. The app has
been **namespaced** (all CSS scoped under `.rrule-root`, theme on a component-owned
wrapper, storage key `rrule:theme`) so it can't clobber the host page. See
[Deployment model](#the-real-question-deployment-model).

---

## The real question: deployment model

"Can someone inject JS and steal cookies" is answered by _where this runs_, not
by the React code. Two ways "hosted on a larger site" can resolve:

| Model | Isolation | Risk |
|-------|-----------|------|
| **Embedded via `<iframe>` (its own origin)** ✅ recommended | Browser same-origin policy walls it off | The app cannot read the parent's cookies or DOM, and the parent can't read the app's. Any flaw stays contained. |
| **Bundled into the parent's pages (same origin)** ← chosen | None (by design) | This app's JS runs _in the host's origin_ and shares its XSS surface and cookie jar. The host's cookie hygiene (`HttpOnly`, `SameSite`) and CSP — not this app — become the controls that matter. |

**Consequence of the same-origin choice:** there is no browser wall between this
app and the host, so the two protections that matter are (a) this app staying
XSS-clean — verified below — and (b) the **host's** own hardening (CSP, cookie
flags). The same-origin choice was made deliberately because the host CSS is
controlled by the same team; the CSS-leakage risk that comes with it has been
neutralised by namespacing everything under `.rrule-root` (see Recommendation 2).

---

## Findings — what was checked

### No HTML-injection sinks ✅
Grepped the source for `dangerouslySetInnerHTML`, `innerHTML`, `outerHTML`,
`insertAdjacentHTML`, `document.write`, `eval`, `new Function` — **none present.**
All dynamic content (the generated `RRULE` string, `rule.toText()`, computed
occurrences, error messages) is rendered through JSX text interpolation, which
React HTML-escapes by default. There is no path from user input to raw markup.

### No cookies ✅
The app reads/writes no cookies. The only persisted state is the theme name in
`localStorage` under `rrule:theme`. There is nothing cookie-shaped to steal.

### `?theme=` URL parameter is allowlisted ✅
`ThemeSwitcher.tsx` reads `?theme=` and the stored value, then validates against
the known `THEME_IDS` list, falling back to `midnight` on anything else. Even
without that check, the value is only ever written as an _attribute value_
(`data-theme` on the `.rrule-root` wrapper via React), not parsed as HTML — so it
isn't an XSS vector. The allowlist is good defense-in-depth; keep it.

### Numeric / date inputs are parsed, not interpolated ✅
`parseNumberList` keeps only `Number.isInteger` tokens; `parseLocalAsUTC` matches
a strict anchored regex and returns `null` on anything else. Both regexes are
linear (no catastrophic backtracking / ReDoS). `interval` is floored to `1`.

### Browser-hang (DoS) is bounded ✅
`buildRule` caps preview enumeration at `PREVIEW_LIMIT` (12) via the `rule.all()`
callback, so even an infinite or pathological rule can't lock the tab by
enumerating endlessly.

### External link is safe ✅
The footer's `target="_blank"` link carries `rel="noreferrer"`, preventing
reverse-tabnabbing and referrer leakage.

---

## Recommendations

### 1. Content-Security-Policy — on the host's pages, since this is same-origin
With same-origin bundling, this code is served by the **host's** pages, so it's
the **host response headers' CSP** that governs (and protects) it. That CSP is
the single highest-value control against "nobody can inject JS" — and this bundle
needs **no** `'unsafe-inline'`/`'unsafe-eval'` for scripts, so it doesn't force
the host to loosen anything. Keep `script-src` tight:

```
Content-Security-Policy:
  script-src 'self';        # this app needs nothing looser — don't add 'unsafe-inline'/'unsafe-eval' for it
  style-src 'self' 'unsafe-inline';   # the build inlines a tiny CSS loader; tighten with hashes later
  base-uri 'none';
  object-src 'none';
```

Notes:
- `frame-ancestors` / `X-Frame-Options` are **moot for this bundle** (it isn't
  iframed — it's part of the host page). Clickjacking protection, if wanted, is
  the **host page's** concern, set on the host's own responses.
- Do **not** add a `<meta>` CSP to this repo's `index.html`: it's the Vite dev
  harness (`make up`), which injects an inline React-refresh script a meta CSP
  would break. (In same-origin bundling, `index.html`/`dist/` aren't shipped at
  all — the host imports the built JS/CSS.)

### 2. Don't clobber the host — namespacing ✅ DONE
Because this app shares the host's DOM, anything global it touches could collide
with the host. Implemented:
- **CSS scoped under `.rrule-root`.** `:root`/`body`/`*`/`code` and every
  `[data-theme=…]` selector are now `.rrule-root`-prefixed, so no rule leaks onto
  the host page. (Generic class names like `.card`/`.btn` are intentionally left
  un-prefixed — safe here because the host CSS is controlled by the same team and
  won't define colliding rules. If that ever changes, prefix them or switch to a
  Shadow DOM mount.)
- **Theme on a component-owned wrapper**, not `<html>`. `ThemeSwitcher` no longer
  writes `document.documentElement`; App applies `data-theme` to its own
  `.rrule-root` div, so it can't override the host's theming.
- **Storage key namespaced** to `rrule:theme`. (Pre-existing `rrule-theme` values
  are abandoned; users re-pick a theme once.)

### 3. Host-side cookie hygiene (now the real cookie control)
Same-origin means this app's JS _can_ read `document.cookie`. The defense that
actually protects the host's session is on the **host**, not here: serve session
cookies `HttpOnly` (JS can't read them) and `SameSite=Lax`/`Strict`. With
`HttpOnly`, even a future XSS in any same-origin code can't exfiltrate them.

### 4. Dependency advisory — low priority (dev-only)
`npm audit` flags a **moderate** esbuild/Vite issue
([GHSA-67mh-4wv8-2f99](https://github.com/advisories/GHSA-67mh-4wv8-2f99)). It
affects the **dev server only** and does **not** ship in the static `dist/`
bundle you deploy. The fix is a breaking jump to Vite 8 (`npm audit fix
--force`); take it on your own schedule, not as a deploy blocker.

---

## Verdict

For the stated goal — _no JS injection, no cookie theft_ — the code is **sound**,
and it's now namespaced so it can't clobber the host it's bundled into. Since you
chose same-origin, the remaining guarantees live on the **host**: a tight
`script-src 'self'` CSP and `HttpOnly`/`SameSite` session cookies. Everything else
is defense-in-depth.
