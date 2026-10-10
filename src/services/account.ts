const TOKEN_KEY = 'builder.session';

export interface AccountUser {
  id: string;
  login: string;
  name: string;
  email: string;
  role: 'admin' | 'member';
  hasPassword: boolean;
  avatarUrl: string;
}

export function workerBase() {
  const configured = import.meta.env.VITE_CLOUDFLARE_WORKER_URL as string | undefined;
  return (configured || 'https://builder-knowledge.thomasrynell.workers.dev').replace(/\/$/, '');
}

export function sessionToken() {
  return sessionStorage.getItem(TOKEN_KEY) ?? '';
}

export function saveSession(token: string) {
  if (token) sessionStorage.setItem(TOKEN_KEY, token);
  else sessionStorage.removeItem(TOKEN_KEY);
}

/** Read the token GitHub sent back in the URL hash, then remove it. */
export function takeSessionFromHash() {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const token = hash.get('session') ?? '';
  const error = hash.get('auth_error') ?? '';
  if (token || error) {
    if (token) saveSession(token);
    const next = `${window.location.pathname}${window.location.search}`;
    window.history.replaceState(null, '', next);
  }
  return { token: token || sessionToken(), error };
}

/** Keep a GitHub return off the route hash before the router reads the URL. */
export function acceptGithubReturn() {
  const landed = takeSessionFromHash();
  if (!landed.error) return landed;
  const next = new URL('/login', window.location.origin);
  next.searchParams.set('auth_error', landed.error);
  window.history.replaceState(null, '', `${next.pathname}${next.search}`);
  return landed;
}

async function accountFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  const token = sessionToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(`${workerBase()}${path}`, { ...init, headers });
  const data = await response.json().catch(() => ({}));
  return { response, data: data as { error?: string; url?: string; token?: string; user?: AccountUser | null; ok?: boolean } };
}

export async function accountMe() {
  const { data } = await accountFetch('/api/auth/me');
  return data.user ?? null;
}

export async function beginGithubLogin() {
  const { response, data } = await accountFetch('/api/auth/github', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ origin: window.location.origin })
  });
  if (!response.ok || !data.url) throw new Error(data.error || 'github');
  window.location.assign(data.url);
}

export async function registerAccount(login: string, password: string, name: string) {
  const { response, data } = await accountFetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login, password, name })
  });
  if (!response.ok || !data.token || !data.user) throw new Error(data.error || 'bad_name');
  saveSession(data.token);
  return data.user;
}

export async function loginWithPassword(login: string, password: string) {
  const { response, data } = await accountFetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login, password })
  });
  if (!response.ok || !data.token || !data.user) throw new Error(data.error || 'bad_login');
  saveSession(data.token);
  return data.user;
}

export async function logoutAccount() {
  try {
    await accountFetch('/api/auth/logout', { method: 'POST' });
  } finally {
    saveSession('');
  }
}

export async function savePassword(password: string, current: string) {
  const { response, data } = await accountFetch('/api/auth/password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password, current })
  });
  if (!response.ok) throw new Error(data.error || 'short_password');
}

export async function saveAvatar(file: File) {
  const { response, data } = await accountFetch('/api/auth/avatar', {
    method: 'POST',
    headers: { 'Content-Type': file.type },
    body: file
  });
  if (!response.ok || !data.user) throw new Error(data.error || 'bad_image');
  return data.user;
}
