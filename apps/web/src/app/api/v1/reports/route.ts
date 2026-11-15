import { serializeReport } from "@/server/api/serializers";
import { requireUser } from "@/server/auth/session";
import { jsonError, jsonOk, parseJsonBody } from "@/server/http";
import { createReport } from "@/server/moderation/service";

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const body = await parseJsonBody<{
      target_type: string;
      target_id: string;
      reason: string;
    }>(request);

    const report = await createReport({
      reporterId: user.id,
      targetType: body.target_type,
      targetId: body.target_id,
      reason: body.reason,
    });

    return jsonOk({ report: serializeReport(report) });
  } catch (error) {
    return jsonError(error);
  }
}
