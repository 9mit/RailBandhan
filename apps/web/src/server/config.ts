export function validateProductionEnvironment(
  env: NodeJS.ProcessEnv = process.env,
): void {
  if (env.NODE_ENV !== "production") return;
  const issues: string[] = [];
  const secret = (key: string) => {
    const value = env[key];
    if (
      !value ||
      value.length < 32 ||
      /(change[-_]?me|placeholder|dev-only|your[_-])/i.test(value)
    )
      issues.push(
        `${key} must be an independent random secret of at least 32 characters`,
      );
  };
  try {
    const url = new URL(env.NEXT_PUBLIC_APP_URL || "");
    if (url.protocol !== "https:")
      issues.push("NEXT_PUBLIC_APP_URL must use HTTPS");
  } catch {
    issues.push("NEXT_PUBLIC_APP_URL must be a valid HTTPS origin");
  }
  if (env.DATA_STORE !== "postgres")
    issues.push("Production requires DATA_STORE=postgres");
  if (!env.DATABASE_URL) issues.push("DATABASE_URL is required");
  if (!env.REDIS_URL)
    issues.push("REDIS_URL is required for shared rate limits");
  if (env.COOKIE_SECURE === "false")
    issues.push("Secure cookies cannot be disabled in production");
  secret("PNR_HMAC_SECRET");
  secret("CRON_SECRET");
  secret("METRICS_SECRET");
  if (!/^[a-fA-F0-9]{64}$/.test(env.TICKET_ENCRYPTION_KEY || ""))
    issues.push(
      "TICKET_ENCRYPTION_KEY must be 64 random hexadecimal characters",
    );
  if (
    env.PNR_HMAC_SECRET === env.CRON_SECRET ||
    env.METRICS_SECRET === env.CRON_SECRET
  )
    issues.push("Operational and PNR secrets must be different");
  if (!env.TICKET_STORAGE_DIR)
    issues.push("TICKET_STORAGE_DIR must point to a persistent private volume");
  if (issues.length)
    throw new Error(`Invalid production configuration: ${issues.join("; ")}`);
}
