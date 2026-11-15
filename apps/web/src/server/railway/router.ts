import { RailwayObservability } from "./observability";
import type { RailwayDataProvider } from "./providers/base";
import { DeterministicRailwayProvider } from "./providers/deterministic";
import { MockRailwayProvider } from "./providers/mock";
import { OpenDataRailwayProvider } from "./providers/opendata";
import { RailRadarProvider } from "./providers/railradar";
import type {
  NormalizedTrainLiveStatus,
  RouteGeometry,
  StationSearchResult,
  TrainSearchResult,
} from "./types";

export interface ProviderRouterConfig {
  primaryProvider?: string; // 'railradar' | 'opendata' | 'deterministic' | 'mock'
  secondaryProvider?: string;
  fallbackProvider?: string;
}

export class RailwayDataRouter {
  private primary: RailwayDataProvider;
  private secondary: RailwayDataProvider | null = null;
  private fallback: RailwayDataProvider;
  private inFlightFetches = new Map<string, Promise<any>>();
  private circuitBreakers = new Map<string, { trippedUntil: number }>();

  constructor(config: ProviderRouterConfig = {}) {
    const primaryName = (
      config.primaryProvider ??
      process.env.RAILWAY_DATA_PROVIDER ??
      process.env.RAILWAY_PROVIDER ??
      "deterministic"
    ).toLowerCase();

    this.primary = this.instantiateProvider(primaryName);

    const secondaryName = (
      config.secondaryProvider ??
      process.env.RAILWAY_FALLBACK_PROVIDER ??
      "opendata"
    ).toLowerCase();

    if (secondaryName !== primaryName) {
      this.secondary = this.instantiateProvider(secondaryName);
    }

    this.fallback = new DeterministicRailwayProvider();
  }

  private instantiateProvider(name: string): RailwayDataProvider {
    switch (name) {
      case "railradar":
        return new RailRadarProvider();
      case "opendata":
        return new OpenDataRailwayProvider();
      case "deterministic":
        return new DeterministicRailwayProvider();
      case "mock":
        if (process.env.NODE_ENV === "production")
          throw new Error("Mock railway data is forbidden in production");
        return new MockRailwayProvider();
      default:
        throw new Error(`Unsupported railway provider: ${name}`);
    }
  }

  private isCircuitOpen(providerName: string): boolean {
    const cb = this.circuitBreakers.get(providerName);
    if (!cb) return false;
    if (Date.now() > cb.trippedUntil) {
      this.circuitBreakers.delete(providerName);
      return false;
    }
    return true;
  }

  private tripCircuit(providerName: string, durationMs = 60000): void {
    this.circuitBreakers.set(providerName, {
      trippedUntil: Date.now() + durationMs,
    });
  }

  /**
   * In-flight coalesced getLiveStatus call across primary, secondary, and fallback providers.
   */
  async getLiveStatus(
    trainNumber: string,
    journeyDate: string,
  ): Promise<NormalizedTrainLiveStatus> {
    const flightKey = `live:${trainNumber}:${journeyDate}`;
    const existing = this.inFlightFetches.get(flightKey);
    if (existing) {
      return existing;
    }

    const promise = this.executeLiveFetch(trainNumber, journeyDate).finally(
      () => {
        this.inFlightFetches.delete(flightKey);
      },
    );

    this.inFlightFetches.set(flightKey, promise);
    return promise;
  }

  private async executeLiveFetch(
    trainNumber: string,
    journeyDate: string,
  ): Promise<NormalizedTrainLiveStatus> {
    // 1. Try Primary Provider (if circuit is not open)
    const primaryName = this.primary.getProviderName();
    if (!this.isCircuitOpen(primaryName)) {
      const start = Date.now();
      try {
        const result = await this.primary.getLiveStatus(
          trainNumber,
          journeyDate,
        );
        const latency = Date.now() - start;

        if (result) {
          RailwayObservability.recordRequest({
            provider: primaryName,
            endpoint: "/live",
            targetId: trainNumber,
            timestamp: new Date().toISOString(),
            latencyMs: latency,
            status: "success",
            cacheHit: false,
            freshnessSeconds: result.dataAgeSeconds,
          });
          return result;
        }

        RailwayObservability.recordRequest({
          provider: primaryName,
          endpoint: "/live",
          targetId: trainNumber,
          timestamp: new Date().toISOString(),
          latencyMs: latency,
          status: "error",
          cacheHit: false,
          freshnessSeconds: 0,
          errorMessage: "Null response from provider",
        });
      } catch (err: any) {
        RailwayObservability.recordRequest({
          provider: primaryName,
          endpoint: "/live",
          targetId: trainNumber,
          timestamp: new Date().toISOString(),
          latencyMs: Date.now() - start,
          status: "error",
          cacheHit: false,
          freshnessSeconds: 0,
          errorMessage: err?.message,
        });
      }

      // Check health and trip circuit if failing repeatedly
      const health = RailwayObservability.getHealthScore(primaryName);
      if (!health.isHealthy) {
        this.tripCircuit(primaryName);
      }
    } else {
      RailwayObservability.recordRequest({
        provider: primaryName,
        endpoint: "/live",
        targetId: trainNumber,
        timestamp: new Date().toISOString(),
        latencyMs: 0,
        status: "circuit_broken",
        cacheHit: false,
        freshnessSeconds: 0,
      });
    }

    // 2. Try Secondary Provider
    if (
      this.secondary &&
      !this.isCircuitOpen(this.secondary.getProviderName())
    ) {
      const secName = this.secondary.getProviderName();
      const start = Date.now();
      try {
        const result = await this.secondary.getLiveStatus(
          trainNumber,
          journeyDate,
        );
        if (result) {
          RailwayObservability.recordRequest({
            provider: secName,
            endpoint: "/live",
            targetId: trainNumber,
            timestamp: new Date().toISOString(),
            latencyMs: Date.now() - start,
            status: "fallback",
            cacheHit: false,
            freshnessSeconds: result.dataAgeSeconds,
          });
          return result;
        }
      } catch {
        // Continue to deterministic fallback
      }
    }

    // 3. Fallback to Deterministic Timetable Graph Interpolator (Guaranteed 100% availability)
    const fbName = this.fallback.getProviderName();
    const fbStart = Date.now();
    const fallbackStatus = await this.fallback.getLiveStatus(
      trainNumber,
      journeyDate,
    );

    RailwayObservability.recordRequest({
      provider: fbName,
      endpoint: "/live",
      targetId: trainNumber,
      timestamp: new Date().toISOString(),
      latencyMs: Date.now() - fbStart,
      status: "fallback",
      cacheHit: false,
      freshnessSeconds: 0,
    });

    if (fallbackStatus) {
      return fallbackStatus;
    }

    // Absolute fallback construct if train is unregistered
    return {
      trainNumber,
      trainName: `Train ${trainNumber}`,
      status: "on_time",
      delayMinutes: 0,
      currentStopIndex: 0,
      currentStationCode: "UNKNOWN",
      nextStopIndex: null,
      nextStationCode: null,
      lastUpdated: new Date().toISOString(),
      observedAt: new Date().toISOString(),
      dataAgeSeconds: 0,
      confidence: "degraded",
      sourceProvider: "OfflineFallback",
      speedKmh: 0,
      bearingDegrees: 0,
      segmentProgress: 0,
      currentPosition: null,
      distanceTravelledKm: 0,
      distanceRemainingKm: 0,
      progressPercent: 0,
      platformHint: null,
      stations: [],
    };
  }

  async getRouteGeometry(trainNumber: string): Promise<RouteGeometry | null> {
    const flightKey = `geom:${trainNumber}`;
    const existing = this.inFlightFetches.get(flightKey);
    if (existing) return existing;

    const promise = (async () => {
      const primaryGeom = await this.primary.getRouteGeometry(trainNumber);
      if (primaryGeom) return primaryGeom;

      if (this.secondary) {
        const secGeom = await this.secondary.getRouteGeometry(trainNumber);
        if (secGeom) return secGeom;
      }

      return this.fallback.getRouteGeometry(trainNumber);
    })().finally(() => {
      this.inFlightFetches.delete(flightKey);
    });

    this.inFlightFetches.set(flightKey, promise);
    return promise;
  }

  async searchTrains(query: string): Promise<TrainSearchResult[]> {
    const list = await this.primary.searchTrains(query);
    if (list.length > 0) return list;
    return this.fallback.searchTrains(query);
  }

  async searchStations(query: string): Promise<StationSearchResult[]> {
    const list = await this.primary.searchStations(query);
    if (list.length > 0) return list;
    return this.fallback.searchStations(query);
  }
}
