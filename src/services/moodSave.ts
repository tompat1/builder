/** Mood boards live beside the house file. Pictures stay small; clips stay in IndexedDB. */

import { acceptMood, type MoodPiece } from '../mood/board';
import { readActiveHouseId } from './houseSave';

const KEY = 'builder.mood';
const DB_NAME = 'builder-mood';
const STORE = 'clips';
const JSON_BUDGET = 3_200_000;

export interface MoodBoardState {
  title: string;
  createdAt: string;
  pieces: MoodPiece[];
}

export function moodHouseKey() {
  return readActiveHouseId() || 'draft';
}

export function hasMoodBoard(houseKey: string): boolean {
  if (!houseKey) return false;
  const all = bucket();
  const raw = all[houseKey];
  if (isMoodNonEmpty(raw)) return true;
  if (houseKey === readActiveHouseId() && isMoodNonEmpty(all['draft'])) return true;
  return false;
}

export function linkDraftMoodToHouse(houseId: string) {
  if (!houseId) return;
  const all = bucket();
  if (isMoodNonEmpty(all['draft']) && !isMoodNonEmpty(all[houseId])) {
    all[houseId] = all['draft'];
    try {
      localStorage.setItem(KEY, JSON.stringify(fit(all, houseId)));
    } catch {
      // ignore
    }
  }
}

function isMoodNonEmpty(raw: unknown): boolean {
  if (!raw) return false;
  if (Array.isArray(raw)) return raw.length > 0;
  if (raw && typeof raw === 'object') {
    const rec = raw as Record<string, unknown>;
    if (Array.isArray(rec.pieces) && rec.pieces.length > 0) return true;
    if (typeof rec.title === 'string' && rec.title.trim().length > 0) return true;
  }
  return false;
}

export function loadMood(houseKey = moodHouseKey()): MoodBoardState {
  const all = bucket();
  const raw = all[houseKey];
  if (Array.isArray(raw)) {
    return {
      title: '',
      createdAt: raw.length > 0 ? new Date().toISOString() : '',
      pieces: acceptMood(raw)
    };
  }
  if (raw && typeof raw === 'object') {
    const rec = raw as Record<string, unknown>;
    return {
      title: typeof rec.title === 'string' ? rec.title.slice(0, 100) : '',
      createdAt: typeof rec.createdAt === 'string' ? rec.createdAt.slice(0, 50) : '',
      pieces: acceptMood(rec.pieces)
    };
  }
  return {
    title: '',
    createdAt: '',
    pieces: []
  };
}

export function saveMood(content: MoodBoardState | MoodPiece[], houseKey = moodHouseKey()) {
  const all = bucket();
  if (Array.isArray(content)) {
    const prev = all[houseKey] as Record<string, unknown> | undefined;
    all[houseKey] = {
      title: prev && typeof prev.title === 'string' ? prev.title : '',
      createdAt: prev && typeof prev.createdAt === 'string' && prev.createdAt
        ? prev.createdAt
        : (content.length > 0 ? new Date().toISOString() : ''),
      pieces: acceptMood(content)
    };
  } else {
    all[houseKey] = {
      title: typeof content.title === 'string' ? content.title.slice(0, 100) : '',
      createdAt: typeof content.createdAt === 'string' && content.createdAt
        ? content.createdAt.slice(0, 50)
        : new Date().toISOString(),
      pieces: acceptMood(content.pieces)
    };
  }
  try {
    localStorage.setItem(KEY, JSON.stringify(fit(all, houseKey)));
  } catch {
    try {
      const slim = fit(all, houseKey);
      for (const key of Object.keys(slim)) {
        if (key === houseKey) continue;
        slim[key].pieces = slim[key].pieces.filter((piece) => !piece.src.startsWith('data:'));
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

function fit(all: Record<string, unknown>, keep: string): Record<string, MoodBoardState> {
  const boards: Record<string, MoodBoardState> = {};
  for (const [key, value] of Object.entries(all)) {
    if (Array.isArray(value)) {
      boards[key] = { title: '', createdAt: '', pieces: acceptMood(value) };
    } else if (value && typeof value === 'object') {
      const rec = value as Record<string, unknown>;
      boards[key] = {
        title: typeof rec.title === 'string' ? rec.title.slice(0, 100) : '',
        createdAt: typeof rec.createdAt === 'string' ? rec.createdAt.slice(0, 50) : '',
        pieces: acceptMood(rec.pieces)
      };
    } else {
      boards[key] = { title: '', createdAt: '', pieces: [] };
    }
  }
  const keys = Object.keys(boards);
  while (JSON.stringify(boards).length > JSON_BUDGET) {
    const donor = keys.find((key) => key !== keep && boards[key].pieces.some((piece) => piece.src.startsWith('data:')))
      ?? (boards[keep].pieces.some((piece) => piece.src.startsWith('data:')) ? keep : '');
    if (!donor) break;
    const index = boards[donor].pieces.findIndex((piece) => piece.src.startsWith('data:'));
    if (index < 0) break;
    boards[donor].pieces.splice(index, 1);
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
