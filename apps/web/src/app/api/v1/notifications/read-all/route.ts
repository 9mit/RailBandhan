import { requireUser } from "@/server/auth/session";
import { jsonError, jsonOk } from "@/server/http";
import { markAllNotificationsRead } from "@/server/notifications/service";

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    await markAllNotificationsRead(user.id);
    return jsonOk({ success: true });
  } catch (error) {
    return jsonError(error);
  }
}
