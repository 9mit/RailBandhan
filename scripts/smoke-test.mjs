// Read-only smoke checks. Never creates users or mutates a production account.
const base = (
  process.argv[2] ||
  process.env.APP_URL ||
  "http://localhost:3000"
).replace(/\/$/, "");
const checks = [
  ["/api/health", 200],
  ["/api/v1/health", 200],
  ["/home", 200],
  ["/login", 200],
  ["/signup", 200],
  ["/explore", 200],
  ["/help", 200],
  ["/manifest.webmanifest", 200],
  ["/sw.js", 200],
  ["/api/v1/journeys", 401],
];
let failed = 0;
for (const [path, status] of checks) {
  const start = performance.now();
  try {
    const response = await fetch(base + path, {
      signal: AbortSignal.timeout(15000),
      redirect: "manual",
    });
    const ok = response.status === status;
    await response.arrayBuffer();
    console.log(
      `${ok ? "PASS" : "FAIL"} ${path}: ${response.status} (${Math.round(performance.now() - start)}ms)`,
    );
    if (!ok) failed++;
  } catch (error) {
    failed++;
    console.error(`FAIL ${path}: ${error.name}`);
  }
}
const attack = await fetch(base + "/api/v1/auth/login", {
  method: "POST",
  headers: {
    Origin: "https://invalid.example",
    "Content-Type": "application/json",
  },
  body: "{}",
  signal: AbortSignal.timeout(10000),
});
if (attack.status !== 403) {
  failed++;
  console.error("FAIL cross-origin write protection");
} else console.log("PASS cross-origin write protection");
const document = await fetch(base + "/home", {
  signal: AbortSignal.timeout(15000),
});
const csp = document.headers.get("content-security-policy") || "";
if (!csp.includes("'nonce-") || !csp.includes("object-src 'none'")) {
  failed++;
  console.error("FAIL content security policy");
} else console.log("PASS nonce-based content security policy");
if (failed) process.exitCode = 1;
