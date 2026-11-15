import { getSessionUser, hasRefreshCookie } from "@/server/auth/session";
import { jsonError, jsonOk } from "@/server/http";

export async function GET(request: Request) {
  try {
    const user = await getSessionUser(request);
    return jsonOk({
      authenticated: Boolean(user),
      can_refresh: hasRefreshCookie(request),
      user_id: user?.id ?? null,
    });
  } catch (error) {
    return jsonError(error);
  }
}
