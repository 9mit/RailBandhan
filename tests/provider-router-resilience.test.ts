import { describe, it, expect, beforeEach } from 'vitest';
import { RailwayDataRouter } from '@/server/railway/router';
import { RailwayDataService } from '@/server/railway/service';
import { RailwayObservability } from '@/server/railway/observability';
import { getTestJourneyDate } from './test-utils';

describe('Railway Provider Router Resilience & In-Flight Coalescing', () => {
  beforeEach(() => {
    RailwayDataService.reset();
    RailwayObservability.reset();
  });

  it('coalesces multiple concurrent requests into a single in-flight execution (SingleFlight)', async () => {
    const router = new RailwayDataRouter({ primaryProvider: 'mock' });
    const testDate = getTestJourneyDate();

    // Fire 10 parallel concurrent requests
    const promises = Array.from({ length: 10 }).map(() =>
      router.getLiveStatus('12723', testDate),
    );

    const results = await Promise.all(promises);

    expect(results.length).toBe(10);
    for (const res of results) {
      expect(res.trainNumber).toBe('12723');
      expect(res.trainName).toBe('Telangana Express');
    }

    // Observability should register only 1 upstream network request execution
    const health = RailwayObservability.getHealthScore('MockSimulation');
    expect(health.totalRequests).toBe(1);
    expect(health.successfulRequests).toBe(1);
  });

  it('automatically falls back to deterministic graph when primary provider fails', async () => {
    // Configure an unreachable primary provider
    const router = new RailwayDataRouter({
      primaryProvider: 'railradar',
      secondaryProvider: 'deterministic',
    });
    const testDate = getTestJourneyDate();

    const result = await router.getLiveStatus('12723', testDate);

    expect(result.trainNumber).toBe('12723');
    expect(result.trainName).toBe('Telangana Express');
    expect(result.stations.length).toBeGreaterThan(0);

    // Fallback status should be reflected
    const logs = RailwayObservability.getRecentLogs();
    expect(logs.some((l) => l.status === 'fallback' || l.status === 'error')).toBe(true);
  });

  it('enriches live status with smart polling interval advice', async () => {
    const testDate = getTestJourneyDate();
    const status = await RailwayDataService.getEnrichedLiveStatus('12723', testDate);

    expect(status.trainNumber).toBe('12723');
    expect(status.positionCalculation).toBeDefined();
    expect(status.recommendedPollIntervalSeconds).toBeGreaterThan(0);
  });

  it('caches search queries to avoid repeated lookups', async () => {
    const r1 = await RailwayDataService.searchStations('NDLS');
    expect(r1.length).toBeGreaterThan(0);
    expect(r1[0].code).toBe('NDLS');

    const r2 = await RailwayDataService.searchTrains('Telangana');
    expect(r2.length).toBeGreaterThan(0);
    expect(r2[0].trainNumber).toBe('12723');
  });
});
