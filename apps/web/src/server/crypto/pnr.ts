import { createHmac } from "node:crypto";

function getPnrHmacSecret(): string {
  const secret = process.env.PNR_HMAC_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("PNR_HMAC_SECRET must be set in production");
    }
    return "railbandhan-dev-only-pnr-hmac-secret-change-me";
  }
  if (
    process.env.NODE_ENV === "production" &&
    (secret.length < 32 || /(dev-only|change-me|local-)/i.test(secret))
  ) {
    throw new Error("Refusing weak PNR_HMAC_SECRET in production");
  }
  return secret;
}

export function hmacPnr(pnr: string): string {
  const normalized = pnr.replace(/\s+/g, "").toUpperCase();
  return createHmac("sha256", getPnrHmacSecret())
    .update(normalized)
    .digest("hex");
}
