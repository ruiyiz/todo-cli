import type { DbInstance } from "./connection.ts";

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS lists (
  id         TEXT PRIMARY KEY,
  logical_id INTEGER UNIQUE,
  title      TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE TABLE IF NOT EXISTS todos (
  id           TEXT PRIMARY KEY,
  title        TEXT NOT NULL,
  list_id      TEXT NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  due_date     TEXT,
  priority     TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal','prioritized')),
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

export function initSchema(db: DbInstance): void {
  db.exec(SCHEMA_SQL);
  migrate(db);
}

function migrate(db: DbInstance): void {
  // Add logical_id column if missing (upgrade from older schema)
  const cols = db.prepare("PRAGMA table_info(lists)").all() as { name: string }[];
  const hasLogicalId = cols.some((c) => c.name === "logical_id");
  if (!hasLogicalId) {
    db.exec("ALTER TABLE lists ADD COLUMN logical_id INTEGER");
  }

  // Backfill logical_id for any rows that don't have one
  const unassigned = db
    .prepare("SELECT id FROM lists WHERE logical_id IS NULL ORDER BY created_at")
    .all() as { id: string }[];
  if (unassigned.length > 0) {
    const maxRow = (db.prepare("SELECT MAX(logical_id) as m FROM lists").get() as { m: number | null } | undefined) ?? null;
    let next = (maxRow?.m ?? 0) + 1;
    const stmt = db.prepare("UPDATE lists SET logical_id = ? WHERE id = ?");
    for (const row of unassigned) {
      stmt.run(next++, row.id);
    }
  }

  // Ensure unique index exists (for databases migrated via ALTER TABLE)
  db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_lists_logical_id ON lists(logical_id)");

  // Migrate priority from 4-level (none/low/medium/high) to 2-level (normal/prioritized)
  const sample = (db.prepare("SELECT priority FROM todos LIMIT 1").get() as { priority: string } | undefined) ?? null;
  if (sample && ["none", "low", "medium", "high"].includes(sample.priority)) {
    db.exec("DROP TRIGGER IF EXISTS trg_todos_updated_at");
    db.exec(`
      CREATE TABLE todos_new (
        id           TEXT PRIMARY KEY,
        title        TEXT NOT NULL,
        list_id      TEXT NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
        due_date     TEXT,
        priority     TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal','prioritized')),
        is_completed INTEGER NOT NULL DEFAULT 0 CHECK (is_completed IN (0,1)),
        completed_at TEXT,
        notes        TEXT,
        created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
        updated_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
      )
    `);
    db.exec(`
      INSERT INTO todos_new SELECT
        id, title, list_id, due_date,
        CASE WHEN priority IN ('medium','high') THEN 'prioritized' ELSE 'normal' END,
        is_completed, completed_at, notes, created_at, updated_at
      FROM todos
    `);
    db.exec("DROP TABLE todos");
    db.exec("ALTER TABLE todos_new RENAME TO todos");
    db.exec("CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todos(due_date)");
    db.exec("CREATE INDEX IF NOT EXISTS idx_todos_is_completed ON todos(is_completed)");
    db.exec("CREATE INDEX IF NOT EXISTS idx_todos_list_id ON todos(list_id)");
    db.exec(`
      CREATE TRIGGER IF NOT EXISTS trg_todos_updated_at AFTER UPDATE ON todos
        FOR EACH ROW BEGIN
          UPDATE todos SET updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE id = OLD.id;
        END
    `);
  }
}
