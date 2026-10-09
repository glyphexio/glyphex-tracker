// File download clicks.
(function() {
  var c = window.analytics && window.analytics._;
  if (!c) return;
  var exts = "pdf zip rar 7z tar gz doc docx xls xlsx ppt pptx csv txt rtf odt ods odp mp3 mp4 wav avi mov wmv exe dmg apk iso".split(" ");
  document.addEventListener("click", function(e) {
    var a = e.target.closest && e.target.closest("a");
    if (!a || !a.href) return;
    try {
      var ext = new URL(a.href).pathname.split(".").pop().toLowerCase();
      if (exts.indexOf(ext) !== -1) {
        c.t("File Download", { url: a.href, filename: a.href.split("/").pop(), extension: ext });
      }
    } catch (err) {}
  });
})();
