#!/usr/bin/env python3
"""Prepare the published site for Cloudflare Pages (https://inkdos-offic.pages.dev), the address that lets browsers
keep the editors and tools: GitHub Pages tells browsers to recheck every file after 10 minutes, which in a web view
without service workers (XeOS on iPad) means hundreds of requests on every open. Cloudflare Pages takes a _headers
file, so the files that never change in place are kept by the browser for long.

- Cloudflare Pages refuses files over 25 MiB: those are left out (the LibreOffice Office-to-PDF converter of the PDF
  toolkit; ONLYOFFICE saves as PDF itself) and dropped from the Offline tools list.
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


def main(site: Path) -> None:
    removed = []
    for path in sorted(site.rglob('*')):
        if path.is_file() and path.stat().st_size > LIMIT:
            removed.append('/' + path.relative_to(site).as_posix())
            path.unlink()
    for url in removed:
        print(f'left out (over 25 MiB): {url}')
    if removed and not all('/libreoffice-wasm/' in url for url in removed):
        sys.exit('a file other than the LibreOffice converter is over 25 MiB; Cloudflare Pages would not serve it')
    listing = site / 'InkDOS-tools' / 'bentopdf' / 'inkdos-offline.json'
    if listing.is_file() and removed:
        data = json.loads(listing.read_text(encoding='utf-8'))
        data['files'] = [f for f in data['files'] if f.get('group') != 'office']
        listing.write_text(json.dumps(data, separators=(',', ':')), encoding='utf-8')
    (site / '_headers').write_text(''.join(f'{route}\n  Cache-Control: {value}\n' for route, value in HEADERS.items()),
                                   encoding='utf-8')
    count = sum(1 for p in site.rglob('*') if p.is_file())
    print(f'{count} files for Cloudflare Pages')
    if count > 20000:
        sys.exit('Cloudflare Pages takes at most 20,000 files per deployment')


if __name__ == '__main__':
    main(Path(sys.argv[1]))
