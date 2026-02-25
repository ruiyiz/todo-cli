import Database from "libsql";
import { mkdirSync } from "fs";
import { dirname, join } from "path";
import { homedir } from "os";
import { initSchema } from "./schema.ts";
import { getTursoConfig } from "../config.ts";

export type DbInstance = InstanceType<typeof Database>;

let db: DbInstance | null = null;

function getDbPath(): string {
  if (process.env.TODO_DB_PATH) {
    return process.env.TODO_DB_PATH;
  }
  return join(homedir(), ".local", "share", "todo", "todo.db");
}

export function getDb(): DbInstance {
  if (db) return db;

  const dbPath = getDbPath();
  mkdirSync(dirname(dbPath), { recursive: true });

  const { url, authToken } = getTursoConfig();
  if (url && authToken) {
    db = new Database(dbPath, {
      syncUrl: url,
      authToken,
      offline: true,
    } as any);
    try {
      (db as any).sync();
    } catch {
      // Offline at startup - will use local cache
    }
  } else {
    db = new Database(dbPath);
    db.exec("PRAGMA journal_mode = WAL");
    db.exec("PRAGMA foreign_keys = ON");
  }

  initSchema(db);
  return db;
}

export function getDbPathInfo(): string {
  return getDbPath();
}

export function syncDb(): void {
  const { url } = getTursoConfig();
  if (!url) return;
  const dbInstance = getDb();
  try {
    (dbInstance as any).sync();
  } catch {
    // Offline - sync failed silently
  }
}
