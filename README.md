# Glyphex tracker

The open-source browser script behind [Glyphex](https://glyphex.io) analytics. MIT licensed, cookie-free, and small enough to read in one sitting.

![core](https://img.shields.io/badge/core-1743%20B%20gzip-black) ![all modules](https://img.shields.io/badge/core%20%2B%20all%20modules-3406%20B%20gzip-black)

## Size (minified, gzip -9)

| File | Bytes |
| --- | --- |
| `core.js` (pageviews, events, engagement, SPA navigation) | 1743 |
| `modules/outbound.js` | 273 |
| `modules/downloads.js` | 381 |
| `modules/rage.js` | 414 |
| `modules/errors.js` | 379 |
| `modules/vitals.js` | 824 |
| `modules/heatmap.js` | 531 |
| Core + every module | 3406 |

CI fails if core reaches 2000 bytes gzip.

## Install

```html
<script defer src="https://glyphex.io/t/YOUR_SITE_ID.js"></script>
```

Or the plain tag, configured with data attributes. It bundles core and every module:

```html
<script defer data-site-id="YOUR_SITE_ID" src="https://glyphex.io/tracker.js"></script>
```

## npm (not yet published)

The `npm/` folder is the `@glyphex/tracker` package. It is a small loader, not a copy of the script: `init()` adds a `<script defer>` for `https://glyphex.io/t/YOUR_SITE_ID.js`, so your per-site settings still apply. `track()`, `pageview()` and `trackNotFound()` can be called before the script has loaded; calls are queued and run once it does. Calls made where there is no `window` (server-side rendering) are dropped, not queued. The package is ESM only and includes TypeScript types.

```js
import { init, track } from "@glyphex/tracker";

init({ siteId: "YOUR_SITE_ID" });
track("Signup", { plan: "pro" });
```

`init` options: `siteId` (required), `host` (default `https://glyphex.io`), `autoTrack`, `excludeSearch`, `tag`, `beforeSend`. `init` does nothing on the server.

## What is collected

Every hit is a JSON `POST` to `/api/collect`. These are all the fields the script can send.

Every hit: `siteId`, `pathname`, `hostname`, `timestamp`, plus `tag` (only if you set `data-tag`) and `type` (omitted for pageviews).

Pageview: `title`, `referrer` (first page of a visit only), `screenWidth`, `utm` (source, medium, campaign, term, content, only if present in the URL).

Engagement (once per page, when it is hidden or left): `scrollDepth` (0-100) and `timeOnPage` (visible seconds).

Custom events (`analytics.track`, `data-glyphex-event`): `name` and the `properties` you pass.

Built-in events, sent as custom events (on by default):

- Outbound Link (`http:` and `https:` links to another host; never `mailto:`, `tel:` or `javascript:`): `url` (origin and path only, no query string or hash), `hostname`
- File Download (`http:` and `https:` links to common file types such as pdf, zip, docx): `url` (origin and path only), `filename` (from the path), `extension`
- Rage Click (3 clicks within 800 ms and 30 px): `selector` (tag, id or first two classes), `x`, `y`

Off unless you enable them:

- Not-found hit (`data-404`, sent on page load): `pathname` (with query unless `data-exclude-search`), `referrer`
- Errors (`data-errors`, max 20 per page load): `message`, `source` (origin and path only, no query string or hash), `line`, `col`
- Vitals (`data-vitals`): `lcp`, `cls`, `inp`, `ttfb`, `fcp`
- Heatmap (`data-heatmap`, one hit per page view when it is hidden or left, max 50 clicks): `clicks` (each `x` as permille of page width, `y` in px rounded to 10, `s` selector as tag, id or first two classes), `device` (`mobile` under 768 px, `tablet` under 1024 px, else `desktop`), `docHeight` (rounded to 100 px). No element text, no input values

Nothing else leaves the browser. Hash fragments are never sent.

## What is not collected

- No cookies, no cookie-like storage, no persistent client ID. The only storage access is one read of `localStorage.glyphex_ignore`; set it to `"true"` to exclude your own browser.
- No IP address is stored. The server receives it with the request, uses it for a country and city lookup, and derives a visitor hash from site id, IP, user agent and a salt that rotates daily. The hash cannot be linked across days or across sites. This part runs server side and is not in this repo.
- No canvas, font or audio fingerprinting. The script reads none of those APIs.
- No keystrokes, form values, page text or session recordings.
- Do Not Track and Global Privacy Control are binding: the script sends nothing.

## Options

Set as `data-*` attributes on the script tag, or as camelCase keys on `window.__glyphex` (for example `data-exclude-search` is `excludeSearch`, `data-api` is `api`, `data-404` is `notFound`).

| Attribute | Effect |
| --- | --- |
| `data-site-id` | Required for the plain tag. |
| `data-domains="a.com,www.a.com"` | Send only when `location.hostname` is in the list (exact match, case-insensitive). |
| `data-exclude-search="true"` | Strip query strings from recorded referrers and 404 URLs. |
| `data-exclude-hash="true"` | Accepted for Umami compatibility. Hashes are never recorded anyway. |
| `data-auto-track="false"` | No automatic pageviews, SPA tracking or 404 hits. Use `analytics.pageview()`. |
| `data-tag="variant-b"` | Label (max 50 chars) attached to every hit. |
| `data-api="https://host/api/collect"` | Send to a different collect endpoint (`api` key). |
| `data-before-send="fnName"` | Name of a `window` function `(type, payload)` (`beforeSend` key: a name or a function). Return falsy to drop the hit, or an object to replace it. |

### Modules and flags

The plain `tracker.js` tag bundles core and every module. `outbound`, `downloads` and `rage` are on unless you turn them off; `errors`, `vitals` and `heatmap` are off until you turn them on. A flag is the `data-<name>` attribute or the `window.__glyphex.<name>` key, and the key wins if both are set. `"false"` and `"0"` (or a `false` or `0` key) mean off; any other value, including a bare `data-errors`, means on.

| Flag | Default | Notes |
| --- | --- | --- |
| `data-outbound` / `outbound` | on | `data-outbound="false"` turns it off. |
| `data-downloads` / `downloads` | on | `data-downloads="false"` turns it off. |
| `data-rage` / `rage` | on | `data-rage="false"` turns it off. |
| `data-errors` / `errors` | off | `data-errors="true"` turns it on. |
| `data-vitals` / `vitals` | off | `data-vitals="true"` turns it on. |
| `data-heatmap` / `heatmap` | off | `data-heatmap="true"` turns it on. |
| `data-404` / `notFound` | off | Core, not a module. `data-404="true"` records a not-found hit on this page. |

The per-site tag `/t/YOUR_SITE_ID.js` serves core plus only the modules enabled in your site settings, with your settings baked in as `window.__glyphex`, so you do not need the attributes there.

Declarative events: `data-glyphex-event="Signup"` plus `data-glyphex-event-plan="pro"` on any element.

JS API: `analytics.track(name, props)`, `analytics.pageview(path)`, `analytics.trackNotFound(url)`.

## Verify what runs on your site

`https://glyphex.io/t/YOUR_SITE_ID.js` is one line `window.__glyphex={...};` (your settings), then the minified `core.js`, then each enabled module, joined by newlines. The minifier settings below are the ones the build uses (terser 5.49.0). Build `core.js` yourself and check the served file contains it:

```sh
npm i terser@5.49.0
curl -s https://glyphex.io/t/YOUR_SITE_ID.js > served.js
node -e '
const { minify } = require("terser");
const fs = require("fs");
minify(fs.readFileSync("src/core.js", "utf8"), {
  ecma: 2017,
  compress: { passes: 3, pure_getters: true, ecma: 2017 },
  mangle: { toplevel: true },
  format: { comments: false },
}).then((r) => console.log(fs.readFileSync("served.js", "utf8").includes(r.code) ? "core matches" : "MISMATCH"));
'
```

Repeat with each `src/modules/<name>.js` you have enabled. A different terser version can produce different bytes; if you see a mismatch, check the version first, or just read `src/core.js` (about 200 lines).

## License and credit

MIT, see [LICENSE](LICENSE) and [NOTICE](NOTICE). Parts of the declarative events handler, the `beforeSend` hook and the Core Web Vitals logic are adapted from the [Umami](https://github.com/umami-software/umami) tracker (MIT, Copyright Umami Software, Inc.). Umami is credited in the source headers.
