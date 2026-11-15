import { serializeAnonymousProfile } from "@/server/api/serializers";
import { requireUser } from "@/server/auth/session";
import { jsonError, jsonOk, parseJsonBody } from "@/server/http";
import { updatePrivacy } from "@/server/profiles/service";

export async function PATCH(request: Request) {
  try {
    const user = await requireUser(request);
    const body = await parseJsonBody<{
      discovery_visible?: boolean;
      allow_discovery?: boolean;
      messaging_policy?: "nobody" | "same_journey" | "eligible";
      coach_visibility?: "never" | "coach" | "coach_berth";
    }>(request);

    const anonymousProfile = await updatePrivacy({
      userId: user.id,
      discoveryVisible: body.discovery_visible ?? body.allow_discovery,
      messagingPolicy: body.messaging_policy,
      coachVisibility: body.coach_visibility,
    });

    return jsonOk({
      anonymous: serializeAnonymousProfile(anonymousProfile),
    });
  } catch (error) {
    return jsonError(error);
  }
}
