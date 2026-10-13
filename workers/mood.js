/**
 * Cloudflare D1 storage for collaborative MoodBoards with likes and comments.
 */

const MOOD_JSON_LIMIT = 2_000_000;

function json(body, status, headers) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' }
  });
}

export function acceptBoardId(value) {
  const id = String(value ?? '').trim();
  return /^[a-zA-Z0-9_-]{1,64}$/.test(id) ? id : '';
}

function parseMoodRoute(pathname) {
  const prefix = '/api/mood';
  if (!pathname.startsWith(prefix)) return null;
  const parts = pathname.slice(prefix.length).split('/').filter(Boolean);
  if (!parts.length) return null;
  const id = acceptBoardId(decodeURIComponent(parts[0]));
  if (!id) return null;
  const action = parts[1] || '';
  return { id, action };
}

let tableChecked = false;
async function ensureMoodTable(db) {
  if (tableChecked || !db) return;
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS mood_boards (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        title TEXT NOT NULL DEFAULT '',
        data TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `).run();
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS mood_assets (
        id TEXT PRIMARY KEY,
        board_id TEXT NOT NULL,
        data TEXT NOT NULL
      )
    `).run();
    tableChecked = true;
  } catch {
    // ignore
  }
}

function pieceCount(row) {
  if (!row || typeof row.data !== 'string') return 0;
  try {
    const data = JSON.parse(row.data);
    return Array.isArray(data.pieces) ? data.pieces.length : 0;
  } catch {
    return 0;
  }
}

function richerBoard(current, candidate) {
  if (!candidate) return current;
  if (!current || pieceCount(candidate) > pieceCount(current)) return candidate;
  return current;
}

async function boardById(db, id) {
  if (!id) return null;
  return db.prepare(
    `SELECT id, user_id, title, data, created_at, updated_at FROM mood_boards WHERE id = ?`
  ).bind(id).first();
}

async function boardsForUser(db, userId) {
  if (!userId) return [];
  const statement = db.prepare(
    `SELECT id, user_id, title, data, created_at, updated_at FROM mood_boards WHERE user_id = ? ORDER BY updated_at DESC LIMIT 20`
  ).bind(userId);
  if (typeof statement.all === 'function') {
    const result = await statement.all();
    return Array.isArray(result?.results) ? result.results : [];
  }
  const row = await statement.first();
  return row ? [row] : [];
}

/** The requested board, or the signed-in user's fullest board when that one is empty. */
async function resolveBoard(db, boardId, userId) {
  let row = await boardById(db, boardId);
  if (!userId || pieceCount(row) > 0) return row;
  for (const owned of await boardsForUser(db, userId)) {
    row = richerBoard(row, owned);
  }
  if (pieceCount(row) === 0) {
    const legacy = await boardById(db, 'draft');
    if (legacy && (legacy.user_id == null || legacy.user_id === userId)) {
      row = richerBoard(row, legacy);
    }
  }
  return row;
}

function mergeBoardData(existingText, incoming) {
  let prev = {};
  try {
    prev = existingText ? JSON.parse(existingText) : {};
  } catch {
    prev = {};
  }
  const pieces = new Map();
  for (const piece of Array.isArray(prev.pieces) ? prev.pieces : []) {
    if (piece && piece.id) pieces.set(piece.id, piece);
  }
  for (const piece of incoming.pieces) {
    if (piece && piece.id) pieces.set(piece.id, piece);
  }
  const participants = new Map();
  for (const person of Array.isArray(prev.participants) ? prev.participants : []) {
    if (person && person.id) participants.set(person.id, person);
  }
  for (const person of incoming.participants) {
    if (person && person.id) participants.set(person.id, person);
  }
  return {
    title: incoming.title || (typeof prev.title === 'string' ? prev.title : ''),
    createdAt: incoming.createdAt || (typeof prev.createdAt === 'string' ? prev.createdAt : ''),
    pieces: [...pieces.values()],
    participants: [...participants.values()]
  };
}

async function assetRows(db, boardId) {
  const statement = db.prepare(`SELECT id, data FROM mood_assets WHERE board_id = ?`).bind(boardId);
  if (typeof statement.all !== 'function') return [];
  const result = await statement.all();
  return Array.isArray(result?.results) ? result.results : [];
}

/** Picture bytes live in their own rows so a full collage fits in D1. */
async function externalizePieceImages(db, boardId, pieces, dropMissing) {
  const stored = [];
  const keep = new Set();
  for (const piece of pieces) {
    if (!piece || typeof piece !== 'object') continue;
    const src = typeof piece.src === 'string' ? piece.src : '';
    if (src.startsWith('data:image/') && piece.id) {
      await db.prepare(
        `INSERT INTO mood_assets (id, board_id, data) VALUES (?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET board_id = excluded.board_id, data = excluded.data`
      ).bind(piece.id, boardId, src).run();
      keep.add(piece.id);
      stored.push({ ...piece, src: `asset:${piece.id}` });
    } else {
      if (src.startsWith('asset:') && piece.id) keep.add(piece.id);
      stored.push(piece);
    }
  }
  if (dropMissing) {
    for (const row of await assetRows(db, boardId)) {
      if (!keep.has(row.id)) {
        await db.prepare(`DELETE FROM mood_assets WHERE id = ?`).bind(row.id).run();
      }
    }
  }
  return stored;
}

async function inflatePieceImages(db, boardId, pieces) {
  const rows = await assetRows(db, boardId);
  if (!rows.length) return pieces;
  const images = new Map(rows.map((row) => [row.id, row.data]));
  return pieces.map((piece) => {
    if (!piece || typeof piece.src !== 'string' || !piece.src.startsWith('asset:')) return piece;
    const data = images.get(piece.src.slice(6));
    return data ? { ...piece, src: data } : piece;
  });
}

export async function handleMood(request, env, headers, sessionUser) {
  if (!env.DB) return json({ error: 'storage_unavailable' }, 503, headers);
  await ensureMoodTable(env.DB);

  const url = new URL(request.url);
  const route = parseMoodRoute(url.pathname);
  if (!route) return json({ error: 'invalid_board_id' }, 400, headers);

  const user = sessionUser ? await sessionUser(request, env).catch(() => null) : null;
  const userId = user?.id || null;
  const boardId = (route.id === 'draft' && userId) ? `draft_${userId}` : route.id;
  const now = new Date().toISOString();

  // 1. GET /api/mood/:id -> Fetch board
  if (request.method === 'GET' && !route.action) {
    const row = await resolveBoard(env.DB, boardId, userId);

    if (!row) {
      return json({ mood: null }, 200, headers);
    }

    let parsedData = null;
    try {
      parsedData = JSON.parse(row.data);
    } catch {
      parsedData = { pieces: [] };
    }
    if (Array.isArray(parsedData.pieces)) {
      parsedData.pieces = await inflatePieceImages(env.DB, row.id, parsedData.pieces);
    }

    return json({
      mood: {
        id: row.id,
        title: row.title,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        ...parsedData
      }
    }, 200, headers);
  }

  // 2. PUT or POST /api/mood/:id -> Save / sync board
  if ((request.method === 'PUT' || request.method === 'POST') && !route.action) {
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'expected_json' }, 400, headers);
    }

    if (!body || typeof body !== 'object') {
      return json({ error: 'invalid_payload' }, 400, headers);
    }

    const title = typeof body.title === 'string' ? body.title.slice(0, 100) : '';
    const incoming = {
      title,
      createdAt: typeof body.createdAt === 'string' ? body.createdAt : now,
      pieces: Array.isArray(body.pieces) ? body.pieces : [],
      participants: Array.isArray(body.participants) ? body.participants : []
    };
    let stored = incoming;
    if (body.authoritative !== true) {
      const existing = await boardById(env.DB, boardId);
      if (existing) stored = mergeBoardData(existing.data, incoming);
    }
    stored = {
      ...stored,
      pieces: await externalizePieceImages(env.DB, boardId, stored.pieces, body.authoritative === true)
    };
    let dataText = '';
    try {
      dataText = JSON.stringify(stored);
    } catch {
      return json({ error: 'serialization_error' }, 400, headers);
    }

    if (dataText.length > MOOD_JSON_LIMIT) {
      return json({ error: 'payload_too_large' }, 413, headers);
    }

    await env.DB.prepare(
      `INSERT INTO mood_boards (id, user_id, title, data, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         title = excluded.title,
         data = excluded.data,
         updated_at = excluded.updated_at,
         user_id = COALESCE(excluded.user_id, mood_boards.user_id)`
    ).bind(boardId, userId, title, dataText, now, now).run();

    return json({ ok: true, id: route.id, updatedAt: now }, 200, headers);
  }

  // 3. POST /api/mood/:id/like -> Toggle like on a piece
  if (request.method === 'POST' && route.action === 'like') {
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'expected_json' }, 400, headers);
    }

    const pieceId = typeof body?.pieceId === 'string' ? body.pieceId : '';
    const likerId = typeof body?.likerId === 'string' ? body.likerId : (userId || 'anon');
    if (!pieceId) return json({ error: 'missing_piece_id' }, 400, headers);

    const row = await env.DB.prepare(
      `SELECT data FROM mood_boards WHERE id = ?`
    ).bind(boardId).first();

    if (!row) return json({ error: 'board_not_found' }, 404, headers);

    let state = {};
    try {
      state = JSON.parse(row.data);
    } catch {
      return json({ error: 'corrupt_board_data' }, 500, headers);
    }

    const pieces = Array.isArray(state.pieces) ? state.pieces : [];
    const piece = pieces.find((p) => p.id === pieceId);
    if (!piece) return json({ error: 'piece_not_found' }, 404, headers);

    if (!Array.isArray(piece.likedBy)) {
      piece.likedBy = [];
    }
    const idx = piece.likedBy.indexOf(likerId);
    let liked = false;
    if (idx >= 0) {
      piece.likedBy.splice(idx, 1);
      liked = false;
    } else {
      piece.likedBy.push(likerId);
      liked = true;
    }
    piece.likes = piece.likedBy.length;

    await env.DB.prepare(
      `UPDATE mood_boards SET data = ?, updated_at = ? WHERE id = ?`
    ).bind(JSON.stringify(state), now, boardId).run();

    return json({ pieceId, likes: piece.likes, liked, likedBy: piece.likedBy }, 200, headers);
  }

  // 4. POST /api/mood/:id/comment -> Add a comment to a piece
  if (request.method === 'POST' && route.action === 'comment') {
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'expected_json' }, 400, headers);
    }

    const pieceId = typeof body?.pieceId === 'string' ? body.pieceId : '';
    const text = typeof body?.text === 'string' ? body.text.trim().slice(0, 1000) : '';
    const rawAuthor = body?.author && typeof body.author === 'object' ? body.author : {};
    if (!pieceId || !text) return json({ error: 'missing_comment_content' }, 400, headers);

    const author = {
      name: String(rawAuthor.name || 'Deltagare').slice(0, 60),
      avatar: String(rawAuthor.avatar || '').slice(0, 50_000),
      email: typeof rawAuthor.email === 'string' ? rawAuthor.email.slice(0, 120) : undefined
    };

    const row = await env.DB.prepare(
      `SELECT data FROM mood_boards WHERE id = ?`
    ).bind(boardId).first();

    if (!row) return json({ error: 'board_not_found' }, 404, headers);

    let state = {};
    try {
      state = JSON.parse(row.data);
    } catch {
      return json({ error: 'corrupt_board_data' }, 500, headers);
    }

    const pieces = Array.isArray(state.pieces) ? state.pieces : [];
    const piece = pieces.find((p) => p.id === pieceId);
    if (!piece) return json({ error: 'piece_not_found' }, 404, headers);

    if (!Array.isArray(piece.comments)) {
      piece.comments = [];
    }

    const comment = {
      id: `comm_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
      pieceId,
      text,
      author,
      createdAt: now
    };

    piece.comments.push(comment);

    await env.DB.prepare(
      `UPDATE mood_boards SET data = ?, updated_at = ? WHERE id = ?`
    ).bind(JSON.stringify(state), now, boardId).run();

    return json({ pieceId, comment, totalComments: piece.comments.length }, 200, headers);
  }

  return json({ error: 'method_not_allowed' }, 405, headers);
}
