import {
  serializeAnonymousProfile,
  serializePrivateProfile,
} from "@/server/api/serializers";
import { requireUser } from "@/server/auth/session";
import { jsonError, jsonOk, parseJsonBody } from "@/server/http";
import { completeOnboarding } from "@/server/profiles/service";

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const body = await parseJsonBody<{
      real_name?: string;
      realName?: string;
      age?: number;
      gender?: string;
      bio?: string;
      public_handle?: string;
      publicHandle?: string;
      discovery_visible?: boolean;
      discoveryVisible?: boolean;
      messaging_policy?: any;
      coach_visibility?: any;
    }>(request);

    const { profile, anonymousProfile } = await completeOnboarding({
      userId: user.id,
      realName: body.real_name ?? body.realName,
      age: body.age,
      gender: body.gender,
      bio: body.bio,
      publicHandle: body.public_handle ?? body.publicHandle,
      discoveryVisible: body.discovery_visible ?? body.discoveryVisible,
      messagingPolicy: body.messaging_policy,
      coachVisibility: body.coach_visibility,
    });

    return jsonOk({
      private_profile: serializePrivateProfile(profile!),
      anonymous: serializeAnonymousProfile(anonymousProfile!),
    });
  } catch (error) {
    return jsonError(error);
  }
}
