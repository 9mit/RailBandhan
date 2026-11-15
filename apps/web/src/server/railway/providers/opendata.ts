import { CANONICAL_TRAIN_ROUTES, RailwayGraph } from "../graph";
import { CANONICAL_STATIONS } from "../stations";
import type {
  NormalizedTrainLiveStatus,
  RouteGeometry,
  StationSearchResult,
  TrainSearchResult,
} from "../types";
import type { RailwayDataProvider } from "./base";
import { DeterministicRailwayProvider } from "./deterministic";

export class OpenDataRailwayProvider implements RailwayDataProvider {
  getProviderName(): string {
    return "OpenData";
  }

  async getLiveStatus(
    trainNumber: string,
    journeyDate: string,
  ): Promise<NormalizedTrainLiveStatus | null> {
    const status = await new DeterministicRailwayProvider().getLiveStatus(
      trainNumber,
      journeyDate,
    );
    return status
      ? {
          ...status,
          sourceProvider: "OpenData timetable",
          confidence: "estimated",
        }
      : null;
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
