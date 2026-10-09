#!/usr/bin/env python3
"""Prepare the published site for Cloudflare Pages (https://inkdos-offic.pages.dev), the address that lets browsers
keep the editors and tools: GitHub Pages tells browsers to recheck every file after 10 minutes, which in a web view
without service workers (XeOS on iPad) means hundreds of requests on every open. Cloudflare Pages takes a _headers
file, so the files that never change in place are kept by the browser for long.

- Cloudflare Pages refuses files over 25 MiB (ONLYOFFICE's x2t.wasm, the LibreOffice converter of the PDF toolkit):
  they are left out of the upload and served at the same address by a Pages Function that fetches them from
  GitHub Pages (functions/[[path]].js, run only for those paths through _routes.json), with the same long cache.
- _headers: hashed build files for a year (immutable); the vendored editor and tool files for a week, refreshed in
  the background for a month after that; pages keep Cloudflare's default (always rechecked), so updates arrive."""
from __future__ import annotations

import json
import sys
from pathlib import Path

LIMIT = 25 * 1024 * 1024
LONG = 'public, max-age=31536000, immutable'
WEEK = 'public, max-age=604800, stale-while-revalidate=2592000'
HEADERS = {
    '/assets/*': LONG,
    '/InkDOS-tools/bentopdf/assets/*': LONG,
    '/sdkjs/*': WEEK,
    '/web-apps/*': WEEK,
    '/fonts/*': WEEK,
    '/ran-fonts/*': WEEK,
    '/InkDOS-tools/bentopdf/wasm/*': WEEK,
    '/InkDOS-tools/bentopdf/pdfjs-viewer/*': WEEK,
    '/InkDOS-tools/bentopdf/pdfjs-annotation-viewer/*': WEEK,
    '/InkDOS-tools/bentopdf/embedpdf/*': WEEK,
    '/InkDOS-tools/bentopdf/ocr/*': WEEK,
    '/InkDOS-tools/epub/*': WEEK,
    '/InkDOS-tools/txt/cm/*': WEEK,
    '/InkDOS-tools/pnk/*': WEEK,
}


FUNCTION = """// Files over the Cloudflare Pages size limit, served from GitHub Pages at this same address (scripts/cloudflare_prepare.py)
export async function onRequest({ request }) {
  const url = new URL(request.url);
  const upstream = await fetch('https://inkdos-tools.github.io' + url.pathname, { cf: { cacheEverything: true, cacheTtl: 604800 } });
  const headers = new Headers(upstream.headers);
  headers.set('Cache-Control', '""" + WEEK + """');
  return new Response(upstream.body, { status: upstream.status, headers });
}
"""


def main(site: Path, functions: Path) -> None:
    proxied = []
    for path in sorted(site.rglob('*')):
        if path.is_file() and path.stat().st_size > LIMIT:
            proxied.append('/' + path.relative_to(site).as_posix())
            path.unlink()
    for url in proxied:
        print(f'served from GitHub Pages (over 25 MiB): {url}')
    if proxied:
        functions.mkdir(parents=True, exist_ok=True)
        (functions / '[[path]].js').write_text(FUNCTION, encoding='utf-8')
        (site / '_routes.json').write_text(json.dumps({'version': 1, 'include': proxied, 'exclude': []}), encoding='utf-8')
    (site / '_headers').write_text(''.join(f'{route}\n  Cache-Control: {value}\n' for route, value in HEADERS.items())
                                   # Check for updates (Offline tools panel) goes through this page: the browser drops its
                                   # copy of the site's files (not saved data, not the offline copies) and returns
                                   + '/update.html\n  Clear-Site-Data: "cache"\n  Cache-Control: no-store\n',
                                   encoding='utf-8')
    count = sum(1 for p in site.rglob('*') if p.is_file())
    print(f'{count} files for Cloudflare Pages')
    if count > 20000:
        sys.exit('Cloudflare Pages takes at most 20,000 files per deployment')


if __name__ == '__main__':
    main(Path(sys.argv[1]), Path(sys.argv[2]))
