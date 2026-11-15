import { serializeLiveStatus } from "@/server/api/serializers";
import { requireUser } from "@/server/auth/session";
import { jsonError, jsonOk } from "@/server/http";
import { getLiveStatusForJourney } from "@/server/trains/service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser(request);
    const { id } = await params;
    const liveStatus = await getLiveStatusForJourney(user.id, id);
    const status = await serializeLiveStatus(id, liveStatus);

    return jsonOk(status);
  } catch (error) {
    return jsonError(error);
  }
}
