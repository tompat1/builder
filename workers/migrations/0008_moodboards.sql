CREATE TABLE mood_boards (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  title TEXT NOT NULL DEFAULT '',
  data TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX mood_boards_user ON mood_boards(user_id);
CREATE INDEX mood_boards_updated ON mood_boards(updated_at DESC);
