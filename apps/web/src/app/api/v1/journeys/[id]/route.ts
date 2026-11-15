import { serializeJourney } from "@/server/api/serializers";
import { requireUser } from "@/server/auth/session";
import { jsonError, jsonOk } from "@/server/http";
import { getJourneyForUser } from "@/server/journeys/service";
import { getStore } from "@/server/store";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser(request);
    const { id } = await params;
    const journey = await getJourneyForUser(user.id, id);
    const store = getStore();
    const membership = await store.getJourneyMember(user.id, id);

    return jsonOk(serializeJourney(journey, membership));
  } catch (error) {
    return jsonError(error);
  }
}
