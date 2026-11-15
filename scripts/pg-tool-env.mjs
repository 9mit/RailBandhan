export function pgToolEnvironment(connectionString) {
  if (!connectionString) throw new Error("A database URL is required");
  const url = new URL(connectionString);
  if (!["postgres:", "postgresql:"].includes(url.protocol))
    throw new Error("Expected a PostgreSQL URL");
  const local = ["localhost", "127.0.0.1", "[::1]", "postgres"].includes(
    url.hostname,
  );
  return {
    ...process.env,
    PGHOST: url.hostname,
    PGPORT: url.port || "5432",
    PGUSER: decodeURIComponent(url.username),
    PGPASSWORD: decodeURIComponent(url.password),
    PGDATABASE: decodeURIComponent(url.pathname.slice(1)),
    PGSSLMODE: local ? "prefer" : "verify-full",
    ...(local
      ? {}
      : { PGSSLROOTCERT: process.env.DATABASE_CA_FILE || "system" }),
  };
}
