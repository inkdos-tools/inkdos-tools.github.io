# InkDOS full office suite (beta)

[ranuts/document](https://github.com/ranuts/document) — the OnlyOffice document, spreadsheet and
presentation editors running entirely in the browser — built for [InkDOS](https://github.com/vfydr2m9wk-ops/InkDOS)
and served at <https://inkdos-tools.github.io/>. InkDOS opens it from the **Full office (beta)** button on its
Home. Files are opened and converted on the device (WebAssembly) and never uploaded.

It is a beta: it is heavy (about 50 MB of code and a 42 MB converter on first use) and may not run on
phones or iPads with little memory. InkDOS's own editors stay the main way to work.

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
5. The start page is InkDOS's own (`site/`): open a file or start a Word, Excel or PowerPoint document
   directly, in the InkDOS look and language; the upstream landing page is replaced. The editor's light
   theme is the flat white one (`theme-white`) instead of the classic coloured header.

## Branches

- `source`: this build script and the workflow (`.github/workflows/pages.yml`).
- `main`: the built site, replaced by every deploy; GitHub Pages serves it.

## Licences

The glue (build script, workflow) is MIT. ranuts/document is AGPL-3.0 (`UPSTREAM-LICENSE.txt` and
`UPSTREAM-SOURCE.txt` in the site name the licence and the exact source); it includes the OnlyOffice
editors (AGPL-3.0) and the fonts listed by the upstream project.
