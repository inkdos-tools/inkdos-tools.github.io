// Files opened from the system (XeOS, a browser's file handling: launchQueue, see manifest.webmanifest) go straight to
// the matching tool: Word, Excel and PowerPoint files to the ONLYOFFICE editor (open-local.js stashes them for
// /editor?open=local), PDF, text and EPUB to the InkDOS apps copied here, Pages, Numbers and Keynote to the pnk viewer.
(function () {
  'use strict';
  var q = window.launchQueue;
  if (!q || typeof q.setConsumer !== 'function') return;
  var OFFICE = ['docx', 'doc', 'docm', 'dotx', 'dot', 'odt', 'fodt', 'rtf', 'xlsx', 'xls', 'xlsm', 'xltx', 'ods', 'fods', 'csv',
    'pptx', 'ppt', 'pptm', 'ppsx', 'pps', 'potx', 'odp', 'fodp'];
  var TEXT = ['txt', 'md', 'markdown', 'log', 'ini', 'cfg', 'conf', 'toml', 'properties', 'xml', 'json', 'jsonl', 'ndjson', 'yaml', 'yml', 'tsv'];
  function route(file) {
    var name = String(file.name || ''), dot = name.lastIndexOf('.'), ext = dot >= 0 ? name.slice(dot + 1).toLowerCase() : '';
    var home = window.InkDOSOfficeHome;
    if (OFFICE.indexOf(ext) >= 0) {
      var target = (document.querySelector('[data-open-local]') || {}).getAttribute
        ? document.querySelector('[data-open-local]').getAttribute('data-open-local') : '/editor?open=local';
      var go = function () { location.href = target; };
      return window.__openLocal ? window.__openLocal.stashFile(file).then(go, go) : go();
    }
    if (!home) return;
    if (ext === 'pdf') return home.handoff(file, './apps/pdf/index.html?suite=1');
    if (ext === 'epub') return home.handoff(file, './apps/epub/index.html?suite=1');
    if (TEXT.indexOf(ext) >= 0 || /^text\//.test(file.type || '')) return home.handoff(file, './apps/txt/index.html?suite=1');
    if (ext === 'pages' || ext === 'numbers' || ext === 'key') return home.handoff(file, '/InkDOS-tools/pnk/');
  }
  q.setConsumer(function (params) {
    var handle = params && params.files && params.files[0];
    if (handle && handle.getFile) handle.getFile().then(route).catch(function (error) { console.error('InkDOS Office: launched file', error); });
  });
})();
