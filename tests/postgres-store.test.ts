import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import pg from "pg";
import { CORE_SCHEMA } from "@/server/store/schema";
import { SqlStore } from "@/server/store/sql-store";
import {
  PostgresConnection,
  postgresSql,
  type SqlConnection,
} from "@/server/store/sql-connection";
// Locally this uses a real PostgreSQL engine compiled to WASM. CI also runs the
// same contract over the PostgreSQL wire protocol using POSTGRES_TEST_URL.
describe("PostgreSQL repository contract", () => {
  let store: SqlStore, connection: SqlConnection;
  beforeAll(async () => {
    if (process.env.POSTGRES_TEST_URL) {
      connection = new PostgresConnection(
        new pg.Pool({ connectionString: process.env.POSTGRES_TEST_URL }),
      );
    } else {
      const db = new PGlite();
      connection = {
        dialect: "postgres",
        prepare(sql) {
          return {
            run: async (...params) => ({
              changes:
                (await db.query(postgresSql(sql), params)).affectedRows ?? 0,
            }),
            get: async (...params) =>
              (await db.query(postgresSql(sql), params)).rows[0],
            all: async (...params) =>
              (await db.query(postgresSql(sql), params)).rows,
          };
        },
        async exec(sql) {
          await db.exec(sql);
        },
        async transaction(work) {
          return db.transaction(async (tx) => {
            const previous = this.prepare;
            this.prepare = (sql) => ({
              run: async (...p) => ({
                changes:
                  (await tx.query(postgresSql(sql), p)).affectedRows ?? 0,
              }),
              get: async (...p) =>
                (await tx.query(postgresSql(sql), p)).rows[0],
              all: async (...p) => (await tx.query(postgresSql(sql), p)).rows,
            });
            try {
              return await work();
            } finally {
              this.prepare = previous;
            }
          });
        },
        async close() {
          await db.close();
        },
      };
    }
    await connection.exec(
      "CREATE TABLE IF NOT EXISTS app_migrations(version TEXT PRIMARY KEY,checksum TEXT NOT NULL DEFAULT '');",
    );
    await connection.exec(CORE_SCHEMA);
    await connection
      .prepare(
        "INSERT OR IGNORE INTO app_migrations(version,checksum) VALUES (?,?)",
      )
      .run("001-core", "test-fixture");
    store = new SqlStore(connection);
    await store.healthCheck();
  }, 30000);
  afterAll(async () => {
    await store?.close();
  });
  it("persists normalized users, catalog, sessions and atomic refresh history", async () => {
    const user = await store.createAuthUser({
      email: "Postgres@example.com",
      passwordHash: "test-only",
    });
    expect((await store.getAuthUserByEmail("postgres@example.com"))?.id).toBe(
      user.id,
    );
    expect((await store.listTrains()).length).toBeGreaterThan(2);
    const now = new Date().toISOString();
    const session = {
      id: crypto.randomUUID(),
      userId: user.id,
      accessHash: "access-original",
      refreshHash: "refresh-original",
      accessExpiresAt: now,
      refreshExpiresAt: new Date(Date.now() + 86400000).toISOString(),
      revokedAt: null,
      createdAt: now,
    };
    await store.createAuthSession(session);
    expect(
      await store.rotateAuthSession(session.refreshHash, {
        ...session,
        accessHash: "access-next",
        refreshHash: "refresh-next",
      }),
    ).toBe(true);
    expect(
      await store.rotateAuthSession(session.refreshHash, {
        ...session,
        accessHash: "access-wrong",
        refreshHash: "refresh-wrong",
      }),
    ).toBe(false);
    expect(
      (await store.getAuthSessionByHash(session.refreshHash, "used"))?.userId,
    ).toBe(user.id);
    await store.revokeAuthSession(session.id);
    expect(
      (await store.getAuthSessionByHash("access-next", "access"))?.revokedAt,
    ).not.toBeNull();
  });
  it("rolls back dependent writes on failure", async () => {
    const email = `rollback-${crypto.randomUUID()}@example.com`;
    await expect(
      store.transaction(async () => {
        await store.createAuthUser({ email, passwordHash: "test-only" });
        throw new Error("abort");
      }),
    ).rejects.toThrow("abort");
    expect(await store.getAuthUserByEmail(email)).toBeNull();
  });
});
