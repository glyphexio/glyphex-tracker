// Outbound link clicks (http and https only). Sends origin and path, never the query string or hash.
(function() {
  var c = window.analytics && window.analytics._;
  if (!c || !c.f("outbound", "data-outbound", 1)) return;
  document.addEventListener("click", function(e) {
    var a = e.target.closest && e.target.closest("a");
    if (!a || !a.href) return;
    try {
      var u = new URL(a.href);
      if (/^https?:$/.test(u.protocol) && u.hostname.replace(/^www\./, "") !== location.hostname.replace(/^www\./, "")) {
        c.t("Outbound Link", { url: u.origin + u.pathname, hostname: u.hostname }, 1);
      }
    } catch (err) {}
  });
})();
