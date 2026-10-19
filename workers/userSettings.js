/** Display choices saved on the account, so they follow the person across devices. */

let tableReady = false;

export function acceptDisplaySettings(body) {
  const source = body && typeof body === 'object' && body.display && typeof body.display === 'object'
    ? body.display
    : body;
  if (!source || typeof source !== 'object') return null;
  return {
    dimensions: source.dimensions === true,
    notes: source.notes === true,
    sun: source.sun === true,
    mood: source.mood === true
  };
}

export async function ensureUserSettings(db) {
  if (tableReady || !db) return;
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS user_settings (
      user_id TEXT PRIMARY KEY REFERENCES users(id),
      display_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `).run();
  tableReady = true;
}

export async function readUserDisplay(db, userId) {
  await ensureUserSettings(db);
  const row = await db.prepare(
    'SELECT display_json FROM user_settings WHERE user_id = ?'
  ).bind(userId).first();
  if (!row?.display_json) return null;
  try {
    return acceptDisplaySettings(JSON.parse(row.display_json));
  } catch {
    return null;
  }
}

export async function writeUserDisplay(db, userId, prefs) {
  await ensureUserSettings(db);
  const now = new Date().toISOString();
  const display = JSON.stringify(prefs);
  await db.prepare(
    `INSERT INTO user_settings (user_id, display_json, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET
       display_json = excluded.display_json,
       updated_at = excluded.updated_at`
  ).bind(userId, display, now).run();
  return prefs;
}
