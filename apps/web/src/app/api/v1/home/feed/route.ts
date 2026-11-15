import { serializeFeedItem } from "@/server/api/serializers";
import { requireUser } from "@/server/auth/session";
import { jsonError, jsonOk } from "@/server/http";
import { getHomeFeed } from "@/server/recommendations/service";

export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    const items = await getHomeFeed(user.id);
    return jsonOk({ items: items.map(serializeFeedItem) });
  } catch (error) {
    return jsonError(error);
  }
}
