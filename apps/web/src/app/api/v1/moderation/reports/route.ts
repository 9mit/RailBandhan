import { serializeReport } from "@/server/api/serializers";
import { requireUser } from "@/server/auth/session";
import type { ReportStatus } from "@/server/domain/types";
import { jsonError, jsonOk, parseJsonBody } from "@/server/http";
import { listReports, resolveReport } from "@/server/moderation/service";

export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    const reports = await listReports(user.id);
    return jsonOk({ reports: reports.map(serializeReport) });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireUser(request);
    const body = await parseJsonBody<{
      report_id: string;
      status: ReportStatus;
      resolution?: string;
    }>(request);

    const report = await resolveReport({
      userId: user.id,
      reportId: body.report_id,
      status: body.status,
      resolution: body.resolution,
    });

    return jsonOk({ report: serializeReport(report) });
  } catch (error) {
    return jsonError(error);
  }
}
