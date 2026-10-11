// Click heatmap (off unless data-heatmap or window.__glyphex.heatmap is set): where visitors click,
// never what. Per click: x in permille of page width, y rounded to 10 px, and a selector (tag, id
// or first two classes). No text, no input values. Clicks are batched (max 50 per page view) and
// sent once when the page is hidden or left.
(function() {
  var c = window.analytics && window.analytics._;
  if (!c || !c.f("heatmap", "data-heatmap")) return;
  var d = document, clicks = [];
  function selector(el) {
    if (!el || el === d.body || el === d.documentElement) return "body";
    if (el.id) return "#" + el.id;
    var cls = el.className && typeof el.className === "string"
      ? "." + el.className.trim().split(/\s+/).slice(0, 2).join(".")
      : "";
    return el.tagName.toLowerCase() + cls;
  }
  d.addEventListener("click", function(e) {
    var w = d.documentElement.scrollWidth;
    if (clicks.length >= 50 || !w || !(e.pageX >= 0) || !(e.pageY >= 0)) return;
    clicks.push({ x: Math.round(e.pageX / w * 1000), y: Math.round(e.pageY / 10) * 10, s: selector(e.target).slice(0, 100) });
  }, true);
  function flush(path) {
    if (!clicks.length) return;
    var w = window.innerWidth, o = {
      clicks: clicks,
      device: w < 768 ? "mobile" : w < 1024 ? "tablet" : "desktop",
      docHeight: Math.round(d.documentElement.scrollHeight / 100) * 100
    };
    if (typeof path === "string") o.pathname = path;
    clicks = [];
    c.s(c.m("heatmap", o));
  }
  d.addEventListener("visibilitychange", function() {
    if (d.visibilityState === "hidden") flush();
  });
  window.addEventListener("pagehide", function() { flush(); });
  c.l.push(flush);
})();
