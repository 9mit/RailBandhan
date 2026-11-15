import { getSessionUser } from "@/server/auth/session";
import { RailwayObservability } from "@/server/railway/observability";
import { getStore } from "@/server/store";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const store = getStore();
  const user = await store.getAuthUserById(sessionUser.id);
  if (user?.role !== "moderator" && user?.role !== "admin") {
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 },
    );
  }

  const healthScores = RailwayObservability.getAllProviderHealth();
  const recentLogs = RailwayObservability.getRecentLogs(30);

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    providers: healthScores,
    recentLogs,
  });
}
