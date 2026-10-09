// Glyphex tracker core. Opt-in modules live in tracker/modules and attach via window.analytics._.
// The declarative-events click handler and the beforeSend hook are adapted from the
// Umami tracker (MIT, https://github.com/umami-software/umami).
(function() {
  "use strict";

  var location = window.location;
  var document = window.document;
  var script = document.currentScript;

  // Per-site config baked into /t/:id.js (window.__glyphex). Old inline tags
  // fall back to data-* attributes on the script tag.
  var G = window.__glyphex || {};
  function flagOn(name, attr) {
    if (G[name] != null) return !!G[name];
    return !!(script && script.hasAttribute(attr));
  }

  if (document.visibilityState === "prerender" || location.protocol === "file:") return;

  // localStorage opt-out: localStorage.setItem("glyphex_ignore", "true")
  try {
    if (localStorage.getItem("glyphex_ignore") === "true") return;
  } catch (e) {}

  // Do Not Track and Global Privacy Control are binding: no tracking at all.
  try {
    var dnt = navigator.doNotTrack || window.doNotTrack || navigator.msDoNotTrack;
    if (dnt === "1" || dnt === "yes" || navigator.globalPrivacyControl === true) return;
  } catch (e) {}

  var siteId = G.siteId || (script && script.getAttribute("data-site-id"));
  if (!siteId) {
    console.warn("Glyphex: data-site-id attribute is required");
    return;
  }

  var baseUrl = (script && script.getAttribute("data-api")) ||
    (script && script.src ? new URL(script.src).origin : location.origin) + "/api/collect";

  // beforeSend(type, payload): falsy drops the hit, an object replaces the payload.
  // Set data-before-send="fnName" or window.__glyphex.beforeSend (name or function).
  var beforeSend = G.beforeSend || (script && script.getAttribute("data-before-send"));

  // Base payload plus extras. Pageviews carry no type (the collect endpoint's default).
  function msg(type, props) {
    var d = { siteId: siteId, pathname: location.pathname, hostname: location.hostname, timestamp: Date.now() };
    if (type) d.type = type;
    for (var k in props) d[k] = props[k];
    return d;
  }

  // text/plain avoids a CORS preflight.
  function send(d) {
    var fn = typeof beforeSend === "string" ? window[beforeSend] : beforeSend;
    var r = d;
    if (typeof fn === "function") {
      try { r = fn(d.type || "pageview", d); } catch (e) {}
    }
    if (!r) return;
    if (typeof r === "object") d = r;
    var payload = JSON.stringify(d);
    if (navigator.sendBeacon && navigator.sendBeacon(baseUrl, payload)) return;
    fetch(baseUrl, { method: "POST", body: payload, headers: { "Content-Type": "text/plain" }, keepalive: true }).catch(function() {});
  }

  function trackEvent(name, properties) {
    if (name) send(msg("event", { name: name, properties: properties || null }));
  }

  // Record a hit on the not-found page: broken URL (path + query, or explicit) plus referrer.
  function trackNotFound(url) {
    send(msg("notfound", { pathname: url || (location.pathname + location.search), referrer: document.referrer || null }));
  }

  var currentPathname, maxScrollDepth, visibleSince, engagedTime, engagementSent;
  var isFirstCollect = true;
  var navTimer;
  var leaveHooks = []; // modules register fn(oldPathname), run synchronously on SPA navigation

  // Start measuring a fresh page.
  function reset() {
    currentPathname = location.pathname;
    maxScrollDepth = 0;
    visibleSince = Date.now();
    engagedTime = 0;
    engagementSent = false;
  }

  function pageview() {
    var utm = {}, has = 0, params = new URLSearchParams(location.search);
    ["source", "medium", "campaign", "term", "content"].forEach(function(k) {
      var v = params.get("utm_" + k);
      if (v) { utm[k] = v; has = 1; }
    });
    send(msg(0, {
      title: document.title || null,
      referrer: isFirstCollect ? (document.referrer || null) : null,
      screenWidth: window.screen.width,
      utm: has ? utm : null
    }));
    isFirstCollect = false;
  }

  window.addEventListener("scroll", function() {
    var h = document.documentElement.scrollHeight - window.innerHeight;
    if (h > 0) {
      var d = Math.round(((window.pageYOffset || document.documentElement.scrollTop) / h) * 100);
      maxScrollDepth = Math.max(maxScrollDepth, Math.min(d, 100));
    }
  }, { passive: true });

  // Engagement counts visible time only. Sends at most once per page.
  function sendEngagement() {
    if (engagementSent) return;
    engagedTime += Date.now() - visibleSince;
    visibleSince = Date.now();
    var t = Math.round(engagedTime / 1000);
    if (t < 1) return;
    engagementSent = true;
    send(msg("engagement", { pathname: currentPathname, scrollDepth: maxScrollDepth, timeOnPage: t }));
  }

  document.addEventListener("visibilitychange", function() {
    if (document.visibilityState === "hidden") sendEngagement();
    else visibleSince = Date.now();
  });
  window.addEventListener("pagehide", sendEngagement);

  // SPA navigation: only a pathname change counts. The previous page is flushed
  // synchronously; the new pageview waits 300 ms so document.title is the new page's.
  function onNav() {
    if (location.pathname === currentPathname) return;
    sendEngagement();
    for (var i = 0; i < leaveHooks.length; i++) leaveHooks[i](currentPathname);
    reset();
    clearTimeout(navTimer);
    navTimer = setTimeout(pageview, 300);
  }
  ["pushState", "replaceState"].forEach(function(m) {
    var orig = history[m];
    history[m] = function() {
      var r = orig.apply(this, arguments);
      onNav();
      return r;
    };
  });
  window.addEventListener("popstate", onNav);

  // Declarative events: data-glyphex-event="Name" plus data-glyphex-event-<prop>="value".
  // sendBeacon survives navigation, so links need no preventDefault or waiting.
  document.addEventListener("click", function(e) {
    var el = e.target.closest && e.target.closest("[data-glyphex-event]");
    if (!el) return;
    var props = {}, attrs = el.attributes;
    for (var i = 0; i < attrs.length; i++) {
      if (attrs[i].name.indexOf("data-glyphex-event-") === 0) props[attrs[i].name.slice(19)] = attrs[i].value;
    }
    trackEvent(el.getAttribute("data-glyphex-event"), props);
  }, true);

  // identify/group/setUserProperties/reset/getAttribution were removed with product
  // analytics but stay as no-ops so existing callers never throw.
  var api = window.analytics = { track: trackEvent, trackNotFound: trackNotFound };
  "getAttribution identify group setUserProperties reset".split(" ").forEach(function(n) {
    api[n] = function() {};
  });
  // Internal handle for modules.
  api._ = { s: send, m: msg, t: trackEvent, f: flagOn, l: leaveHooks };

  reset();
  pageview();
  if (flagOn("notFound", "data-404")) trackNotFound();
})();
