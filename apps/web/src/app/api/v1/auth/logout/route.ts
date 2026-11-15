import { logoutCookies, revokeRequestSession } from "@/server/auth/session";
import { jsonError, jsonOk } from "@/server/http";
export async function POST(request: Request) {
  try {
    await revokeRequestSession(request);
    const res = jsonOk({ ok: true });
    for (const cookie of logoutCookies())
      res.headers.append("Set-Cookie", cookie);
    return res;
  } catch (error) {
    return jsonError(error);
  }
}
