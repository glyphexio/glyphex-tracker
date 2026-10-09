// @glyphex/tracker: load the Glyphex script from your bundle and call it safely
// before it has finished loading. The script itself is served by glyphex.io so
// your per-site settings (modules, tag, options) still apply.
var queue = [];

function api() {
  return typeof window !== "undefined" ? window.analytics : undefined;
}

function flush() {
  var a = api();
  if (!a) return;
  while (queue.length) {
    var c = queue.shift();
    if (typeof a[c[0]] === "function") a[c[0]].apply(a, c[1]);
  }
}

function call(name, args) {
  var a = api();
  if (a && typeof a[name] === "function") return a[name].apply(a, args);
  queue.push([name, args]);
}

export function init(options) {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (!options || !options.siteId) throw new Error("@glyphex/tracker: siteId is required");
  if (document.querySelector("script[data-glyphex-loader]")) return;
  var host = (options.host || "https://glyphex.io").replace(/\/+$/, "");
  var s = document.createElement("script");
  s.defer = true;
  s.src = host + "/t/" + encodeURIComponent(options.siteId) + ".js";
  s.setAttribute("data-glyphex-loader", "");
  if (options.autoTrack === false) s.setAttribute("data-auto-track", "false");
  if (options.excludeSearch) s.setAttribute("data-exclude-search", "true");
  if (options.tag) s.setAttribute("data-tag", String(options.tag).slice(0, 50));
  if (options.beforeSend) {
    var fn = "__glyphexBeforeSend";
    window[fn] = options.beforeSend;
    s.setAttribute("data-before-send", fn);
  }
  s.addEventListener("load", flush);
  document.head.appendChild(s);
}

export function track(name, properties) {
  return call("track", [name, properties]);
}

export function pageview(path) {
  return call("pageview", [path]);
}

export function trackNotFound(url) {
  return call("trackNotFound", [url]);
}
