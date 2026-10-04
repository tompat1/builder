CREATE TABLE users (
  id TEXT PRIMARY KEY,
  github_id TEXT UNIQUE,
  github_login TEXT NOT NULL UNIQUE COLLATE NOCASE,
  email TEXT,
  name TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'member')),
  password_hash TEXT,
  github_avatar TEXT,
  avatar_key TEXT,
  avatar_type TEXT,
  avatar_bytes BLOB,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  expires_at TEXT NOT NULL
);

CREATE INDEX sessions_user ON sessions(user_id);

INSERT INTO users (id, github_login, name, role, created_at, updated_at)
VALUES (
  'usr_tompat1',
  'tompat1',
  'tompat1',
  'admin',
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
);
