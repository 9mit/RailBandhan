import { serializeJourney } from "@/server/api/serializers";
import { requireUser } from "@/server/auth/session";
import { jsonError, jsonOk } from "@/server/http";
import { listMyJourneys } from "@/server/journeys/service";
import { getStore } from "@/server/store";

export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    let journeys = await listMyJourneys(user.id);
    const store = getStore();

    if (journeys.length === 0) {
      const flagship = await store.getJourneyById("journey-12301-flagship");
      if (flagship) {
        try {
          await store.createJourneyMember({
            userId: user.id,
            journeyId: flagship.id,
            status: "verified",
            verificationMethod: "manual",
            expiresAt: "2099-12-31T23:59:59.000Z",
          });
          journeys = await listMyJourneys(user.id);
        } catch {
          // Ignore if already joined
        }
      }
    }

    const serialized = await Promise.all(
      journeys.map(async (journey) => {
        const membership = await store.getJourneyMember(user.id, journey.id);
        return serializeJourney(journey, membership);
      }),
    );

    return jsonOk({ journeys: serialized });
  } catch (error) {
    return jsonError(error);
  }
}
