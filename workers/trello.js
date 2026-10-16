/**
 * Trello board link for a signed-in Builder account.
 * GitHub (or password) signs the user into Builder. Trello needs its own
 * authorize step with TRELLO_API_KEY on the worker; the user token is stored
 * per account and used to create a board + cards for a saved house.
 */

const TOKEN_RE = /^[A-Za-z0-9_-]{20,200}$/;
const BOARD_ID_RE = /^[a-f0-9]{24}$/i;
const HOUSE_ID_RE = /^hus_[a-f0-9]{32}$/;
const CARD_LIMIT = 40;
const CARD_NAME_LIMIT = 160;
const CARD_DESC_LIMIT = 8_000;
const BOARD_NAME_LIMIT = 80;

function json(body, status, headers) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' }
  });
}

function allowedOrigin(origin, env) {
  const allowed = (env.ALLOWED_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  return allowed.includes(origin) ? origin : '';
}

function requireDb(env, headers) {
  if (env.DB && env.SESSION_SECRET) return null;
  return json({ error: 'storage' }, 503, headers);
}

function requireTrelloKey(env, headers) {
  if (env.TRELLO_API_KEY) return null;
  return json({ error: 'trello' }, 503, headers);
}

export function acceptTrelloToken(value) {
  const token = String(value ?? '').trim();
  return TOKEN_RE.test(token) ? token : '';
}

export function acceptTrelloCards(value) {
  if (!Array.isArray(value)) return [];
  const cards = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') continue;
    const name = String(item.name ?? '').trim().replace(/\s+/g, ' ').slice(0, CARD_NAME_LIMIT);
    if (!name) continue;
    const desc = String(item.desc ?? '').trim().slice(0, CARD_DESC_LIMIT);
    cards.push({ name, desc });
    if (cards.length >= CARD_LIMIT) break;
  }
  return cards;
}

export function acceptBoardName(value, fallback) {
  const name = String(value ?? '').trim().replace(/\s+/g, ' ').slice(0, BOARD_NAME_LIMIT);
  if (name) return name;
  const alt = String(fallback ?? '').trim().replace(/\s+/g, ' ').slice(0, BOARD_NAME_LIMIT);
  return alt || 'Builder house';
}

let tablesChecked = false;
async function ensureTrelloTables(db) {
  if (tablesChecked || !db) return;
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS trello_tokens (
      user_id TEXT PRIMARY KEY REFERENCES users(id),
      token TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `).run();
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS house_trello_boards (
      house_id TEXT NOT NULL,
      user_id TEXT NOT NULL REFERENCES users(id),
      board_id TEXT NOT NULL,
      board_url TEXT NOT NULL,
      board_name TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY (house_id, user_id)
    )
  `).run();
  tablesChecked = true;
}

async function readUserToken(db, userId) {
  const row = await db.prepare('SELECT token FROM trello_tokens WHERE user_id = ?').bind(userId).first();
  return row?.token ? String(row.token) : '';
}

function trelloUrl(path, key, token, params = {}) {
  const url = new URL(`https://api.trello.com/1/${path.replace(/^\//, '')}`);
  url.searchParams.set('key', key);
  url.searchParams.set('token', token);
  for (const [name, value] of Object.entries(params)) {
    if (value == null || value === '') continue;
    url.searchParams.set(name, String(value));
  }
  return url;
}

async function trelloFetch(path, key, token, init = {}, params = {}) {
  const url = trelloUrl(path, key, token, params);
  const response = await fetch(url, init);
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { message: text };
  }
  return { response, data };
}

function pickTodoList(lists) {
  if (!Array.isArray(lists) || !lists.length) return null;
  const prefer = lists.find((list) => {
    const name = String(list?.name ?? '').toLowerCase();
    return name === 'to do' || name === 'todo' || name === 'att göra' || name === 'att gora';
  });
  return prefer || lists[0];
}

export async function handleTrello(request, env, headers, sessionUser) {
  try {
    return await routeTrello(request, env, headers, sessionUser);
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'trello failed');
    return json({ error: 'trello_failed' }, 500, headers);
  }
}

async function routeTrello(request, env, headers, sessionUser) {
  const url = new URL(request.url);
  if (!url.pathname.startsWith('/api/trello')) return null;

  const missingDb = requireDb(env, headers);
  if (missingDb) return missingDb;

  const user = await sessionUser(request, env);
  if (!user) return json({ error: 'sign_in' }, 401, headers);

  await ensureTrelloTables(env.DB);

  if (url.pathname === '/api/trello/status' && request.method === 'GET') {
    const houseId = acceptHouseId(url.searchParams.get('houseId'));
    const token = await readUserToken(env.DB, user.id);
    let board = null;
    if (houseId) {
      const row = await env.DB.prepare(
        `SELECT board_id, board_url, board_name, created_at
         FROM house_trello_boards WHERE house_id = ? AND user_id = ?`
      ).bind(houseId, user.id).first();
      if (row) {
        board = {
          id: row.board_id,
          url: row.board_url,
          name: row.board_name,
          createdAt: row.created_at
        };
      }
    }
    return json({
      configured: Boolean(env.TRELLO_API_KEY),
      connected: Boolean(token),
      board
    }, 200, headers);
  }

  if (url.pathname === '/api/trello/authorize' && request.method === 'POST') {
    const missingKey = requireTrelloKey(env, headers);
    if (missingKey) return missingKey;
    let body = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }
    const origin = allowedOrigin(String(body.origin ?? ''), env);
    if (!origin) return json({ error: 'origin' }, 400, headers);
    const returnPath = body.returnPath === '/mood' ? '/mood' : '/build';
    const returnUrl = `${origin}${returnPath}`;
    const authorize = new URL('https://trello.com/1/authorize');
    authorize.searchParams.set('expiration', 'never');
    authorize.searchParams.set('name', 'Builder');
    authorize.searchParams.set('scope', 'read,write');
    authorize.searchParams.set('response_type', 'token');
    authorize.searchParams.set('key', env.TRELLO_API_KEY);
    authorize.searchParams.set('callback_method', 'fragment');
    authorize.searchParams.set('return_url', returnUrl);
    return json({ url: authorize.toString() }, 200, headers);
  }

  if (url.pathname === '/api/trello/token' && request.method === 'POST') {
    const missingKey = requireTrelloKey(env, headers);
    if (missingKey) return missingKey;
    let body = {};
    try {
      body = await request.json();
    } catch {
      return json({ error: 'token' }, 400, headers);
    }
    const token = acceptTrelloToken(body.token);
    if (!token) return json({ error: 'token' }, 400, headers);
    const probe = await trelloFetch('members/me', env.TRELLO_API_KEY, token, { method: 'GET' });
    if (!probe.response.ok) return json({ error: 'token' }, 400, headers);
    const now = new Date().toISOString();
    await env.DB.prepare(
      `INSERT INTO trello_tokens (user_id, token, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET token = excluded.token, updated_at = excluded.updated_at`
    ).bind(user.id, token, now).run();
    return json({ ok: true, connected: true }, 200, headers);
  }

  if (url.pathname === '/api/trello/token' && request.method === 'DELETE') {
    await env.DB.prepare('DELETE FROM trello_tokens WHERE user_id = ?').bind(user.id).run();
    return json({ ok: true, connected: false }, 200, headers);
  }

  if (url.pathname === '/api/trello/boards' && request.method === 'POST') {
    const missingKey = requireTrelloKey(env, headers);
    if (missingKey) return missingKey;
    const token = await readUserToken(env.DB, user.id);
    if (!token) return json({ error: 'connect' }, 401, headers);

    let body = {};
    try {
      body = await request.json();
    } catch {
      return json({ error: 'board' }, 400, headers);
    }

    const houseId = acceptHouseId(body.houseId);
    if (!houseId) return json({ error: 'house' }, 400, headers);

    const owned = await env.DB.prepare(
      'SELECT id, name FROM saved_houses WHERE id = ? AND user_id = ?'
    ).bind(houseId, user.id).first();
    if (!owned) return json({ error: 'house' }, 404, headers);

    const existing = await env.DB.prepare(
      `SELECT board_id, board_url, board_name, created_at
       FROM house_trello_boards WHERE house_id = ? AND user_id = ?`
    ).bind(houseId, user.id).first();
    if (existing && !body.force) {
      return json({
        ok: true,
        existing: true,
        board: {
          id: existing.board_id,
          url: existing.board_url,
          name: existing.board_name,
          createdAt: existing.created_at
        },
        cardsCreated: 0
      }, 200, headers);
    }

    const boardName = acceptBoardName(body.name, owned.name);
    const cards = acceptTrelloCards(body.cards);
    const created = await trelloFetch('boards', env.TRELLO_API_KEY, token, { method: 'POST' }, {
      name: boardName,
      defaultLists: 'true',
      desc: `Builder house project ${houseId}`
    });
    if (!created.response.ok || !created.data?.id) {
      return json({ error: 'board' }, 502, headers);
    }

    const boardId = String(created.data.id);
    if (!BOARD_ID_RE.test(boardId) && boardId.length < 8) {
      return json({ error: 'board' }, 502, headers);
    }
    const boardUrl = typeof created.data.url === 'string' && created.data.url
      ? created.data.url
      : `https://trello.com/b/${boardId}`;

    const lists = await trelloFetch(`boards/${boardId}/lists`, env.TRELLO_API_KEY, token, { method: 'GET' });
    const todo = pickTodoList(lists.data);
    if (!todo?.id) return json({ error: 'lists' }, 502, headers);

    let cardsCreated = 0;
    for (const card of cards) {
      const result = await trelloFetch('cards', env.TRELLO_API_KEY, token, { method: 'POST' }, {
        idList: String(todo.id),
        name: card.name,
        desc: card.desc
      });
      if (result.response.ok) cardsCreated += 1;
    }

    const now = new Date().toISOString();
    await env.DB.prepare(
      `INSERT INTO house_trello_boards (house_id, user_id, board_id, board_url, board_name, created_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(house_id, user_id) DO UPDATE SET
         board_id = excluded.board_id,
         board_url = excluded.board_url,
         board_name = excluded.board_name,
         created_at = excluded.created_at`
    ).bind(houseId, user.id, boardId, boardUrl, boardName, now).run();

    return json({
      ok: true,
      existing: false,
      board: { id: boardId, url: boardUrl, name: boardName, createdAt: now },
      cardsCreated
    }, 200, headers);
  }

  return json({ error: 'Not found' }, 404, headers);
}

function acceptHouseId(value) {
  const id = String(value ?? '');
  return HOUSE_ID_RE.test(id) ? id : '';
}
