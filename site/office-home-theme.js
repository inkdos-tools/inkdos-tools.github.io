// InkDOS Office: the InkDOS appearance before first paint (same key as the InkDOS workspaces on this site) and the
// matching editor theme; InkDOS passes ?inkdos-theme= and ?lang= when it links here.
(function () {
  'use strict';
  var root = document.documentElement, params = new URLSearchParams(location.search), mode = 'system';
  function store(k, v) { try { localStorage.setItem(k, v); } catch (_) {} }
  try { mode = localStorage.getItem('inkdos2:appearance') || 'system'; } catch (_) {}
  var given = params.get('inkdos-theme');
  if (/^(light|dark|system)$/.test(given || '')) { mode = given; store('inkdos2:appearance', mode); }
  if (!/^(light|dark|system)$/.test(mode)) mode = 'system';
  var dark = mode === 'dark' || (mode === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  root.dataset.theme = root.dataset.appearance = root.dataset.appearanceResolved = dark ? 'dark' : 'light';
  root.dataset.appearanceMode = mode;
  root.style.colorScheme = dark ? 'dark' : 'light';
  // the OnlyOffice editors follow 'ran-theme' (light: flat white chrome, dark: dark chrome)
  store('ran-theme', dark ? 'dark' : 'light');
  var lang = params.get('lang');
  if (lang) store('inkdos2:language', lang);
})();
