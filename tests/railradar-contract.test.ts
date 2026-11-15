import { describe, it, expect } from 'vitest';
import { RailwayDataNormalizer } from '@/server/railway/normalizer';
import { RailRadarProvider } from '@/server/railway/providers/railradar';

describe('RailRadar Provider Contract & Data Normalization', () => {
  it('normalizes a full valid RailRadar live telemetry payload', () => {
    const rawRailRadarResponse = {
      success: true,
      meta: {
        timestamp: '2026-08-23T10:30:00.000Z',
        traceId: 'rr-trace-12345',
        executionTimeMs: 42,
      },
      data: {
        trainNumber: '12723',
        trainName: 'Telangana Express',
        status: 'running',
        delayMinutes: 18,
        speedKmh: 82,
        bearingDegrees: 135,
        segmentProgress: 0.65,
        currentStopIndex: 2,
        currentPosition: { lat: 17.9689, lng: 79.5941 },
        stations: [
          {
            stopIndex: 0,
            stationCode: 'SC',
            stationName: 'Secunderabad Junction',
            scheduledArrival: null,
            scheduledDeparture: '2026-08-23T06:00:00.000Z',
            delayMinutes: 0,
            distanceKm: 0,
            platform: '1',
          },
          {
            stopIndex: 1,
            stationCode: 'KZJ',
            stationName: 'Kazipet Junction',
            scheduledArrival: '2026-08-23T08:03:00.000Z',
            scheduledDeparture: '2026-08-23T08:05:00.000Z',
            delayMinutes: 5,
            distanceKm: 132,
            platform: '2',
          },
          {
            stopIndex: 2,
            stationCode: 'WL',
            stationName: 'Warangal',
            scheduledArrival: '2026-08-23T08:18:00.000Z',
            scheduledDeparture: '2026-08-23T08:20:00.000Z',
            delayMinutes: 18,
            distanceKm: 142,
            platform: '3',
          },
          {
            stopIndex: 3,
            stationCode: 'NDLS',
            stationName: 'New Delhi',
            scheduledArrival: '2026-08-24T07:40:00.000Z',
            scheduledDeparture: null,
            delayMinutes: 0,
            distanceKm: 1677,
            platform: '5',
          },
        ],
      },
    };

    const normalized = RailwayDataNormalizer.normalizeLiveTelemetry(
      rawRailRadarResponse,
      'RailRadar',
      rawRailRadarResponse.meta.timestamp,
    );

    expect(normalized.trainNumber).toBe('12723');
    expect(normalized.trainName).toBe('Telangana Express');
    expect(normalized.delayMinutes).toBe(18);
    expect(normalized.status).toBe('delayed');
    expect(normalized.speedKmh).toBe(82);
    expect(normalized.bearingDegrees).toBe(135);
    expect(normalized.segmentProgress).toBe(0.65);
    expect(normalized.currentStationCode).toBe('WL');
    expect(normalized.nextStationCode).toBe('NDLS');
    expect(normalized.currentPosition).toEqual({ lat: 17.9689, lng: 79.5941 });
    expect(normalized.stations.length).toBe(4);
    expect(normalized.stations[0].passed).toBe(true);
    expect(normalized.stations[1].passed).toBe(true);
    expect(normalized.stations[2].passed).toBe(false);
  });

  it('correctly captures operational exceptions such as diversions and cancellations', () => {
    const divertedPayload = {
      trainNumber: '12951',
      trainName: 'Mumbai Rajdhani Express',
      isDiverted: true,
      divertedVia: ['KOTA', 'SWM', 'MTJ'],
      operationalNotice: 'Diverted due to track maintenance between RTM and KOTA',
      delayMinutes: 45,
      currentStopIndex: 1,
      stations: [
        { stationCode: 'BCT', distanceKm: 0 },
        { stationCode: 'BRC', distanceKm: 393 },
        { stationCode: 'NDLS', distanceKm: 1386 },
      ],
    };

    const normalized = RailwayDataNormalizer.normalizeLiveTelemetry(divertedPayload, 'RailRadar');
    expect(normalized.status).toBe('diverted');
    expect(normalized.exception?.isDiverted).toBe(true);
    expect(normalized.exception?.divertedViaStations).toContain('KOTA');
    expect(normalized.exception?.notice).toContain('track maintenance');
  });

  it('rejects invalid or empty payloads without throwing unhandled crashes', () => {
    expect(() => {
      RailwayDataNormalizer.normalizeLiveTelemetry(null, 'RailRadar');
    }).toThrow('Invalid provider payload');

    expect(() => {
      RailwayDataNormalizer.normalizeLiveTelemetry({}, 'RailRadar');
    }).toThrow('Missing train number');
  });

  it('sanitizes coordinates and bounds check to valid geographical boundaries in India', () => {
    const payloadWithOutOfBoundsCoords = {
      trainNumber: '12723',
      currentPosition: { lat: 150.0, lng: -200.0 }, // completely invalid coordinates
      stations: [
        { stationCode: 'SC', lat: 17.4334, lng: 78.5045 },
        { stationCode: 'NDLS', lat: 99.0, lng: 200.0 }, // invalid
      ],
    };

    const normalized = RailwayDataNormalizer.normalizeLiveTelemetry(payloadWithOutOfBoundsCoords, 'RailRadar');
    // Out-of-bounds current position must be rejected (sanitized to null)
    expect(normalized.currentPosition).toBeNull();
    // Valid station coords preserved
    expect(normalized.stations[0].coordinates).toBeDefined();
    // Invalid station coords rejected
    expect(normalized.stations[1].coordinates).toBeUndefined();
  });
});
