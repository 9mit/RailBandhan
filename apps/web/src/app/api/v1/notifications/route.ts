import { serializeNotification } from "@/server/api/serializers";
import { requireUser } from "@/server/auth/session";
import { jsonError, jsonOk } from "@/server/http";
import {
  countUnreadNotifications,
  listNotifications,
} from "@/server/notifications/service";

export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    const notifications = await listNotifications(user.id);
    const unreadCount = await countUnreadNotifications(user.id);

    return jsonOk({
      notifications: notifications.map(serializeNotification),
      unread_count: unreadCount,
    });
  } catch (error) {
    return jsonError(error);
  }
}
