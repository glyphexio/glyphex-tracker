# Glyphex tracker

The open-source browser script behind [Glyphex](https://glyphex.io) analytics. MIT licensed, cookie-free, and small enough to read in one sitting.

![core](https://img.shields.io/badge/core-1699%20B%20gzip-black) ![all modules](https://img.shields.io/badge/core%20%2B%20all%20modules-3015%20B%20gzip-black)

## Size (minified, gzip -9)

| File | Bytes |
| --- | --- |
| `core.js` (pageviews, events, engagement, SPA navigation) | 1699 |
| `modules/outbound.js` | 221 |
| `modules/downloads.js` | 331 |
| `modules/rage.js` | 399 |
| `modules/errors.js` | 310 |
| `modules/vitals.js` | 824 |
| Core + every module | 3015 |

CI fails if core reaches 2000 bytes gzip. Each site is served core plus only the modules it enabled.

## Install

```html
<script defer src="https://glyphex.io/t/YOUR_SITE_ID.js"></script>
```

Or the plain tag, configured with data attributes:

```html
<script defer data-site-id="YOUR_SITE_ID" src="https://glyphex.io/tracker.js"></script>
```

## What is collected

Every hit is a JSON `POST` to `/api/collect`. These are all the fields the script can send.

Every hit: `siteId`, `pathname`, `hostname`, `timestamp`, plus `tag` (only if you set `data-tag`) and `type` (omitted for pageviews).

Pageview: `title`, `referrer` (first page of a visit only), `screenWidth`, `utm` (source, medium, campaign, term, content, only if present in the URL).

Engagement (once per page, when it is hidden or left): `scrollDepth` (0-100) and `timeOnPage` (visible seconds).

Custom events (`analytics.track`, `data-glyphex-event`): `name` and the `properties` you pass.

Built-in events, sent as custom events (on by default for new sites):

- Outbound Link: `url`, `hostname`
- File Download: `url`, `filename`, `extension`

Opt-in:

- Rage Click: `selector` (tag, id or first two classes), `x`, `y`
- Not-found hit (`data-404`): `pathname` (with query unless `data-exclude-search`), `referrer`
- Errors (`data-errors`, max 20 per page load): `message`, `source`, `line`, `col`
- Vitals (`data-vitals`): `lcp`, `cls`, `inp`, `ttfb`, `fcp`

Nothing else leaves the browser. Hash fragments are never sent.

## What is not collected

- No cookies, no cookie-like storage, no persistent client ID. The only storage access is one read of `localStorage.glyphex_ignore`; set it to `"true"` to exclude your own browser.
- No IP address is stored. The server receives it with the request, uses it for a country and city lookup, and derives a visitor hash from site id, IP, user agent and a salt that rotates daily. The hash cannot be linked across days or across sites. This part runs server side and is not in this repo.
- No canvas, font or audio fingerprinting. The script reads none of those APIs.
- No keystrokes, form values, page text or session recordings.
- Do Not Track and Global Privacy Control are binding: the script sends nothing.

## Options

Set as `data-*` attributes on the script tag, or as camelCase keys on `window.__glyphex`.

| Attribute | Effect |
| --- | --- |
| `data-site-id` | Required for the plain tag. |
| `data-domains="a.com,www.a.com"` | Send only when `location.hostname` is in the list (exact match, case-insensitive). |
| `data-exclude-search="true"` | Strip query strings from recorded referrers and 404 URLs. |
| `data-exclude-hash="true"` | Accepted for Umami compatibility. Hashes are never recorded anyway. |
| `data-auto-track="false"` | No automatic pageviews, SPA tracking or 404 hits. Use `analytics.pageview()`. |
| `data-tag="variant-b"` | Label (max 50 chars) attached to every hit. |
| `data-api="https://host/api/collect"` | Send to a different collect endpoint. |
| `data-before-send="fnName"` | Name of a `window` function `(type, payload)`. Return falsy to drop the hit, or an object to replace it. |
| `data-errors="true"` | Enable the errors module. |
| `data-vitals="true"` | Enable the vitals module. |
| `data-404="true"` | Record a not-found hit on this page. |

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
