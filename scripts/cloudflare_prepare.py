#!/usr/bin/env python3
"""Prepare the published site for Cloudflare Pages (https://inkdos-offic.pages.dev), the address that lets browsers
keep the editors and tools: GitHub Pages tells browsers to recheck every file after 10 minutes, which in a web view
without service workers (XeOS on iPad) means hundreds of requests on every open. Cloudflare Pages takes a _headers
file, so the files that never change in place are kept by the browser for long.

- Cloudflare Pages refuses files over 25 MiB (ONLYOFFICE's x2t.wasm, the LibreOffice converter of the PDF toolkit):
  they are left out of the upload and served at the same address by a Pages Function that fetches them from
  GitHub Pages (functions/[[path]].js, run only for those paths through _routes.json), with the same long cache.
- _headers: the large program files (editors, fonts, toolkit, hashed build files) are kept by the browser for a year;
  pages and the small scripts are served from the browser's copy at once and refreshed in the background
  (stale-while-revalidate), so they open with no internet and a new version shows on the next open without anyone
  pressing anything. Check for updates (Offline tools panel) goes through check-update.html, never cached, which
  fetches everything again past the cache."""
from __future__ import annotations

import json
import sys
from pathlib import Path

LIMIT = 25 * 1024 * 1024
YEAR = 'public, max-age=31536000'
SOON = 'public, max-age=0, stale-while-revalidate=31536000'
LARGE = ('/assets/*', '/sdkjs/*', '/web-apps/*', '/fonts/*', '/ran-fonts/*', '/InkDOS-tools/bentopdf/assets/*',
         '/InkDOS-tools/bentopdf/wasm/*', '/InkDOS-tools/bentopdf/pdfjs-viewer/*',
         '/InkDOS-tools/bentopdf/pdfjs-annotation-viewer/*', '/InkDOS-tools/bentopdf/embedpdf/*',
         '/InkDOS-tools/bentopdf/ocr/*', '/InkDOS-tools/pnk/*', '/apps/pdf/vendor/*', '/apps/documents/vendor/*',
         '/apps/spreadsheets/vendor/*', '/apps/presentations/vendor/*', '/apps/epub/vendor/*')
# Cloudflare Pages serves page.html at /page (after a 308 from /page.html): both addresses are listed
NEVER = ('/update', '/update.html', '/check-update', '/check-update.html')


FUNCTION = """// Files over the Cloudflare Pages size limit, served from GitHub Pages at this same address (scripts/cloudflare_prepare.py)
export async function onRequest({ request }) {
  const url = new URL(request.url);
  const upstream = await fetch('https://inkdos-tools.github.io' + url.pathname, { cf: { cacheEverything: true, cacheTtl: 31536000 } });
  const headers = new Headers(upstream.headers);
  headers.set('Cache-Control', '""" + YEAR + """');
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
    (site / '_headers').write_text(f'/*\n  Cache-Control: {SOON}\n'
                                   + ''.join(f'{route}\n  ! Cache-Control\n  Cache-Control: {YEAR}\n' for route in LARGE)
                                   + ''.join(f'{route}\n  ! Cache-Control\n  Cache-Control: no-store\n' for route in NEVER),
                                   encoding='utf-8')
    count = sum(1 for p in site.rglob('*') if p.is_file())
    print(f'{count} files for Cloudflare Pages')
    if count > 20000:
        sys.exit('Cloudflare Pages takes at most 20,000 files per deployment')


if __name__ == '__main__':
    main(Path(sys.argv[1]), Path(sys.argv[2]))
