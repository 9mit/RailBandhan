import { validateProductionEnvironment } from "../config";
import { getMemoryStore, resetMemoryStore } from "./memory-store";
import { getPostgresStore } from "./postgres-store";
import { getSqliteStore, resetSqliteStore } from "./sqlite-store";
import type { Store } from "./types";
export type DataStoreType = "memory" | "sqlite" | "postgres";
export function getActiveStoreType(): DataStoreType {
  const configured = process.env.DATA_STORE?.trim().toLowerCase() || "sqlite";
  if (configured === "memory" && process.env.NODE_ENV === "production")
    throw new Error("Memory storage is forbidden in production");
  if (!["memory", "sqlite", "postgres"].includes(configured))
    throw new Error(
      `Unsupported DATA_STORE: ${configured}. Use postgres, sqlite or memory.`,
    );
  return configured as DataStoreType;
}
export const shouldUseMemoryStore = () => getActiveStoreType() === "memory";
export const shouldUseSqliteStore = () => getActiveStoreType() === "sqlite";
export function getStore(): Store {
  validateProductionEnvironment();
  switch (getActiveStoreType()) {
    case "memory":
      return getMemoryStore();
    case "postgres":
      return getPostgresStore();
    default:
      return getSqliteStore();
  }
}
export function resetStore(): void {
  if (getActiveStoreType() === "postgres")
    throw new Error(
      "Use an isolated database and explicit test teardown for PostgreSQL",
    );
  if (getActiveStoreType() === "memory") resetMemoryStore();
  else resetSqliteStore();
}
export { getMemoryStore, getSqliteStore, resetMemoryStore, resetSqliteStore };
