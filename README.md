# InkDOS Office

InkDOS Office is the InkDOS suite with OnlyOffice in place of InkDOS's own Word, Excel and PowerPoint editors,
served at <https://inkdos-tools.github.io/>. Its Home (`site/`) has the six InkDOS workspaces in the InkDOS look:

- **Documents, Spreadsheets, Presentations**: the OnlyOffice editors of
  [ranuts/document](https://github.com/ranuts/document) (OnlyOffice running entirely in the browser: files are
  opened, edited and converted on the device and never uploaded), with Open and New directly on the Home.
- **PDF Workspace, Plain Text, EPUB Reader**: the InkDOS workspaces themselves, taken unchanged from the InkDOS
  commit pinned in `office.json` (with `shared/`, `labs/pdf/` and the Home look they use).

The editors are heavy (about 100 MB the first time) and may not open on devices with little memory.
InkDOS (<https://vfydr2m9wk-ops.github.io/InkDOS/>) stays the light, offline edition.

## Origin

The site shares the origin `https://inkdos-tools.github.io` with the other InkDOS tools
(<https://inkdos-tools.github.io/InkDOS-tools/>) and is a different origin from InkDOS
(`https://vfydr2m9wk-ops.github.io`), so its third-party code cannot reach InkDOS storage or pages.
It lives at the root of the origin because the upstream build uses root-absolute paths.

## Changes to upstream

`build.py` fetches the commit pinned in `office.json`, builds it with the project's own tooling
(`pnpm run build`) and changes only its output:

1. `x2t.wasm.br` is served decompressed as `x2t.wasm` (upstream needs `Content-Encoding: br`, which GitHub
   Pages cannot send).
2. The service worker ignores requests under `/InkDOS-tools/` and deletes only its own caches (upstream
   deletes every other cache of the origin on activate).
3. Every page gets a Content-Security-Policy that allows no connection to another site
   (`connect-src 'self' data: blob:`), so the optional AI assistants of the editor cannot send anything out.
4. Cloudflare host files (`_headers`, `_redirects`) are left out.
5. The Home is InkDOS Office's own (`site/`), in place of the upstream landing page, with "Powered by
   ONLYOFFICE" at the bottom. The editor's light
   theme is the flat white one (`theme-white`) instead of the classic coloured header.
6. No recent files: the editor's local history is turned off (`lib/history/autosave.ts` always reports it
   disabled), the Home has no Recent files link and removes a history stored before, once per device. Files are
   found again with the device's own file manager. Should it ever be turned back on, its snapshots are encrypted at
   rest (AES-GCM, non-extractable key; `patches/history-seal.ts`).

## Branches

- `source`: this build script and the workflow (`.github/workflows/pages.yml`).
- `main`: the built site, replaced by every deploy; GitHub Pages serves it.

## Licences

This repository (build script, patches to the editor, workflow, `site/`) is AGPL-3.0, the licence of the editor it builds (`LICENSE`). The InkDOS workspaces it copies in stay MIT (`INKDOS-LICENSE.txt`). ranuts/document is AGPL-3.0 (`UPSTREAM-LICENSE.txt` and
`UPSTREAM-SOURCE.txt` in the site name the licence and the exact source); it includes the OnlyOffice
editors (AGPL-3.0) and the fonts listed by the upstream project.
