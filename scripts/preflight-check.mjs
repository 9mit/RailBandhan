import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { validateProductionEnvironment } from "../apps/web/src/server/config.ts";
const required = [
  "apps/web/package-lock.json",
  "deploy/Dockerfile.web",
  "deploy/docker-compose.prod.yml",
  "deploy/nginx/templates/railbandhan.conf.template",
  "docs/PRODUCTION_DEPLOYMENT.md",
  "docs/SECURITY_REVIEW.md",
  "docs/PRODUCTION_READINESS.md",
];
let failed = false;
for (const file of required) {
  const ok = existsSync(file);
  console.log(`${ok ? "PASS" : "FAIL"} required file: ${file}`);
  if (!ok) failed = true;
}
try {
  validateProductionEnvironment();
  console.log("PASS environment policy");
} catch (error) {
  console.error(error.message);
  failed = true;
}
const major = Number(process.versions.node.split(".")[0]);
console.log(`${major === 24 ? "PASS" : "FAIL"} Node.js 24 runtime`);
if (major !== 24) failed = true;
for (const command of ["pdftotext", "tesseract"]) {
  const result = spawnSync(command, ["-v"], { stdio: "ignore" });
  console.log(
    `${result.error ? "WARN" : "PASS"} local ticket reader: ${command}`,
  );
}
const ignored = spawnSync("git", ["check-ignore", ".env.production"], {
  encoding: "utf8",
});
if (ignored.status !== 0) {
  console.error("FAIL .env.production must be ignored");
  failed = true;
} else console.log("PASS runtime secrets excluded from Git");
if (failed) process.exitCode = 1;
