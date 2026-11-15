import { createHash } from "node:crypto";
import { createRequire } from "node:module";
const pg = createRequire(new URL("../apps/web/package.json", import.meta.url))(
  "pg",
);
import { CORE_SCHEMA } from "../apps/web/src/server/store/schema.ts";
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
const { postgresConfig } =
  await import("../apps/web/src/server/store/postgres-config.ts");
const pool = new pg.Pool(postgresConfig());
const client = await pool.connect();
try {
  await client.query("BEGIN");
  await client.query("SELECT pg_advisory_xact_lock(728219001)");
  await client.query(
    "CREATE TABLE IF NOT EXISTS app_migrations (version TEXT PRIMARY KEY, checksum TEXT NOT NULL, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())",
  );
  const checksum = createHash("sha256").update(CORE_SCHEMA).digest("hex");
  const existing = await client.query(
    "SELECT checksum FROM app_migrations WHERE version=$1",
    ["001-core"],
  );
  if (existing.rows.length) {
    if (existing.rows[0].checksum !== checksum)
      throw new Error(
        "Migration checksum mismatch. Add a new migration instead of editing an applied migration.",
      );
    console.log("Database is current.");
  } else {
    await client.query(CORE_SCHEMA);
    await client.query(
      "INSERT INTO app_migrations(version,checksum)VALUES($1,$2)",
      ["001-core", checksum],
    );
    console.log("Applied 001-core.");
  }
  await client.query("COMMIT");
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  client.release();
  await pool.end();
}
