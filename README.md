# Glyphex tracker

The tracking script behind [Glyphex](https://glyphex.io), the cookieless analytics tool. MIT licensed. Read exactly what runs on your visitors' browsers.

## What it collects

- Page path, page title, referrer, UTM parameters, screen width
- Custom events you send yourself
- Time on page and scroll depth
- Hits on your 404 page, when you call `trackNotFound()`
- Optional modules, only when you turn them on: outbound links, file downloads, rage clicks, JavaScript errors, Core Web Vitals

## What it never does

- No cookies, no localStorage identifiers, no fingerprinting in the browser
- No tracking when Do Not Track or Global Privacy Control is on
- No tracking when `localStorage.glyphex_ignore = "true"` (use it to exclude yourself)

Visitor counting happens on the server: a daily-rotating hash of IP, user agent and site, so a visitor can't be followed across days or across sites. Raw IPs are never stored.

## Size (gzip -9)

| Part | Bytes |
| --- | --- |
| Core | 1484 |
| Outbound links | 221 |
| File downloads | 331 |
| Rage clicks | 399 |
| JS errors | 310 |
| Web Vitals | 824 |

The per-site script (`/t/<site-id>.js`) ships the core plus only the modules you enable.

## Usage

```html
<script defer src="https://glyphex.io/t/YOUR_SITE_ID.js"></script>
```

```js
window.analytics.track("Signup", { plan: "lite" });
```

```html
<button data-glyphex-event="Signup" data-glyphex-event-plan="lite">Sign up</button>
```

Redact or drop hits before they leave the browser:

```html
<script defer src="https://glyphex.io/t/YOUR_SITE_ID.js" data-before-send="redact"></script>
<script>
  function redact(type, payload) {
    if (payload.pathname) payload.pathname = payload.pathname.replace(/\/users\/[^/]+/, "/users/:id");
    return payload; // return false to drop the hit
  }
</script>
```

Full docs: https://glyphex.io/docs/script

## Build

```sh
npm install
npm run build   # writes dist/ and dist/sizes.json
```

## Credits

Some parts are adapted from [Umami](https://github.com/umami-software/umami) (MIT). See `NOTICE`.
