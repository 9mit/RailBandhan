import { boundedJson } from "@/server/outbound";
import { RailwayDataNormalizer } from "../normalizer";
import type {
  NormalizedTrainLiveStatus,
  RouteGeometry,
  StationSearchResult,
  TrainSearchResult,
} from "../types";
import type { RailwayDataProvider } from "./base";

export interface RailRadarConfig {
  baseUrl?: string;
  apiKey?: string;
  timeoutMs?: number;
}

export class RailRadarProvider implements RailwayDataProvider {
  private baseUrl: string;
  private apiKey: string;
  private timeoutMs: number;

  constructor(config: RailRadarConfig = {}) {
    this.baseUrl =
      config.baseUrl ??
      process.env.RAILRADAR_API_BASE_URL ??
      "https://api.railradar.in/v1";
    if (new URL(this.baseUrl).protocol !== "https:")
      throw new Error("RailRadar requires HTTPS");
    this.apiKey = config.apiKey ?? process.env.RAILRADAR_API_KEY ?? "";
    this.timeoutMs = config.timeoutMs ?? 3500;
  }

  getProviderName(): string {
    return "RailRadar";
  }

  async getLiveStatus(
    trainNumber: string,
    journeyDate: string,
  ): Promise<NormalizedTrainLiveStatus | null> {
    const cleanNumber = trainNumber.trim().replace(/\s+/g, "");
    if (!this.apiKey || !/^\d{5}$/.test(cleanNumber)) return null;
    const url = `${this.baseUrl}/trains/${cleanNumber}/live?date=${encodeURIComponent(journeyDate)}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(url, {
        signal: controller.signal,
        redirect: "error",
        headers: {
          Accept: "application/json",
          ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
        },
      });

      if (!res.ok) {
        return null;
      }

      const json = await boundedJson(res);
      const observedAt = json?.meta?.timestamp ?? new Date().toISOString();
      return RailwayDataNormalizer.normalizeLiveTelemetry(
        json,
        "RailRadar",
        observedAt,
      );
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  async getRouteGeometry(trainNumber: string): Promise<RouteGeometry | null> {
    const cleanNumber = trainNumber.trim().replace(/\s+/g, "");
    if (!this.apiKey || !/^\d{5}$/.test(cleanNumber)) return null;
    const url = `${this.baseUrl}/trains/${cleanNumber}/route?format=geojson&stops=true`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(url, {
        signal: controller.signal,
        redirect: "error",
        headers: {
          Accept: "application/json",
          ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
        },
      });

      if (!res.ok) return null;
      const json = await boundedJson(res);
      const coords =
        json?.data?.geojson?.geometry?.coordinates ??
        json?.geojson?.geometry?.coordinates;

      if (!Array.isArray(coords) || coords.length === 0) return null;

      return {
        trainNumber: cleanNumber,
        type: "LineString",
        coordinates: coords,
        totalDistanceKm: Number(
          json?.data?.totalDistanceKm ?? json?.totalDistanceKm ?? 1000,
        ),
      };
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  async searchTrains(query: string): Promise<TrainSearchResult[]> {
    const clean = query.trim();
    if (!clean || !this.apiKey || clean.length > 100) return [];

    const url = `${this.baseUrl}/lookup/search/trains?q=${encodeURIComponent(clean)}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(url, {
        signal: controller.signal,
        redirect: "error",
        headers: {
          Accept: "application/json",
          ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
        },
      });

      if (!res.ok) return [];
      const json = await boundedJson(res);
      const list: any[] = Array.isArray(json?.data)
        ? json.data
        : Array.isArray(json)
          ? json
          : [];

      return list.map((item) => ({
        trainNumber: String(item.trainNumber ?? item.number ?? ""),
        trainName: String(item.trainName ?? item.name ?? ""),
        trainType: String(item.trainType ?? item.type ?? "Express"),
        originStationCode: String(item.origin ?? item.from ?? ""),
        destinationStationCode: String(item.destination ?? item.to ?? ""),
        runsOnDays: Array.isArray(item.runsOnDays)
          ? item.runsOnDays
          : [0, 1, 2, 3, 4, 5, 6],
      }));
    } catch {
      return [];
    } finally {
      clearTimeout(timer);
    }
  }

  async searchStations(query: string): Promise<StationSearchResult[]> {
    const clean = query.trim();
    if (!clean || !this.apiKey || clean.length > 100) return [];

    const url = `${this.baseUrl}/lookup/search/stations?q=${encodeURIComponent(clean)}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(url, {
        signal: controller.signal,
        redirect: "error",
        headers: {
          Accept: "application/json",
          ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
        },
      });

      if (!res.ok) return [];
      const json = await boundedJson(res);
      const list: any[] = Array.isArray(json?.data)
        ? json.data
        : Array.isArray(json)
          ? json
          : [];

      return list.map((item) => ({
        code: String(item.code ?? item.stationCode ?? "").toUpperCase(),
        name: String(item.name ?? item.stationName ?? ""),
        hindiName: item.hindiName ?? item.hindi_name,
        aliases: Array.isArray(item.aliases) ? item.aliases : [],
        lat: item.lat ? Number(item.lat) : undefined,
        lng: item.lng ? Number(item.lng) : undefined,
        division: item.division,
        zone: item.zone,
      }));
    } catch {
      return [];
    } finally {
      clearTimeout(timer);
    }
  }
}
