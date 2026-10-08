/**
 * InkDOS: the local history keeps each snapshot's document bytes encrypted at rest (AES-GCM, 256-bit key), as
 * InkDOS keeps its recovery drafts. The key is a non-extractable CryptoKey kept in its own IndexedDB database of
 * this origin: the browser can use it, nothing can read it out. A snapshot written before this change (no
 * `sealed` flag) is still read as it is. If this browser cannot encrypt, a snapshot is kept unencrypted rather
 * than lost (the history is a safety net, see lib/history/db.ts).
 */
import type { HistorySnapshot } from './types';

const KEY_DB = 'document-history-key';
const KEY_STORE = 'keys';
const KEY_ID = 'aes-gcm-256';
const IV_BYTES = 12;

let keyPromise: Promise<CryptoKey | null> | null = null;

function keyDb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') return resolve(null);
    let request: IDBOpenDBRequest;
    try {
      request = indexedDB.open(KEY_DB, 1);
    } catch {
      return resolve(null);
    }
    request.onupgradeneeded = () => request.result.createObjectStore(KEY_STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
    request.onblocked = () => resolve(null);
  });
}

function keyRequest<T>(db: IDBDatabase, mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(KEY_STORE, mode);
    const request = run(tx.objectStore(KEY_STORE));
    let value: T;
    request.onsuccess = () => {
      value = request.result;
    };
    tx.oncomplete = () => resolve(value);
    tx.onerror = tx.onabort = () => reject(tx.error ?? new Error('key store failed'));
  });
}

async function loadKey(): Promise<CryptoKey | null> {
  if (typeof crypto === 'undefined' || !crypto.subtle) return null;
  const db = await keyDb();
  if (!db) return null;
  try {
    const stored = (await keyRequest(db, 'readonly', (store) => store.get(KEY_ID))) as CryptoKey | undefined;
    if (stored) return stored;
    const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    // add, not put: a second tab that raced us keeps its key and we read it back
    try {
      await keyRequest(db, 'readwrite', (store) => store.add(key, KEY_ID));
    } catch {
      // another tab stored one first
    }
    return ((await keyRequest(db, 'readonly', (store) => store.get(KEY_ID))) as CryptoKey | undefined) ?? null;
  } catch {
    return null;
  } finally {
    db.close();
  }
}

function historyKey(): Promise<CryptoKey | null> {
  if (!keyPromise) {
    keyPromise = loadKey().then((key) => {
      if (!key) keyPromise = null; // try again next time
      return key;
    });
  }
  return keyPromise;
}

/** The bytes to store for one snapshot: IV followed by the AES-GCM ciphertext, or the bytes themselves if this
 *  browser cannot encrypt. */
export async function sealHistoryBytes(plain: Uint8Array): Promise<{ bytes: Uint8Array; sealed: boolean }> {
  try {
    const key = await historyKey();
    if (!key) return { bytes: plain, sealed: false };
    const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
    const data = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plain));
    const out = new Uint8Array(IV_BYTES + data.byteLength);
    out.set(iv);
    out.set(data, IV_BYTES);
    return { bytes: out, sealed: true };
  } catch {
    return { bytes: plain, sealed: false };
  }
}

/** A stored snapshot with its document bytes readable again. Throws when an encrypted snapshot cannot be
 *  decrypted (its key is gone), which the callers treat as "no snapshot". */
export async function openHistoryBytes(snapshot: HistorySnapshot): Promise<HistorySnapshot> {
  if (!snapshot.sealed) return snapshot;
  const key = await historyKey();
  if (!key) throw new Error('The history key is not available in this browser.');
  const stored = snapshot.bytes;
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: stored.subarray(0, IV_BYTES) },
    key,
    stored.subarray(IV_BYTES),
  );
  return { ...snapshot, bytes: new Uint8Array(plain), sealed: false };
}
