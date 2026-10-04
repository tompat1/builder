/** The house kept in this browser, and the copy on the signed-in account. */

import { sessionToken, workerBase } from './account';

const HOUSE_KEY = 'builder.house';
const PENDING_KEY = 'builder.house.pending';

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
}

export function markHousePending() {
  localStorage.setItem(PENDING_KEY, '1');
}

export function housePending() {
  return localStorage.getItem(PENDING_KEY) === '1';
}

export function clearHousePending() {
  localStorage.removeItem(PENDING_KEY);
}

/** Keep an edited house across the GitHub redirect. A fresh page still loads the account copy. */
export function keepHouseForLogin(config: unknown, changed: boolean) {
  if (!changed && !localStorage.getItem(HOUSE_KEY)) return;
  writeLocalHouse(config);
}

async function houseFetch(method: 'GET' | 'PUT', config?: unknown) {
  const headers = new Headers();
  const token = sessionToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (method === 'PUT') headers.set('Content-Type', 'application/json');
  const response = await fetch(`${workerBase()}/api/house`, {
    method,
    headers,
    body: method === 'PUT' ? JSON.stringify({ config }) : undefined
  });
  const data = await response.json().catch(() => ({})) as { config?: unknown; error?: string };
  if (!response.ok) throw new Error(data.error || 'house');
  return data;
}

export async function saveRemoteHouse(config: unknown) {
  await houseFetch('PUT', config);
  clearHousePending();
}

export async function loadRemoteHouse() {
  const data = await houseFetch('GET');
  return data.config && typeof data.config === 'object' ? data.config : null;
}
