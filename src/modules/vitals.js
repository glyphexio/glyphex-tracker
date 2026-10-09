// Core Web Vitals (opt-in via data-vitals or the site setting).
// Metric logic adapted from the Umami tracker (MIT, https://github.com/umami-software/umami):
// CLS session windows, INP as p98 of interactions grouped by interactionId,
// activationStart subtracted for prerendered pages, one sample per SPA route.
(function() {
  var c = window.analytics && window.analytics._;
  if (!c || !c.f("vitals", "data-vitals")) return;
  var m = {}, sent = 0, first = 1, act = 0, cls = 0, win = [], inter = {}, io;
  try { act = performance.getEntriesByType("navigation")[0].activationStart || 0; } catch (e) {}

  function observe(type, cb, opts) {
    try {
      var o = new PerformanceObserver(function(l) { l.getEntries().forEach(cb); });
      var cfg = { type: type, buffered: true };
      for (var k in opts) cfg[k] = opts[k];
      o.observe(cfg);
      return o;
    } catch (e) {}
  }

  observe("largest-contentful-paint", function(e) { m.lcp = Math.max(e.startTime - act, 0); });

  // CLS: shifts <1 s apart in a window of <=5 s; report the worst window.
  observe("layout-shift", function(e) {
    if (e.hadRecentInput) return;
    var f = win[0], l = win[win.length - 1];
    if (l && e.startTime - l.startTime - l.duration < 1000 && e.startTime - f.startTime < 5000) {
      cls += e.value;
      win.push(e);
    } else {
      cls = e.value;
      win = [e];
    }
    if (cls > (m.cls || 0)) m.cls = cls;
  });

  function rec(e) {
    if (e.interactionId && !(e.duration <= inter[e.interactionId])) inter[e.interactionId] = e.duration;
  }
  io = observe("event", rec, { durationThreshold: 40 });

  function r(x) { return x == null ? null : Math.round(x); }

  function flush(path) {
    if (sent) return;
    if (io) io.takeRecords().forEach(rec);
    var v = Object.keys(inter).map(function(k) { return inter[k]; }).sort(function(a, b) { return b - a; });
    if (v.length) m.inp = v[Math.min(Math.floor(Math.max(v.length, 10) * 0.02), v.length - 1)];
    if (first) {
      try {
        m.ttfb = Math.max(performance.getEntriesByType("navigation")[0].responseStart - act, 0);
        performance.getEntriesByType("paint").forEach(function(p) {
          if (p.name === "first-contentful-paint") m.fcp = Math.max(p.startTime - act, 0);
        });
      } catch (e) {}
    }
    if (!Object.keys(m).length) return;
    sent = 1;
    c.s(c.m("vitals", {
      pathname: path || location.pathname,
      lcp: r(m.lcp),
      cls: m.cls == null ? null : Math.round(m.cls * 1000) / 1000,
      inp: r(m.inp),
      ttfb: r(m.ttfb),
      fcp: r(m.fcp)
    }));
  }

  // New SPA route: send the one for the page being left, then start fresh.
  c.l.push(function(path) {
    flush(path);
    first = act = cls = sent = 0;
    m = {};
    win = [];
    inter = {};
  });

  document.addEventListener("visibilitychange", function() {
    if (document.visibilityState === "hidden") flush();
  });
  window.addEventListener("pagehide", function() { flush(); });
})();
