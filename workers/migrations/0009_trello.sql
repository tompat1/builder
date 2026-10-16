CREATE TABLE IF NOT EXISTS trello_tokens (
  user_id TEXT PRIMARY KEY REFERENCES users(id),
  token TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS house_trello_boards (
  house_id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id),
  board_id TEXT NOT NULL,
  board_url TEXT NOT NULL,
  board_name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (house_id, user_id)
);

CREATE INDEX IF NOT EXISTS house_trello_boards_user ON house_trello_boards(user_id, created_at DESC);
