// Client-side JS errors (off unless data-errors or window.__glyphex.errors is set). Capped at 20 per page load.
(function() {
  var c = window.analytics && window.analytics._;
  if (!c || !c.f("errors", "data-errors")) return;
  var sent = 0;
  // Origin and path only, like the link modules: no query string or hash.
  function strip(src) {
    try {
      var u = new URL(src);
      if (!/^https?:$/.test(u.protocol)) return null;
      return (u.origin + u.pathname).slice(0, 2048);
    } catch (e) { return null; }
  }
  function report(message, source, line, col) {
    if (!message || sent >= 20) return;
    sent++;
    c.s(c.m("error", {
      message: String(message).slice(0, 1024),
      source: source ? strip(source) : null,
      line: typeof line === "number" ? line : null,
      col: typeof col === "number" ? col : null
    }));
  }
  window.addEventListener("error", function(e) {
    // Resource-load errors (img/script) carry no message.
    if (e && e.message) report(e.message, e.filename, e.lineno, e.colno);
  });
  window.addEventListener("unhandledrejection", function(e) {
    var r = e && e.reason;
    report("Unhandled promise rejection: " + (r && r.message ? r.message : String(r)));
  });
})();
