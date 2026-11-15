import { requireUser } from "@/server/auth/session";
import { jsonError, jsonOk } from "@/server/http";
import { getUserBadges } from "@/server/reputation/service";

export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    const badges = await getUserBadges(user.id);

    return jsonOk({
      badges: badges.map((b) => ({
        slug: b.badge.slug,
        name: b.badge.name,
        description: b.badge.description,
        earned_at: b.earnedAt,
      })),
    });
  } catch (error) {
    return jsonError(error);
  }
}
