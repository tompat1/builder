CREATE TABLE content (
  key TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('text', 'image')),
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
