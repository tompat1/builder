/** Mood boards live beside the house file. Pictures stay small; clips stay in IndexedDB. */

import { acceptMood, type MoodPiece } from '../mood/board';
import { readActiveHouseId } from './houseSave';

const KEY = 'builder.mood';
const DB_NAME = 'builder-mood';
const STORE = 'clips';
const JSON_BUDGET = 3_200_000;

export function moodHouseKey() {
  return readActiveHouseId() || 'draft';
}

export function loadMood(houseKey = moodHouseKey()) {
  const all = bucket();
  return acceptMood(all[houseKey]);
}

export function saveMood(pieces: MoodPiece[], houseKey = moodHouseKey()) {
  const all = bucket();
  all[houseKey] = acceptMood(pieces);
  try {
    localStorage.setItem(KEY, JSON.stringify(fit(all, houseKey)));
  } catch {
    try {
      const slim = fit(all, houseKey);
      for (const key of Object.keys(slim)) {
        if (key === houseKey) continue;
        slim[key] = slim[key].filter((piece) => !piece.src.startsWith('data:'));
      }
      localStorage.setItem(KEY, JSON.stringify(slim));
    } catch {
      // The board stays on screen even when the browser refuses the copy.
    }
  }
}

export function putClip(id: string, blob: Blob) {
  return withStore('readwrite', (store) => store.put({ id, blob }));
}

export function getClip(id: string): Promise<Blob | null> {
  return withStore('readonly', (store) => store.get(id)).then((row) => {
    const record = row as { blob?: Blob } | undefined;
    return record?.blob instanceof Blob ? record.blob : null;
  });
}

export function deleteClip(id: string) {
  return withStore('readwrite', (store) => store.delete(id));
}

function bucket(): Record<string, unknown> {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return parsed as Record<string, unknown>;
  } catch {
    return {};
  }
}

function fit(all: Record<string, unknown>, keep: string) {
  const boards: Record<string, MoodPiece[]> = {};
  for (const [key, value] of Object.entries(all)) boards[key] = acceptMood(value);
  const keys = Object.keys(boards);
  while (JSON.stringify(boards).length > JSON_BUDGET) {
    const donor = keys.find((key) => key !== keep && boards[key].some((piece) => piece.src.startsWith('data:')))
      ?? (boards[keep].some((piece) => piece.src.startsWith('data:')) ? keep : '');
    if (!donor) break;
    const index = boards[donor].findIndex((piece) => piece.src.startsWith('data:'));
    if (index < 0) break;
    boards[donor].splice(index, 1);
  }
  return boards;
}

function withStore(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest) {
  return new Promise<unknown>((resolve, reject) => {
    const open = indexedDB.open(DB_NAME, 1);
    open.onupgradeneeded = () => {
      const db = open.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' });
    };
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const db = open.result;
      const tx = db.transaction(STORE, mode);
      const request = run(tx.objectStore(STORE));
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      tx.oncomplete = () => db.close();
    };
  });
}
