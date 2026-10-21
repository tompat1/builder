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

let housesTableChecked = false;
async function ensureHousesTable(db) {
  if (housesTableChecked || !db) return;
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS houses (
        user_id TEXT PRIMARY KEY REFERENCES users(id),
        config TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `).run();
    housesTableChecked = true;
  } catch {
    // ignore
  }
}

export async function handleHouse(request, env, headers, sessionUser) {
  if (!env.DB) return json({ error: 'storage' }, 503, headers);
  const user = await sessionUser(request, env);
  if (!user) return json({ error: 'sign_in' }, 401, headers);

  const url = new URL(request.url);
  const id = houseId(url.pathname);
  const listing = url.pathname === '/api/houses';
  const activeRoute = url.pathname === '/api/houses/active';

  if (request.method === 'GET' && activeRoute) {
    await ensureHousesTable(env.DB);
    const row = await env.DB.prepare(
      `SELECT config, updated_at FROM houses WHERE user_id = ?`
    ).bind(user.id).first();
    if (row) {
      let data = null;
      try {
        data = JSON.parse(row.config);
      } catch {
        data = null;
      }
      if (data && typeof data === 'object') {
        return json({
          active: {
            ...data,
            updatedAt: typeof row.updated_at === 'string' ? row.updated_at : undefined
          }
        }, 200, headers);
      }
    }
    const latestSaved = await env.DB.prepare(
      `SELECT id, name, created_at, created_by, config FROM saved_houses WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`
    ).bind(user.id).first();
    if (latestSaved) {
      let config = null;
      try {
        config = JSON.parse(latestSaved.config);
      } catch {
        config = null;
      }
      return json({
        active: {
          activeId: latestSaved.id,
          name: latestSaved.name,
          config
        }
      }, 200, headers);
    }
    return json({ active: null }, 200, headers);
  }

  if ((request.method === 'PUT' || request.method === 'POST') && activeRoute) {
    await ensureHousesTable(env.DB);
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'house' }, 400, headers);
    }
    const config = acceptHouse(body);
    if (!config) return json({ error: 'house' }, 400, headers);
    const activeId = acceptHouseId(body?.activeId) || '';
    let name = acceptHouseName(body?.name) || '';
    let locale = body?.locale === 'en' || body?.locale === 'sv' ? body.locale : '';
    const existing = await env.DB.prepare(`SELECT config FROM houses WHERE user_id = ?`).bind(user.id).first();
    let prev = {};
    try {
      prev = JSON.parse(existing?.config || '{}');
    } catch {
      prev = {};
    }
    if (!name) name = acceptHouseName(prev.name) || '';
    if (!locale && (prev.locale === 'en' || prev.locale === 'sv')) locale = prev.locale;
    const payload = JSON.stringify({ activeId, name, locale, config: JSON.parse(config) });
    const now = new Date().toISOString();

    await env.DB.prepare(
      `INSERT INTO houses (user_id, config, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET config = excluded.config, updated_at = excluded.updated_at`
    ).bind(user.id, payload, now).run();

    if (activeId) {
      if (name) {
        await env.DB.prepare(
          'UPDATE saved_houses SET name = ?, config = ? WHERE id = ? AND user_id = ?'
        ).bind(name, config, activeId, user.id).run();
      } else {
        await env.DB.prepare(
          'UPDATE saved_houses SET config = ? WHERE id = ? AND user_id = ?'
        ).bind(config, activeId, user.id).run();
      }
    }
    return json({ ok: true, activeId }, 200, headers);
  }

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

  if ((request.method === 'PUT' || request.method === 'POST') && id) {
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'house' }, 400, headers);
    }
    const hasName = body?.name !== undefined;
    const hasConfig = body?.config !== undefined;
    const name = hasName ? acceptHouseName(body.name) : undefined;
    const config = hasConfig ? acceptHouse(body) : undefined;
    if ((hasName && !name) || (hasConfig && !config)) return json({ error: 'house' }, 400, headers);
    if (!hasName && !hasConfig) return json({ error: 'house' }, 400, headers);

    let result;
    if (name !== undefined && config !== undefined) {
      result = await env.DB.prepare(
        'UPDATE saved_houses SET name = ?, config = ? WHERE id = ? AND user_id = ?'
      ).bind(name, config, id, user.id).run();
    } else if (name !== undefined) {
      result = await env.DB.prepare(
        'UPDATE saved_houses SET name = ? WHERE id = ? AND user_id = ?'
      ).bind(name, id, user.id).run();
    } else {
      result = await env.DB.prepare(
        'UPDATE saved_houses SET config = ? WHERE id = ? AND user_id = ?'
      ).bind(config, id, user.id).run();
    }
    if (!result.meta?.changes) return json({ error: 'house' }, 404, headers);
    return json({ ok: true, name }, 200, headers);
  }

  if (request.method === 'DELETE' && id) {
    await env.DB.prepare('DELETE FROM saved_houses WHERE id = ? AND user_id = ?').bind(id, user.id).run();
    return json({ ok: true }, 200, headers);
  }

  return json({ error: 'house' }, 405, headers);
}
