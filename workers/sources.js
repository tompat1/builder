/** Reference sites kept for the knowledge base. A saved site is also read into passages. */

import { deletePassages, indexExternalPage } from './passages.js';

export function acceptSource(input) {
  const raw = String(typeof input === 'string' ? input : input?.url ?? '').trim();
  if (!raw || raw.length > 2000) return null;
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    return null;
  }
  if (parsed.protocol !== 'https:' || !parsed.hostname || parsed.username || parsed.password) return null;
  return parsed.href;
}

export async function handleSources(request, env, headers, sessionUser) {
  const url = new URL(request.url);
  if (url.pathname !== '/api/sources') {
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
  if (request.method === 'GET') return listSources(env, headers);
  if (request.method === 'POST') return createSource(request, env, headers, sessionUser);
  if (request.method === 'DELETE') return deleteSource(request, env, headers, sessionUser, url.searchParams.get('url') ?? '');
  return new Response(JSON.stringify({ error: 'Not found' }), {
    status: 404,
    headers: { ...headers, 'Content-Type': 'application/json' }
  });
}

async function listSources(env, headers) {
  const result = await env.DB.prepare('SELECT url FROM sources ORDER BY created_at').all();
  return new Response(JSON.stringify({ sources: (result.results ?? []).map((row) => row.url) }), {
    headers: { ...headers, 'Content-Type': 'application/json' }
  });
}

async function createSource(request, env, headers, sessionUser) {
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
  const href = acceptSource(body);
  if (!href) {
    return new Response(JSON.stringify({ error: 'bad_link' }), {
      status: 400,
      headers: { ...headers, 'Content-Type': 'application/json' }
    });
  }
  await env.DB.prepare(
    'INSERT INTO sources (url, created_at) VALUES (?, ?) ON CONFLICT(url) DO NOTHING'
  ).bind(href, new Date().toISOString()).run();
  await indexExternalPage(env, href).catch(() => false);
  return new Response(JSON.stringify({ url: href }), {
    headers: { ...headers, 'Content-Type': 'application/json' }
  });
}

async function deleteSource(request, env, headers, sessionUser, raw) {
  const user = await sessionUser(request, env);
  if (!user || user.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'sign_in' }), {
      status: 401,
      headers: { ...headers, 'Content-Type': 'application/json' }
    });
  }
  const href = acceptSource(raw);
  if (!href) {
    return new Response(JSON.stringify({ error: 'bad_link' }), {
      status: 400,
      headers: { ...headers, 'Content-Type': 'application/json' }
    });
  }
  await env.DB.prepare('DELETE FROM sources WHERE url = ?').bind(href).run();
  await deletePassages(env, 'source', href);
  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...headers, 'Content-Type': 'application/json' }
  });
}
