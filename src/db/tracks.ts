import { DB_NAME, DB_VERSION, TRACKS_STORE } from '@/lib/constants';
import type { StoredTrack, Track, TrackId } from '@/lib/types';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB is not available in this environment'));
  }
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(TRACKS_STORE)) {
          const store = db.createObjectStore(TRACKS_STORE, { keyPath: 'id' });
          store.createIndex('addedAt', 'addedAt');
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  return dbPromise;
}

function runTransaction<T>(
  mode: IDBTransactionMode,
  handler: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(TRACKS_STORE, mode);
        const request = handler(tx.objectStore(TRACKS_STORE));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      }),
  );
}

export function putTrack(track: StoredTrack): Promise<IDBValidKey> {
  return runTransaction('readwrite', (store) => store.put(track));
}

export function deleteTrack(id: TrackId): Promise<undefined> {
  return runTransaction('readwrite', (store) => store.delete(id));
}

export function clearTracks(): Promise<undefined> {
  return runTransaction('readwrite', (store) => store.clear());
}

export function getAllStoredTracks(): Promise<StoredTrack[]> {
  return runTransaction<StoredTrack[]>('readonly', (store) => store.getAll());
}

/** Convert a stored record into the UI shape, minting object URLs for the blobs. */
export function toTrack(stored: StoredTrack): Track {
  return {
    id: stored.id,
    title: stored.title,
    artist: stored.artist,
    album: stored.album,
    durationSec: stored.durationSec,
    fileName: stored.fileName,
    addedAt: stored.addedAt,
    src: URL.createObjectURL(stored.audio),
    coverUrl: stored.cover ? URL.createObjectURL(stored.cover) : undefined,
  };
}

export function revokeTrack(track: Track): void {
  URL.revokeObjectURL(track.src);
  if (track.coverUrl) URL.revokeObjectURL(track.coverUrl);
}
