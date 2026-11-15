import type { NormalizedTrainLiveStatus } from "./types";

export interface EstimatedArrivalResult {
  targetStationCode: string;
  targetStationName: string;
  scheduledArrival: string | null;
  estimatedArrival: string | null;
  estimatedDelayMinutes: number;
  confidenceScore: number; // 0.0 to 1.0
  distanceRemainingKm: number;
  stopsRemaining: number;
}

export interface MLEtaFeatureVector {
  trainNumber: string;
  trainType: string;
  hourOfDay: number;
  dayOfWeek: number;
  currentDelayMinutes: number;
  distanceRemainingKm: number;
  stopsRemaining: number;
  historicalCorridorDelayAvg: number;
  currentSpeedKmh: number;
}

export class ETAEngine {
  /**
   * Deterministic ETA estimation with corridor slack damping.
   */
  static calculateETA(
    status: NormalizedTrainLiveStatus,
    targetStationCode: string,
  ): EstimatedArrivalResult {
    const targetIdx = status.stations.findIndex(
      (s) => s.stationCode.toUpperCase() === targetStationCode.toUpperCase(),
    );

    const currentStation =
      status.stations[status.currentStopIndex] ?? status.stations[0];
    const targetStation = targetIdx >= 0 ? status.stations[targetIdx] : null;

    if (!targetStation || targetIdx <= status.currentStopIndex) {
      return {
        targetStationCode,
        targetStationName: targetStation?.stationName ?? targetStationCode,
        scheduledArrival: targetStation?.scheduledArrival ?? null,
        estimatedArrival: targetStation?.scheduledArrival ?? null,
        estimatedDelayMinutes: 0,
        confidenceScore: 0.5,
        distanceRemainingKm: 0,
        stopsRemaining: 0,
      };
    }

    const distanceRemainingKm = Math.max(
      0,
      targetStation.distanceKm - currentStation.distanceKm,
    );
    const stopsRemaining = targetIdx - status.currentStopIndex;

    // Damping factor: Superfast & Rajdhani trains recover 5-10% delay on long runs
    const isPremium =
      status.trainName.includes("Rajdhani") ||
      status.trainName.includes("Vande Bharat") ||
      status.trainName.includes("Shatabdi");

    const recoveryFactor = isPremium && distanceRemainingKm > 300 ? 0.9 : 1.0;
    const estimatedDelayMinutes = Math.max(
      0,
      Math.round(status.delayMinutes * recoveryFactor),
    );

    // Calculate arrival timestamp
    let estimatedArrival: string | null = null;
    if (targetStation.scheduledArrival) {
      const scheduledTime = new Date(targetStation.scheduledArrival).getTime();
      if (!isNaN(scheduledTime)) {
        estimatedArrival = new Date(
          scheduledTime + estimatedDelayMinutes * 60 * 1000,
        ).toISOString();
      }
    }

    // Confidence decreases with distance and high current delays
    const distancePenalty = Math.min(0.3, (distanceRemainingKm / 2000) * 0.3);
    const delayPenalty = Math.min(0.2, (status.delayMinutes / 180) * 0.2);
    const confidenceScore = Number(
      (1.0 - distancePenalty - delayPenalty).toFixed(2),
    );

    return {
      targetStationCode: targetStation.stationCode,
      targetStationName: targetStation.stationName,
      scheduledArrival: targetStation.scheduledArrival,
      estimatedArrival,
      estimatedDelayMinutes,
      confidenceScore,
      distanceRemainingKm,
      stopsRemaining,
    };
  }

  /**
   * Generates structured numerical feature vector for downstream XGBoost / LightGBM models.
   */
  static extractMLFeatures(
    status: NormalizedTrainLiveStatus,
    targetStationCode: string,
  ): MLEtaFeatureVector {
    const targetIdx = status.stations.findIndex(
      (s) => s.stationCode.toUpperCase() === targetStationCode.toUpperCase(),
    );
    const currentStation =
      status.stations[status.currentStopIndex] ?? status.stations[0];
    const targetStation = targetIdx >= 0 ? status.stations[targetIdx] : null;

    const distanceRemainingKm = targetStation
      ? Math.max(0, targetStation.distanceKm - currentStation.distanceKm)
      : 0;
    const stopsRemaining =
      targetIdx >= 0 ? Math.max(0, targetIdx - status.currentStopIndex) : 0;

    const now = new Date();
    return {
      trainNumber: status.trainNumber,
      trainType: status.trainName.includes("Rajdhani")
        ? "Rajdhani"
        : status.trainName.includes("Vande")
          ? "VandeBharat"
          : "Express",
      hourOfDay: now.getHours(),
      dayOfWeek: now.getDay(),
      currentDelayMinutes: status.delayMinutes,
      distanceRemainingKm,
      stopsRemaining,
      historicalCorridorDelayAvg: 12.5, // Standard baseline for major routes
      currentSpeedKmh: status.speedKmh,
    };
  }
}
