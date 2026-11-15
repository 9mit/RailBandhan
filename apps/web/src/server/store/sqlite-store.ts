import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { SqliteConnection } from "./sql-connection";
import { SqlStore } from "./sql-store";
export class SqliteStore extends SqlStore {
  constructor(dbPath?: string) {
    const test =
      process.env.NODE_ENV === "test" ||
      process.env.VITEST !== undefined ||
      process.env.DATA_STORE === "memory";
    const target =
      dbPath ??
      process.env.SQLITE_DB_PATH ??
      (test ? ":memory:" : path.join(process.cwd(), ".data", "railbandhan.db"));
    if (target !== ":memory:")
      fs.mkdirSync(path.dirname(target), { recursive: true, mode: 0o700 });
    const db = new DatabaseSync(target);
    db.exec(
      "PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 10000; PRAGMA journal_mode = WAL;",
    );
    super(new SqliteConnection(db), true);
    if (target !== ":memory:") fs.chmodSync(target, 0o600);
  }
}
let instance: SqliteStore | null = null;
export function getSqliteStore(dbPath?: string): SqliteStore {
  if (dbPath) return new SqliteStore(dbPath);
  return (instance ??= new SqliteStore());
}
export function resetSqliteStore(): void {
  if (instance) instance.reset();
  else instance = new SqliteStore();
}
