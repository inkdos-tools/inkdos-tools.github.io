// InkDOS inside another web page (the XeOS web desktop on iPad): there, an editor framed inside InkDOS does not
// scroll, so InkDOS opens the editor as a page of its own instead. It keeps the document on the device
// (IndexedDB of the InkDOS origin) and opens /editor?inkdos-handoff=<id>&inkdos-return=<InkDOS page>. This page
// fetches the document through a hidden InkDOS page (handoff.html, InkDOS origin; it only answers this origin)
// and hands it to the editor with the embed protocol it already speaks (document:ready -> document:open-file,
// embedOrigin = this site). The editor's Home button and this site's root lead back to the InkDOS page.
(function () {
  'use strict';
  var INKDOS = 'https://vfydr2m9wk-ops.github.io';
  var q = new URLSearchParams(location.search), id = q.get('inkdos-handoff'), back = q.get('inkdos-return');
  if (back && back.indexOf(INKDOS + '/') === 0) { try { sessionStorage.setItem('inkdos-return', back); } catch (_) {} }
  // a small way back to the InkDOS page (the editor's own Home button shows only when it is the top page)
  function backButton() {
    var url = null;
    try { url = sessionStorage.getItem('inkdos-return'); } catch (_) {}
    if (!url || url.indexOf(INKDOS + '/') !== 0 || document.getElementById('inkdosBack')) return;
    var b = document.createElement('a');
    b.id = 'inkdosBack'; b.href = url; b.textContent = '\u2190 InkDOS';
    b.setAttribute('aria-label', /^pt/i.test(navigator.language || '') ? 'Voltar ao InkDOS' : 'Back to InkDOS');
    b.style.cssText = 'position:fixed;right:12px;bottom:34px;z-index:2147483647;padding:6px 12px;border-radius:999px;' +
      'background:#192235;color:#fff;font:600 13px/1.2 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;' +
      'text-decoration:none;box-shadow:0 2px 8px rgba(0,0,0,.25);opacity:.9';
    document.body.appendChild(b);
  }
  if (document.body) backButton(); else document.addEventListener('DOMContentLoaded', backButton, { once: true });
  if (!id || !/^[A-Za-z0-9-]{8,64}$/.test(id)) return;
  // the editor talks to window.parent (embed protocol); inside the XeOS window that would be XeOS: here the editor is
  // the top of its own conversation, so its replies come back to this page (window.parent is replaceable)
  try { Object.defineProperty(window, 'parent', { value: window, configurable: true }); } catch (_) {}
  var file = null, ready = false, sent = false, frame = null;
  function send() {
    if (sent || !file || !ready) return;
    sent = true;
    window.postMessage({ id: 'inkdos-launch', type: 'document:open-file', payload: { file: file, fileName: file.name } }, location.origin);
  }
  addEventListener('message', function (event) {
    var data = event.data || {};
    if (event.origin === location.origin && event.source === window && data.type === 'document:ready') { ready = true; send(); return; }
    if (event.origin !== INKDOS || !frame || event.source !== frame.contentWindow) return;
    if (data.type !== 'inkdos-handoff-file' || !(data.file instanceof Blob)) return;
    file = data.file instanceof File ? data.file : new File([data.file], String(data.name || 'document'), { type: data.file.type });
    frame.remove(); frame = null;
    send();
  });
  function fetchFile() {
    frame = document.createElement('iframe');
    frame.hidden = true; frame.title = 'InkDOS';
    frame.src = INKDOS + '/InkDOS/handoff.html?id=' + encodeURIComponent(id);
    document.body.appendChild(frame);
  }
  if (document.body) fetchFile(); else document.addEventListener('DOMContentLoaded', fetchFile, { once: true });
})();
