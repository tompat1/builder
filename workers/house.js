/** One saved house per signed-in user. */

const LIMIT = 100_000;

function json(body, status, headers) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' }
  });
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

export async function handleHouse(request, env, headers, sessionUser) {
  if (!env.DB) return json({ error: 'storage' }, 503, headers);
  const user = await sessionUser(request, env);
  if (!user) return json({ error: 'sign_in' }, 401, headers);

  if (request.method === 'GET') {
    const row = await env.DB.prepare('SELECT config FROM houses WHERE user_id = ?').bind(user.id).first();
    if (!row?.config) return json({ config: null }, 200, headers);
    try {
      return json({ config: JSON.parse(row.config) }, 200, headers);
    } catch {
      return json({ config: null }, 200, headers);
    }
  }

  if (request.method !== 'PUT') return json({ error: 'house' }, 405, headers);
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'house' }, 400, headers);
  }
  const config = acceptHouse(body);
  if (!config) return json({ error: 'house' }, 400, headers);
  const now = new Date().toISOString();
  await env.DB.prepare(
    `INSERT INTO houses (user_id, config, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET config = excluded.config, updated_at = excluded.updated_at`
  ).bind(user.id, config, now).run();
  return json({ ok: true }, 200, headers);
}
