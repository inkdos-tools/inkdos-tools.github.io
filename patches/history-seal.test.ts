import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { BLOBS_STORE, DB_NAME } from '../../lib/history/db';
import { getLatestSnapshot, putSnapshot } from '../../lib/history/store';

function raw(): Promise<{ bytes: Uint8Array; sealed?: boolean; byteLength: number }[]> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME);
    request.onsuccess = () => {
      const get = request.result.transaction(BLOBS_STORE).objectStore(BLOBS_STORE).getAll();
      get.onsuccess = () => {
        request.result.close();
        resolve(get.result);
      };
      get.onerror = () => reject(get.error);
    };
    request.onerror = () => reject(request.error);
  });
}

describe('history encryption at rest (InkDOS)', () => {
  it('stores ciphertext and reads the document back', async () => {
    const text = Uint8Array.from(new TextEncoder().encode('Confidential report: quarterly numbers'));
    const doc = await putSnapshot({ title: 'Report.docx', origin: 'local', bytes: text });
    expect(doc?.size).toBe(text.byteLength);
    const [stored] = await raw();
    expect(stored.sealed).toBe(true);
    expect(stored.byteLength).toBe(text.byteLength);
    expect(stored.bytes.byteLength).toBe(text.byteLength + 12 + 16);
    expect(new TextDecoder().decode(stored.bytes)).not.toContain('Confidential');
    const snapshot = await getLatestSnapshot(doc!.id);
    expect(new TextDecoder().decode(snapshot!.bytes)).toBe('Confidential report: quarterly numbers');
    expect(snapshot!.sealed).toBe(false);
  });
});
