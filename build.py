#!/usr/bin/env python3
"""Build the InkDOS full office suite (beta) site: ranuts/document at the commit pinned in office.json.

The site is served at the root of https://inkdos-tools.github.io/ (the upstream build uses root-absolute
paths), the same origin as the other InkDOS tools (https://inkdos-tools.github.io/InkDOS-tools/) and a
different one from InkDOS. Changes to the upstream build, all in its output, are listed in apply_patches().

    python build.py --out _site
"""
from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
TOOL = json.loads((ROOT / 'office.json').read_text(encoding='utf-8'))
# no page of this site may reach another site (the editor's optional AI assistants call outside APIs)
CSP = ("connect-src 'self' data: blob:; frame-src 'self' blob:; form-action 'none'; object-src 'none'; "
       "base-uri 'self'")
CSP_META = f'<meta http-equiv="Content-Security-Policy" content="{CSP}" data-inkdos-office>'


def run(cmd: list[str], cwd: Path, env: dict | None = None) -> None:
    print('+', ' '.join(cmd), flush=True)
    subprocess.run(cmd, cwd=cwd, check=True, env={**os.environ, **(env or {})})


def fetch(work: Path, name: str = 'document', repo: str = TOOL['repo'], ref: str = TOOL['ref']) -> Path:
    src = work / name
    if (src / '.git').exists():
        head = subprocess.run(['git', 'rev-parse', 'HEAD'], cwd=src, capture_output=True, text=True).stdout.strip()
        if head == ref:
            return src
        shutil.rmtree(src)
    src.mkdir(parents=True)
    run(['git', 'init', '-q'], src)
    run(['git', 'remote', 'add', 'origin', repo], src)
    run(['git', 'fetch', '-q', '--depth', '1', 'origin', ref], src)
    run(['git', 'checkout', '-q', 'FETCH_HEAD'], src)
    return src


def patch(file: Path, edits: list[tuple[str, str]]) -> None:
    """Exact replacements; fail loudly if upstream no longer matches."""
    text = file.read_text(encoding='utf-8')
    for old, new in edits:
        if new in text:
            continue
        if text.count(old) != 1:
            sys.exit(f'{file}: expected exactly one occurrence of {old!r}')
        text = text.replace(old, new)
    file.write_text(text, encoding='utf-8')


def apply_patches(out: Path) -> None:
    # 1. The x2t converter is shipped brotli-compressed under x2t.wasm.br and needs the server to declare
    #    Content-Encoding: br, which GitHub Pages cannot send: ship it decompressed as x2t.wasm instead.
    br = out / 'sdkjs' / 'common' / 'wasm' / 'x2t' / 'x2t.wasm.br'
    run(['node', '-e', "const z=require('zlib'),f=require('fs');f.writeFileSync(process.argv[2],z.brotliDecompressSync(f.readFileSync(process.argv[1])))",
         str(br), str(br.with_suffix(''))], out)
    br.unlink()
    renamed = 0
    for path in out.rglob('*'):
        if path.suffix in ('.js', '.mjs', '.html') and path.is_file():
            text = path.read_text(encoding='utf-8', errors='surrogateescape')
            if 'x2t.wasm.br' in text:
                path.write_text(text.replace('x2t.wasm.br', 'x2t.wasm'), encoding='utf-8', errors='surrogateescape')
                renamed += 1
    if renamed < 3:
        sys.exit(f'x2t.wasm.br referenced from {renamed} files only; upstream changed')
    # 2. The service worker lives at the root of an origin it shares with the other InkDOS tools: it must not
    #    handle their requests nor delete their caches (upstream deletes every cache but its own on activate).
    patch(out / 'sw.js', [
        ("  const url = new URL(event.request.url);\n\n  // 1. Only handle GET requests",
         "  const url = new URL(event.request.url);\n\n"
         "  // InkDOS: other sites share this origin (/InkDOS-tools/); their requests are not this worker's\n"
         "  if (/^\\/InkDOS[^/]*\\//i.test(url.pathname)) return;\n\n  // 1. Only handle GET requests"),
        ("            if (cacheName !== CORE_CACHE && cacheName !== RUNTIME_CACHE) {",
         "            // InkDOS: only this editor's own caches; the other tools on this origin keep theirs\n"
         "            if (cacheName.startsWith('document-editor-') && cacheName !== CORE_CACHE && cacheName !== RUNTIME_CACHE) {"),
    ])
    # 3. Every page: no request to another site (see CSP)
    pages = 0
    for page in out.rglob('*.html'):
        text = page.read_text(encoding='utf-8', errors='surrogateescape')
        if 'data-inkdos-office' in text:
            continue
        lower = text.lower()
        at = lower.find('<head')
        if at >= 0:
            end = text.find('>', at) + 1
            text = text[:end] + CSP_META + text[end:]
        else:
            text = CSP_META + text
        page.write_text(text, encoding='utf-8', errors='surrogateescape')
        pages += 1
    # 4. Host configuration for Cloudflare Pages has no meaning here
    for name in ('_headers', '_redirects'):
        (out / name).unlink(missing_ok=True)
    print(f'patched: x2t.wasm in {renamed} files, service worker, CSP on {pages} pages', flush=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('--out', default='_site')
    parser.add_argument('--work', default='.work')
    args = parser.parse_args()
    out, work = Path(args.out).resolve(), Path(args.work).resolve()
    work.mkdir(parents=True, exist_ok=True)
    src = fetch(work)
    pnpm = ['npx', '-y', f"pnpm@{TOOL['pnpm']}"]
    # InkDOS look: the editor's light chrome is the flat white theme instead of the classic coloured header
    patch(src / 'lib' / 'onlyoffice' / 'ui-theme.ts', [
        ("export const DEFAULT_UI_THEME = 'theme-classic-light';", "export const DEFAULT_UI_THEME = 'theme-white';"),
    ])
    # Local history (recent files): the document bytes of every snapshot are kept encrypted at rest (AES-GCM 256,
    # non-extractable key in this origin's IndexedDB), as InkDOS keeps its recovery drafts (patches/history-seal.ts).
    # Snapshots stored before stay readable. Upstream's history tests and ours run before the build.
    shutil.copy2(ROOT / 'patches' / 'history-seal.ts', src / 'lib' / 'history' / 'seal.ts')
    shutil.copy2(ROOT / 'patches' / 'history-seal.test.ts', src / 'test' / 'unit' / 'history-seal.test.ts')
    patch(src / 'lib' / 'history' / 'types.ts', [
        ("  bytes: Uint8Array;\n  byteLength: number;\n}",
         "  bytes: Uint8Array;\n  byteLength: number;\n"
         "  /** InkDOS: `bytes` is IV + AES-GCM ciphertext (lib/history/seal.ts); byteLength stays the document's size. */\n"
         "  sealed?: boolean;\n}"),
    ])
    patch(src / 'lib' / 'history' / 'store.ts', [
        ("import type { HistoryDoc, HistoryOrigin, HistorySnapshot } from './types';",
         "import type { HistoryDoc, HistoryOrigin, HistorySnapshot } from './types';\n"
         "import { openHistoryBytes, sealHistoryBytes } from './seal';"),
        ("async function writeSnapshot(payload: Uint8Array, input: SnapshotInput, budget: number): Promise<HistoryDoc | null> {\n"
         "  const byteLength = payload.byteLength;",
         "async function writeSnapshot(\n  payload: Uint8Array,\n  input: SnapshotInput,\n  budget: number,\n  sealed = false,\n"
         "  byteLength = payload.byteLength,\n): Promise<HistoryDoc | null> {"),
        ("const snapshot: HistorySnapshot = { docId: doc.id, rev, savedAt: now, bytes: payload, byteLength };",
         "const snapshot: HistorySnapshot = { docId: doc.id, rev, savedAt: now, bytes: payload, byteLength, ...(sealed ? { sealed } : {}) };"),
        ("  const payload = await toBytes(input.bytes);\n  try {\n    return await writeSnapshot(payload, input, budget);",
         "  const plain = await toBytes(input.bytes);\n"
         "  // InkDOS: encrypted before the transaction (an await on anything but IndexedDB would end it)\n"
         "  const { bytes: payload, sealed } = await sealHistoryBytes(plain);\n"
         "  try {\n    return await writeSnapshot(payload, input, budget, sealed, plain.byteLength);"),
        ("    try {\n      return await writeSnapshot(payload, input, budget);\n    } catch {",
         "    try {\n      return await writeSnapshot(payload, input, budget, sealed, plain.byteLength);\n    } catch {"),
        ("        return rows.sort((a, b) => b.rev - a.rev)[0];\n      })) ?? null",
         "        return rows.sort((a, b) => b.rev - a.rev)[0];\n      }).then((row) => (row ? openHistoryBytes(row) : null))) ?? null"),
    ])
    run([*pnpm, 'install', '--frozen-lockfile'], src)
    run([*pnpm, 'exec', 'vitest', 'run', 'test/unit/history-seal.test.ts', 'test/unit/history-store.test.ts',
         'test/unit/history-recovery.test.ts'], src)
    run([*pnpm, 'run', 'build'], src)
    if out.exists():
        shutil.rmtree(out)
    shutil.copytree(src / 'dist', out)
    # InkDOS Office Home (site/) in place of the upstream landing page, with the InkDOS PDF, Plain Text and EPUB
    # workspaces (and what they load: shared/, labs/pdf/, the Home look) from the InkDOS commit pinned in office.json
    inkdos = TOOL['inkdos']
    ink = fetch(work, 'inkdos', inkdos['repo'], inkdos['ref'])
    for rel in inkdos['paths']:
        source, target = ink / rel, out / rel
        if source.is_dir():
            shutil.copytree(source, target, dirs_exist_ok=True)
        else:
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source, target)
    shutil.copy2(ink / 'LICENSE', out / 'INKDOS-LICENSE.txt')
    for item in (ROOT / 'site').iterdir():
        shutil.copy2(item, out / item.name)
    apply_patches(out)
    shutil.copy2(src / TOOL['license_file'], out / 'UPSTREAM-LICENSE.txt')
    (out / 'UPSTREAM-SOURCE.txt').write_text(
        f"{TOOL['name']}\n{TOOL['repo']}\ncommit {TOOL['ref']}\nlicense {TOOL['license']}\n"
        'changes: see build.py on the source branch of https://github.com/inkdos-tools/inkdos-tools.github.io\n',
        encoding='utf-8')
    (out / '.nojekyll').write_text('', encoding='utf-8')


if __name__ == '__main__':
    main()
