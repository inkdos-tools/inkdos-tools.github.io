# Changelog

Changes to the InkDOS suite site (https://inkdos-tools.github.io), newest first.

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
