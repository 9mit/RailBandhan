import { AppError } from "@/lib/errors";
import { requireUser } from "@/server/auth/session";
import {
  assertNotBlocked,
  usersShareVerifiedJourney,
} from "@/server/authz/relationships";
import { jsonError, jsonOk } from "@/server/http";
import { getPublicProfileByHandle } from "@/server/reputation/service";
import { getStore } from "@/server/store";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ handle: string }> },
) {
  try {
    const user = await requireUser(request);
    const { handle } = await params;
    const anonymous = await getStore().getAnonymousProfileByHandle(handle);
    if (!anonymous) throw new AppError("not_found", "Profile not found");
    if (anonymous.userId !== user.id) {
      if (!(await usersShareVerifiedJourney(user.id, anonymous.userId)))
        throw new AppError("not_found", "Profile not found");
      await assertNotBlocked(user.id, anonymous.userId);
    }
    const profile = await getPublicProfileByHandle(handle);

    if (!profile) {
      throw new AppError("not_found", "Profile not found");
    }

    return jsonOk({
      profile: {
        handle: profile.public_handle,
        reputation: profile.reputation,
        bio: profile.bio,
        badges: [],
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
