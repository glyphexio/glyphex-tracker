// File download clicks (http and https only). Sends origin and path, never the query string or hash.
(function() {
  var c = window.analytics && window.analytics._;
  if (!c || !c.f("downloads", "data-downloads", 1)) return;
  var exts = "pdf zip rar 7z tar gz doc docx xls xlsx ppt pptx csv txt rtf odt ods odp mp3 mp4 wav avi mov wmv exe dmg apk iso".split(" ");
  document.addEventListener("click", function(e) {
    var a = e.target.closest && e.target.closest("a");
    if (!a || !a.href) return;
    try {
      var u = new URL(a.href), ext = u.pathname.split(".").pop().toLowerCase();
      if (/^https?:$/.test(u.protocol) && exts.indexOf(ext) !== -1) {
        c.t("File Download", { url: u.origin + u.pathname, filename: u.pathname.split("/").pop(), extension: ext }, 1);
      }
    } catch (err) {}
  });
})();
