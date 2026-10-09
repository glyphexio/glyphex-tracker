// Rage click detection: 3 clicks within 800 ms and 30 px.
(function() {
  var c = window.analytics && window.analytics._;
  if (!c) return;
  var clicks = [], cooldown = 0;
  function selector(el) {
    if (!el || el === document.body || el === document.documentElement) return "body";
    if (el.id) return "#" + el.id;
    var cls = el.className && typeof el.className === "string"
      ? "." + el.className.trim().split(/\s+/).slice(0, 2).join(".")
      : "";
    return el.tagName.toLowerCase() + cls;
  }
  document.addEventListener("click", function(e) {
    var now = Date.now(), x = e.clientX, y = e.clientY;
    clicks = clicks.filter(function(k) { return now - k.t < 800; });
    clicks.push({ x: x, y: y, t: now });
    if (clicks.length < 3) return;
    var near = clicks.filter(function(k) { return Math.abs(k.x - x) < 30 && Math.abs(k.y - y) < 30; });
    if (near.length >= 3 && now - cooldown > 2000) {
      cooldown = now;
      clicks = [];
      c.t("Rage Click", { selector: selector(e.target), x: x, y: y });
    }
  });
})();
