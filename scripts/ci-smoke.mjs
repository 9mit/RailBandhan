import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
const privateDir = await mkdtemp(path.join(tmpdir(), "railbandhan-smoke-"));
const secret = () => randomBytes(32).toString("hex");
const env = {
  ...process.env,
  NODE_ENV: "production",
  DATA_STORE: "postgres",
  DATABASE_URL: process.env.DATABASE_URL || process.env.POSTGRES_TEST_URL,
  REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",
  NEXT_PUBLIC_APP_URL: "https://railbandhan-ci.example",
  TICKET_STORAGE_DIR: privateDir,
  PNR_HMAC_SECRET: secret(),
  TICKET_ENCRYPTION_KEY: secret(),
  CRON_SECRET: secret(),
  METRICS_SECRET: secret(),
  TRUST_PROXY: "false",
  COOKIE_SECURE: "true",
  PORT: "3000",
};
const server = spawn(
  process.execPath,
  ["apps/web/.next/standalone/apps/web/server.js"],
  { env, stdio: ["ignore", "ignore", "inherit"] },
);
const serverCompletion = new Promise((resolve) => {
  server.once("exit", resolve);
  server.once("error", () => resolve(1));
});
try {
  let ready = false;
  for (let i = 0; i < 40; i++) {
    try {
      ready = (
        await fetch("http://localhost:3000/api/health", {
          signal: AbortSignal.timeout(1000),
        })
      ).ok;
    } catch {}
    if (ready) break;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  if (!ready) throw new Error("Production smoke server did not become ready");
  const smoke = spawn(
    process.execPath,
    ["scripts/smoke-test.mjs", "http://localhost:3000"],
    { env, stdio: "inherit" },
  );
  const code = await new Promise((resolve) => smoke.on("exit", resolve));
  if (code !== 0) throw new Error("HTTP smoke checks failed");
} finally {
  server.kill("SIGTERM");
  await serverCompletion;
  await rm(privateDir, { recursive: true, force: true });
}
