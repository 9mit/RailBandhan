import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "@/middleware";
import { parseJsonBody, jsonError } from "@/server/http";
import { safeNextPath } from "@/lib/navigation";
import { rateLimit, resetRateLimits, clientAddress } from "@/server/rate-limit";
const jsonRequest = (path: string, body: unknown) =>
  new Request(`http://localhost/api/v1${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
describe("HTTP trust boundaries", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    resetRateLimits();
  });
  it("rejects cross-site writes and foreign origins", () => {
    for (const headers of [
      new Headers({ origin: "https://attacker.example" }),
      new Headers({ "sec-fetch-site": "cross-site" }),
    ])
      expect(
        middleware(
          new NextRequest("http://localhost/api/v1/auth/login", {
            method: "POST",
            headers,
          }),
        ).status,
      ).toBe(403);
  });
  it("sets an unpredictable nonce and removes eval permissions in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    const first = middleware(new NextRequest("https://app.example/home")),
      second = middleware(new NextRequest("https://app.example/home"));
    expect(first.headers.get("Content-Security-Policy")).toContain("'nonce-");
    expect(first.headers.get("Content-Security-Policy")).not.toContain(
      "unsafe-eval",
    );
    expect(first.headers.get("Content-Security-Policy")).not.toBe(
      second.headers.get("Content-Security-Policy"),
    );
  });
  it("rejects wrong content types, oversized streams, malformed fields and prototype-shaped bodies", async () => {
    await expect(
      parseJsonBody(
        new Request("http://localhost/api/v1/auth/login", {
          method: "POST",
          body: "{}",
        }),
      ),
    ).rejects.toThrow("Content-Type");
    await expect(
      parseJsonBody(jsonRequest("/auth/login", { email: "a".repeat(40000) })),
    ).rejects.toThrow("too large");
    for (const body of [
      { age: "18" },
      { discovery_visible: "false" },
      { bio: ["wrong type"] },
      { __proto__: null, age: 999 },
    ])
      await expect(
        parseJsonBody(jsonRequest("/profiles/onboarding", body)),
      ).rejects.toBeDefined();
    expect(jsonError(new Error("secret-value")).status).toBe(500);
  });
  it("accepts corner game moves and travel post categories without allowing invalid columns", async () => {
    await expect(
      parseJsonBody(jsonRequest("/games/match/move", { move: { index: 8 } })),
    ).resolves.toEqual({ move: { index: 8 } });
    await expect(
      parseJsonBody(jsonRequest("/games/match/move", { move: { column: 8 } })),
    ).rejects.toBeDefined();
    for (const post_type of ["food", "story"])
      await expect(
        parseJsonBody(
          jsonRequest("/journeys/trip/posts", {
            body: "A window seat story",
            post_type,
          }),
        ),
      ).resolves.toMatchObject({ post_type });
  });
  it("does not bypass limits for loopback or untrusted proxy headers", async () => {
    for (let i = 0; i < 2; i++)
      expect((await rateLimit("login:127.0.0.1", 2, 60000)).allowed).toBe(true);
    expect((await rateLimit("login:127.0.0.1", 2, 60000)).allowed).toBe(false);
    expect(
      clientAddress(
        new Request("http://localhost", {
          headers: { "x-forwarded-for": "1.2.3.4", "x-real-ip": "1.2.3.4" },
        }),
      ),
    ).toBe("untrusted");
    vi.stubEnv("TRUST_PROXY", "true");
    expect(
      clientAddress(
        new Request("http://localhost", {
          headers: { "x-real-ip": "1.2.3.4" },
        }),
      ),
    ).toBe("1.2.3.4");
  });
  it.each([
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "/\nevil.example",
  ])("prevents redirect escape: %s", (path) =>
    expect(safeNextPath(path)).toBe("/home"),
  );
  it("retains safe local deep links", () =>
    expect(safeNextPath("/journeys/new/manual?train=12723")).toBe(
      "/journeys/new/manual?train=12723",
    ));
});
