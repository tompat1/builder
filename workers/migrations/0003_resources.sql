CREATE TABLE resources (
  id TEXT PRIMARY KEY,
  keywords TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  link_label TEXT,
  link_href TEXT,
  created_at TEXT NOT NULL
);
