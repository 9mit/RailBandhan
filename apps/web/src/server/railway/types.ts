export type DataConfidenceLevel = 'live' | 'cached' | 'estimated' | 'degraded';

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface RouteGeometry {
  trainNumber: string;
  type: 'LineString';
  coordinates: [number, number][]; // [lng, lat] GeoJSON format
  totalDistanceKm: number;
}

export interface NormalizedStationStop {
  stopIndex: number;
  stationCode: string;
  stationName: string;
  scheduledArrival: string | null;
  scheduledDeparture: string | null;
  actualArrival: string | null;
  actualDeparture: string | null;
  eta: string | null;
  delayMinutes: number;
  distanceKm: number;
  platform: string | null;
  passed: boolean;
  isHalt: boolean;
  coordinates?: GeoPoint;
}

export interface OperationalException {
  isDiverted: boolean;
  isCancelled: boolean;
  shortTerminated: boolean;
  originStationCode?: string;
  terminationStationCode?: string;
  divertedViaStations?: string[];
  notice?: string;
}

export interface NormalizedTrainLiveStatus {
  trainNumber: string;
  trainName: string;
  status: 'on_time' | 'delayed' | 'cancelled' | 'arrived' | 'diverted';
  delayMinutes: number;
  currentStopIndex: number;
  currentStationCode: string;
  nextStopIndex: number | null;
  nextStationCode: string | null;
  lastUpdated: string;
  observedAt: string;
  dataAgeSeconds: number;
  confidence: DataConfidenceLevel;
  sourceProvider: string;
  speedKmh: number;
  bearingDegrees: number;
  segmentProgress: number; // 0.0 to 1.0
  currentPosition: GeoPoint | null;
  distanceTravelledKm: number;
  distanceRemainingKm: number;
  progressPercent: number;
  platformHint: string | null;
  stations: NormalizedStationStop[];
  exception?: OperationalException;
}

export interface ProviderHealthScore {
  providerName: string;
  availabilityPercent: number;
  averageLatencyMs: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  cacheHitRatio: number;
  averageFreshnessSeconds: number;
  lastSuccessTimestamp: string | null;
  lastFailureTimestamp: string | null;
  isHealthy: boolean;
  consecutiveFailures: number;
}

export interface TrainSearchResult {
  trainNumber: string;
  trainName: string;
  trainType: string;
  originStationCode: string;
  destinationStationCode: string;
  runsOnDays: number[];
}

export interface StationSearchResult {
  code: string;
  name: string;
  hindiName?: string;
  aliases: string[];
  lat?: number;
  lng?: number;
  division?: string;
  zone?: string;
}
