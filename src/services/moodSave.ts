import {
  acceptMood,
  acceptMoodBoard,
  type MoodAuthor,
  type MoodComment,
  type MoodParticipant,
  type MoodPiece
} from '../mood/board';
import { readActiveHouseId } from './houseSave';
import { sessionToken, workerBase } from './account';

const KEY = 'builder.mood';
const PARTICIPANT_KEY = 'builder.mood.participant';
const DB_NAME = 'builder-mood';
const STORE = 'clips';
const JSON_BUDGET = 3_200_000;

export interface MoodBoardState {
  title: string;
  createdAt: string;
  pieces: MoodPiece[];
  participants?: MoodParticipant[];
}

export function moodHouseKey() {
  return readActiveHouseId() || 'draft';
}

export function getStoredParticipant(): MoodParticipant | null {
  try {
    const raw = localStorage.getItem(PARTICIPANT_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as unknown;
    if (!data || typeof data !== 'object') return null;
    const rec = data as Record<string, unknown>;
    const id = typeof rec.id === 'string' ? rec.id : '';
    const name = typeof rec.name === 'string' ? rec.name : '';
    const avatar = typeof rec.avatar === 'string' ? rec.avatar : '';
    if (!id || !name || !avatar) return null;
    return {
      id,
      name,
      avatar,
      email: typeof rec.email === 'string' ? rec.email : undefined,
      themes: Array.isArray(rec.themes) ? (rec.themes as string[]) : undefined,
      joinedAt: typeof rec.joinedAt === 'string' ? rec.joinedAt : new Date().toISOString()
    };
  } catch {
    return null;
  }
}

export function saveStoredParticipant(p: MoodParticipant) {
  try {
    localStorage.setItem(PARTICIPANT_KEY, JSON.stringify(p));
  } catch {
    // ignore
  }
}

export function clearStoredParticipant() {
  try {
    localStorage.removeItem(PARTICIPANT_KEY);
    localStorage.removeItem('mood_participant');
  } catch {
    // ignore
  }
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
  const parsed = acceptMoodBoard(raw);
  return {
    title: parsed.title,
    createdAt: parsed.createdAt || (parsed.pieces.length > 0 ? new Date().toISOString() : ''),
    pieces: parsed.pieces,
    ...(parsed.participants ? { participants: parsed.participants } : {})
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
      pieces: acceptMood(content),
      ...(Array.isArray(prev?.participants) ? { participants: prev.participants } : {})
    };
  } else {
    all[houseKey] = {
      title: typeof content.title === 'string' ? content.title.slice(0, 100) : '',
      createdAt: typeof content.createdAt === 'string' && content.createdAt
        ? content.createdAt.slice(0, 50)
        : new Date().toISOString(),
      pieces: acceptMood(content.pieces),
      ...(content.participants ? { participants: content.participants } : {})
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
  // Also persist to Cloudflare database in background
  scheduleCloudflareSave(houseKey, all[houseKey] as MoodBoardState);
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
let pendingState: { houseKey: string; state: MoodBoardState } | null = null;

function scheduleCloudflareSave(houseKey: string, state: MoodBoardState) {
  pendingState = { houseKey, state };
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    if (pendingState) {
      void saveMoodToCloudflare(pendingState.state, pendingState.houseKey);
      pendingState = null;
    }
  }, 400);
}

export async function saveMoodToCloudflare(state: MoodBoardState, houseKey = moodHouseKey()): Promise<boolean> {
  if (!houseKey) return false;
  try {
    const headers = new Headers();
    const token = sessionToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
    headers.set('Content-Type', 'application/json');

    const payload = {
      title: state.title,
      createdAt: state.createdAt,
      pieces: state.pieces,
      participants: state.participants
    };

    const res = await fetch(`${workerBase()}/api/mood/${encodeURIComponent(houseKey)}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(payload)
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function syncMoodWithCloudflare(houseKey = moodHouseKey()): Promise<MoodBoardState | null> {
  if (!houseKey) return null;
  try {
    const headers = new Headers();
    const token = sessionToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);

    const res = await fetch(`${workerBase()}/api/mood/${encodeURIComponent(houseKey)}`, {
      method: 'GET',
      headers
    });
    if (!res.ok) return null;
    const body = (await res.json().catch(() => null)) as { mood?: unknown };
    if (!body || !body.mood) return null;
    const parsed = acceptMoodBoard(body.mood);
    const boardState: MoodBoardState = {
      title: parsed.title,
      createdAt: parsed.createdAt,
      pieces: parsed.pieces,
      ...(parsed.participants ? { participants: parsed.participants } : {})
    };

    // Cache locally as well
    const all = bucket();
    all[houseKey] = boardState;
    try {
      localStorage.setItem(KEY, JSON.stringify(fit(all, houseKey)));
    } catch {
      // ignore
    }

    return boardState;
  } catch {
    return null;
  }
}

export async function togglePieceLikeCloudflare(
  houseKey: string,
  pieceId: string,
  likerId: string
): Promise<{ pieceId: string; likes: number; liked: boolean; likedBy: string[] } | null> {
  if (!houseKey || !pieceId) return null;
  try {
    const headers = new Headers();
    const token = sessionToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
    headers.set('Content-Type', 'application/json');

    const res = await fetch(`${workerBase()}/api/mood/${encodeURIComponent(houseKey)}/like`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ pieceId, likerId })
    });
    if (!res.ok) return null;
    return (await res.json().catch(() => null)) as {
      pieceId: string;
      likes: number;
      liked: boolean;
      likedBy: string[];
    } | null;
  } catch {
    return null;
  }
}

export async function addPieceCommentCloudflare(
  houseKey: string,
  pieceId: string,
  text: string,
  author: MoodAuthor
): Promise<{ pieceId: string; comment: MoodComment; totalComments: number } | null> {
  if (!houseKey || !pieceId || !text.trim()) return null;
  try {
    const headers = new Headers();
    const token = sessionToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
    headers.set('Content-Type', 'application/json');

    const res = await fetch(`${workerBase()}/api/mood/${encodeURIComponent(houseKey)}/comment`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ pieceId, text, author })
    });
    if (!res.ok) return null;
    return (await res.json().catch(() => null)) as {
      pieceId: string;
      comment: MoodComment;
      totalComments: number;
    } | null;
  } catch {
    return null;
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
    const parsed = acceptMoodBoard(value);
    boards[key] = {
      title: parsed.title,
      createdAt: parsed.createdAt,
      pieces: parsed.pieces,
      ...(parsed.participants ? { participants: parsed.participants } : {})
    };
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
