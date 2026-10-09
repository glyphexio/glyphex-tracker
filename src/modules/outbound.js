// Outbound link clicks.
(function() {
  var c = window.analytics && window.analytics._;
  if (!c) return;
  document.addEventListener("click", function(e) {
    var a = e.target.closest && e.target.closest("a");
    if (!a || !a.href) return;
    try {
      var host = new URL(a.href).hostname.replace(/^www\./, "");
      if (host !== location.hostname.replace(/^www\./, "")) {
        c.t("Outbound Link", { url: a.href, hostname: new URL(a.href).hostname });
      }
    } catch (err) {}
  });
})();
