import { logger } from "@/lib/logger";
import { Pool } from "pg";
import { postgresConfig } from "./postgres-config";
import { PostgresConnection } from "./sql-connection";
import { SqlStore } from "./sql-store";
let instance: SqlStore | null = null;
export function getPostgresStore(): SqlStore {
  if (instance) return instance;
  const pool = new Pool(postgresConfig());
  pool.on("error", () => logger.error("database_pool_error"));
  return (instance = new SqlStore(new PostgresConnection(pool)));
}
