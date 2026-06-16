# TODO

Follow-ups from the security audit (see `SECURITY.md`). The app code is XSS-safe
and build-verified. **Decision made:** the app is bundled into the host's pages
at the **same origin** (host CSS controlled by the same team).

## Done

- [x] **Decide the embedding model** → same-origin bundle.
- [x] **Namespace the app so it can't clobber the host.** All CSS scoped under
      `.rrule-root`; theme applied to a component-owned wrapper instead of
      `<html>`; `localStorage` key changed to `rrule:theme`. (Old `rrule-theme`
      values are abandoned — re-pick a theme once.)

## Before shipping

- [ ] **Tighten the host pages' CSP.** Since this is served by the host's pages,
      the host's response-header CSP governs it. This bundle needs **no**
      `'unsafe-inline'`/`'unsafe-eval'` for scripts, so keep `script-src 'self'`.
      See the policy in `SECURITY.md` §1. _(host ops config — not this repo)_

- [ ] **Confirm host session cookies are `HttpOnly` + `SameSite`.** Same-origin
      means any same-origin JS can read non-`HttpOnly` cookies; `HttpOnly` is what
      actually protects the session. _(host config — not this repo)_

## Optional / not on the critical path

- [ ] **If host CSS later stops being trusted**, prefix the generic class names
      (`.card`, `.btn`, …) under `.rrule-root` too, or switch to a Shadow DOM
      mount for full bidirectional isolation. Not needed while the host CSS is
      controlled by the same team.

- [ ] **Dependency advisory (dev-only).** `npm audit` flags a moderate
      esbuild/Vite issue (GHSA-67mh-4wv8-2f99) that affects the dev server only
      and does **not** ship in the built JS/CSS. Fix is a breaking jump to Vite 8
      (`npm audit fix --force`); take it on your own schedule.

## No longer applicable

- ~~Swap the CSP `frame-ancestors` placeholder~~ — moot: the bundle isn't iframed,
  so `frame-ancestors`/`X-Frame-Options` don't apply to it. Clickjacking
  protection, if wanted, is the host page's concern.
