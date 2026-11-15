import { spawn } from "node:child_process";
import { unlink } from "node:fs/promises";
import { encryptBackup } from "./backup-format.mjs";
import { pgToolEnvironment } from "./pg-tool-env.mjs";
const destination = process.argv[2];
if (!destination)
  throw new Error(
    "Usage: node scripts/pg-backup.mjs /private/path/database.rbbackup",
  );
const child = spawn("pg_dump", ["--format=custom", "--no-owner", "--no-acl"], {
  env: pgToolEnvironment(process.env.DATABASE_URL),
  stdio: ["ignore", "pipe", "ignore"],
});
const completion = new Promise((resolve, reject) => {
  child.once("error", reject);
  child.once("exit", (code) =>
    code === 0 ? resolve() : reject(new Error("pg_dump failed")),
  );
});
let created = false;
const encryption = encryptBackup(
  child.stdout,
  destination,
  process.env.BACKUP_ENCRYPTION_KEY,
  () => {
    created = true;
  },
);
try {
  await Promise.all([completion, encryption]);
  console.log("Encrypted database backup completed.");
} catch (error) {
  child.kill("SIGTERM");
  await encryption.catch(() => {});
  if (created) await unlink(destination).catch(() => {});
  throw error;
}
