import { RailwayGraph } from "./graph";
import { CANONICAL_STATIONS } from "./stations";
import type {
  DataConfidenceLevel,
  GeoPoint,
  NormalizedStationStop,
  NormalizedTrainLiveStatus,
  OperationalException,
} from "./types";

export class RailwayDataNormalizer {
  /**
   * Validates and normalizes raw external vendor telemetry (RailRadar, RailCore, etc.)
   * into strict internal NormalizedTrainLiveStatus.
   */
  static normalizeLiveTelemetry(
    raw: any,
    providerName: string,
    observedAt: string = new Date().toISOString(),
  ): NormalizedTrainLiveStatus {
    if (!raw || typeof raw !== "object") {
      throw new Error(
        `[Normalizer] Invalid provider payload from ${providerName}`,
      );
    }

    const payload = raw.data ?? raw;
    const trainNumber = String(
      payload.trainNumber ?? payload.train_number ?? payload.number ?? "",
    )
      .trim()
      .replace(/\s+/g, "");

    if (!/^\d{5}$/.test(trainNumber)) {
      throw new Error(`[Normalizer] Missing train number from ${providerName}`);
    }

    const canonicalRoute = RailwayGraph.getRoute(trainNumber);
    const trainName = String(
      payload.trainName ??
        payload.train_name ??
        payload.name ??
        canonicalRoute?.trainName ??
        `Train ${trainNumber}`,
    ).trim();

    const delayMinutes = Math.max(
      0,
      Number(
        payload.delayMinutes ?? payload.delay ?? payload.delay_minutes ?? 0,
      ),
    );
    const speedKmh = Math.max(
      0,
      Math.min(
        250,
        Number(payload.speedKmh ?? payload.speed ?? payload.currentSpeed ?? 0),
      ),
    );
    const bearingDegrees =
      ((Number(payload.bearingDegrees ?? payload.bearing ?? 0) % 360) + 360) %
      360;
    const segmentProgress = Math.max(
      0,
      Math.min(1.0, Number(payload.segmentProgress ?? payload.progress ?? 0)),
    );

    // Parse station stops
    const rawStations: any[] = Array.isArray(payload.stations)
      ? payload.stations
      : Array.isArray(payload.route)
        ? payload.route
        : [];

    let stations: NormalizedStationStop[] = [];
    const currentStopIndex = Math.max(
      0,
      Number(payload.currentStopIndex ?? payload.current_stop_index ?? 0),
    );

    if (rawStations.length > 0) {
      stations = rawStations.map((st: any, idx: number) => {
        const code = String(st.stationCode ?? st.code ?? st.station_code ?? "")
          .toUpperCase()
          .trim();
        const fallbackStation = CANONICAL_STATIONS.find((c) => c.code === code);
        const name = String(
          st.stationName ?? st.name ?? fallbackStation?.name ?? code,
        ).trim();
        const dist = Math.max(0, Number(st.distanceKm ?? st.distance ?? 0));

        let coords: GeoPoint | undefined = undefined;
        const lat = Number(st.lat ?? st.latitude ?? fallbackStation?.lat);
        const lng = Number(st.lng ?? st.longitude ?? fallbackStation?.lng);
        if (
          !isNaN(lat) &&
          !isNaN(lng) &&
          lat >= 6 &&
          lat <= 38 &&
          lng >= 68 &&
          lng <= 98
        ) {
          coords = { lat, lng };
        }

        return {
          stopIndex: idx,
          stationCode: code,
          stationName: name,
          scheduledArrival: st.scheduledArrival ?? st.sch_arr ?? null,
          scheduledDeparture: st.scheduledDeparture ?? st.sch_dep ?? null,
          actualArrival: st.actualArrival ?? st.act_arr ?? null,
          actualDeparture: st.actualDeparture ?? st.act_dep ?? null,
          eta: st.eta ?? st.expectedArrival ?? null,
          delayMinutes: Math.max(0, Number(st.delayMinutes ?? st.delay ?? 0)),
          distanceKm: dist,
          platform: st.platform ? String(st.platform).trim() : null,
          passed: idx < currentStopIndex,
          isHalt: st.isHalt ?? true,
          coordinates: coords,
        };
      });
    } else if (canonicalRoute) {
      stations = canonicalRoute.stops.map((st, idx) => {
        const canonical = CANONICAL_STATIONS.find(
          (c) => c.code === st.stationCode,
        );
        return {
          stopIndex: idx,
          stationCode: st.stationCode,
          stationName: canonical?.name ?? st.stationCode,
          scheduledArrival: st.scheduledArrival,
          scheduledDeparture: st.scheduledDeparture,
          actualArrival: null,
          actualDeparture: null,
          eta: st.scheduledArrival,
          delayMinutes: idx <= currentStopIndex ? delayMinutes : 0,
          distanceKm: st.distanceKm,
          platform: null,
          passed: idx < currentStopIndex,
          isHalt: true,
          coordinates: canonical
            ? { lat: canonical.lat ?? 0, lng: canonical.lng ?? 0 }
            : undefined,
        };
      });
    }

    const currentStation = stations[currentStopIndex] ?? stations[0];
    const nextStopIndex =
      currentStopIndex < stations.length - 1 ? currentStopIndex + 1 : null;
    const nextStation = nextStopIndex !== null ? stations[nextStopIndex] : null;

    const totalDistance =
      stations.length > 0 ? stations[stations.length - 1].distanceKm : 1000;
    const travelled = currentStation?.distanceKm ?? 0;
    const remaining = Math.max(0, totalDistance - travelled);
    const progressPercent =
      totalDistance > 0 ? Math.round((travelled / totalDistance) * 100) : 0;

    // Parse coordinates / current position
    let currentPosition: GeoPoint | null = null;
    if (
      payload.currentPosition &&
      typeof payload.currentPosition === "object"
    ) {
      const pLat = Number(
        payload.currentPosition.lat ?? payload.currentPosition.latitude,
      );
      const pLng = Number(
        payload.currentPosition.lng ?? payload.currentPosition.longitude,
      );
      if (
        !isNaN(pLat) &&
        !isNaN(pLng) &&
        pLat >= 6 &&
        pLat <= 38 &&
        pLng >= 68 &&
        pLng <= 98
      ) {
        currentPosition = { lat: pLat, lng: pLng };
      }
    }

    // Determine operational exceptions
    let exception: OperationalException | undefined = undefined;
    if (
      payload.isDiverted ||
      payload.isCancelled ||
      payload.shortTerminated ||
      payload.diverted
    ) {
      exception = {
        isDiverted: Boolean(payload.isDiverted ?? payload.diverted ?? false),
        isCancelled: Boolean(payload.isCancelled ?? payload.cancelled ?? false),
        shortTerminated: Boolean(payload.shortTerminated ?? false),
        originStationCode: payload.divertedOrigin,
        terminationStationCode: payload.divertedTermination,
        divertedViaStations: Array.isArray(payload.divertedVia)
          ? payload.divertedVia
          : [],
        notice: payload.operationalNotice ?? payload.notice,
      };
    }

    const now = new Date();
    const observedTime = new Date(observedAt);
    const dataAgeSeconds = Math.max(
      0,
      Math.round((now.getTime() - observedTime.getTime()) / 1000),
    );

    let confidence: DataConfidenceLevel = Number.isFinite(
      observedTime.getTime(),
    )
      ? "live"
      : "degraded";
    if (dataAgeSeconds > 300) {
      confidence = "degraded";
    } else if (dataAgeSeconds > 60) {
      confidence = "cached";
    }

    let status: NormalizedTrainLiveStatus["status"] = "on_time";
    if (exception?.isCancelled) {
      status = "cancelled";
    } else if (exception?.isDiverted) {
      status = "diverted";
    } else if (currentStopIndex >= stations.length - 1 && stations.length > 0) {
      status = "arrived";
    } else if (delayMinutes > 15) {
      status = "delayed";
    }

    return {
      trainNumber,
      trainName,
      status,
      delayMinutes,
      currentStopIndex,
      currentStationCode: currentStation?.stationCode ?? "UNKNOWN",
      nextStopIndex,
      nextStationCode: nextStation?.stationCode ?? null,
      lastUpdated: now.toISOString(),
      observedAt,
      dataAgeSeconds,
      confidence,
      sourceProvider: providerName,
      speedKmh,
      bearingDegrees,
      segmentProgress,
      currentPosition,
      distanceTravelledKm: travelled,
      distanceRemainingKm: remaining,
      progressPercent,
      platformHint: currentStation?.platform
        ? `Platform ${currentStation.platform}`
        : null,
      stations,
      exception,
    };
  }
}
