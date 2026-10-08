// InkDOS full office start page: InkDOS appearance and language, and the editor's own settings to match.
(function () {
  'use strict';
  var root = document.documentElement, params = new URLSearchParams(location.search);
  function store(key, value) { try { localStorage.setItem(key, value); } catch (_) {} }
  function read(key) { try { return localStorage.getItem(key); } catch (_) { return null; } }

  // appearance: InkDOS passes ?inkdos-theme= (another origin); kept for later visits, else the system setting
  var mode = params.get('inkdos-theme');
  if (/^(light|dark|system)$/.test(mode || '')) store('inkdos2:appearance', mode); else mode = read('inkdos2:appearance') || 'system';
  var dark = mode === 'dark' || (mode !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches);
  root.dataset.theme = dark ? 'dark' : 'light';
  // the editor follows the site theme it reads from 'ran-theme' (light: flat white chrome, dark: dark chrome)
  store('ran-theme', dark ? 'dark' : 'light');

  var T = {
    en: {},
    pt: { credit: 'Editor completo baseado no OnlyOffice (ranuts/document, AGPL-3.0) · beta', title: 'Office completo',
      subtitle: 'Word, Excel e PowerPoint com o editor completo. Os arquivos ficam neste aparelho.', open: 'Abrir arquivo',
      openHint: 'DOCX, XLSX, PPTX, DOC, XLS, PPT, CSV ou PDF', word: 'Novo documento', excel: 'Nova planilha', powerpoint: 'Nova apresentação',
      note: 'Pesado: na primeira vez baixa cerca de 100 MB e pode não abrir em celulares ou iPads com pouca memória.',
      recent: 'Arquivos recentes', back: 'Voltar ao InkDOS', source: 'Código-fonte' },
    es: { credit: 'Editor completo basado en OnlyOffice (ranuts/document, AGPL-3.0) · beta', title: 'Office completo',
      subtitle: 'Word, Excel y PowerPoint con el editor completo. Los archivos se quedan en este dispositivo.', open: 'Abrir archivo',
      openHint: 'DOCX, XLSX, PPTX, DOC, XLS, PPT, CSV o PDF', word: 'Nuevo documento', excel: 'Nueva hoja de cálculo', powerpoint: 'Nueva presentación',
      note: 'Pesado: la primera vez descarga unos 100 MB y puede no abrir en teléfonos o iPads con poca memoria.',
      recent: 'Archivos recientes', back: 'Volver a InkDOS', source: 'Código fuente' },
    fr: { credit: 'Éditeur complet basé sur OnlyOffice (ranuts/document, AGPL-3.0) · bêta', title: 'Office complet',
      subtitle: 'Word, Excel et PowerPoint avec l’éditeur complet. Les fichiers restent sur cet appareil.', open: 'Ouvrir un fichier',
      openHint: 'DOCX, XLSX, PPTX, DOC, XLS, PPT, CSV ou PDF', word: 'Nouveau document', excel: 'Nouveau classeur', powerpoint: 'Nouvelle présentation',
      note: 'Lourd : la première fois il télécharge environ 100 Mo et peut ne pas s’ouvrir sur un téléphone ou un iPad avec peu de mémoire.',
      recent: 'Fichiers récents', back: 'Retour à InkDOS', source: 'Code source' },
    de: { credit: 'Vollständiger Editor auf Basis von OnlyOffice (ranuts/document, AGPL-3.0) · Beta', title: 'Vollständiges Office',
      subtitle: 'Word, Excel und PowerPoint mit dem vollständigen Editor. Dateien bleiben auf diesem Gerät.', open: 'Datei öffnen',
      openHint: 'DOCX, XLSX, PPTX, DOC, XLS, PPT, CSV oder PDF', word: 'Neues Dokument', excel: 'Neue Tabelle', powerpoint: 'Neue Präsentation',
      note: 'Schwer: Beim ersten Mal werden etwa 100 MB geladen; auf Telefonen oder iPads mit wenig Speicher öffnet es sich eventuell nicht.',
      recent: 'Zuletzt verwendet', back: 'Zurück zu InkDOS', source: 'Quellcode' },
    ja: { credit: 'OnlyOffice ベースの完全なエディター（ranuts/document、AGPL-3.0）· ベータ', title: 'フル Office',
      subtitle: '完全なエディターで Word・Excel・PowerPoint を編集。ファイルはこのデバイスに残ります。', open: 'ファイルを開く',
      openHint: 'DOCX、XLSX、PPTX、DOC、XLS、PPT、CSV、PDF', word: '新しい文書', excel: '新しいスプレッドシート', powerpoint: '新しいプレゼンテーション',
      note: '重い：初回は約 100 MB をダウンロードし、メモリの少ないスマートフォンや iPad では開かない場合があります。',
      recent: '最近のファイル', back: 'InkDOS に戻る', source: 'ソースコード' },
    ru: { credit: 'Полный редактор на основе OnlyOffice (ranuts/document, AGPL-3.0) · бета', title: 'Полный офис',
      subtitle: 'Word, Excel и PowerPoint в полном редакторе. Файлы остаются на этом устройстве.', open: 'Открыть файл',
      openHint: 'DOCX, XLSX, PPTX, DOC, XLS, PPT, CSV или PDF', word: 'Новый документ', excel: 'Новая таблица', powerpoint: 'Новая презентация',
      note: 'Тяжёлый: в первый раз загружает около 100 МБ и может не открыться на телефонах и iPad с малым объёмом памяти.',
      recent: 'Недавние файлы', back: 'Вернуться в InkDOS', source: 'Исходный код' },
    zh: { credit: '基于 OnlyOffice 的完整编辑器（ranuts/document，AGPL-3.0）· 测试版', title: '完整 Office',
      subtitle: '用完整编辑器处理 Word、Excel 和 PowerPoint。文件保留在本设备上。', open: '打开文件',
      openHint: 'DOCX、XLSX、PPTX、DOC、XLS、PPT、CSV 或 PDF', word: '新建文档', excel: '新建表格', powerpoint: '新建演示文稿',
      note: '较大：首次需下载约 100 MB，在内存较少的手机或 iPad 上可能无法打开。',
      recent: '最近的文件', back: '返回 InkDOS', source: '源代码' }
  };
  // InkDOS passes ?lang= (its language setting); otherwise the browser language
  var given = (params.get('lang') || read('inkdos2:office-lang') || navigator.language || 'en').toLowerCase();
  if (params.get('lang')) store('inkdos2:office-lang', params.get('lang'));
  var lang = given.split('-')[0];
  if (!T[lang]) lang = 'en';
  // editor UI language: the site's own codes (ranuts) for the languages it ships, the editor's for the others
  var editorLocale = { pt: 'pt', es: 'es', de: 'de', ja: 'ja', zh: 'zh-CN', fr: 'fr', ru: 'ru' }[lang];

  document.addEventListener('DOMContentLoaded', function () {
    var t = T[lang];
    root.lang = lang === 'zh' ? 'zh-CN' : lang === 'pt' ? 'pt-BR' : lang;
    document.querySelectorAll('[data-t]').forEach(function (el) { if (t[el.dataset.t]) el.textContent = t[el.dataset.t]; });
    if (t.title) document.title = t.title + ' — InkDOS';
    if (!editorLocale) return;
    document.querySelectorAll('a[href^="/editor"], a[href="/history"]').forEach(function (a) { a.href = a.getAttribute('href') + (a.getAttribute('href').indexOf('?') < 0 ? '?' : '&') + 'locale=' + editorLocale; });
    document.querySelectorAll('[data-open-local]').forEach(function (b) { b.setAttribute('data-open-local', b.getAttribute('data-open-local') + '&locale=' + editorLocale); });
  });
})();
