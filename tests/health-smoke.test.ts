import { describe, it, expect } from "vitest";
import { GET } from "@/app/api/health/route";
describe("Readiness probe", () => {
  it("checks implemented dependencies without claiming unprobed services are healthy", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.services.database).toBe("ok");
    expect(body.services.auth).toBeUndefined();
    expect(body.services.realtime).toBeUndefined();
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });
});
