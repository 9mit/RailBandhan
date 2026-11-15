import { AppError } from "@/lib/errors";
import Redis from "ioredis";
import { createHash } from "node:crypto";
import { isIP } from "node:net";
interface Entry {
  timestamps: number[];
  expiresAt: number;
}
const buckets = new Map<string, Entry>();
let redis: Redis | null = null;
const LUA =
  "local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('PEXPIRE',KEYS[1],ARGV[1]) end; return {n,redis.call('PTTL',KEYS[1])}";
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}
export function clientAddress(request: Request): string {
  if (process.env.TRUST_PROXY === "true") {
    const ip = request.headers.get("x-real-ip")?.trim();
    if (ip && isIP(ip)) return ip;
  }
  return "untrusted";
}
export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const now = Date.now();
  if (process.env.REDIS_URL) {
    redis ??= new Redis(process.env.REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      connectTimeout: 2000,
      commandTimeout: 2000,
      retryStrategy: () => null,
    });
    if (redis.listenerCount("error") === 0) redis.on("error", () => {});
    try {
      if (redis.status === "wait") await redis.connect();
      const result = (await redis.eval(
        LUA,
        1,
        `rb:limit:${createHash("sha256").update(key).digest("hex")}`,
        windowMs,
      )) as [number, number];
      return {
        allowed: result[0] <= limit,
        remaining: Math.max(0, limit - result[0]),
        resetAt: now + Math.max(0, result[1]),
      };
    } catch {
      throw new AppError("unavailable", "Please try again shortly");
    }
  }
  for (const [k, entry] of buckets)
    if (entry.expiresAt <= now) buckets.delete(k);
  const entry = buckets.get(key) ?? {
    timestamps: [],
    expiresAt: now + windowMs,
  };
  entry.timestamps = entry.timestamps.filter((t) => t > now - windowMs);
  if (!buckets.has(key) && buckets.size >= 10000)
    return { allowed: false, remaining: 0, resetAt: now + windowMs };
  const allowed = entry.timestamps.length < limit;
  if (allowed) entry.timestamps.push(now);
  entry.expiresAt = now + windowMs;
  buckets.set(key, entry);
  return {
    allowed,
    remaining: Math.max(0, limit - entry.timestamps.length),
    resetAt: (entry.timestamps[0] ?? now) + windowMs,
  };
}
export function resetRateLimits(): void {
  buckets.clear();
}

export async function checkRateLimitBackend(): Promise<boolean> {
  if (!process.env.REDIS_URL) return process.env.NODE_ENV !== "production";
  await rateLimit("readiness", 1000000, 1000);
  return true;
}
