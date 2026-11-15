import { beforeEach, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
import {
  createUser,
  issueSessionCookies,
  getSessionUser,
  rotateRefreshSession,
  revokeRequestSession,
} from "@/server/auth/session";
import { getStore, resetStore } from "@/server/store";
const request = (cookies: string[]) =>
  new Request("http://localhost/api/v1/auth/refresh", {
    headers: { cookie: cookies.map((c) => c.split(";")[0]).join("; ") },
  });
describe("Persistent session security", () => {
  beforeEach(() => {
    resetStore();
  });
  it("revokes a stolen access cookie on logout", async () => {
    const user = await createUser("logout@example.com", "long-passphrase-123");
    const cookies = await issueSessionCookies(user.id);
    const req = request(cookies);
    expect((await getSessionUser(req))?.id).toBe(user.id);
    await revokeRequestSession(req);
    expect(await getSessionUser(req)).toBeNull();
  });
  it("rotates refresh tokens and revokes the family on reuse without affecting another device", async () => {
    const user = await createUser("rotate@example.com", "long-passphrase-123");
    const original = await issueSessionCookies(user.id),
      otherDevice = await issueSessionCookies(user.id);
    const rotated = await rotateRefreshSession(request(original));
    expect(await getSessionUser(request(original))).toBeNull();
    expect((await getSessionUser(request(rotated)))?.id).toBe(user.id);
    await expect(rotateRefreshSession(request(original))).rejects.toThrow(
      "sign in again",
    );
    expect(await getSessionUser(request(rotated))).toBeNull();
    expect((await getSessionUser(request(otherDevice)))?.id).toBe(user.id);
  });
  it("stores only token hashes and enforces access expiration", async () => {
    const user = await createUser("expiry@example.com", "long-passphrase-123");
    const cookies = await issueSessionCookies(user.id);
    const raw = cookies[0]!.split(";")[0]!.split("=")[1]!;
    const record = await getStore().getAuthSessionByHash(
      createHash("sha256").update(raw).digest("hex"),
      "access",
    );
    expect(JSON.stringify(record)).not.toContain(raw);
    const now = Date.now();
    vi.spyOn(Date, "now").mockReturnValue(now + 16 * 60_000);
    try {
      expect(await getSessionUser(request(cookies))).toBeNull();
    } finally {
      vi.restoreAllMocks();
    }
  });
  it.each(["%E0%A4%A", "not-a-token", "a.b.c", ""])(
    "rejects malformed cookies without throwing: %s",
    async (value) => {
      expect(
        await getSessionUser(
          new Request("http://localhost", {
            headers: { cookie: `rb_session=${value}` },
          }),
        ),
      ).toBeNull();
    },
  );
});
