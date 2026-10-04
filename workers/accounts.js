/**
 * Admin accounts on the knowledge worker.
 * GitHub is the login that creates the session. A password can be set afterwards.
 * Avatars live in R2. Rows live in D1. The inline editor comes later.
 */
import { adminRole, hashPassword, verifyPassword } from './password.js';
import { openState, randomToken, signState, tokenHash } from './state.js';

const SESSION_MS = 14 * 24 * 60 * 60 * 1000;
const AVATAR_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);
const AVATAR_LIMIT = 600_000;

function json(body, status, headers, extra = {}) {
  const responseHeaders = { ...headers, 'Content-Type': 'application/json', ...extra };
  return new Response(JSON.stringify(body), { status, headers: responseHeaders });
}

function allowedOrigin(origin, env) {
  const allowed = (env.ALLOWED_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  return allowed.includes(origin) ? origin : '';
}

function sessionCookie(token, maxAge) {
  const parts = [
    `builder_session=${encodeURIComponent(token)}`,
    'HttpOnly',
    'Secure',
    'Path=/',
    'SameSite=None',
    `Max-Age=${maxAge}`
  ];
  return parts.join('; ');
}

function clearCookie() {
  return 'builder_session=; HttpOnly; Secure; Path=/; SameSite=None; Max-Age=0';
}

function readToken(request) {
  const header = request.headers.get('Authorization') ?? '';
  const bearer = /^Bearer\s+(\S+)$/i.exec(header);
  if (bearer) return bearer[1];
  const cookie = request.headers.get('Cookie') ?? '';
  const match = /(?:^|;\s*)builder_session=([^;]+)/.exec(cookie);
  return match ? decodeURIComponent(match[1]) : '';
}

function publicUser(row, origin) {
  const custom = row.avatar_key || row.avatar_bytes;
  const avatarUrl = custom
    ? `${origin}/api/auth/avatar/${row.id}?v=${encodeURIComponent(row.updated_at)}`
    : row.github_avatar || '';
  return {
    id: row.id,
    login: row.github_login,
    name: row.name || row.github_login,
    email: row.email || '',
    role: row.role,
    hasPassword: Boolean(row.password_hash),
    avatarUrl
  };
}

export async function sessionUser(request, env) {
  return userFromToken(env, readToken(request));
}

async function userFromToken(env, token) {
  if (!token) return null;
  const hash = await tokenHash(token);
  const now = new Date().toISOString();
  const row = await env.DB.prepare(
    `SELECT users.* FROM sessions
     JOIN users ON users.id = sessions.user_id
     WHERE sessions.token_hash = ? AND sessions.expires_at > ?`
  ).bind(hash, now).first();
  return row ?? null;
}

async function startSession(env, userId, headers) {
  const token = randomToken();
  const expires = new Date(Date.now() + SESSION_MS).toISOString();
  await env.DB.prepare('DELETE FROM sessions WHERE expires_at <= ?').bind(new Date().toISOString()).run();
  await env.DB.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)').bind(await tokenHash(token), userId, expires).run();
  return { token, cookie: sessionCookie(token, Math.floor(SESSION_MS / 1000)), headers };
}

function requireDb(env, headers) {
  if (env.DB && env.SESSION_SECRET) return null;
  return json({ error: 'storage' }, 503, headers);
}

async function githubProfile(token) {
  const headers = {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'User-Agent': 'builder-knowledge'
  };
  const userResponse = await fetch('https://api.github.com/user', { headers });
  if (!userResponse.ok) return null;
  const user = await userResponse.json();
  let email = typeof user.email === 'string' ? user.email : '';
  if (!email) {
    const emailResponse = await fetch('https://api.github.com/user/emails', { headers });
    if (emailResponse.ok) {
      const emails = await emailResponse.json();
      const primary = Array.isArray(emails) ? emails.find((item) => item.primary && item.verified) : null;
      email = primary?.email ?? '';
    }
  }
  return {
    id: String(user.id ?? ''),
    login: String(user.login ?? ''),
    name: typeof user.name === 'string' && user.name ? user.name : String(user.login ?? ''),
    email,
    avatar: typeof user.avatar_url === 'string' ? user.avatar_url : ''
  };
}

export async function handleAccounts(request, env, headers) {
  try {
    return await routeAccounts(request, env, headers);
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'account failed');
    return json({ error: 'account' }, 500, headers);
  }
}

async function routeAccounts(request, env, headers) {
  const url = new URL(request.url);
  if (!url.pathname.startsWith('/api/auth')) return null;
  const missing = requireDb(env, headers);
  if (missing && url.pathname !== '/api/auth/avatar') return missing;

  if (url.pathname === '/api/auth/github' && request.method === 'POST') {
    return beginGithub(request, env, headers);
  }
  if (url.pathname === '/api/auth/github/callback' && request.method === 'GET') {
    return finishGithub(request, env);
  }
  if (url.pathname === '/api/auth/login' && request.method === 'POST') {
    return passwordLogin(request, env, headers);
  }
  if (url.pathname === '/api/auth/logout' && request.method === 'POST') {
    return logout(request, env, headers);
  }
  if (url.pathname === '/api/auth/me' && request.method === 'GET') {
    return me(request, env, headers);
  }
  if (url.pathname === '/api/auth/password' && request.method === 'POST') {
    return setPassword(request, env, headers);
  }
  if (url.pathname === '/api/auth/avatar' && request.method === 'POST') {
    return uploadAvatar(request, env, headers);
  }
  const avatar = /^\/api\/auth\/avatar\/([A-Za-z0-9_-]{1,80})$/.exec(url.pathname);
  if (avatar && request.method === 'GET') {
    return readAvatar(env, headers, avatar[1]);
  }
  return json({ error: 'Not found' }, 404, headers);
}

async function beginGithub(request, env, headers) {
  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
    return json({ error: 'github' }, 503, headers);
  }
  let body = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const origin = allowedOrigin(String(body.origin ?? ''), env);
  if (!origin) return json({ error: 'origin' }, 403, headers);
  const state = await signState({ origin, exp: Date.now() + 10 * 60 * 1000 }, env.SESSION_SECRET);
  const redirectUri = `${new URL(request.url).origin}/api/auth/github/callback`;
  const auth = new URL('https://github.com/login/oauth/authorize');
  auth.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
  auth.searchParams.set('redirect_uri', redirectUri);
  auth.searchParams.set('state', state);
  return json({ url: auth.toString() }, 200, headers);
}

async function finishGithub(request, env) {
  const url = new URL(request.url);
  const state = await openState(url.searchParams.get('state') ?? '', env.SESSION_SECRET ?? '');
  const origin = state ? allowedOrigin(state.origin, env) : '';
  const fail = (code) => Response.redirect(`${origin || 'http://localhost:5173'}/#auth_error=${code}`, 302);
  if (!origin) return fail('state');
  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) return fail('github');
  const code = url.searchParams.get('code') ?? '';
  if (!code) return fail('code');

  const redirectUri = `${url.origin}/api/auth/github/callback`;
  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: redirectUri
    })
  });
  const tokenBody = await tokenResponse.json().catch(() => ({}));
  const profile = tokenBody.access_token ? await githubProfile(tokenBody.access_token) : null;
  if (!profile?.login || !adminRole(profile.login, env.ADMIN_LOGINS)) return fail('denied');

  const now = new Date().toISOString();
  const existing = await env.DB.prepare('SELECT * FROM users WHERE github_login = ? OR github_id = ?').bind(profile.login, profile.id).first();
  let userId = existing?.id;
  if (existing) {
    await env.DB.prepare(
      `UPDATE users
       SET github_id = ?, github_login = ?, email = ?, name = ?, github_avatar = ?, role = 'admin', updated_at = ?
       WHERE id = ?`
    ).bind(profile.id, profile.login, profile.email, profile.name, profile.avatar, now, existing.id).run();
  } else {
    userId = `usr_${crypto.randomUUID().replaceAll('-', '')}`;
    await env.DB.prepare(
      `INSERT INTO users (id, github_id, github_login, email, name, role, github_avatar, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'admin', ?, ?, ?)`
    ).bind(userId, profile.id, profile.login, profile.email, profile.name, profile.avatar, now, now).run();
  }
  const session = await startSession(env, userId, {});
  return new Response(null, {
    status: 302,
    headers: {
      Location: `${origin}/#session=${encodeURIComponent(session.token)}`,
      'Set-Cookie': session.cookie
    }
  });
}

async function passwordLogin(request, env, headers) {
  let body = {};
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Expected JSON' }, 400, headers);
  }
  const login = String(body.login ?? '').trim();
  const password = String(body.password ?? '');
  const row = login
    ? await env.DB.prepare('SELECT * FROM users WHERE github_login = ?').bind(login).first()
    : null;
  if (!row?.password_hash || !adminRole(row.github_login, env.ADMIN_LOGINS)) {
    await hashPassword(password || 'missing');
    return json({ error: 'bad_login' }, 401, headers);
  }
  const ok = await verifyPassword(password, row.password_hash);
  if (!ok) return json({ error: 'bad_login' }, 401, headers);
  const session = await startSession(env, row.id, headers);
  return json({ token: session.token, user: publicUser(row, new URL(request.url).origin) }, 200, headers, {
    'Set-Cookie': session.cookie
  });
}

async function logout(request, env, headers) {
  const token = readToken(request);
  if (token) {
    await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await tokenHash(token)).run();
  }
  return json({ ok: true }, 200, headers, { 'Set-Cookie': clearCookie() });
}

async function me(request, env, headers) {
  const row = await userFromToken(env, readToken(request));
  if (!row) return json({ user: null }, 200, headers);
  return json({ user: publicUser(row, new URL(request.url).origin) }, 200, headers);
}

async function setPassword(request, env, headers) {
  const row = await userFromToken(env, readToken(request));
  if (!row || row.role !== 'admin') return json({ error: 'sign_in' }, 401, headers);
  let body = {};
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Expected JSON' }, 400, headers);
  }
  const password = String(body.password ?? '');
  if (password.length < 10 || password.length > 200) {
    return json({ error: 'short_password' }, 400, headers);
  }
  if (row.password_hash) {
    const current = String(body.current ?? '');
    const ok = await verifyPassword(current, row.password_hash);
    if (!ok) return json({ error: 'bad_current' }, 401, headers);
  }
  const now = new Date().toISOString();
  await env.DB.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?').bind(await hashPassword(password), now, row.id).run();
  return json({ ok: true }, 200, headers);
}

async function uploadAvatar(request, env, headers) {
  const row = await userFromToken(env, readToken(request));
  if (!row || row.role !== 'admin') return json({ error: 'sign_in' }, 401, headers);
  const type = (request.headers.get('Content-Type') ?? '').split(';')[0].trim().toLowerCase();
  if (!AVATAR_TYPES.has(type)) return json({ error: 'bad_image' }, 400, headers);
  const bytes = new Uint8Array(await request.arrayBuffer());
  if (!bytes.byteLength || bytes.byteLength > AVATAR_LIMIT) {
    return json({ error: 'big_image' }, 400, headers);
  }
  const now = new Date().toISOString();
  if (env.AVATARS) {
    const key = `users/${row.id}`;
    await env.AVATARS.put(key, bytes, { httpMetadata: { contentType: type } });
    await env.DB.prepare(
      'UPDATE users SET avatar_key = ?, avatar_bytes = NULL, avatar_type = NULL, updated_at = ? WHERE id = ?'
    ).bind(key, now, row.id).run();
  } else {
    await env.DB.prepare(
      'UPDATE users SET avatar_key = NULL, avatar_bytes = ?, avatar_type = ?, updated_at = ? WHERE id = ?'
    ).bind(bytes, type, now, row.id).run();
  }
  const fresh = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(row.id).first();
  return json({ user: publicUser(fresh, new URL(request.url).origin) }, 200, headers);
}

async function readAvatar(env, headers, id) {
  if (!env.DB) return json({ error: 'storage' }, 503, headers);
  const row = await env.DB.prepare('SELECT avatar_key, avatar_bytes, avatar_type FROM users WHERE id = ?').bind(id).first();
  if (row?.avatar_key && env.AVATARS) {
    const object = await env.AVATARS.get(row.avatar_key);
    if (!object) return json({ error: 'Not found' }, 404, headers);
    return new Response(object.body, {
      headers: {
        ...headers,
        'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
        'Cache-Control': 'private, max-age=300'
      }
    });
  }
  if (!row?.avatar_bytes) return json({ error: 'Not found' }, 404, headers);
  return new Response(row.avatar_bytes, {
    headers: {
      ...headers,
      'Content-Type': row.avatar_type || 'application/octet-stream',
      'Cache-Control': 'private, max-age=300'
    }
  });
}
