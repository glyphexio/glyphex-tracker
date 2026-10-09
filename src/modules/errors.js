// Client-side JS errors (opt-in via data-errors or the site setting). Capped at 20 per page load.
(function() {
  var c = window.analytics && window.analytics._;
  if (!c || !c.f("errors", "data-errors")) return;
  var sent = 0;
  function report(message, source, line, col) {
    if (!message || sent >= 20) return;
    sent++;
    c.s(c.m("error", {
      message: String(message).slice(0, 1024),
      source: source ? String(source).slice(0, 2048) : null,
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
