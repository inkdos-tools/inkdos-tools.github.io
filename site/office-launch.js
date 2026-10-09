// Files opened from the system (XeOS, a browser's file handling: launchQueue, see manifest.webmanifest) go straight to
// the matching InkDOS app copied here (Edit with ONLYOFFICE inside it opens the full editor on request); Pages,
// Numbers and Keynote go to the pnk viewer.
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
    if (!home) return;
    var group = /^(xlsx|xls|xlsm|xltx|ods|fods|csv)$/.test(ext) ? 'spreadsheets' : /^(pptx|ppt|pptm|ppsx|pps|potx|odp|fodp)$/.test(ext) ? 'presentations' : 'documents';
    if (OFFICE.indexOf(ext) >= 0) return home.handoff(file, './apps/' + group + '/index.html?suite=1');
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
