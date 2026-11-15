import { describe, it, expect, beforeEach } from "vitest";
import {
  hashPassword,
  verifyPassword,
  createUser,
  login,
  buildSessionCookie,
  getSessionUser,
  buildLogoutCookie,
} from "@/server/auth/session";
import { resetStore } from "@/server/store";

describe("Authentication & Session Lifecycle", () => {
  beforeEach(() => {
    resetStore();
  });

  it("correctly hashes and verifies passwords using salt and scrypt", async () => {
    const password = "SuperSecretTrainPassword123!";
    const hash = await hashPassword(password);

    expect(hash).toContain(":");
    expect(await verifyPassword(password, hash)).toBe(true);
    expect(await verifyPassword("WrongPassword", hash)).toBe(false);
  });

  it("creates a new user and denies duplicate emails", async () => {
    const user = await createUser("passenger@railbandhan.in", "Password1234!");
    expect(user.id).toBeDefined();
    expect(user.email).toBe("passenger@railbandhan.in");

    await expect(
      createUser("passenger@railbandhan.in", "AnotherPassword123!"),
    ).rejects.toThrow("already exists");
  });

  it("authenticates valid credentials and rejects invalid passwords", async () => {
    await createUser("traveler@railbandhan.in", "ValidPassword1234");

    const loggedIn = await login(
      "traveler@railbandhan.in",
      "ValidPassword1234",
    );
    expect(loggedIn.email).toBe("traveler@railbandhan.in");

    await expect(
      login("traveler@railbandhan.in", "InvalidPassword!"),
    ).rejects.toThrow("Invalid email or password");

    await expect(
      login("nonexistent@railbandhan.in", "SomePassword1234"),
    ).rejects.toThrow("Invalid email or password");
  });

  it("creates tamper-resistant session cookies and validates them", async () => {
    const user = await createUser(
      "cookie_user@railbandhan.in",
      "ValidPassword1234",
    );
    const cookieHeader = await buildSessionCookie(user.id);

    expect(cookieHeader).toContain("rb_session=");
    expect(cookieHeader).toContain("HttpOnly");

    // Extract cookie value for request header
    const cookieValue = cookieHeader.split(";")[0];

    const req = new Request("http://localhost:3000/api/v1/auth/me", {
      headers: { cookie: cookieValue },
    });

    const sessionUser = await getSessionUser(req);
    expect(sessionUser).not.toBeNull();
    expect(sessionUser?.id).toBe(user.id);
    expect(sessionUser?.email).toBe(user.email);
  });

  it("rejects tampered or forged session tokens", async () => {
    const user = await createUser(
      "tamper_user@railbandhan.in",
      "ValidPassword1234",
    );
    const cookieHeader = await buildSessionCookie(user.id);
    const rawCookie = cookieHeader.split(";")[0].replace("rb_session=", "");
    const decodedVal = decodeURIComponent(rawCookie);

    // Tamper with payload
    const [body] = decodedVal.split(".");
    const forgedToken = `${body}.invalid_forged_signature`;

    const req = new Request("http://localhost:3000/api/v1/auth/me", {
      headers: { cookie: `rb_session=${encodeURIComponent(forgedToken)}` },
    });

    const sessionUser = await getSessionUser(req);
    expect(sessionUser).toBeNull();
  });

  it("returns valid logout cookie with Max-Age=0", () => {
    const logoutCookie = buildLogoutCookie();
    expect(logoutCookie).toContain("Max-Age=0");
    expect(logoutCookie).toContain("rb_session=;");
  });
});
