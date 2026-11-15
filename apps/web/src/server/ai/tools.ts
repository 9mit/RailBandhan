import { getRailwayRepository } from "@/server/railway/repository";

export interface ReadOnlyToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, string>;
  execute: (args: Record<string, unknown>) => Promise<Record<string, unknown>>;
}

export const READ_ONLY_AI_TOOLS: Record<string, ReadOnlyToolDefinition> = {
  get_train_schedule: {
    name: "get_train_schedule",
    description:
      "Fetch the authoritative route timetable and station stop sequence for a train number.",
    parameters: { trainNumber: "string (e.g. 12723)" },
    execute: async (args) => {
      const trainNumber = String(args.trainNumber ?? "");
      const repo = getRailwayRepository();
      const train = await repo.getTrain(trainNumber);
      if (!train) return { error: `Train ${trainNumber} not found` };
      return {
        trainNumber: train.trainNumber,
        name: train.name,
        type: train.type,
        origin: train.origin.name,
        destination: train.destination.name,
        stopsCount: train.stops.length,
      };
    },
  },

  get_live_delay: {
    name: "get_live_delay",
    description:
      "Fetch current running status and delay for a train on a specific journey date.",
    parameters: { trainNumber: "string", journeyDate: "YYYY-MM-DD" },
    execute: async (args) => {
      const trainNumber = String(args.trainNumber ?? "");
      const journeyDate = String(args.journeyDate ?? "");
      const repo = getRailwayRepository();
      const status = await repo.getLiveStatus(trainNumber, journeyDate);
      if (!status) return { status: "unknown", delayMinutes: 0 };
      return {
        trainNumber: status.trainNumber,
        status: status.status,
        delayMinutes: status.delayMinutes,
        currentStation:
          status.stations[status.currentStopIndex]?.stationName ?? null,
        progressPercent: status.progressPercent,
      };
    },
  },

  get_station_info: {
    name: "get_station_info",
    description:
      "Look up canonical station name and aliases for a station code or query.",
    parameters: { query: "string (e.g. NDLS or New Delhi)" },
    execute: async (args) => {
      const query = String(args.query ?? "");
      const repo = getRailwayRepository();
      const results = await repo.searchStations(query);
      return { stations: results.slice(0, 3) };
    },
  },
};
