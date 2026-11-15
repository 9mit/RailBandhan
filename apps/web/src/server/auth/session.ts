import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { rateLimit } from "@/server/rate-limit";
import { getStore } from "@/server/store";
import type { AuthSessionRecord } from "@/server/store/types";
import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { z } from "zod";

const scryptAsync = promisify(scrypt);
const ACCESS_SECONDS = 15 * 60;
const REFRESH_SECONDS = 7 * 24 * 60 * 60;
const credentials = z
  .object({
    email: z.string().trim().toLowerCase().email().max(254),
    password: z.string().min(8).max(128),
  })
  .strict();
export interface SessionUser {
  id: string;
  email: string;
}
function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}
function secureCookie(): string {
  if (
    process.env.NODE_ENV === "production" ||
    process.env.COOKIE_SECURE === "true"
  )
    return "; Secure";
  return "";
}
function cookie(name: string, value: string, seconds: number, path = "/") {
  return `${name}=${value}; HttpOnly; Path=${path}; SameSite=Lax; Max-Age=${seconds}${secureCookie()}`;
}
function readCookie(request: Request, name: string): string | null {
  const item = request.headers
    .get("cookie")
    ?.split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith(name + "="));
  if (!item) return null;
  const value = item.slice(name.length + 1);
  return /^[A-Za-z0-9_-]{43}$/.test(value) ? value : null;
}
function tokenPair() {
  return {
    access: randomBytes(32).toString("base64url"),
    refresh: randomBytes(32).toString("base64url"),
  };
}
function cookiesForPair(
  pair: ReturnType<typeof tokenPair>,
  refreshExpiresAt: string,
) {
  return [
    cookie("rb_session", pair.access, ACCESS_SECONDS),
    cookie(
      "rb_refresh",
      pair.refresh,
      Math.max(
        0,
        Math.floor((Date.parse(refreshExpiresAt) - Date.now()) / 1000),
      ),
    ),
  ];
}
export async function issueSessionCookies(userId: string): Promise<string[]> {
  const pair = tokenPair();
  const now = Date.now();
  const session: AuthSessionRecord = {
    id: crypto.randomUUID(),
    userId,
    accessHash: hash(pair.access),
    refreshHash: hash(pair.refresh),
    accessExpiresAt: new Date(now + ACCESS_SECONDS * 1000).toISOString(),
    refreshExpiresAt: new Date(now + REFRESH_SECONDS * 1000).toISOString(),
    revokedAt: null,
    createdAt: new Date(now).toISOString(),
  };
  await getStore().createAuthSession(session);
  logger.info("session_created", { userId });
  return cookiesForPair(pair, session.refreshExpiresAt);
}
export async function buildSessionCookie(userId: string): Promise<string> {
  return (await issueSessionCookies(userId))[0]!;
}
export const sessionCookieForUser = buildSessionCookie;
export function buildLogoutCookie(): string {
  return cookie("rb_session", "", 0);
}
export function logoutCookies(): string[] {
  return [buildLogoutCookie(), cookie("rb_refresh", "", 0)];
}
export function logout(): string {
  return buildLogoutCookie();
}
export async function revokeRequestSession(request: Request): Promise<void> {
  const access = readCookie(request, "rb_session"),
    refresh = readCookie(request, "rb_refresh");
  const store = getStore();
  const session = access
    ? await store.getAuthSessionByHash(hash(access), "access")
    : refresh
      ? await store.getAuthSessionByHash(hash(refresh), "refresh")
      : null;
  if (session) {
    await store.revokeAuthSession(session.id);
    logger.info("session_revoked", { userId: session.userId });
  }
}
export async function rotateRefreshSession(
  request: Request,
): Promise<string[]> {
  const token = readCookie(request, "rb_refresh");
  if (!token) throw new AppError("unauthorized", "Please sign in again");
  const store = getStore();
  const digest = hash(token);
  const session = await store.getAuthSessionByHash(digest, "refresh");
  if (!session) {
    const consumed = await store.getAuthSessionByHash(digest, "used");
    if (consumed) {
      await store.revokeAuthSession(consumed.id);
      logger.warn("refresh_token_reuse", { userId: consumed.userId });
    }
    throw new AppError("unauthorized", "Please sign in again");
  }
  if (
    session.revokedAt ||
    Date.parse(session.refreshExpiresAt) <= Date.now() ||
    !(await store.getAuthUserById(session.userId))
  )
    throw new AppError("unauthorized", "Please sign in again");
  const pair = tokenPair();
  const next = {
    ...session,
    accessHash: hash(pair.access),
    refreshHash: hash(pair.refresh),
    accessExpiresAt: new Date(Date.now() + ACCESS_SECONDS * 1000).toISOString(),
  };
  if (!(await store.rotateAuthSession(digest, next))) {
    await store.revokeAuthSession(session.id);
    throw new AppError("unauthorized", "Please sign in again");
  }
  logger.info("session_rotated", { userId: session.userId });
  return cookiesForPair(pair, session.refreshExpiresAt);
}
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}
export async function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  if (
    typeof password !== "string" ||
    password.length > 128 ||
    !/^[a-f0-9]{32}:[a-f0-9]{128}$/.test(passwordHash)
  )
    return false;
  const [salt, stored] = passwordHash.split(":");
  const derived = (await scryptAsync(password, salt!, 64)) as Buffer;
  return timingSafeEqual(Buffer.from(stored!, "hex"), derived);
}
export async function createUser(
  email: string,
  password: string,
): Promise<SessionUser> {
  const parsed = credentials
    .extend({ password: z.string().min(12).max(128) })
    .safeParse({ email, password });
  if (!parsed.success)
    throw new AppError(
      "validation",
      "A valid email and a password of 12–128 characters are required",
    );
  const store = getStore();
  const existing = await store.getAuthUserByEmail(parsed.data.email);
  if (existing)
    throw new AppError("conflict", "An account with this email already exists");
  const passwordHash = await hashPassword(parsed.data.password);
  try {
    const user = await store.createAuthUser({
      email: parsed.data.email,
      passwordHash,
    });
    return { id: user.id, email: user.email };
  } catch (error) {
    if (error instanceof Error && /unique|duplicate/i.test(error.message))
      throw new AppError(
        "conflict",
        "An account with this email already exists",
      );
    throw error;
  }
}
export async function login(
  email: string,
  password: string,
): Promise<SessionUser> {
  const parsed = credentials.safeParse({ email, password });
  if (!parsed.success)
    throw new AppError("unauthorized", "Invalid email or password");
  const user = await getStore().getAuthUserByEmail(parsed.data.email);
  // Equal-cost verification also for unknown accounts, reducing account enumeration.
  const dummy = "00000000000000000000000000000000:" + "00".repeat(64);
  const valid = await verifyPassword(
    parsed.data.password,
    user?.passwordHash ?? dummy,
  );
  if (!user || !valid)
    throw new AppError("unauthorized", "Invalid email or password");
  return { id: user.id, email: user.email };
}
export const hasRefreshCookie = (request: Request): boolean =>
  !!readCookie(request, "rb_refresh");
export async function getSessionUser(
  request: Request,
): Promise<SessionUser | null> {
  const token = readCookie(request, "rb_session");
  if (!token) return null;
  const store = getStore();
  const session = await store.getAuthSessionByHash(hash(token), "access");
  if (
    !session ||
    session.revokedAt ||
    Date.parse(session.accessExpiresAt) <= Date.now() ||
    Date.parse(session.refreshExpiresAt) <= Date.now()
  )
    return null;
  const user = await store.getAuthUserById(session.userId);
  return user ? { id: user.id, email: user.email } : null;
}
export async function requireUser(request: Request): Promise<SessionUser> {
  const user = await getSessionUser(request);
  if (!user) throw new AppError("unauthorized", "Authentication required");
  const limit = await rateLimit(
    `api:${user.id}`,
    request.method === "GET" ? 240 : 90,
    60_000,
  );
  if (!limit.allowed)
    throw new AppError(
      "rate_limited",
      "Please wait a moment before trying again",
    );
  return user;
}
