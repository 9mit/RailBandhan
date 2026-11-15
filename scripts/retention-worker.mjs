const url =
  process.env.RETENTION_URL || "http://web:3000/api/v1/jobs/retention";
if (!process.env.CRON_SECRET) throw new Error("CRON_SECRET is required");
let stopping = false;
let timer;
for (const signal of ["SIGTERM", "SIGINT"])
  process.on(signal, () => {
    stopping = true;
    clearTimeout(timer);
  });
async function run() {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
      signal: AbortSignal.timeout(60000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    console.log(
      JSON.stringify({
        event: "retention_run",
        ok: true,
        timestamp: new Date().toISOString(),
      }),
    );
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "retention_run",
        ok: false,
        reason: error instanceof Error ? error.name : "unknown",
        timestamp: new Date().toISOString(),
      }),
    );
  }
  if (!stopping) timer = setTimeout(run, 60 * 60 * 1000);
}
await run();
