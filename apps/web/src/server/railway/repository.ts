import type {
  AdvancedLiveStatus,
  TrainDataProvider,
} from "@/server/trains/provider";
import { RailwayGraph } from "./graph";
import {
  CANONICAL_STATIONS,
  normalizeStationInput,
  type CanonicalStation,
} from "./stations";
import { datedTimetable } from "./timetable";

export interface TrainScheduleInfo {
  trainNumber: string;
  name: string;
  type: string;
  origin: CanonicalStation;
  destination: CanonicalStation;
  stops: Array<{
    station: CanonicalStation;
    stopIndex: number;
    distanceKm: number;
    scheduledArrival: string | null;
    scheduledDeparture: string | null;
  }>;
}

export interface RailwayRepository {
  getTrain(trainNumber: string): Promise<TrainScheduleInfo | null>;
  searchStations(query: string): Promise<CanonicalStation[]>;
  getLiveStatus(
    trainNumber: string,
    journeyDate: string,
  ): Promise<AdvancedLiveStatus | null>;
}

export class OpenDataRailwayRepository implements RailwayRepository {
  constructor(private readonly liveProvider?: TrainDataProvider) {}

  async getTrain(trainNumber: string): Promise<TrainScheduleInfo | null> {
    const route = RailwayGraph.getRoute(trainNumber);
    if (!route) return null;

    const origin = CANONICAL_STATIONS.find(
      (s) => s.code === route.originCode,
    ) ?? {
      code: route.originCode,
      name: route.originCode,
      aliases: [],
    };
    const destination = CANONICAL_STATIONS.find(
      (s) => s.code === route.destinationCode,
    ) ?? {
      code: route.destinationCode,
      name: route.destinationCode,
      aliases: [],
    };

    const stops = route.stops.map((stop) => {
      const station = CANONICAL_STATIONS.find(
        (s) => s.code === stop.stationCode,
      ) ?? {
        code: stop.stationCode,
        name: stop.stationCode,
        aliases: [],
      };
      return {
        station,
        stopIndex: stop.stopIndex,
        distanceKm: stop.distanceKm,
        scheduledArrival: stop.scheduledArrival,
        scheduledDeparture: stop.scheduledDeparture,
      };
    });

    return {
      trainNumber: route.trainNumber,
      name: route.trainName,
      type: route.type,
      origin,
      destination,
      stops,
    };
  }

  async searchStations(query: string): Promise<CanonicalStation[]> {
    const clean = query.trim().toUpperCase();
    if (!clean) return [];

    const exact = normalizeStationInput(clean);
    if (exact) {
      return [exact];
    }

    return CANONICAL_STATIONS.filter(
      (s) =>
        s.code.includes(clean) ||
        s.name.toUpperCase().includes(clean) ||
        s.aliases.some((a) => a.toUpperCase().includes(clean)),
    ).slice(0, 10);
  }

  async getLiveStatus(
    trainNumber: string,
    journeyDate: string,
  ): Promise<AdvancedLiveStatus | null> {
    if (this.liveProvider) {
      try {
        return await this.liveProvider.getLiveStatus(trainNumber, journeyDate);
      } catch (err) {
        console.warn(
          `[RailwayRepository] Live provider error for ${trainNumber}:`,
          err,
        );
      }
    }

    // Fallback: Build synthetic on-schedule status from canonical timetable graph
    const route = RailwayGraph.getRoute(trainNumber);
    if (!route) return null;

    const stations = datedTimetable(route.stops, journeyDate).map((stop) => {
      const s = CANONICAL_STATIONS.find((st) => st.code === stop.stationCode);
      return {
        stopIndex: stop.stopIndex,
        stationCode: stop.stationCode,
        stationName: s?.name ?? stop.stationCode,
        scheduledArrival: stop.scheduledArrival,
        eta: stop.scheduledArrival,
        platform: null,
        passed: false,
      };
    });

    const totalDistance = route.stops[route.stops.length - 1].distanceKm;

    return {
      trainNumber: route.trainNumber,
      trainName: route.trainName,
      status: "on_time",
      delayMinutes: 0,
      currentStopIndex: 0,
      lastUpdated: new Date().toISOString(),
      stations,
      nextStopIndex: 1,
      distanceTravelledKm: 0,
      distanceRemainingKm: totalDistance,
      platformHint: null,
      sourceProvider: "OpenData timetable",
      confidence: "estimated",
      progressPercent: 0,
    };
  }
}

let repositoryInstance: RailwayRepository | null = null;

export function getRailwayRepository(): RailwayRepository {
  if (!repositoryInstance) {
    repositoryInstance = new OpenDataRailwayRepository();
  }
  return repositoryInstance;
}
