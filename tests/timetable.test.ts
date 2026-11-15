import { describe, it, expect, vi } from "vitest";
import { datedTimetable } from "@/server/railway/timetable";
import { DeterministicRailwayProvider } from "@/server/railway/providers/deterministic";
import { RailwayGraph } from "@/server/railway/graph";
describe("Honest timetable estimates", () => {
  it("uses Indian local time and rolls over midnight", () => {
    const stops = datedTimetable(
      RailwayGraph.getRoute("12951")!.stops,
      "2026-11-15",
    );
    expect(stops[0].scheduledDeparture).toBe("2026-11-15T11:30:00.000Z");
    expect(stops[3].scheduledArrival).toBe("2026-11-15T18:32:00.000Z");
    expect(Date.parse(stops[5].scheduledArrival!)).toBeGreaterThan(
      Date.parse(stops[3].scheduledArrival!),
    );
  });
  it("shows zero progress before departure and completion after arrival without inventing a platform", async () => {
    const provider = new DeterministicRailwayProvider();
    const clock = vi.spyOn(Date, "now");
    try {
      clock.mockReturnValue(Date.parse("2026-11-15T00:00:00Z"));
      const before = await provider.getLiveStatus("12951", "2026-11-15");
      expect(before?.progressPercent).toBe(0);
      expect(before?.confidence).toBe("estimated");
      expect(before?.platformHint).toBeNull();
      clock.mockReturnValue(Date.parse("2026-11-17T00:00:00Z"));
      const after = await provider.getLiveStatus("12951", "2026-11-15");
      expect(after?.progressPercent).toBe(100);
      expect(after?.status).toBe("arrived");
    } finally {
      clock.mockRestore();
    }
  });
});
