import { serializeReport } from "@/server/api/serializers";
import { requireUser } from "@/server/auth/session";
import type { ReportStatus } from "@/server/domain/types";
import { jsonError, jsonOk, parseJsonBody } from "@/server/http";
import { resolveReport } from "@/server/moderation/service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser(request);
    const { id } = await params;
    const body = await parseJsonBody<{
      action?: "resolve" | "dismiss";
      status?: ReportStatus;
      resolution?: string;
    }>(request);

    const status: ReportStatus =
      body.status ?? (body.action === "dismiss" ? "dismissed" : "resolved");

    const report = await resolveReport({
      userId: user.id,
      reportId: id,
      status,
      resolution:
        body.resolution ?? `Resolved action: ${body.action ?? status}`,
    });

    return jsonOk({ report: serializeReport(report) });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return POST(request, { params });
}
