import { ETAEngine, type EstimatedArrivalResult } from "./eta-engine";
import { RailwayObservability } from "./observability";
import {
  TrainPositionEngine,
  type CalculatedPositionResult,
} from "./position-engine";
import { RailwayDataRouter } from "./router";
import type {
  NormalizedTrainLiveStatus,
  RouteGeometry,
  StationSearchResult,
  TrainSearchResult,
} from "./types";

export interface EnrichedTrainLiveStatus extends NormalizedTrainLiveStatus {
  positionCalculation: CalculatedPositionResult;
  recommendedPollIntervalSeconds: number;
}

export class RailwayDataService {
  private static router: RailwayDataRouter | null = null;
  private static liveCache = new Map<
    string,
    { status: NormalizedTrainLiveStatus; expiresAt: number }
  >();
  private static geometryCache = new Map<
    string,
    { geom: RouteGeometry; expiresAt: number }
  >();
  private static searchCache = new Map<
    string,
    { results: any[]; expiresAt: number }
  >();

  private static getRouter(): RailwayDataRouter {
    if (!this.router) {
      this.router = new RailwayDataRouter();
    }
    return this.router;
  }

  /**
   * Resets router and in-memory caches (for testing or reconfiguration).
   */
  static reset(routerConfig?: any): void {
    this.router = routerConfig ? new RailwayDataRouter(routerConfig) : null;
    this.liveCache.clear();
    this.geometryCache.clear();
    this.searchCache.clear();
  }

  /**
   * Retrieves enriched live train status with track geometry, calculated position,
   * dead-reckoning, and smart polling intervals.
   */
  static async getEnrichedLiveStatus(
    trainNumber: string,
    journeyDate: string,
    targetDestinationCode?: string,
  ): Promise<EnrichedTrainLiveStatus> {
    const cleanNumber = trainNumber.trim().replace(/\s+/g, "");
    if (
      !/^\d{5}$/.test(cleanNumber) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(journeyDate)
    )
      throw new Error("Invalid train or journey date");
    const cacheKey = `live:${cleanNumber}:${journeyDate}`;
    const cached = this.liveCache.get(cacheKey);

    let status: NormalizedTrainLiveStatus;
    if (cached && cached.expiresAt > Date.now()) {
      status = cached.status;
      RailwayObservability.recordRequest({
        provider: status.sourceProvider,
        endpoint: "/live",
        targetId: cleanNumber,
        timestamp: new Date().toISOString(),
        latencyMs: 0,
        status: "success",
        cacheHit: true,
        freshnessSeconds: Math.round(
          (Date.now() - new Date(status.observedAt).getTime()) / 1000,
        ),
      });
    } else {
      status = await this.getRouter().getLiveStatus(cleanNumber, journeyDate);
      // Cache live status for 25 seconds
      if (this.liveCache.size >= 1000)
        this.liveCache.delete(this.liveCache.keys().next().value!);
      this.liveCache.set(cacheKey, {
        status,
        expiresAt: Date.now() + 25 * 1000,
      });
    }

    // Fetch geometry
    const geometry = await this.getRouteGeometry(cleanNumber);

    // Calculate position via TrainPositionEngine
    const positionCalculation = TrainPositionEngine.calculatePosition(
      status,
      geometry,
    );

    // Determine smart polling interval
    let recommendedPollIntervalSeconds = 30;
    if (status.status === "arrived" || status.status === "cancelled") {
      recommendedPollIntervalSeconds = 0; // stop polling
    } else if (status.speedKmh === 0) {
      recommendedPollIntervalSeconds = 60; // train halted at station
    }

    return {
      ...status,
      currentPosition: positionCalculation.position,
      bearingDegrees: positionCalculation.bearingDegrees,
      confidence: positionCalculation.confidence,
      positionCalculation,
      recommendedPollIntervalSeconds,
    };
  }

  /**
   * Retrieves GeoJSON track geometry for map rendering.
   */
  static async getRouteGeometry(
    trainNumber: string,
  ): Promise<RouteGeometry | null> {
    const cleanNumber = trainNumber.trim().replace(/\s+/g, "");
    const cacheKey = `geom:${cleanNumber}`;
    const cached = this.geometryCache.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
      return cached.geom;
    }

    const geom = await this.getRouter().getRouteGeometry(cleanNumber);
    if (geom) {
      // Cache geometry for 24 hours (static)
      if (this.geometryCache.size >= 1000)
        this.geometryCache.delete(this.geometryCache.keys().next().value!);
      this.geometryCache.set(cacheKey, {
        geom,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      });
    }

    return geom;
  }

  /**
   * Calculates estimated time of arrival for a target station along the route.
   */
  static async getETA(
    trainNumber: string,
    journeyDate: string,
    targetStationCode: string,
  ): Promise<EstimatedArrivalResult> {
    const liveStatus = await this.getEnrichedLiveStatus(
      trainNumber,
      journeyDate,
    );
    return ETAEngine.calculateETA(liveStatus, targetStationCode);
  }

  /**
   * Fast train lookup and autocomplete.
   */
  static async searchTrains(query: string): Promise<TrainSearchResult[]> {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const cacheKey = `search:train:${q}`;
    const cached = this.searchCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.results;
    }

    const results = await this.getRouter().searchTrains(q);
    if (this.searchCache.size >= 1000)
      this.searchCache.delete(this.searchCache.keys().next().value!);
    this.searchCache.set(cacheKey, {
      results,
      expiresAt: Date.now() + 60 * 60 * 1000,
    });
    return results;
  }

  /**
   * Fast station lookup and autocomplete.
   */
  static async searchStations(query: string): Promise<StationSearchResult[]> {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const cacheKey = `search:station:${q}`;
    const cached = this.searchCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.results;
    }

    const results = await this.getRouter().searchStations(q);
    if (this.searchCache.size >= 1000)
      this.searchCache.delete(this.searchCache.keys().next().value!);
    this.searchCache.set(cacheKey, {
      results,
      expiresAt: Date.now() + 60 * 60 * 1000,
    });
    return results;
  }
}
