import { Database } from "bun:sqlite";
import { mkdirSync } from "fs";
import { dirname, join } from "path";
import { homedir } from "os";
import { initSchema } from "./schema.ts";

let db: Database | null = null;

function getDbPath(): string {
  if (process.env.TODO_DB_PATH) {
    return process.env.TODO_DB_PATH;
  }
  return join(homedir(), ".local", "share", "todo", "todo.db");
}

export function getDb(): Database {
  if (db) return db;

  const dbPath = getDbPath();
  mkdirSync(dirname(dbPath), { recursive: true });

  db = new Database(dbPath);
  db.run("PRAGMA journal_mode = WAL");
  db.run("PRAGMA foreign_keys = ON");

  initSchema(db);
  return db;
}

export function getDbPathInfo(): string {
  return getDbPath();
}
