/** Named houses kept on the signed-in account, plus one local copy of the open design. */

import { sessionToken, workerBase } from './account';
import { accountHouseConfig, chooseWorkingHouse, type ActiveHouseData } from './houseSync';

export { accountHouseConfig, chooseWorkingHouse };

const HOUSE_KEY = 'builder.house';
const PENDING_KEY = 'builder.house.pending';
const ACTIVE_KEY = 'builder.house.active';
const LOCAL_AT_KEY = 'builder.house.localAt';
const SYNCED_AT_KEY = 'builder.house.syncedAt';
const ACTIVE_EVENT = 'builder:house-active';

export function acceptActiveHouseId(value: unknown) {
  const id = typeof value === 'string' ? value : '';
  return /^hus_[a-zA-Z0-9_-]{16,64}$/.test(id) ? id : '';
}

export function readActiveHouseId() {
  return acceptActiveHouseId(localStorage.getItem(ACTIVE_KEY));
}

export function writeActiveHouseId(id: string) {
  const accepted = acceptActiveHouseId(id);
  if (accepted) localStorage.setItem(ACTIVE_KEY, accepted);
  else localStorage.removeItem(ACTIVE_KEY);
  window.dispatchEvent(new Event(ACTIVE_EVENT));
}

/** Same-tab writers and other tabs both move the active house. */
export function watchActiveHouseId(onChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key !== ACTIVE_KEY && event.key !== null) return;
    onChange();
  };
  window.addEventListener('storage', onStorage);
  window.addEventListener(ACTIVE_EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(ACTIVE_EVENT, onChange);
  };
}

export interface SavedHouse {
  id: string;
  name: string;
  createdAt: string;
  createdBy: string;
  areaSqMeters?: number | null;
  thumb?: string;
  config?: unknown;
}

export interface PendingHouse {
  name: string;
  config: unknown;
}

export function readLocalHouse(): unknown | null {
  try {
    const raw = localStorage.getItem(HOUSE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as unknown;
    return data && typeof data === 'object' ? data : null;
  } catch {
    return null;
  }
}

export function writeLocalHouse(config: unknown) {
  localStorage.setItem(HOUSE_KEY, JSON.stringify(config));
  localStorage.setItem(LOCAL_AT_KEY, new Date().toISOString());
}

/** This browser has an edit that has not reached the account yet. A missing sync time means the local copy has never been uploaded. */
export function localHouseNeedsUpload() {
  const { localAt, syncedAt } = readHouseStamps();
  if (!localAt) return false;
  return !syncedAt || localAt > syncedAt;
}

export function readHouseStamps() {
  return {
    localAt: localStorage.getItem(LOCAL_AT_KEY) || '',
    syncedAt: localStorage.getItem(SYNCED_AT_KEY) || ''
  };
}

function markHouseSynced(stamp: string) {
  if (stamp) localStorage.setItem(SYNCED_AT_KEY, stamp);
}

/** The open house matches the account copy, so the next visit can take a newer one. */
export function noteHouseSynced() {
  markHouseSynced(localStorage.getItem(LOCAL_AT_KEY) || '');
}

export function markHousePending(name: string, config: unknown) {
  const pending: PendingHouse = { name, config };
  localStorage.setItem(PENDING_KEY, JSON.stringify(pending));
}

export function readPendingHouse(): PendingHouse | null {
  const raw = localStorage.getItem(PENDING_KEY);
  if (!raw) return null;
  if (raw === '1') {
    const config = readLocalHouse();
    return config ? { name: '', config } : null;
  }
  try {
    const data = JSON.parse(raw) as PendingHouse;
    if (!data || typeof data.name !== 'string' || !data.config || typeof data.config !== 'object') return null;
    return data;
  } catch {
    return null;
  }
}

export function housePending() {
  return readPendingHouse() != null;
}

export function clearHousePending() {
  localStorage.removeItem(PENDING_KEY);
}

/** Keep an edited house across the GitHub redirect. A fresh page still loads the account copy. */
export function keepHouseForLogin(config: unknown, changed: boolean) {
  if (!changed && !localStorage.getItem(HOUSE_KEY)) return;
  writeLocalHouse(config);
}

async function houseFetch(path: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE', body?: unknown) {
  const headers = new Headers();
  const token = sessionToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (body) headers.set('Content-Type', 'application/json');
  const response = await fetch(`${workerBase()}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await response.json().catch(() => ({})) as {
    houses?: SavedHouse[];
    house?: SavedHouse;
    error?: string;
  };
  if (!response.ok) throw new Error(data.error || 'house');
  return data;
}

export async function listHouses() {
  const data = await houseFetch('/api/houses', 'GET');
  return Array.isArray(data.houses) ? data.houses : [];
}

export async function saveNamedHouse(name: string, config: unknown) {
  const data = await houseFetch('/api/houses', 'POST', { name, config });
  clearHousePending();
  if (!data.house) throw new Error('house');
  return data.house;
}

export async function openNamedHouse(id: string) {
  const data = await houseFetch(`/api/houses/${encodeURIComponent(id)}`, 'GET');
  if (!data.house?.config || typeof data.house.config !== 'object') throw new Error('house');
  return data.house;
}

export async function updateNamedHouse(id: string, config: unknown) {
  if (!acceptActiveHouseId(id)) throw new Error('house');
  try {
    await houseFetch(`/api/houses/${encodeURIComponent(id)}`, 'PUT', { config });
  } catch {
    await houseFetch(`/api/houses/${encodeURIComponent(id)}`, 'POST', { config });
  }
}

export async function renameNamedHouse(id: string, name: string) {
  if (!acceptActiveHouseId(id)) throw new Error('house');
  try {
    await houseFetch(`/api/houses/${encodeURIComponent(id)}`, 'PUT', { name });
  } catch {
    await houseFetch(`/api/houses/${encodeURIComponent(id)}`, 'POST', { name });
  }
}

export async function removeNamedHouse(id: string) {
  await houseFetch(`/api/houses/${encodeURIComponent(id)}`, 'DELETE');
}

export async function getActiveHouse(): Promise<ActiveHouseData | null> {
  const token = sessionToken();
  if (!token) return null;
  try {
    const data = (await houseFetch('/api/houses/active', 'GET')) as { active?: ActiveHouseData | null };
    return data.active || null;
  } catch {
    return null;
  }
}

export async function saveActiveHouse(config: unknown, activeId?: string, name?: string): Promise<boolean> {
  const token = sessionToken();
  if (!token) return false;
  const stamp = localStorage.getItem(LOCAL_AT_KEY) || '';
  try {
    await houseFetch('/api/houses/active', 'PUT', {
      config,
      activeId,
      name,
      locale: readAccountLocale()
    });
    markHouseSynced(stamp);
    return true;
  } catch {
    return false;
  }
}

function readAccountLocale() {
  try {
    const saved = localStorage.getItem('builder.locale');
    if (saved === 'en' || saved === 'sv') return saved;
  } catch {
    /* Swedish stays the default when storage is blocked. */
  }
  return 'sv';
}

/** Keep the language with the account so the next device opens in the same language. */
export function saveAccountLocale() {
  const config = readLocalHouse();
  if (!config) return;
  void saveActiveHouse(config, readActiveHouseId() || undefined);
}
