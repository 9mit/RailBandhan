import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { decryptBackup } from "./backup-format.mjs";
import { pgToolEnvironment } from "./pg-tool-env.mjs";
const source = process.argv[2],
  env = pgToolEnvironment(process.env.RESTORE_DATABASE_URL);
if (!source)
  throw new Error(
    "Usage: RESTORE_DATABASE_URL=... node scripts/pg-restore.mjs backup.rbbackup",
  );
if (!/(_restore|_staging)(_|$)/.test(env.PGDATABASE))
  throw new Error(
    "Restore only targets an empty database named with _restore or _staging. Production overwrite is refused.",
  );
const temp = await mkdtemp(path.join(tmpdir(), "rail-restore-")),
  dump = path.join(temp, "database.dump");
function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env,
      stdio: ["ignore", "ignore", "ignore"],
    });
    child.once("error", reject);
    child.once("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`${command} failed`)),
    );
  });
}
try {
  // Authentication succeeds before any database mutation. Tampered backups never reach pg_restore.
  await decryptBackup(source, dump, process.env.BACKUP_ENCRYPTION_KEY);
  await run("pg_restore", [
    "--exit-on-error",
    "--single-transaction",
    "--no-owner",
    "--no-acl",
    "--dbname",
    env.PGDATABASE,
    dump,
  ]);
  await run("psql", [
    "--set",
    "ON_ERROR_STOP=1",
    "--command",
    "UPDATE auth_sessions SET revoked_at = CURRENT_TIMESTAMP::text;",
  ]);
  console.log(
    "Restored into the isolated database and revoked recovered sessions. Verify it before switching traffic.",
  );
} finally {
  await rm(temp, { recursive: true, force: true });
}
