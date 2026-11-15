import type { RouteStop } from "./graph";
/** Convert India-local clock times into monotonic instants across midnight. */
export function datedTimetable(stops: RouteStop[], journeyDate: string) {
  const start = Date.parse(`${journeyDate}T00:00:00+05:30`);
  if (!Number.isFinite(start)) throw new Error("Invalid journey date");
  let day = 0,
    last = -1;
  const stamp = (clock: string | null) => {
    if (!clock) return null;
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(clock))
      throw new Error("Invalid timetable time");
    const [h, m] = clock.split(":").map(Number);
    const minute = h * 60 + m;
    if (minute < last) day++;
    last = minute;
    return new Date(start + day * 86400000 + minute * 60000).toISOString();
  };
  return stops.map((stop) => ({
    ...stop,
    scheduledArrival: stamp(stop.scheduledArrival),
    scheduledDeparture: stamp(stop.scheduledDeparture),
  }));
}
