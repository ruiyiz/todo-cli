import type { Database } from "bun:sqlite";

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS lists (
  id         TEXT PRIMARY KEY,
  title      TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE TABLE IF NOT EXISTS todos (
  id           TEXT PRIMARY KEY,
  title        TEXT NOT NULL,
  list_id      TEXT NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  due_date     TEXT,
  priority     TEXT NOT NULL DEFAULT 'none' CHECK (priority IN ('none','low','medium','high')),
  is_completed INTEGER NOT NULL DEFAULT 0 CHECK (is_completed IN (0,1)),
  completed_at TEXT,
  notes        TEXT,
  created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todos(due_date);
CREATE INDEX IF NOT EXISTS idx_todos_is_completed ON todos(is_completed);
CREATE INDEX IF NOT EXISTS idx_todos_list_id ON todos(list_id);

CREATE TRIGGER IF NOT EXISTS trg_todos_updated_at AFTER UPDATE ON todos
  FOR EACH ROW BEGIN
    UPDATE todos SET updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE id = OLD.id;
  END;

CREATE TABLE IF NOT EXISTS _last_result (
  idx     INTEGER PRIMARY KEY,
  todo_id TEXT NOT NULL
);

INSERT OR IGNORE INTO lists (id, title) VALUES ('00000000-0000-0000-0000-000000000001', 'Todos');
`;

export function initSchema(db: Database): void {
  db.exec(SCHEMA_SQL);
}
