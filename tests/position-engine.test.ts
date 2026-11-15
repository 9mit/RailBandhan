import { describe, it, expect } from 'vitest';
import { TrainPositionEngine } from '@/server/railway/position-engine';
import { RailwayDataNormalizer } from '@/server/railway/normalizer';
import type { RouteGeometry } from '@/server/railway/types';

describe('Train Position Engine & GIS Dead-Reckoning', () => {
  const sampleLiveStatus = RailwayDataNormalizer.normalizeLiveTelemetry(
    {
      trainNumber: '12723',
      trainName: 'Telangana Express',
      delayMinutes: 10,
      currentStopIndex: 1,
      currentStationCode: 'KZJ',
      nextStationCode: 'WL',
      speedKmh: 90,
      bearingDegrees: 90,
      segmentProgress: 0.5,
      stations: [
        { stationCode: 'SC', distanceKm: 0 },
        { stationCode: 'KZJ', distanceKm: 132 },
        { stationCode: 'WL', distanceKm: 142 },
        { stationCode: 'NDLS', distanceKm: 1677 },
      ],
    },
    'RailRadar',
    new Date().toISOString(),
  );

  const sampleGeometry: RouteGeometry = {
    trainNumber: '12723',
    type: 'LineString',
    totalDistanceKm: 1677,
    coordinates: [
      [78.5045, 17.4334], // SC
      [79.0, 17.6],
      [79.5222, 17.9784], // KZJ
      [79.5941, 17.9689], // WL
      [77.2167, 28.6139], // NDLS
    ],
  };

  it('interpolates geographical coordinates along GeoJSON LineString geometry', () => {
    const result = TrainPositionEngine.calculatePosition(sampleLiveStatus, sampleGeometry);

    expect(result.position.lat).toBeGreaterThan(17.0);
    expect(result.position.lat).toBeLessThan(29.0);
    expect(result.position.lng).toBeGreaterThan(77.0);
    expect(result.position.lng).toBeLessThan(80.0);
    expect(result.method).toBe('geometry_interpolation');
    expect(result.confidence).toBe('live');
  });

  it('applies dead-reckoning advance when telemetry is aged', () => {
    // Simulate observation made 90 seconds ago while moving at 90 km/h
    const agedStatus = {
      ...sampleLiveStatus,
      observedAt: new Date(Date.now() - 90 * 1000).toISOString(),
    };

    const result = TrainPositionEngine.calculatePosition(agedStatus, sampleGeometry);

    expect(result.method).toBe('dead_reckoning');
    expect(result.confidence).toBe('cached');
    expect(result.estimatedSegmentProgress).toBeGreaterThan(sampleLiveStatus.segmentProgress);
  });

  it('falls back to station coordinates when geometry is unavailable', () => {
    const result = TrainPositionEngine.calculatePosition(sampleLiveStatus, null);

    expect(result.method).toBe('station_fallback');
    expect(result.confidence).toBe('estimated');
    expect(result.position.lat).toBeGreaterThan(17.0);
    expect(result.position.lng).toBeGreaterThan(78.0);
  });

  it('preserves exact GPS telemetry when provided directly', () => {
    const gpsStatus = {
      ...sampleLiveStatus,
      currentPosition: { lat: 17.9784, lng: 79.5222 },
      observedAt: new Date().toISOString(),
    };

    const result = TrainPositionEngine.calculatePosition(gpsStatus, sampleGeometry);

    expect(result.method).toBe('exact_gps');
    expect(result.position).toEqual({ lat: 17.9784, lng: 79.5222 });
    expect(result.confidence).toBe('live');
  });
});
