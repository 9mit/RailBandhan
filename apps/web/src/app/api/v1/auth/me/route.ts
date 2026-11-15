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
      user: { id: user.id, email: user.email },
      private_profile: profile ? serializePrivateProfile(profile) : null,
      anonymous_profile: anonymousProfile
        ? serializeAnonymousProfile(anonymousProfile)
        : null,
      anonymous: anonymousProfile
        ? serializeAnonymousProfile(anonymousProfile)
        : null,
    });
  } catch (error) {
    return jsonError(error);
  }
}
