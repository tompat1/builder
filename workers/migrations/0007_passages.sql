CREATE TABLE passages (
  id TEXT PRIMARY KEY,
  source_kind TEXT NOT NULL,
  source_id TEXT NOT NULL,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  position INTEGER NOT NULL,
  text TEXT NOT NULL,
  fetched_at TEXT NOT NULL
);

CREATE INDEX passages_source ON passages(source_kind, source_id);
