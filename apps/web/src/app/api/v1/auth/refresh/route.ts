import { AppError } from "@/lib/errors";
import { logoutCookies, rotateRefreshSession } from "@/server/auth/session";
import { jsonError, jsonOk } from "@/server/http";
import { clientAddress, rateLimit } from "@/server/rate-limit";
export async function POST(request: Request) {
  try {
    if (
      !(await rateLimit(`refresh:${clientAddress(request)}`, 60, 60_000))
        .allowed
    )
      throw new AppError("rate_limited", "Please wait before trying again");
    const cookies = await rotateRefreshSession(request);
    const res = jsonOk({ ok: true });
    for (const cookie of cookies) res.headers.append("Set-Cookie", cookie);
    return res;
  } catch (error) {
    const res = jsonError(error);
    if (res.status === 401)
      for (const cookie of logoutCookies())
        res.headers.append("Set-Cookie", cookie);
    return res;
  }
}
