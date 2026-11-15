import { AppError } from "@/lib/errors";
import { timingSafeEqual } from "node:crypto";
export function assertOperationalCredential(
  request: Request,
  key: "CRON_SECRET" | "METRICS_SECRET",
): void {
  const secret = process.env[key];
  const header = request.headers.get("authorization") ?? "";
  const expected = Buffer.from(`Bearer ${secret ?? ""}`),
    actual = Buffer.from(header);
  if (
    !secret ||
    actual.length !== expected.length ||
    !timingSafeEqual(actual, expected)
  )
    throw new AppError("unauthorized", "Invalid operational credentials");
}
