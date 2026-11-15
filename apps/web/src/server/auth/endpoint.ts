import { AppError } from "@/lib/errors";
import { jsonError, jsonOk, parseJsonBody } from "@/server/http";
import { clientAddress, rateLimit } from "@/server/rate-limit";
import { createHash } from "node:crypto";
import { z } from "zod";
import { createUser, issueSessionCookies, login } from "./session";
const schema = z
  .object({
    email: z.string().trim().toLowerCase().email().max(254),
    password: z.string().min(8).max(128),
  })
  .strict();
export async function authenticate(request: Request, signup = false) {
  try {
    const ip = clientAddress(request);
    const window = signup ? 60 * 60_000 : 15 * 60_000;
    if (
      !(
        await rateLimit(
          `${signup ? "signup" : "login"}:${ip}`,
          signup ? 8 : 20,
          window,
        )
      ).allowed
    )
      throw new AppError(
        "rate_limited",
        "Too many attempts. Please try again later.",
      );
    const parsed = schema.safeParse(await parseJsonBody(request));
    if (!parsed.success)
      throw new AppError("validation", "Enter a valid email and password");
    const key = createHash("sha256").update(parsed.data.email).digest("hex");
    if (!(await rateLimit(`account:${key}`, 10, 15 * 60_000)).allowed)
      throw new AppError(
        "rate_limited",
        "Too many attempts. Please try again later.",
      );
    const user = await (signup ? createUser : login)(
      parsed.data.email,
      parsed.data.password,
    );
    const res = jsonOk({ user }, { status: signup ? 201 : 200 });
    for (const value of await issueSessionCookies(user.id))
      res.headers.append("Set-Cookie", value);
    return res;
  } catch (error) {
    return jsonError(error);
  }
}
