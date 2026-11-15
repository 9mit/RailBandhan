import { CANONICAL_TRAIN_ROUTES, RailwayGraph } from "../graph";
import { RailwayDataNormalizer } from "../normalizer";
import { CANONICAL_STATIONS } from "../stations";
import { datedTimetable } from "../timetable";
import type {
  NormalizedTrainLiveStatus,
  RouteGeometry,
  StationSearchResult,
  TrainSearchResult,
} from "../types";
import type { RailwayDataProvider } from "./base";

export class DeterministicRailwayProvider implements RailwayDataProvider {
  getProviderName(): string {
    return "DeterministicGraph";
  }

  async getLiveStatus(
    trainNumber: string,
    journeyDate: string,
  ): Promise<NormalizedTrainLiveStatus | null> {
    const route = RailwayGraph.getRoute(trainNumber);
    if (!route || route.stops.length === 0) return null;

    const timed = datedTimetable(route.stops, journeyDate);
    const now = Date.now();
    let currentStopIndex = 0;
    for (let i = 0; i < timed.length; i++) {
      const stopTime = Date.parse(
        timed[i].scheduledArrival ?? timed[i].scheduledDeparture ?? "",
      );
      if (stopTime <= now) currentStopIndex = i;
    }
    const current = timed[currentStopIndex],
      next = timed[currentStopIndex + 1];
    const departure = Date.parse(
      current.scheduledDeparture ?? current.scheduledArrival ?? "",
    );
    const arrival = next
      ? Date.parse(next.scheduledArrival ?? next.scheduledDeparture ?? "")
      : departure;
    const segmentProgress =
      next && now > departure
        ? Math.max(0, Math.min(1, (now - departure) / (arrival - departure)))
        : 0;
    const currSt = CANONICAL_STATIONS.find(
        (s) => s.code === current.stationCode,
      ),
      nextSt = next
        ? CANONICAL_STATIONS.find((s) => s.code === next.stationCode)
        : undefined;
    const currentPosition =
      currSt?.lat && currSt.lng
        ? {
            lat:
              currSt.lat +
              ((nextSt?.lat ?? currSt.lat) - currSt.lat) * segmentProgress,
            lng:
              currSt.lng +
              ((nextSt?.lng ?? currSt.lng) - currSt.lng) * segmentProgress,
          }
        : undefined;
    const travelled =
      current.distanceKm +
      (next ? next.distanceKm - current.distanceKm : 0) * segmentProgress;
    const total = timed[timed.length - 1].distanceKm;
    const speedKmh =
      next && segmentProgress > 0 && segmentProgress < 1
        ? Math.min(
            200,
            (next.distanceKm - current.distanceKm) /
              ((arrival - departure) / 3600000),
          )
        : 0;

    const raw = {
      trainNumber: route.trainNumber,
      trainName: route.trainName,
      delayMinutes: 0,
      currentStopIndex,
      speedKmh,
      bearingDegrees: 0,
      segmentProgress,
      currentPosition,
      stations: timed.map((s) => {
        const canonical = CANONICAL_STATIONS.find(
          (c) => c.code === s.stationCode,
        );
        return {
          stationCode: s.stationCode,
          stationName: canonical?.name ?? s.stationCode,
          scheduledArrival: s.scheduledArrival,
          scheduledDeparture: s.scheduledDeparture,
          distanceKm: s.distanceKm,
          platform: null,
          eta: s.scheduledArrival,
          lat: canonical?.lat,
          lng: canonical?.lng,
        };
      }),
    };

    const normalized = RailwayDataNormalizer.normalizeLiveTelemetry(
      raw,
      "DeterministicGraph",
    );
    normalized.confidence = "estimated";
    normalized.distanceTravelledKm = travelled;
    normalized.distanceRemainingKm = Math.max(0, total - travelled);
    normalized.progressPercent =
      total > 0 ? Math.min(100, Math.max(0, (travelled / total) * 100)) : 0;
    normalized.platformHint = null;
    return normalized;
  }

  async getRouteGeometry(trainNumber: string): Promise<RouteGeometry | null> {
    const route = RailwayGraph.getRoute(trainNumber);
    if (!route) return null;

    const coordinates: [number, number][] = [];
    for (const stop of route.stops) {
      const station = CANONICAL_STATIONS.find(
        (s) => s.code === stop.stationCode,
      );
      if (station && station.lng && station.lat) {
        coordinates.push([station.lng, station.lat]);
      }
    }

    return {
      trainNumber: route.trainNumber,
      type: "LineString",
      coordinates,
      totalDistanceKm: route.stops[route.stops.length - 1]?.distanceKm ?? 1000,
    };
  }

  async searchTrains(query: string): Promise<TrainSearchResult[]> {
    const q = query.toLowerCase().trim();
    if (!q) return [];

    return CANONICAL_TRAIN_ROUTES.filter(
      (r) =>
        r.trainNumber.toLowerCase().includes(q) ||
        r.trainName.toLowerCase().includes(q),
    ).map((r) => ({
      trainNumber: r.trainNumber,
      trainName: r.trainName,
      trainType: r.type,
      originStationCode: r.originCode,
      destinationStationCode: r.destinationCode,
      runsOnDays: [0, 1, 2, 3, 4, 5, 6],
    }));
  }

  async searchStations(query: string): Promise<StationSearchResult[]> {
    const q = query.toLowerCase().trim();
    if (!q) return [];

    return CANONICAL_STATIONS.filter(
      (s) =>
        s.code.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.aliases.some((a) => a.toLowerCase().includes(q)),
    ).map((s) => ({
      code: s.code,
      name: s.name,
      hindiName: s.hindiName,
      aliases: s.aliases,
      lat: s.lat,
      lng: s.lng,
    }));
  }
}
