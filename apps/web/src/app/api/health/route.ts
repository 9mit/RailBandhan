import { checkRateLimitBackend } from "@/server/rate-limit";
import { getActiveStoreType, getStore } from "@/server/store";
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    await Promise.all([getStore().healthCheck(), checkRateLimitBackend()]);
    return NextResponse.json(
      {
        status: "ok",
        version: "0.2.0",
        services: {
          database: "ok",
          rate_limit: process.env.REDIS_URL ? "ok" : "local",
        },
        store: getActiveStoreType(),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { status: "unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
