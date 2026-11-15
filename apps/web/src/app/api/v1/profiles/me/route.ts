import {
  serializeAnonymousProfile,
  serializePrivateProfile,
} from "@/server/api/serializers";
import { requireUser } from "@/server/auth/session";
import { jsonError, jsonOk } from "@/server/http";
import { getMe } from "@/server/profiles/service";

export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    const { profile, anonymousProfile } = await getMe(user.id);

    return jsonOk({
      anonymous: anonymousProfile
        ? serializeAnonymousProfile(anonymousProfile)
        : null,
      private: profile ? serializePrivateProfile(profile) : null,
      privacy: anonymousProfile
        ? {
            discovery_visible: anonymousProfile.discoveryVisible,
            messaging_policy: anonymousProfile.messagingPolicy,
            coach_visibility: anonymousProfile.coachVisibility,
          }
        : null,
    });
  } catch (error) {
    return jsonError(error);
  }
}
