CREATE TABLE user_settings (
  user_id TEXT PRIMARY KEY REFERENCES users(id),
  display_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
