# RRULE Configuration Builder

A React + TypeScript demo of a configuration screen that exposes (nearly) the
entire [RFC 5545](https://datatracker.ietf.org/doc/html/rfc5545#section-3.3.10)
recurrence-rule surface, with a live preview of the generated `RRULE` string,
its human-readable form, and the next occurrences.

Built on [`rrule`](https://github.com/jkbrzt/rrule), Vite, and plain CSS.

## Run it

```bash
make up          # install deps (first run) + start dev server → http://localhost:5180
make down        # stop the background dev server
make status      # is it running?
make logs        # follow the dev server log
make restart     # down + up
make build       # type-check + production build
make preview     # serve the production build
make clean       # stop server, remove dist/ and caches
```

`make up` runs Vite in the background and tracks its PID in `.vite.pid`. Override
the port with `make up PORT=3000`. (Default is 5180 to avoid a common 5173 clash.)

Prefer raw npm? `npm install && npm run dev` still works.

## Deploying

This is a **fully static, client-side app** — there is no backend. All RRULE
parsing, text generation, and occurrence computation run in the browser via the
[`rrule`](https://github.com/jkbrzt/rrule) library. `make build` (or `npm run
build`) emits a self-contained `dist/` you can host anywhere:

```
dist/
  index.html
  assets/index-*.css
  assets/index-*.js
```

Upload that folder to any static host — Netlify, Vercel, Cloudflare Pages,
GitHub Pages, an S3 bucket behind CloudFront, etc. There's nothing to run
server-side and no environment variables to set.

### Base path (subpath hosting)

By default the build uses absolute asset paths (`/assets/…`), which assume the
app is served from a **domain root**:

- ✅ Works as-is: `example.com/`, `app.example.com/`, GitHub Pages **user/org**
  page (`username.github.io/`), Netlify/Vercel/Cloudflare default URLs.
- ⚠️ Needs a `base`: any **subpath**, most commonly a GitHub Pages **project**
  page like `username.github.io/rrule/`. Without it the `/assets/…` URLs 404.

To deploy under a subpath, set `base` in `vite.config.ts` to match (include the
leading and trailing slash) and rebuild:

```ts
export default defineConfig({
  base: '/rrule/',   // '/' (default) for root hosting
  plugins: [react()],
})
```

### Host-specific notes

- **Netlify / Vercel / Cloudflare Pages** — point the build command at
  `npm run build` and the publish/output directory at `dist`. No `base` change
  needed (they serve from the root).
- **GitHub Pages (project page)** — set `base: '/<repo>/'` as above, then push
  the contents of `dist/` to a `gh-pages` branch (or use an Actions workflow).
- **Plain static host / S3** — just copy `dist/` up. For clean URLs, configure
  the host to fall back to `index.html`.

Locally, `make preview` serves the built `dist/` so you can sanity-check the
production bundle before shipping.

## What it covers

| RRULE part | Control |
|------------|---------|
| `FREQ` | Frequency dropdown (yearly → secondly) |
| `INTERVAL` | "Every N" number input |
| `DTSTART` | datetime-local picker |
| `WKST` | Week-start dropdown |
| `COUNT` / `UNTIL` | Mutually-exclusive "Ends" radio group |
| `BYDAY` | Weekday toggles **plus** ordinal entries ("1st Monday", "last Friday") |
| `BYMONTH` | Month toggles |
| `BYMONTHDAY` | Comma list (supports negatives) |
| `BYYEARDAY` | Comma list |
| `BYWEEKNO` | Comma list (yearly) |
| `BYHOUR` / `BYMINUTE` / `BYSECOND` | Comma lists |
| `BYSETPOS` | Comma list (nth of the matched set) |

Preset buttons load example rules (every-other-Friday, last weekday of the
month, US Thanksgiving, quarterly, twice-daily-until, …) to show how the parts
combine.

## Themes

A theme dropdown in the top-right corner switches between nine looks, grouped
into dark and light:

- **Dark** — Midnight (default), Nord, Terminal (monospace console), Glass (frosted gradient)
- **Light** — Paper (editorial), Soft (rounded), Sepia (warm reading), Brutalist, High contrast

The choice persists in `localStorage`, and you can link a specific look with a
`?theme=` param (e.g. `?theme=terminal`). Themes are pure CSS: `index.css`
exposes structural variables (fonts, radius, borders, shadow, density) that each
`[data-theme]` block in `themes.css` overrides. Adding one is a new block there
plus an entry in `ThemeSwitcher.tsx` — no other component changes.

## A note on timezones

`rrule` operates on a date's **UTC** components. To keep the builder behaving
like a floating wall-clock — *what you type is what the preview shows* — every
date is anchored at its UTC components (`buildRule.ts` → `parseLocalAsUTC`) and
occurrences are formatted back with `timeZone: 'UTC'`. For a real app that must
honor a specific zone, you'd attach a `tzid` and convert accordingly.

## Layout

```
src/
  App.tsx                 composition + builder state
  presets.ts              example rules
  rrule/
    types.ts              BuilderState + option tables
    buildRule.ts          state → RRule, string/text/occurrences, date handling
  components/
    controls.tsx          Field, ToggleGroup, NumberListInput
    WeekdayPicker.tsx     BYDAY (plain + ordinal)
    Preview.tsx           string / text / occurrences / errors
    ThemeSwitcher.tsx     data-theme picker (localStorage + ?theme= param)
  index.css               base layout + structural CSS variables
  themes.css              [data-theme] overrides (Nord, Paper, Glass, …)
```
