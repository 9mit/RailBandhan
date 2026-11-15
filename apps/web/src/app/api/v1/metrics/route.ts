import { jsonError } from "@/server/http";
import { assertOperationalCredential } from "@/server/operations";
import { getStore } from "@/server/store";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    assertOperationalCredential(request, "METRICS_SECRET");
    const start = performance.now();
    await getStore().healthCheck();
    const memory = process.memoryUsage();
    return new Response(
      [
        "# HELP railbandhan_up Application and database are reachable.",
        "# TYPE railbandhan_up gauge",
        "railbandhan_up 1",
        "# TYPE railbandhan_database_probe_seconds gauge",
        `railbandhan_database_probe_seconds ${(performance.now() - start) / 1000}`,
        "# TYPE railbandhan_uptime_seconds gauge",
        `railbandhan_uptime_seconds ${process.uptime()}`,
        "# TYPE railbandhan_process_resident_memory_bytes gauge",
        `railbandhan_process_resident_memory_bytes ${memory.rss}`,
        "# TYPE railbandhan_process_heap_used_bytes gauge",
        `railbandhan_process_heap_used_bytes ${memory.heapUsed}`,
      ].join("\n") + "\n",
      {
        headers: {
          "Content-Type": "text/plain; version=0.0.4",
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    return jsonError(error);
  }
}
