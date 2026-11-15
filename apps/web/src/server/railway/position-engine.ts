import { CANONICAL_STATIONS } from "./stations";
import type {
  DataConfidenceLevel,
  GeoPoint,
  NormalizedTrainLiveStatus,
  RouteGeometry,
} from "./types";

export interface CalculatedPositionResult {
  position: GeoPoint;
  bearingDegrees: number;
  confidence: DataConfidenceLevel;
  method:
    | "exact_gps"
    | "geometry_interpolation"
    | "dead_reckoning"
    | "station_fallback";
  estimatedSegmentProgress: number;
}

export class TrainPositionEngine {
  /**
   * Calculates the exact or dead-reckoned geographical position of the train.
   */
  static calculatePosition(
    status: NormalizedTrainLiveStatus,
    geometry?: RouteGeometry | null,
  ): CalculatedPositionResult {
    const now = Date.now();
    const observedAtMs = new Date(status.observedAt).getTime();
    const deltaSeconds = Math.max(0, (now - observedAtMs) / 1000);

    // 1. Exact GPS telemetry provided directly by provider
    if (status.currentPosition && deltaSeconds < 45) {
      return {
        position: status.currentPosition,
        bearingDegrees: status.bearingDegrees,
        confidence: "live",
        method: "exact_gps",
        estimatedSegmentProgress: status.segmentProgress,
      };
    }

    // 2. High-resolution GeoJSON LineString geometry interpolation + Dead-Reckoning
    if (geometry && geometry.coordinates && geometry.coordinates.length >= 2) {
      const coords = geometry.coordinates; // [ [lng, lat], ... ]
      const totalPoints = coords.length;

      // Adjust segment progress with dead-reckoning if moving
      let adjustedProgress = status.segmentProgress;
      if (status.speedKmh > 0 && deltaSeconds > 0 && deltaSeconds < 360) {
        // Average segment distance between stations is ~40 km
        const approxSegmentDistKm = 40;
        const additionalDistanceKm = (status.speedKmh * deltaSeconds) / 3600;
        const additionalProgress = additionalDistanceKm / approxSegmentDistKm;
        adjustedProgress = Math.min(
          0.99,
          status.segmentProgress + additionalProgress,
        );
      }

      // Map progress to whole route index
      const totalStops = Math.max(1, status.stations.length);
      const baseRatio = status.currentStopIndex / totalStops;
      const segmentRatio = (1 / totalStops) * adjustedProgress;
      const overallProgress = Math.min(
        1.0,
        Math.max(0.0, baseRatio + segmentRatio),
      );

      const targetIndexFloat = overallProgress * (totalPoints - 1);
      const lowerIdx = Math.floor(targetIndexFloat);
      const upperIdx = Math.min(totalPoints - 1, lowerIdx + 1);
      const fraction = targetIndexFloat - lowerIdx;

      const p1 = coords[lowerIdx]; // [lng, lat]
      const p2 = coords[upperIdx];

      const lng = Number((p1[0] + (p2[0] - p1[0]) * fraction).toFixed(5));
      const lat = Number((p1[1] + (p2[1] - p1[1]) * fraction).toFixed(5));

      const bearingDegrees = this.calculateBearing(p1[1], p1[0], p2[1], p2[0]);
      const confidence: DataConfidenceLevel =
        deltaSeconds < 60
          ? "live"
          : deltaSeconds < 300
            ? "cached"
            : "estimated";

      return {
        position: { lat, lng },
        bearingDegrees,
        confidence,
        method: deltaSeconds > 30 ? "dead_reckoning" : "geometry_interpolation",
        estimatedSegmentProgress: adjustedProgress,
      };
    }

    // 3. Station coordinate interpolation / fallback
    const currStation = CANONICAL_STATIONS.find(
      (s) => s.code === status.currentStationCode,
    );
    const nextStation = status.nextStationCode
      ? CANONICAL_STATIONS.find((s) => s.code === status.nextStationCode)
      : null;

    if (
      currStation?.lat &&
      currStation?.lng &&
      nextStation?.lat &&
      nextStation?.lng
    ) {
      const lat = Number(
        (
          currStation.lat +
          (nextStation.lat - currStation.lat) * status.segmentProgress
        ).toFixed(5),
      );
      const lng = Number(
        (
          currStation.lng +
          (nextStation.lng - currStation.lng) * status.segmentProgress
        ).toFixed(5),
      );
      const bearingDegrees = this.calculateBearing(
        currStation.lat,
        currStation.lng,
        nextStation.lat,
        nextStation.lng,
      );

      return {
        position: { lat, lng },
        bearingDegrees,
        confidence: "estimated",
        method: "station_fallback",
        estimatedSegmentProgress: status.segmentProgress,
      };
    }

    // 4. Default station point fallback
    const defaultLat = currStation?.lat ?? 20.5937;
    const defaultLng = currStation?.lng ?? 78.9629;

    return {
      position: { lat: defaultLat, lng: defaultLng },
      bearingDegrees: status.bearingDegrees,
      confidence: "degraded",
      method: "station_fallback",
      estimatedSegmentProgress: status.segmentProgress,
    };
  }

  /**
   * Computes geographic heading / bearing in degrees between two coordinates.
   */
  private static calculateBearing(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const toDeg = (rad: number) => (rad * 180) / Math.PI;

    const phi1 = toRad(lat1);
    const phi2 = toRad(lat2);
    const deltaLambda = toRad(lng2 - lng1);

    const y = Math.sin(deltaLambda) * Math.cos(phi2);
    const x =
      Math.cos(phi1) * Math.sin(phi2) -
      Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);

    const theta = Math.atan2(y, x);
    return Math.round(((toDeg(theta) % 360) + 360) % 360);
  }
}
