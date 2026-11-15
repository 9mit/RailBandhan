import { requireUser } from "@/server/auth/session";
import { listPassengers } from "@/server/discovery/service";
import { jsonError, jsonOk } from "@/server/http";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser(request);
    const { id } = await params;
    const passengers = await listPassengers(user.id, id);

    return jsonOk({
      passengers: passengers.map((p) => ({
        handle: p.publicHandle,
        reputation: p.reputation,
        bio: p.bio,
        avatar_url: p.avatarUrl,
        badge_count: p.badgeCount,
        online: p.online,
      })),
    });
  } catch (error) {
    return jsonError(error);
  }
}
