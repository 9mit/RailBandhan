import { serializeAnonymousProfile } from "@/server/api/serializers";
import { requireUser } from "@/server/auth/session";
import { jsonError, jsonOk, parseJsonBody } from "@/server/http";
import { updateAnonymous } from "@/server/profiles/service";

export async function PATCH(request: Request) {
  try {
    const user = await requireUser(request);
    const body = await parseJsonBody<{
      bio?: string | null;
      avatar_url?: string | null;
      public_handle?: string;
    }>(request);

    const anonymousProfile = await updateAnonymous({
      userId: user.id,
      bio: body.bio,
      avatarUrl: body.avatar_url,
      publicHandle: body.public_handle,
    });

    return jsonOk({
      anonymous: serializeAnonymousProfile(anonymousProfile),
    });
  } catch (error) {
    return jsonError(error);
  }
}
