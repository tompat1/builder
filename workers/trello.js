/**
 * Trello board link for a signed-in Builder account.
 * GitHub (or password) signs the user into Builder. Trello needs its own
 * authorize step with TRELLO_API_KEY on the worker; the user token is stored
 * per account and used to create a board + cards for a saved house.
 */

const TOKEN_RE = /^[A-Za-z0-9_-]{20,200}$/;
const BOARD_ID_RE = /^[a-f0-9]{24}$/i;
const HOUSE_ID_RE = /^hus_[a-f0-9]{32}$/;
const CARD_LIMIT = 80;
const CARD_NAME_LIMIT = 160;
const CARD_DESC_LIMIT = 8_000;
const BOARD_NAME_LIMIT = 80;
const LIST_NAME_LIMIT = 48;
const LIST_KEYS = new Set([
  'critical',
  'phase1',
  'phase2',
  'phase3',
  'phase4',
  'phase5',
  'phase6',
  'builder',
  'notes',
  'doing',
  'done'
]);
const DEFAULT_LISTS = [
  { key: 'critical', name: '1. Critical first' },
  { key: 'phase1', name: '2. Phase 1: Earthworks' },
  { key: 'phase2', name: '3. Phase 2: Foundation' },
  { key: 'phase3', name: '4. Phase 3: Framing' },
  { key: 'phase4', name: '5. Phase 4: Weatherproofing' },
  { key: 'phase5', name: '6. Phase 5: Rough-ins' },
  { key: 'phase6', name: '7. Phase 6: Interiors' },
  { key: 'builder', name: 'Builder decisions' },
  { key: 'notes', name: 'Notes' },
  { key: 'doing', name: 'Doing' },
  { key: 'done', name: 'Done' }
];

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

const STATE_RE = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

export function acceptTrelloToken(value) {
  const token = String(value ?? '').trim();
  return TOKEN_RE.test(token) ? token : '';
}

export function acceptTrelloState(value) {
  const state = String(value ?? '').trim();
  return STATE_RE.test(state) ? state : '';
}

export function acceptTrelloLists(value) {
  if (!Array.isArray(value) || !value.length) return DEFAULT_LISTS.map((row) => ({ ...row }));
  const lists = [];
  const seen = new Set();
  for (const item of value) {
    if (!item || typeof item !== 'object') continue;
    const key = String(item.key ?? '').trim();
    if (!LIST_KEYS.has(key) || seen.has(key)) continue;
    const name = String(item.name ?? '').trim().replace(/\s+/g, ' ').slice(0, LIST_NAME_LIMIT);
    if (!name) continue;
    seen.add(key);
    lists.push({ key, name });
  }
  for (const row of DEFAULT_LISTS) {
    if (seen.has(row.key)) continue;
    lists.push({ ...row });
  }
  return lists;
}

export function acceptTrelloCards(value) {
  if (!Array.isArray(value)) return [];
  const cards = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') continue;
    const name = String(item.name ?? '').trim().replace(/\s+/g, ' ').slice(0, CARD_NAME_LIMIT);
    if (!name) continue;
    const desc = String(item.desc ?? '').trim().slice(0, CARD_DESC_LIMIT);
    const listKey = LIST_KEYS.has(String(item.list ?? '')) ? String(item.list) : 'critical';
    cards.push({ name, desc, list: listKey });
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
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS trello_auth_states (
      user_id TEXT PRIMARY KEY REFERENCES users(id),
      state TEXT NOT NULL,
      created_at TEXT NOT NULL
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

async function createBoardLists(key, token, boardId, lists) {
  const byKey = new Map();
  let rejected = false;
  const present = await trelloFetch(`boards/${boardId}/lists`, key, token, { method: 'GET' }, {
    fields: 'name',
    filter: 'open'
  });
  if (tokenRejected(present.response.status)) {
    return { byKey, rejected: true };
  }
  const have = new Map();
  if (Array.isArray(present.data)) {
    for (const list of present.data) {
      if (list?.name && list.id) have.set(String(list.name), String(list.id));
    }
  }
  // Trello puts `top` at the left. Create in reverse so the first list ends leftmost.
  for (let i = lists.length - 1; i >= 0; i -= 1) {
    const row = lists[i];
    const existingId = have.get(row.name);
    if (existingId) {
      byKey.set(row.key, existingId);
      continue;
    }
    const result = await trelloFetch(`boards/${boardId}/lists`, key, token, { method: 'POST' }, {
      name: row.name,
      pos: 'top'
    });
    if (tokenRejected(result.response.status)) {
      rejected = true;
      break;
    }
    if (result.response.ok && result.data?.id) {
      byKey.set(row.key, String(result.data.id));
    }
  }
  return { byKey, rejected };
}

function tokenRejected(status) {
  return status === 401 || status === 403;
}

async function dropToken(db, userId) {
  await db.prepare('DELETE FROM trello_tokens WHERE user_id = ?').bind(userId).run();
}

/** A stored token that Trello rejects is not a connection. Other failures leave it in place. */
async function liveToken(env, userId) {
  const token = await readUserToken(env.DB, userId);
  if (!token || !env.TRELLO_API_KEY) return token;
  try {
    const probe = await trelloFetch('members/me', env.TRELLO_API_KEY, token, { method: 'GET' });
    if (tokenRejected(probe.response.status)) {
      await dropToken(env.DB, userId);
      return '';
    }
  } catch {
    // Trello did not answer. Keep the stored token.
  }
  return token;
}

async function discardBoard(env, token, boardId) {
  if (!boardId) return;
  try {
    await trelloFetch(`boards/${boardId}`, env.TRELLO_API_KEY, token, { method: 'DELETE' });
  } catch {
    // The house is not linked, so the next attempt can create another board.
  }
}

async function findHouseBoard(key, token, houseId) {
  const marker = `Builder house project ${houseId}`;
  const listed = await trelloFetch('members/me/boards', key, token, { method: 'GET' }, {
    fields: 'name,desc,url,closed',
    filter: 'open'
  });
  if (!listed.response.ok || !Array.isArray(listed.data)) return null;
  const match = listed.data.find((board) => (
    board
    && board.closed !== true
    && board.id
    && board.desc === marker
  ));
  if (!match) return null;
  return {
    id: String(match.id),
    url: typeof match.url === 'string' && match.url ? match.url : `https://trello.com/b/${match.id}`,
    name: typeof match.name === 'string' ? match.name : ''
  };
}

function linkedBoard(row) {
  if (!row || row.board_id === 'pending') return null;
  return {
    id: row.board_id,
    url: row.board_url,
    name: row.board_name,
    createdAt: row.created_at
  };
}

function pendingFresh(row) {
  if (!row || row.board_id !== 'pending') return false;
  const at = Date.parse(row.created_at);
  return Number.isFinite(at) && Date.now() - at < 3 * 60 * 1000;
}

async function releaseClaim(db, houseId, userId) {
  await db.prepare(
    `DELETE FROM house_trello_boards WHERE house_id = ? AND user_id = ? AND board_id = 'pending'`
  ).bind(houseId, userId).run();
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
    const token = await liveToken(env, user.id);
    let board = null;
    if (houseId) {
      const row = await env.DB.prepare(
        `SELECT board_id, board_url, board_name, created_at
         FROM house_trello_boards WHERE house_id = ? AND user_id = ?`
      ).bind(houseId, user.id).first();
      if (row && row.board_id !== 'pending') {
        board = linkedBoard(row);
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
    const state = acceptTrelloState(body.state);
    if (!state) return json({ error: 'state' }, 400, headers);
    const returnPath = body.returnPath === '/mood' ? '/mood' : '/build';
    const returnUrl = `${origin}${returnPath}?trello_state=${encodeURIComponent(state)}`;
    const authorize = new URL('https://trello.com/1/authorize');
    authorize.searchParams.set('expiration', 'never');
    authorize.searchParams.set('name', 'Builder');
    authorize.searchParams.set('scope', 'read,write');
    authorize.searchParams.set('response_type', 'token');
    authorize.searchParams.set('key', env.TRELLO_API_KEY);
    authorize.searchParams.set('callback_method', 'fragment');
    authorize.searchParams.set('return_url', returnUrl);
    const now = new Date().toISOString();
    await env.DB.prepare(
      `INSERT INTO trello_auth_states (user_id, state, created_at) VALUES (?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET state = excluded.state, created_at = excluded.created_at`
    ).bind(user.id, state, now).run();
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
    const state = acceptTrelloState(body.state);
    if (!token || !state) return json({ error: 'state' }, 400, headers);
    const pending = await env.DB.prepare(
      'SELECT state, created_at FROM trello_auth_states WHERE user_id = ?'
    ).bind(user.id).first();
    const fresh = pending && Number.isFinite(Date.parse(pending.created_at))
      && Date.now() - Date.parse(pending.created_at) < 30 * 60 * 1000;
    if (!pending || pending.state !== state || !fresh) {
      return json({ error: 'state' }, 400, headers);
    }
    await env.DB.prepare('DELETE FROM trello_auth_states WHERE user_id = ?').bind(user.id).run();
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
    const token = await liveToken(env, user.id);
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

    let existing = await env.DB.prepare(
      `SELECT board_id, board_url, board_name, created_at
       FROM house_trello_boards WHERE house_id = ? AND user_id = ?`
    ).bind(houseId, user.id).first();
    if (body.force && existing) {
      await env.DB.prepare(
        'DELETE FROM house_trello_boards WHERE house_id = ? AND user_id = ?'
      ).bind(houseId, user.id).run();
      existing = null;
    }
    const linked = linkedBoard(existing);
    if (linked) {
      return json({
        ok: true,
        existing: true,
        board: linked,
        cardsCreated: 0
      }, 200, headers);
    }
    if (pendingFresh(existing)) return json({ error: 'busy' }, 409, headers);
    if (existing) {
      await env.DB.prepare(
        'DELETE FROM house_trello_boards WHERE house_id = ? AND user_id = ?'
      ).bind(houseId, user.id).run();
    }

    const claimedAt = new Date().toISOString();
    const claim = await env.DB.prepare(
      `INSERT INTO house_trello_boards (house_id, user_id, board_id, board_url, board_name, created_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(house_id, user_id) DO NOTHING`
    ).bind(houseId, user.id, 'pending', '', '', claimedAt).run();
    if (!claim?.meta?.changes) return json({ error: 'busy' }, 409, headers);

    const boardName = acceptBoardName(body.name, owned.name);
    const planLists = acceptTrelloLists(body.lists);
    const cards = acceptTrelloCards(body.cards);
    const marker = `Builder house project ${houseId}`;
    let createdFresh = false;
    let boardId = '';
    let boardUrl = '';
    const recovered = await findHouseBoard(env.TRELLO_API_KEY, token, houseId);
    if (recovered) {
      boardId = recovered.id;
      boardUrl = recovered.url;
    } else {
      const created = await trelloFetch('boards', env.TRELLO_API_KEY, token, { method: 'POST' }, {
        name: boardName,
        defaultLists: 'false',
        desc: marker
      });
      if (tokenRejected(created.response.status)) {
        await dropToken(env.DB, user.id);
        await releaseClaim(env.DB, houseId, user.id);
        return json({ error: 'connect' }, 401, headers);
      }
      if (!created.response.ok || !created.data?.id) {
        await releaseClaim(env.DB, houseId, user.id);
        return json({ error: 'board' }, 502, headers);
      }
      boardId = String(created.data.id);
      if (!BOARD_ID_RE.test(boardId) && boardId.length < 8) {
        await releaseClaim(env.DB, houseId, user.id);
        return json({ error: 'board' }, 502, headers);
      }
      boardUrl = typeof created.data.url === 'string' && created.data.url
        ? created.data.url
        : `https://trello.com/b/${boardId}`;
      createdFresh = true;
    }

    const failBoard = async (error, status) => {
      if (createdFresh) await discardBoard(env, token, boardId);
      await releaseClaim(env.DB, houseId, user.id);
      return json({ error }, status, headers);
    };

    const lists = await createBoardLists(env.TRELLO_API_KEY, token, boardId, planLists);
    if (lists.rejected) {
      await dropToken(env.DB, user.id);
      return failBoard('connect', 401);
    }
    const listIds = lists.byKey;
    if (listIds.size !== planLists.length) return failBoard('lists', 502);
    const fallbackList = listIds.get('critical') || [...listIds.values()][0];

    let cardsCreated = 0;
    for (const card of cards) {
      const idList = listIds.get(card.list) || fallbackList;
      const result = await trelloFetch('cards', env.TRELLO_API_KEY, token, { method: 'POST' }, {
        idList: String(idList),
        name: card.name,
        desc: card.desc,
        pos: 'bottom'
      });
      if (tokenRejected(result.response.status)) {
        await dropToken(env.DB, user.id);
        return failBoard('connect', 401);
      }
      if (!result.response.ok) return failBoard('cards', 502);
      cardsCreated += 1;
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
      existing: !createdFresh,
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
