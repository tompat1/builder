CREATE TABLE houses (
  user_id TEXT PRIMARY KEY REFERENCES users(id),
  config TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
