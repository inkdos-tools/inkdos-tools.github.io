// InkDOS Office Home: the appearance menu of the InkDOS Home, the strings of this page in the InkDOS language,
// and the OnlyOffice editors opened in that language.
(function () {
  'use strict';
  var root = document.documentElement;

  // appearance menu (same behaviour and storage key as the InkDOS Home)
  (function () {
    var KEY = 'inkdos2:appearance', VALID = ['light', 'dark', 'system'];
    var button = document.getElementById('appearanceButton'), menu = document.getElementById('appearanceMenu');
    var media = matchMedia('(prefers-color-scheme: dark)'), mode = root.dataset.appearanceMode || 'system';
    function apply() {
      var value = mode === 'system' ? (media.matches ? 'dark' : 'light') : mode;
      root.dataset.theme = root.dataset.appearance = root.dataset.appearanceResolved = value;
      root.dataset.appearanceMode = mode;
      root.style.colorScheme = value;
      document.querySelectorAll('[data-home-appearance-mode]').forEach(function (b) { b.setAttribute('aria-checked', String(b.dataset.homeAppearanceMode === mode)); });
      try { localStorage.setItem('ran-theme', value); } catch (_) {}
    }
    function closeMenu() { menu.hidden = true; button.setAttribute('aria-expanded', 'false'); }
    button.addEventListener('click', function () { var opening = menu.hidden; menu.hidden = !opening; button.setAttribute('aria-expanded', String(opening)); });
    document.querySelectorAll('[data-home-appearance-mode]').forEach(function (choice) {
      choice.addEventListener('click', function () {
        if (VALID.indexOf(choice.dataset.homeAppearanceMode) < 0) return;
        mode = choice.dataset.homeAppearanceMode;
        try { localStorage.setItem(KEY, mode); } catch (_) {}
        apply(); closeMenu();
      });
    });
    document.addEventListener('click', function (event) { if (!event.target.closest('.home-appearance')) closeMenu(); });
    document.addEventListener('keydown', function (event) { if (event.key === 'Escape' && !menu.hidden) { closeMenu(); button.focus(); } });
    media.addEventListener('change', function () { if (mode === 'system') apply(); });
    apply();
  })();

  var T = {
    en: {},
    pt: { documents: 'Documentos Word (DOCX, DOC, ODT, RTF) com o editor completo.', spreadsheets: 'Planilhas Excel (XLSX, XLS, ODS, CSV) com fórmulas e gráficos.',
      presentations: 'Apresentações PowerPoint (PPTX, PPT, ODP) com o editor completo.', open: 'Abrir', new: 'Novo',
      note: 'Documentos, Planilhas e Apresentações baixam cerca de 100 MB na primeira vez. Os arquivos nunca saem deste aparelho.',
      powered: 'Powered by', recent: 'Arquivos recentes', source: 'Código-fonte' },
    es: { documents: 'Documentos Word (DOCX, DOC, ODT, RTF) con el editor completo.', spreadsheets: 'Hojas de Excel (XLSX, XLS, ODS, CSV) con fórmulas y gráficos.',
      presentations: 'Presentaciones PowerPoint (PPTX, PPT, ODP) con el editor completo.', open: 'Abrir', new: 'Nuevo',
      note: 'Documentos, Hojas de cálculo y Presentaciones descargan unos 100 MB la primera vez. Los archivos nunca salen de este dispositivo.',
      recent: 'Archivos recientes', source: 'Código fuente' },
    fr: { documents: 'Documents Word (DOCX, DOC, ODT, RTF) avec l’éditeur complet.', spreadsheets: 'Classeurs Excel (XLSX, XLS, ODS, CSV) avec formules et graphiques.',
      presentations: 'Présentations PowerPoint (PPTX, PPT, ODP) avec l’éditeur complet.', open: 'Ouvrir', new: 'Nouveau',
      note: 'Documents, Tableurs et Présentations téléchargent environ 100 Mo la première fois. Les fichiers ne quittent jamais cet appareil.',
      recent: 'Fichiers récents', source: 'Code source' },
    de: { documents: 'Word-Dokumente (DOCX, DOC, ODT, RTF) mit dem vollständigen Editor.', spreadsheets: 'Excel-Arbeitsmappen (XLSX, XLS, ODS, CSV) mit Formeln und Diagrammen.',
      presentations: 'PowerPoint-Präsentationen (PPTX, PPT, ODP) mit dem vollständigen Editor.', open: 'Öffnen', new: 'Neu',
      note: 'Dokumente, Tabellen und Präsentationen laden beim ersten Mal etwa 100 MB. Dateien verlassen dieses Gerät nie.',
      recent: 'Zuletzt verwendet', source: 'Quellcode' },
    ja: { documents: '完全なエディターで Word 文書（DOCX、DOC、ODT、RTF）を編集。', spreadsheets: '数式とグラフ付きの Excel ブック（XLSX、XLS、ODS、CSV）。',
      presentations: '完全なエディターで PowerPoint（PPTX、PPT、ODP）を編集。', open: '開く', new: '新規',
      note: '文書・スプレッドシート・プレゼンテーションは初回に約 100 MB をダウンロードします。ファイルがこのデバイスの外に出ることはありません。',
      recent: '最近のファイル', source: 'ソースコード' },
    ru: { documents: 'Документы Word (DOCX, DOC, ODT, RTF) в полном редакторе.', spreadsheets: 'Книги Excel (XLSX, XLS, ODS, CSV) с формулами и диаграммами.',
      presentations: 'Презентации PowerPoint (PPTX, PPT, ODP) в полном редакторе.', open: 'Открыть', new: 'Создать',
      note: 'Документы, Таблицы и Презентации в первый раз загружают около 100 МБ. Файлы никогда не покидают это устройство.',
      recent: 'Недавние файлы', source: 'Исходный код' },
    zh: { documents: '用完整编辑器处理 Word 文档（DOCX、DOC、ODT、RTF）。', spreadsheets: '带公式和图表的 Excel 工作簿（XLSX、XLS、ODS、CSV）。',
      presentations: '用完整编辑器处理 PowerPoint 演示文稿（PPTX、PPT、ODP）。', open: '打开', new: '新建',
      note: '文档、表格和演示文稿首次使用时需下载约 100 MB。文件绝不会离开本设备。',
      recent: '最近的文件', source: '源代码' }
  };
  var EN = {};
  document.querySelectorAll('[data-office-t]').forEach(function (el) { EN[el.dataset.officeT] = el.textContent; });
  // the OnlyOffice editors' UI language for each InkDOS language (site codes of ranuts/document, else the editor's)
  var EDITOR = { pt: 'pt', es: 'es', de: 'de', ja: 'ja', zh: 'zh-CN', fr: 'fr', ru: 'ru' };

  function localize() {
    var code = (root.lang || 'en').toLowerCase().split('-')[0], t = T[code] || {};
    document.querySelectorAll('[data-office-t]').forEach(function (el) { el.textContent = t[el.dataset.officeT] || EN[el.dataset.officeT]; });
    var locale = EDITOR[code];
    document.querySelectorAll('a[href^="/editor"], a[href^="/history"], [data-open-local]').forEach(function (el) {
      var attr = el.hasAttribute('data-open-local') ? 'data-open-local' : 'href';
      var url = new URL(el.getAttribute(attr), location.href);
      if (locale) url.searchParams.set('locale', locale); else url.searchParams.delete('locale');
      el.setAttribute(attr, url.pathname + url.search);
    });
  }
  new MutationObserver(localize).observe(root, { attributes: true, attributeFilter: ['lang'] });
  localize();
})();
