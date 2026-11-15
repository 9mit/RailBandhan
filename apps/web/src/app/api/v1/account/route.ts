import { AppError } from "@/lib/errors";
import { deleteAccount } from "@/server/account/service";
import { login, logoutCookies, requireUser } from "@/server/auth/session";
import { jsonError, jsonOk, parseJsonBody } from "@/server/http";
import { rateLimit } from "@/server/rate-limit";
export async function DELETE(request: Request) {
  try {
    const user = await requireUser(request);
    if (!(await rateLimit(`account-delete:${user.id}`, 3, 3600000)).allowed)
      throw new AppError("rate_limited", "Please wait before retrying");
    const body = await parseJsonBody<{ password: string }>(request);
    await login(user.email, body.password);
    await deleteAccount(user.id);
    const res = jsonOk({ ok: true });
    for (const cookie of logoutCookies())
      res.headers.append("Set-Cookie", cookie);
    return res;
  } catch (error) {
    return jsonError(error);
  }
}
