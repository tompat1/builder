/** Client calls for Trello authorize + house board creation. */

import { sessionToken, workerBase } from './account';
import { trelloCardsFromHouse, type TrelloCardDraft } from '../trello/tasks';

const PENDING_KEY = 'builder.trello.pending';
const INCOMING_TOKEN_KEY = 'builder.trello.incoming';

export interface TrelloBoardLink {
  id: string;
  url: string;
  name: string;
  createdAt: string;
}

export interface TrelloStatus {
  configured: boolean;
  connected: boolean;
  board: TrelloBoardLink | null;
}

export interface TrelloBoardResult {
  ok: boolean;
  existing: boolean;
  board: TrelloBoardLink;
  cardsCreated: number;
}

interface PendingCreate {
  houseId: string;
  name: string;
}

async function trelloFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  const token = sessionToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const response = await fetch(`${workerBase()}${path}`, { ...init, headers });
  const data = await response.json().catch(() => ({}));
  return { response, data: data as Record<string, unknown> };
}

/** Pull a Trello authorize return off the hash (or a stashed incoming token). */
export function takeTrelloTokenFromHash() {
  const stashed = sessionStorage.getItem(INCOMING_TOKEN_KEY) || '';
  if (stashed) sessionStorage.removeItem(INCOMING_TOKEN_KEY);

  const raw = window.location.hash.replace(/^#/, '');
  if (!raw && !stashed) return { token: '', error: '' };
  const hash = raw ? new URLSearchParams(raw.includes('=') ? raw : `token=${raw}`) : null;
  // Trello may return #token=… or #error=…
  const token = ((hash?.get('token') || '') || stashed).trim();
  const error = (hash?.get('error') || '').trim();
  const looksLikeTrello = Boolean(stashed)
    || Boolean(hash && (hash.has('token') || hash.has('error')));
  if (!looksLikeTrello) return { token: '', error: '' };
  if (token || error) {
    const next = `${window.location.pathname}${window.location.search}`;
    window.history.replaceState(null, '', next);
  }
  return { token, error };
}

/** Keep a Trello return off the route hash before the router reads the URL. */
export function acceptTrelloReturn() {
  const landed = takeTrelloTokenFromHash();
  if (landed.token) sessionStorage.setItem(INCOMING_TOKEN_KEY, landed.token);
  return landed;
}

export function rememberTrelloPending(houseId: string, name: string) {
  const pending: PendingCreate = { houseId, name };
  sessionStorage.setItem(PENDING_KEY, JSON.stringify(pending));
}

export function readTrelloPending(): PendingCreate | null {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as PendingCreate;
    if (!data?.houseId || typeof data.houseId !== 'string') return null;
    return { houseId: data.houseId, name: typeof data.name === 'string' ? data.name : '' };
  } catch {
    return null;
  }
}

export function clearTrelloPending() {
  sessionStorage.removeItem(PENDING_KEY);
}

export async function trelloStatus(houseId?: string): Promise<TrelloStatus> {
  const query = houseId ? `?houseId=${encodeURIComponent(houseId)}` : '';
  const { response, data } = await trelloFetch(`/api/trello/status${query}`);
  if (!response.ok) {
    return { configured: false, connected: false, board: null };
  }
  const board = data.board && typeof data.board === 'object'
    ? (data.board as TrelloBoardLink)
    : null;
  return {
    configured: Boolean(data.configured),
    connected: Boolean(data.connected),
    board
  };
}

export async function beginTrelloAuthorize(returnPath: '/build' | '/mood' = '/build') {
  const { response, data } = await trelloFetch('/api/trello/authorize', {
    method: 'POST',
    body: JSON.stringify({ origin: window.location.origin, returnPath })
  });
  if (!response.ok || typeof data.url !== 'string' || !data.url) {
    throw new Error(typeof data.error === 'string' ? data.error : 'trello');
  }
  window.location.assign(data.url);
}

export async function saveTrelloToken(token: string) {
  const { response, data } = await trelloFetch('/api/trello/token', {
    method: 'POST',
    body: JSON.stringify({ token })
  });
  if (!response.ok) throw new Error(typeof data.error === 'string' ? data.error : 'token');
}

export async function disconnectTrello() {
  await trelloFetch('/api/trello/token', { method: 'DELETE' });
}

export async function createHouseTrelloBoard(input: {
  houseId: string;
  name: string;
  locale: 'sv' | 'en';
  notes: Array<{ text?: string; link?: { kind?: string; wall?: string; slotId?: string } }>;
  config: Record<string, unknown>;
  force?: boolean;
  cards?: TrelloCardDraft[];
}): Promise<TrelloBoardResult> {
  const cards = input.cards ?? trelloCardsFromHouse({
    name: input.name,
    locale: input.locale,
    notes: input.notes,
    config: input.config
  });
  const { response, data } = await trelloFetch('/api/trello/boards', {
    method: 'POST',
    body: JSON.stringify({
      houseId: input.houseId,
      name: input.name,
      cards,
      force: Boolean(input.force)
    })
  });
  if (!response.ok || !data.board || typeof data.board !== 'object') {
    throw new Error(typeof data.error === 'string' ? data.error : 'board');
  }
  return {
    ok: Boolean(data.ok),
    existing: Boolean(data.existing),
    board: data.board as TrelloBoardLink,
    cardsCreated: Number(data.cardsCreated) || 0
  };
}
