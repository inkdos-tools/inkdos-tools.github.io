# Changelog

Changes to the InkDOS suite site (https://inkdos-tools.github.io), newest first.

## 2026-10-10 · Editor page without the InkDOS button

- InkDOS (web) now always opens the editor as a page of its own; the "← InkDOS" button over it is gone, the
  browser's Back returns to InkDOS (owner).

## 2026-10-10 · InkDOS on one address (Cloudflare)

- The Cloudflare mirror is on again (owner): https://inkdos-offic.pages.dev serves this site at /, InkDOS at
  /InkDOS/ and the InkDOS-tools pages at /InkDOS-tools/. In that copy the GitHub addresses are rewritten to the one
  address (InkDOS's offline snapshot rebuilt), so InkDOS uses the editors and BentoPDF of the same address; the root
  opens InkDOS.

## 2026-10-10 · Editor as a separate page (InkDOS in XeOS)

- Inside the XeOS web desktop an editor framed in InkDOS does not scroll, so InkDOS opens /editor as a page of its
  own (?inkdos-handoff=<id>&inkdos-return=<InkDOS page>). site/inkdos-handoff.js (added to editor.html) fetches the
  document through a hidden InkDOS page (handoff.html) and opens it with the editor's own embed protocol; a small
  "← InkDOS" button and this site's root lead back to the InkDOS page. CSP frame-src allows the InkDOS origin.

## 2026-10-09 · ONLYOFFICE always classic light

- The ONLYOFFICE editors always open in the classic light theme (coloured header), whatever the InkDOS theme or the
  system's: the editor no longer follows the site theme, the OS dark mode or the flat white default (build.py patch of
  upstream lib/onlyoffice/ui-theme.ts; office-home-theme.js keeps 'ran-theme' light).

## 2026-10-09 · No cache-time promise

- The Offline tools panel no longer says the tools stay cached "for up to a year": it says the browser or the system
  can clear that cache at any time. README: the Cloudflare mirror is noted as paused, without cache durations.

## 2026-10-09 · Redirect loop with an old cached InkDOS

- The Home's redirect goes to `https://vfydr2m9wk-ops.github.io/InkDOS/?engine=light`: an older InkDOS Home still
  cached on a device (with the Light/Full switch set to Full) sent visitors back here, a loop that kept it from
  updating; `?engine=light` makes that old Home stay, so the new version installs.

## 2026-10-09 · Engine only: no Home, no copies of the InkDOS apps

- Owner decision: everything goes through the main InkDOS repository and site. This site is now only the engine
  InkDOS calls (ONLYOFFICE editors, BentoPDF, and the Offline tools panel framed by the InkDOS Home).
- Its Home sends visitors to https://vfydr2m9wk-ops.github.io/InkDOS/ unless framed (`?embed=1`); the workspace
  cards are gone.
- The InkDOS apps are no longer copied here (`office.json` keeps only `shared/`, `assets/home.css`,
  `assets/icons/` for the panel's look); the Offline tools panel no longer lists them.
- No longer an entry point for files: `office-launch.js` and the web app manifest are removed.
- Cloudflare stays paused and isolated (see below).

## 2026-10-09 · Offline tools from the InkDOS Home

- `?offline=1` opens the Offline tools panel. With `&embed=1` (the InkDOS Home's download button frames it) only the
  panel shows, on a transparent page; Close asks the InkDOS Home to remove the frame; Check for updates comes back
  to the embedded panel.

## 2026-10-09 · Home back to the plain workspace cards; Cloudflare paused

- Home: each workspace is a single card that opens its InkDOS app (Documents, Spreadsheets, Presentations, PDF,
  Plain Text, EPUB). The Open, New and Edit buttons on the cards are gone.
- Home: removed the OCR button (OCR is in BentoPDF) and the note about the 100 MB download.
- Home: Offline tools is now a download icon button left of the Settings (sun) button.
- Cloudflare Pages (https://inkdos-offic.pages.dev): paused. The address and project stay; it shows a notice
  pointing here (`cloudflare/paused/`). `scripts/cloudflare_prepare.py` and the deploy steps are kept for later
  (`CLOUDFLARE_MIRROR: 'on'` in the workflow publishes the full site again).
- InkDOS apps copied here follow InkDOS main (c83042d), which opens ONLYOFFICE and BentoPDF from this address again.
