/** Admin-added knowledge pages. The model may choose the id. The stored sentence stays. */

import { deletePassages, indexResource } from './passages.js';

const ID_PATTERN = /^extra-[a-z0-9-]{1,48}$/;

export function resourceSlug(title) {
  const slug = String(title ?? '')
    .toLowerCase()
    .replace(/å|ä/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 36);
  return slug ? `extra-${slug}` : null;
}

const LINK_LIMIT = 2000;

/** A source link was sent, and it is not an https address we can store. */
export function linkRejected(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return false;
  return !acceptLink(raw);
}

function acceptLink(value) {
  if (!value || value.length > LINK_LIMIT) return '';
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    return '';
  }
  if (parsed.protocol !== 'https:' || !parsed.hostname || parsed.username || parsed.password) return '';
  if (parsed.href.length > LINK_LIMIT) return '';
  return parsed.href;
}

export function acceptResource(input) {
  const title = String(input?.title ?? '').trim();
  const body = String(input?.body ?? '').trim();
  if (title.length < 2 || title.length > 120) return null;
  if (body.length < 2 || body.length > 4000) return null;
  const id = resourceSlug(title);
  if (!id || !ID_PATTERN.test(id)) return null;
  let keywords = String(input?.keywords ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 12);
  if (!keywords.length) {
    keywords = title.split(/\s+/).map((item) => item.trim()).filter((item) => item.length > 2).slice(0, 8);
  }
  if (!keywords.length || keywords.some((item) => item.length > 40)) return null;
  const supplied = String(input?.linkHref ?? '').trim();
  const linkHref = supplied ? acceptLink(supplied) : '';
  if (supplied && !linkHref) return null;
  const linkLabel = linkHref ? (String(input?.linkLabel ?? '').trim().slice(0, 120) || title) : '';
  return { id, title, body, keywords, linkLabel, linkHref };
}

export function catalogPage(row) {
  if (!ID_PATTERN.test(row?.id ?? '')) return null;
  return {
    id: row.id,
    title: String(row.title ?? '').slice(0, 160),
    summary: String(row.body ?? '').slice(0, 240)
  };
}

export async function resourcePages(env) {
  if (!env.DB) return [];
  try {
    const result = await env.DB.prepare('SELECT id, title, body FROM resources').all();
    return (result.results ?? []).map(catalogPage).filter(Boolean);
  } catch {
    return [];
  }
}

export async function handleResources(request, env, headers, sessionUser) {
  const url = new URL(request.url);
  if (url.pathname !== '/api/resources' && !url.pathname.startsWith('/api/resources/')) {
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
  if (request.method === 'GET' && url.pathname === '/api/resources') return listResources(env, headers);
  if (request.method === 'POST' && url.pathname === '/api/resources') {
    return createResource(request, env, headers, sessionUser);
  }
  if (request.method === 'DELETE' && url.pathname.startsWith('/api/resources/')) {
    return deleteResource(request, env, headers, sessionUser, decodeURIComponent(url.pathname.slice('/api/resources/'.length)));
  }
  return new Response(JSON.stringify({ error: 'Not found' }), {
    status: 404,
    headers: { ...headers, 'Content-Type': 'application/json' }
  });
}

function rowToResource(row) {
  let keywords = [];
  try {
    const parsed = JSON.parse(row.keywords);
    if (Array.isArray(parsed)) keywords = parsed.map((item) => String(item));
  } catch {
    keywords = [];
  }
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    keywords,
    linkLabel: row.link_label || '',
    linkHref: row.link_href || ''
  };
}

async function listResources(env, headers) {
  const result = await env.DB.prepare(
    'SELECT id, title, body, keywords, link_label, link_href FROM resources ORDER BY created_at'
  ).all();
  return new Response(JSON.stringify({ resources: (result.results ?? []).map(rowToResource) }), {
    headers: { ...headers, 'Content-Type': 'application/json' }
  });
}

async function createResource(request, env, headers, sessionUser) {
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
  const row = acceptResource(body);
  if (!row) {
    const code = linkRejected(body?.linkHref) ? 'bad_link' : 'bad_resource';
    return new Response(JSON.stringify({ error: code }), {
      status: 400,
      headers: { ...headers, 'Content-Type': 'application/json' }
    });
  }
  let id = row.id;
  for (let n = 2; n < 20; n += 1) {
    const existing = await env.DB.prepare('SELECT id FROM resources WHERE id = ?').bind(id).first();
    if (!existing) break;
    id = `${row.id}-${n}`.slice(0, 54);
  }
  if (!ID_PATTERN.test(id)) {
    return new Response(JSON.stringify({ error: 'bad_resource' }), {
      status: 400,
      headers: { ...headers, 'Content-Type': 'application/json' }
    });
  }
  const now = new Date().toISOString();
  await env.DB.prepare(
    'INSERT INTO resources (id, keywords, title, body, link_label, link_href, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, JSON.stringify(row.keywords), row.title, row.body, row.linkLabel, row.linkHref, now).run();
  await indexResource(env, { ...row, id }).catch(() => false);
  return new Response(JSON.stringify({ resource: { ...row, id } }), {
    headers: { ...headers, 'Content-Type': 'application/json' }
  });
}

async function deleteResource(request, env, headers, sessionUser, id) {
  const user = await sessionUser(request, env);
  if (!user || user.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'sign_in' }), {
      status: 401,
      headers: { ...headers, 'Content-Type': 'application/json' }
    });
  }
  if (!ID_PATTERN.test(id)) {
    return new Response(JSON.stringify({ error: 'bad_resource' }), {
      status: 400,
      headers: { ...headers, 'Content-Type': 'application/json' }
    });
  }
  await env.DB.prepare('DELETE FROM resources WHERE id = ?').bind(id).run();
  await deletePassages(env, 'resource', id);
  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...headers, 'Content-Type': 'application/json' }
  });
}
