export function safeNextPath(value: string | null, fallback = "/home"): string {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\r\n]/.test(value)
  )
    return fallback;
  try {
    const base = "https://railbandhan.invalid";
    const url = new URL(value, base);
    return url.origin === base
      ? url.pathname + url.search + url.hash
      : fallback;
  } catch {
    return fallback;
  }
}
