// InkDOS Office Home: "Offline tools", the list of the tools this origin can keep on the device, what of each is
// already stored, and "Download all". Every tool here is on this origin, so this page can read and fill their caches:
// - Documents, Spreadsheets, Presentations (ONLYOFFICE): the editor's own worker (/sw.js) stores each editor the
//   first time it runs; downloading runs it once, unseen, on a blank file (embed mode: nothing goes to Recent files).
// - PDF tools, Office to PDF converters, EPUB reader, text editor (InkDOS-tools): each folder lists its files in
//   inkdos-offline.json (worker, cache, files); downloading registers that worker and stores the missing files.
(function () {
  'use strict';
  var root = document.documentElement;
  var dialog = document.getElementById('offlineTools');
  var opener = document.getElementById('offlineToolsButton');
  if (!dialog || !opener) return;
  var list = dialog.querySelector('[data-offline-list]'), all = dialog.querySelector('[data-offline-all]');
  var usage = dialog.querySelector('[data-offline-usage]'), warn = dialog.querySelector('[data-offline-warn]');

  var T = {
    en: { word: 'Documents editor (Word)', cell: 'Spreadsheets editor (Excel)', slide: 'Presentations editor (PowerPoint)',
      pdf: 'PDF tools (edit, split, merge, OCR…)', office: 'Office and ODF to PDF converters (LibreOffice)', python: 'Python terminal and packages', epub: 'EPUB reader (foliate-js)', txt: 'Plain text editor (CodeMirror)',
      stored: 'On this device', none: 'Not downloaded', part: 'Partly downloaded', working: 'Downloading…', failed: 'Could not download; try again online',
      get: 'Download', again: 'Update', remove: 'Remove', removing: 'Removing…', used: 'Used on this device: ', nosw: 'This browser cannot keep tools offline (no service worker), so they always load from the internet here.',
      busy: 'Downloading', ofs: ' of ' },
    pt: { word: 'Editor de Documentos (Word)', cell: 'Editor de Planilhas (Excel)', slide: 'Editor de Apresentações (PowerPoint)',
      pdf: 'Ferramentas de PDF (editar, dividir, juntar, OCR…)', office: 'Conversores Office e ODF para PDF (LibreOffice)', python: 'Terminal Python e pacotes', epub: 'Leitor de EPUB (foliate-js)', txt: 'Editor de texto (CodeMirror)',
      stored: 'Neste aparelho', none: 'Não baixado', part: 'Baixado em parte', working: 'Baixando…', failed: 'Não foi possível baixar; tente de novo com internet',
      get: 'Baixar', again: 'Atualizar', remove: 'Remover', removing: 'Removendo…', used: 'Em uso neste aparelho: ', nosw: 'Este navegador não consegue guardar as ferramentas offline (sem service worker); aqui elas sempre carregam da internet.',
      busy: 'Baixando', ofs: ' de ' }
  };
  var t = function (key) { var code = (root.lang || 'en').toLowerCase().split('-')[0]; return (T[code] || T.en)[key] || T.en[key]; };
  var mb = function (bytes) { return bytes >= 1e9 ? (bytes / 1e9).toFixed(1) + ' GB' : Math.max(1, Math.round(bytes / 1e6)) + ' MB'; };

  var EDITORS = [
    { id: 'word', ext: 'docx', marks: ['/sdkjs/word/', '/web-apps/apps/documenteditor/'] },
    { id: 'cell', ext: 'xlsx', marks: ['/sdkjs/cell/', '/web-apps/apps/spreadsheeteditor/'] },
    { id: 'slide', ext: 'pptx', marks: ['/sdkjs/slide/', '/web-apps/apps/presentationeditor/'] }
  ];
  var LISTS = [
    { id: 'pdf', list: '/InkDOS-tools/bentopdf/inkdos-offline.json', group: 'pdf' },
    { id: 'office', list: '/InkDOS-tools/bentopdf/inkdos-offline.json', group: 'office' },
    { id: 'epub', list: '/InkDOS-tools/epub/inkdos-offline.json' },
    { id: 'txt', list: '/InkDOS-tools/txt/inkdos-offline.json' }
  ];
  var items = EDITORS.map(function (e) { return { id: e.id, kind: 'editor', editor: e }; })
    .concat(LISTS.map(function (l) { return { id: l.id, kind: 'list', source: l }; }));
  var running = false;

  // ---- the lists of files (kept in a cache of their own, so the status still shows with no network) ----
  var LIST_CACHE = 'inkdos-offline-lists';
  var lists = {};
  function readList(url) {
    if (!lists[url]) lists[url] = fetch(url, { cache: 'no-cache' }).then(function (response) {
      if (!response.ok) throw new Error(response.status);
      var copy = response.clone();
      caches.open(LIST_CACHE).then(function (cache) { cache.put(url, copy); }).catch(function () {});
      return response.json();
    }).catch(function () {
      return caches.open(LIST_CACHE).then(function (cache) { return cache.match(url); })
        .then(function (stored) { if (!stored) throw new Error('no list'); return stored.json(); });
    }).catch(function (error) { delete lists[url]; throw error; });
    return lists[url];
  }
  function filesOf(item) {
    return readList(item.source.list).then(function (data) {
      var files = data.files.filter(function (f) { return !item.source.group || f.group === item.source.group; })
        .map(function (f) { return { url: new URL(f.url, location.origin).href, size: f.size || 0 }; });
      return { data: data, files: files };
    });
  }

  // ---- what is stored ----
  function editorStatus(item) {
    return caches.keys().then(function (names) {
      var runtime = names.filter(function (n) { return n.indexOf('document-editor-runtime-') === 0; });
      return Promise.all(runtime.map(function (n) { return caches.open(n).then(function (c) { return c.keys(); }); }));
    }).then(function (keyLists) {
      var found = item.editor.marks.map(function (mark) {
        return keyLists.some(function (keys) { return keys.some(function (r) { return new URL(r.url).pathname.indexOf(mark) === 0; }); });
      });
      return { done: found.every(Boolean), part: found.some(Boolean) };
    });
  }
  function listStatus(item) {
    return filesOf(item).then(function (info) {
      return caches.open(info.data.cache).then(function (cache) { return cache.keys(); }).then(function (keys) {
        var have = new Set(keys.map(function (r) { var u = new URL(r.url); return u.origin + u.pathname; }));
        var missing = info.files.filter(function (f) { return !have.has(f.url); });
        var total = info.files.reduce(function (s, f) { return s + f.size; }, 0);
        var left = missing.reduce(function (s, f) { return s + f.size; }, 0);
        return { done: !missing.length, part: missing.length < info.files.length, total: total, left: left, info: info, missing: missing };
      });
    });
  }
  function statusOf(item) { return item.kind === 'editor' ? editorStatus(item) : listStatus(item); }

  // ---- downloading ----
  function editorWorker() {
    return navigator.serviceWorker.register('/sw.js').then(function () { return navigator.serviceWorker.ready; });
  }
  // the editor runs once in an unseen frame on a blank file; its worker stores everything it loads
  function runEditor(item) {
    return editorWorker().then(function () {
      return fetch('./offline-blank.' + item.editor.ext).then(function (r) { return r.blob(); });
    }).then(function (blob) {
      return new Promise(function (resolve, reject) {
        var frame = document.createElement('iframe');
        var file = new File([blob], 'offline.' + item.editor.ext, { type: blob.type });
        frame.setAttribute('aria-hidden', 'true');
        frame.tabIndex = -1;
        frame.style.cssText = 'position:fixed;left:-10000px;top:0;width:1024px;height:768px;border:0;visibility:hidden';
        var timer = setTimeout(function () { finish(new Error('timeout')); }, 300000);
        function finish(error) {
          clearTimeout(timer);
          removeEventListener('message', onMessage);
          frame.remove();
          if (error) reject(error); else resolve();
        }
        function onMessage(event) {
          if (event.origin !== location.origin || event.source !== frame.contentWindow) return;
          var type = event.data && event.data.type;
          if (type === 'document:ready') frame.contentWindow.postMessage({ id: 'inkdos-offline', type: 'document:open-file', payload: { file: file, fileName: file.name } }, location.origin);
          else if (type === 'document:opened') settle(Date.now());
          else if (type === 'document:error') finish(new Error('editor error'));
        }
        // "opened" can come before the editor has loaded all of itself: wait until its files are stored (or 2 minutes),
        // then a little longer for the last ones
        function settle(start) {
          editorStatus(item).then(function (s) {
            if (s.done || Date.now() - start > 120000) setTimeout(function () { finish(); }, 3000);
            else setTimeout(function () { settle(start); }, 1000);
          }, function () { setTimeout(function () { finish(); }, 3000); });
        }
        addEventListener('message', onMessage);
        frame.src = '/editor?embed=1&embedOrigin=' + encodeURIComponent(location.origin);
        document.body.appendChild(frame);
      });
    });
  }
  function activeWorker(data) {
    return navigator.serviceWorker.register(data.worker, { scope: data.scope }).then(function (registration) {
      return new Promise(function (resolve, reject) {
        var check = function () {
          if (registration.active) return resolve(registration);
          var worker = registration.installing || registration.waiting;
          if (!worker) return setTimeout(check, 500);
          worker.addEventListener('statechange', function () {
            if (worker.state === 'activated') resolve(registration);
            else if (worker.state === 'redundant') reject(new Error('worker failed'));
          });
        };
        check();
      });
    });
  }
  // the tool's worker first (it serves the stored files offline, and the Python one stores its own on install),
  // then whatever is still missing, a few files at a time
  function fillList(item, progress) {
    return listStatus(item).then(function (first) {
      return activeWorker(first.info.data).then(function () { return listStatus(item); });
    }).then(function (state) {
      var queue = state.missing.slice(), done = state.total - state.left, failed = 0;
      progress(done, state.total);
      return caches.open(state.info.data.cache).then(function (cache) {
        function next() {
          var file = queue.shift();
          if (!file) return Promise.resolve();
          return fetch(file.url, { cache: 'no-cache' }).then(function (response) {
            if (!response.ok) throw new Error(response.status);
            return cache.put(file.url, response);
          }).catch(function () { failed++; }).then(function () { done += file.size; progress(done, state.total); return next(); });
        }
        return Promise.all([next(), next(), next(), next()]);
      }).then(function () { if (failed) throw new Error(failed + ' files'); });
    });
  }

  // ---- the list ----
  var rows = {};
  function render() {
    list.textContent = '';
    items.forEach(function (item) {
      var row = document.createElement('li');
      row.className = 'offline-row';
      row.innerHTML = '<span class="offline-name"></span><span class="offline-state"></span><span class="offline-actions">'
        + '<button type="button" class="office-action" data-remove hidden></button><button type="button" class="office-action" data-get></button></span>';
      row.querySelector('.offline-name').textContent = t(item.id);
      row.querySelector('[data-get]').addEventListener('click', function () { download([item]); });
      row.querySelector('[data-remove]').addEventListener('click', function () { removeItem(item); });
      list.appendChild(row);
      rows[item.id] = row;
    });
  }
  function show(item, text, state, label) {
    var row = rows[item.id];
    if (!row) return;
    row.dataset.state = state;
    row.querySelector('.offline-state').textContent = text;
    var button = row.querySelector('[data-get]'), drop = row.querySelector('[data-remove]');
    button.textContent = label || t('get');
    button.disabled = running || state === 'working';
    drop.textContent = t('remove');
    drop.hidden = !(state === 'done' || state === 'part');
    drop.disabled = running;
  }
  // Remove one tool from this device: the stored files of that tool only (the editors share some common files,
  // which stay while another editor is stored), so the others keep working offline.
  function removeItem(item) {
    if (running) return;
    running = true;
    show(item, t('removing'), 'working');
    var job;
    if (item.kind === 'editor') {
      job = caches.keys().then(function (names) {
        return Promise.all(names.filter(function (n) { return n.indexOf('document-editor-runtime-') === 0; }).map(function (n) {
          return caches.open(n).then(function (cache) {
            return cache.keys().then(function (keys) {
              return Promise.all(keys.filter(function (r) {
                var path = new URL(r.url).pathname;
                return item.editor.marks.some(function (mark) { return path.indexOf(mark) === 0; });
              }).map(function (r) { return cache.delete(r); }));
            });
          });
        }));
      });
    } else {
      job = filesOf(item).then(function (info) {
        var drop = new Set(info.files.map(function (f) { return f.url; }));
        return caches.open(info.data.cache).then(function (cache) {
          return cache.keys().then(function (keys) {
            return Promise.all(keys.filter(function (r) { var u = new URL(r.url); return drop.has(u.origin + u.pathname); })
              .map(function (r) { return cache.delete(r); }));
          });
        });
      });
    }
    job.catch(function () {}).then(function () { running = false; refresh(); });
  }
  function refresh() {
    items.forEach(function (item) {
      statusOf(item).then(function (s) {
        var size = s.total ? ' · ' + mb(s.done ? s.total : s.left) : '';
        if (s.done) show(item, t('stored') + (s.total ? ' · ' + mb(s.total) : ''), 'done', t('again'));
        else show(item, (s.part ? t('part') : t('none')) + size, s.part ? 'part' : 'none');
      }).catch(function () { show(item, t('none'), 'none'); });
    });
    all.disabled = running;
    if (navigator.storage && navigator.storage.estimate) {
      navigator.storage.estimate().then(function (e) { usage.textContent = t('used') + mb(e.usage || 0); }).catch(function () {});
    }
  }
  function download(chosen) {
    if (running) return;
    running = true;
    all.disabled = true;
    try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(function () {}); } catch (_) {}
    var failures = [];
    chosen.reduce(function (chain, item) {
      return chain.then(function () {
        show(item, t('working'), 'working');
        var job = item.kind === 'editor' ? runEditor(item) : fillList(item, function (done, total) {
          show(item, t('busy') + ' ' + mb(done) + t('ofs') + mb(total), 'working');
        });
        return job.then(function () { return statusOf(item); }).then(function (s) {
          if (!s.done) throw new Error('incomplete');
          show(item, t('stored') + (s.total ? ' · ' + mb(s.total) : ''), 'done', t('again'));
        }).catch(function () { failures.push(item); show(item, t('failed'), 'failed'); });
      });
    }, Promise.resolve()).then(function () {
      running = false;
      refresh();
      failures.forEach(function (item) { show(item, t('failed'), 'failed'); });
    });
  }

  function open() {
    dialog.hidden = false;
    opener.setAttribute('aria-expanded', 'true');
    render();
    if (!('serviceWorker' in navigator) || !window.caches) {
      warn.textContent = t('nosw');
      warn.hidden = false;
      all.disabled = true;
      dialog.querySelectorAll('.offline-row button').forEach(function (b) { b.disabled = true; });
      items.forEach(function (item) { rows[item.id].querySelector('.offline-state').textContent = t('none'); });
      return;
    }
    refresh();
    dialog.querySelector('[data-offline-close]').focus();
  }
  function close() {
    dialog.hidden = true;
    opener.setAttribute('aria-expanded', 'false');
    opener.focus();
  }
  opener.addEventListener('click', open);
  dialog.querySelector('[data-offline-close]').addEventListener('click', close);
  dialog.addEventListener('click', function (event) { if (event.target === dialog) close(); });
  document.addEventListener('keydown', function (event) { if (event.key === 'Escape' && !dialog.hidden) close(); });
  all.addEventListener('click', function () { download(items); });
  window.InkDOSOfflineTools = Object.freeze({ open: open, status: function () { return Promise.all(items.map(function (i) { return statusOf(i).then(function (s) { return { id: i.id, done: s.done, part: s.part }; }); })); } });
})();
