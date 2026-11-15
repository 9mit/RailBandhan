import { readFileSync } from "node:fs";
import type { PoolConfig } from "pg";
export function postgresConfig(
  env: NodeJS.ProcessEnv = process.env,
): PoolConfig {
  if (!env.DATABASE_URL) throw new Error("DATABASE_URL is required");
  const url = new URL(env.DATABASE_URL);
  if (!["postgres:", "postgresql:"].includes(url.protocol))
    throw new Error("DATABASE_URL must use PostgreSQL");
  if (url.searchParams.get("sslmode") === "no-verify")
    throw new Error("Unverified database TLS is forbidden");
  for (const key of ["sslmode", "sslcert", "sslkey", "sslrootcert"])
    url.searchParams.delete(key);
  const remote = !["localhost", "127.0.0.1", "[::1]", "postgres"].includes(
    url.hostname,
  );
  const ssl =
    remote || env.DATABASE_SSL === "true"
      ? {
          rejectUnauthorized: true,
          ca: env.DATABASE_CA_FILE
            ? readFileSync(env.DATABASE_CA_FILE, "utf8")
            : undefined,
        }
      : undefined;
  return {
    connectionString: url.toString(),
    ssl,
    max: Math.min(50, Math.max(2, Number(env.DATABASE_POOL_SIZE) || 10)),
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    statement_timeout: 10000,
    application_name: "railbandhan",
  };
}
