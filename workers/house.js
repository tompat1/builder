/** Named houses for a signed-in user. Each save keeps its own time and author. */

const LIMIT = 100_000;
const LIST_LIMIT = 24;

function json(body, status, headers) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' }
  });
}

export function acceptHouseName(value) {
  const name = String(value ?? '').trim().replace(/\s+/g, ' ');
  if (!name || name.length > 80) return null;
  return name;
}

export function acceptHouse(body) {
  const config = body?.config;
  if (!config || typeof config !== 'object' || Array.isArray(config)) return null;
  let text = '';
  try {
    text = JSON.stringify(config);
  } catch {
    return null;
  }
  if (!text || text.length > LIMIT) return null;
  return text;
}

export function houseAreaSqMeters(value) {
  let config = value;
  if (typeof value === 'string') {
    try {
      config = JSON.parse(value);
    } catch {
      return null;
    }
  }
  if (!config || typeof config !== 'object' || Array.isArray(config)) return null;
  const width = Number(config.buildingWidth);
  const depth = Number(config.buildingDepth);
  if (!Number.isFinite(width) || !Number.isFinite(depth) || width <= 0 || depth <= 0) return null;
  return Math.round((width * depth) / 1e5) / 10;
}

function summary(row) {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    createdBy: row.created_by,
    areaSqMeters: houseAreaSqMeters(row.config)
  };
}

export function acceptHouseId(value) {
  const id = String(value ?? '');
  return /^hus_[a-f0-9]{32}$/.test(id) ? id : '';
}

function houseId(pathname) {
  if (!pathname.startsWith('/api/houses/')) return '';
  return acceptHouseId(decodeURIComponent(pathname.slice('/api/houses/'.length)));
}

export async function handleHouse(request, env, headers, sessionUser) {
  if (!env.DB) return json({ error: 'storage' }, 503, headers);
  const user = await sessionUser(request, env);
  if (!user) return json({ error: 'sign_in' }, 401, headers);

  const url = new URL(request.url);
  const id = houseId(url.pathname);
  const listing = url.pathname === '/api/houses';

  if (request.method === 'GET' && listing) {
    const rows = await env.DB.prepare(
      `SELECT id, name, created_at, created_by, config FROM saved_houses
       WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`
    ).bind(user.id, LIST_LIMIT).all();
    return json({ houses: (rows.results ?? []).map(summary) }, 200, headers);
  }

  if (request.method === 'GET' && id) {
    const row = await env.DB.prepare(
      `SELECT id, name, created_at, created_by, config FROM saved_houses
       WHERE id = ? AND user_id = ?`
    ).bind(id, user.id).first();
    if (!row) return json({ error: 'house' }, 404, headers);
    let config = null;
    try {
      config = JSON.parse(row.config);
    } catch {
      config = null;
    }
    return json({ house: { ...summary(row), config } }, 200, headers);
  }

  if (request.method === 'POST' && listing) {
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'house' }, 400, headers);
    }
    const name = acceptHouseName(body?.name);
    const config = acceptHouse(body);
    if (!name || !config) return json({ error: 'house' }, 400, headers);
    const now = new Date().toISOString();
    const createdBy = String(user.name || user.login || '').slice(0, 80);
    const savedId = `hus_${crypto.randomUUID().replaceAll('-', '')}`;
    await env.DB.prepare(
      `INSERT INTO saved_houses (id, user_id, name, config, created_at, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(savedId, user.id, name, config, now, createdBy).run();
    return json({
      house: { id: savedId, name, createdAt: now, createdBy, areaSqMeters: houseAreaSqMeters(config) }
    }, 200, headers);
  }

  if (request.method === 'PUT' && id) {
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'house' }, 400, headers);
    }
    const config = acceptHouse(body);
    if (!config) return json({ error: 'house' }, 400, headers);
    const result = await env.DB.prepare(
      'UPDATE saved_houses SET config = ? WHERE id = ? AND user_id = ?'
    ).bind(config, id, user.id).run();
    if (!result.meta?.changes) return json({ error: 'house' }, 404, headers);
    return json({ ok: true }, 200, headers);
  }

  if (request.method === 'DELETE' && id) {
    await env.DB.prepare('DELETE FROM saved_houses WHERE id = ? AND user_id = ?').bind(id, user.id).run();
    return json({ ok: true }, 200, headers);
  }

  return json({ error: 'house' }, 405, headers);
}
