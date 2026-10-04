/** Stored copy and pictures. The page still owns the original text. */

const TEXT_LIMIT = 8_000;
const IMAGE_LIMIT = 600_000;

export function contentKey(locale, key) {
  if (locale !== 'sv' && locale !== 'en') return null;
  if (!/^[a-z0-9._-]{1,96}$/i.test(String(key ?? ''))) return null;
  return `${locale}:${key}`;
}

export function acceptEntry(entry) {
  const key = contentKey(entry?.locale, entry?.key);
  if (!key) return null;
  if (entry.kind === 'text') {
    const value = String(entry.value ?? '');
    if (value.length > TEXT_LIMIT) return null;
    return { key, kind: 'text', value };
  }
  if (entry.kind === 'image') {
    const value = String(entry.value ?? '');
    if (!/^data:image\/(png|jpeg|webp);base64,/.test(value) || value.length > IMAGE_LIMIT) return null;
    return { key, kind: 'image', value };
  }
  return null;
}

export async function handleContent(request, env, headers, sessionUser) {
  const url = new URL(request.url);
  if (url.pathname !== '/api/content') {
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...headers, 'Content-Type': 'application/json' }
    });
  }
  if (!env.DB) {
    return new Response(JSON.stringify({ error: 'storage' }), {
      status: 503,
      headers: { ...headers, 'Content-Type': 'application/json' }
    });
  }
  if (request.method === 'GET') return listContent(env, headers);
  if (request.method === 'POST') return saveContent(request, env, headers, sessionUser);
  return new Response(JSON.stringify({ error: 'Not found' }), {
    status: 404,
    headers: { ...headers, 'Content-Type': 'application/json' }
  });
}

async function listContent(env, headers) {
  const result = await env.DB.prepare('SELECT key, kind, value FROM content').all();
  const entries = {};
  for (const row of result.results ?? []) entries[row.key] = { kind: row.kind, value: row.value };
  return new Response(JSON.stringify({ entries }), {
    headers: { ...headers, 'Content-Type': 'application/json' }
  });
}

async function saveContent(request, env, headers, sessionUser) {
  const user = await sessionUser(request, env);
  if (!user || user.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'sign_in' }), {
      status: 401,
      headers: { ...headers, 'Content-Type': 'application/json' }
    });
  }
  let body = {};
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Expected JSON' }), {
      status: 400,
      headers: { ...headers, 'Content-Type': 'application/json' }
    });
  }
  const incoming = Array.isArray(body.entries) ? body.entries.slice(0, 80) : [];
  const rows = incoming.map(acceptEntry).filter(Boolean);
  if (!rows.length) {
    return new Response(JSON.stringify({ ok: true, saved: 0 }), {
      headers: { ...headers, 'Content-Type': 'application/json' }
    });
  }
  const now = new Date().toISOString();
  await env.DB.batch(rows.map((row) => env.DB.prepare(
    `INSERT INTO content (key, kind, value, updated_at) VALUES (?, ?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET kind = excluded.kind, value = excluded.value, updated_at = excluded.updated_at`
  ).bind(row.key, row.kind, row.value, now)));
  return new Response(JSON.stringify({ ok: true, saved: rows.length }), {
    headers: { ...headers, 'Content-Type': 'application/json' }
  });
}
