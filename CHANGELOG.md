# Changelog

Changes to the InkDOS suite site (https://inkdos-tools.github.io), newest first.

## 2026-10-09 · Offline tools from the InkDOS Home

- `?offline=1` opens the Offline tools panel: the InkDOS Home's download button links here.

## 2026-10-09 · Home back to the plain workspace cards; Cloudflare paused

- Home: each workspace is a single card that opens its InkDOS app (Documents, Spreadsheets, Presentations, PDF,
  Plain Text, EPUB). The Open, New and Edit buttons on the cards are gone.
- Home: removed the OCR button (OCR is in BentoPDF) and the note about the 100 MB download.
- Home: Offline tools is now a download icon button left of the Settings (sun) button.
- Cloudflare Pages (https://inkdos-offic.pages.dev): paused. The address and project stay; it shows a notice
  pointing here (`cloudflare/paused/`). `scripts/cloudflare_prepare.py` and the deploy steps are kept for later
  (`CLOUDFLARE_MIRROR: 'on'` in the workflow publishes the full site again).
- InkDOS apps copied here follow InkDOS main (c83042d), which opens ONLYOFFICE and BentoPDF from this address again.
