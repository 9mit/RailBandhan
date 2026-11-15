import { AsyncLocalStorage } from "node:async_hooks";
import type { DatabaseSync, SQLInputValue } from "node:sqlite";
import type { Pool, PoolClient } from "pg";

export interface SqlStatement {
  run(...values: unknown[]): Promise<{ changes: number }>;
  get(...values: unknown[]): Promise<any>;
  all(...values: unknown[]): Promise<any[]>;
}
export interface SqlConnection {
  dialect: "sqlite" | "postgres";
  prepare(sql: string): SqlStatement;
  exec(sql: string): Promise<void>;
  transaction<T>(work: () => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

/** Only application-owned SQL reaches this function. User values remain parameters. */
export function postgresSql(sql: string): string {
  let query = sql.trim();
  const ignore = /^INSERT OR IGNORE /i.test(query);
  query = query.replace(/^INSERT OR IGNORE /i, "INSERT ");
  let parameter = 0;
  query = query.replace(/\?/g, () => `$${++parameter}`);
  if (ignore) query = query.replace(/;?$/, " ON CONFLICT DO NOTHING");
  return query;
}

// A transaction owns the SQLite connection across async service calls. Other
// requests queue, so they cannot accidentally write inside that transaction.
export class SqliteConnection implements SqlConnection {
  readonly dialect = "sqlite" as const;
  private context = new AsyncLocalStorage<boolean>();
  private queue: Promise<void> = Promise.resolve();
  constructor(private db: DatabaseSync) {}
  private async locked<T>(work: () => T | Promise<T>): Promise<T> {
    if (this.context.getStore()) return work();
    const previous = this.queue;
    let release!: () => void;
    this.queue = new Promise<void>((resolve) => {
      release = resolve;
    });
    await previous;
    try {
      return await work();
    } finally {
      release();
    }
  }
  prepare(sql: string): SqlStatement {
    return {
      run: (...values) =>
        this.locked(() => ({
          changes: Number(
            this.db.prepare(sql).run(...(values as SQLInputValue[])).changes,
          ),
        })),
      get: (...values) =>
        this.locked(() =>
          this.db.prepare(sql).get(...(values as SQLInputValue[])),
        ),
      all: (...values) =>
        this.locked(() =>
          this.db.prepare(sql).all(...(values as SQLInputValue[])),
        ),
    };
  }
  async exec(sql: string) {
    await this.locked(() => this.db.exec(sql));
  }
  async transaction<T>(work: () => Promise<T>): Promise<T> {
    if (this.context.getStore()) return work();
    return this.locked(() =>
      this.context.run(true, async () => {
        this.db.exec("BEGIN IMMEDIATE");
        try {
          const result = await work();
          this.db.exec("COMMIT");
          return result;
        } catch (error) {
          this.db.exec("ROLLBACK");
          throw error;
        }
      }),
    );
  }
  async close() {
    await this.locked(() => this.db.close());
  }
}

export class PostgresConnection implements SqlConnection {
  readonly dialect = "postgres" as const;
  private context = new AsyncLocalStorage<PoolClient>();
  constructor(private pool: Pool) {}
  private query(sql: string, values?: unknown[]) {
    return (this.context.getStore() ?? this.pool).query(
      postgresSql(sql),
      values,
    );
  }
  prepare(sql: string): SqlStatement {
    return {
      run: async (...values) => ({
        changes: (await this.query(sql, values)).rowCount ?? 0,
      }),
      get: async (...values) => (await this.query(sql, values)).rows[0],
      all: async (...values) => (await this.query(sql, values)).rows,
    };
  }
  async exec(sql: string) {
    await this.query(sql);
  }
  async transaction<T>(work: () => Promise<T>): Promise<T> {
    if (this.context.getStore()) return work();
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      return await this.context.run(client, async () => {
        try {
          const result = await work();
          await client.query("COMMIT");
          return result;
        } catch (error) {
          await client.query("ROLLBACK");
          throw error;
        }
      });
    } finally {
      client.release();
    }
  }
  async close() {
    await this.pool.end();
  }
}
