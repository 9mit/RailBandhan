import { AppError } from "@/lib/errors";
import { serializeNotification } from "@/server/api/serializers";
import { requireUser } from "@/server/auth/session";
import { jsonError, jsonOk } from "@/server/http";
import { markNotificationRead } from "@/server/notifications/service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser(request);
    const { id } = await params;
    const notification = await markNotificationRead(user.id, id);
    if (!notification) {
      throw new AppError("not_found", "Notification not found");
    }
    return jsonOk({ notification: serializeNotification(notification) });
  } catch (error) {
    return jsonError(error);
  }
}
