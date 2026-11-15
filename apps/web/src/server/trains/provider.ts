export interface TrainLiveStatus {
  trainNumber: string;
  trainName: string;
  status: "on_time" | "delayed" | "cancelled" | "arrived";
  delayMinutes: number;
  currentStopIndex: number;
  lastUpdated: string;
}

export interface AdvancedLiveStation {
  stopIndex: number;
  stationCode: string;
  stationName: string;
  scheduledArrival: string | null;
  eta: string | null;
  platform: string | null;
  passed: boolean;
}

export interface AdvancedLiveStatus extends TrainLiveStatus {
  sourceProvider?: string;
  confidence?: "live" | "cached" | "estimated" | "degraded";
  observedAt?: string;

  stations: AdvancedLiveStation[];
  nextStopIndex: number | null;
  distanceTravelledKm: number;
  distanceRemainingKm: number;
  platformHint: string | null;
  progressPercent: number;
}

export interface TrainDataProvider {
  getLiveStatus(
    trainNumber: string,
    journeyDate: string,
  ): Promise<AdvancedLiveStatus | null>;
}

interface MockStatusConfig {
  trainNumber: string;
  trainName: string;
  status: TrainLiveStatus["status"];
  delayMinutes: number;
  currentStopIndex: number;
  stations: Array<{ code: string; name: string }>;
  segmentKm: number[];
}

const MOCK_STATUSES: MockStatusConfig[] = [
  {
    trainNumber: "12723",
    trainName: "Telangana Express",
    status: "delayed",
    delayMinutes: 18,
    currentStopIndex: 2,
    stations: [
      { code: "SC", name: "Secunderabad" },
      { code: "KZJ", name: "Kazipet" },
      { code: "WL", name: "Warangal" },
      { code: "NGP", name: "Nagpur" },
      { code: "BPL", name: "Bhopal" },
      { code: "NDLS", name: "New Delhi" },
    ],
    segmentKm: [0, 142, 98, 352, 352, 707],
  },
  {
    trainNumber: "12951",
    trainName: "Mumbai Rajdhani",
    status: "on_time",
    delayMinutes: 0,
    currentStopIndex: 1,
    stations: [
      { code: "BCT", name: "Mumbai Central" },
      { code: "BPL", name: "Bhopal" },
      { code: "NDLS", name: "New Delhi" },
    ],
    segmentKm: [0, 709, 707],
  },
];

function addMinutes(isoBase: string, minutes: number): string {
  const date = new Date(isoBase);
  date.setMinutes(date.getMinutes() + minutes);
  return date.toISOString();
}

export class MockTrainDataProvider implements TrainDataProvider {
  async getLiveStatus(
    trainNumber: string,
    journeyDate: string,
  ): Promise<AdvancedLiveStatus | null> {
    const normalized = trainNumber.replace(/\s+/g, "");
    const config = MOCK_STATUSES.find(
      (entry) => entry.trainNumber === normalized,
    );

    if (!config) {
      return null;
    }

    const baseTime = `${journeyDate}T06:00:00.000Z`;
    const lastUpdated = new Date().toISOString();
    const nextStopIndex =
      config.currentStopIndex < config.stations.length - 1
        ? config.currentStopIndex + 1
        : null;

    const travelled = config.segmentKm
      .slice(0, config.currentStopIndex + 1)
      .reduce((sum, km) => sum + km, 0);
    const total = config.segmentKm.reduce((sum, km) => sum + km, 0);
    const remaining = Math.max(0, total - travelled);
    const progressPercent =
      total > 0 ? Math.round((travelled / total) * 100) : 0;

    const stations: AdvancedLiveStation[] = config.stations.map(
      (station, stopIndex) => {
        const scheduled = addMinutes(baseTime, stopIndex * 180);
        const eta = addMinutes(scheduled, config.delayMinutes);
        return {
          stopIndex,
          stationCode: station.code,
          stationName: station.name,
          scheduledArrival: scheduled,
          eta,
          platform:
            stopIndex === config.currentStopIndex
              ? `${(stopIndex % 5) + 1}`
              : null,
          passed: stopIndex < config.currentStopIndex,
        };
      },
    );

    const currentStation = config.stations[config.currentStopIndex];

    return {
      trainNumber: config.trainNumber,
      trainName: config.trainName,
      status: config.status,
      delayMinutes: config.delayMinutes,
      currentStopIndex: config.currentStopIndex,
      lastUpdated,
      stations,
      nextStopIndex,
      distanceTravelledKm: travelled,
      distanceRemainingKm: remaining,
      platformHint: currentStation
        ? `Platform ${(config.currentStopIndex % 5) + 1}`
        : null,
      progressPercent,
    };
  }
}

import { RailwayDataService } from "@/server/railway/service";

export class RailwayDataServiceAdapter implements TrainDataProvider {
  async getLiveStatus(
    trainNumber: string,
    journeyDate: string,
  ): Promise<AdvancedLiveStatus | null> {
    try {
      const enriched = await RailwayDataService.getEnrichedLiveStatus(
        trainNumber,
        journeyDate,
      );
      return {
        sourceProvider: enriched.sourceProvider,
        confidence: enriched.confidence,
        observedAt: enriched.observedAt,
        trainNumber: enriched.trainNumber,
        trainName: enriched.trainName,
        status: enriched.status === "diverted" ? "delayed" : enriched.status,
        delayMinutes: enriched.delayMinutes,
        currentStopIndex: enriched.currentStopIndex,
        lastUpdated: enriched.lastUpdated,
        stations: enriched.stations.map((s) => ({
          stopIndex: s.stopIndex,
          stationCode: s.stationCode,
          stationName: s.stationName,
          scheduledArrival: s.scheduledArrival,
          eta: s.eta,
          platform: s.platform,
          passed: s.passed,
        })),
        nextStopIndex: enriched.nextStopIndex,
        distanceTravelledKm: enriched.distanceTravelledKm,
        distanceRemainingKm: enriched.distanceRemainingKm,
        platformHint: enriched.platformHint,
        progressPercent: enriched.progressPercent,
      };
    } catch {
      return null;
    }
  }
}

let provider: TrainDataProvider | null = null;

export function getTrainDataProvider(): TrainDataProvider {
  if (!provider) {
    const configuredProvider = (
      process.env.RAILWAY_DATA_PROVIDER ??
      process.env.RAILWAY_PROVIDER ??
      "deterministic"
    ).toLowerCase();

    if (configuredProvider === "mock") {
      if (process.env.NODE_ENV === "production")
        throw new Error("Mock railway data is forbidden in production");
      provider = new MockTrainDataProvider();
    } else {
      provider = new RailwayDataServiceAdapter();
    }
  }
  return provider;
}
