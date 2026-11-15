import { describe, it, expect } from 'vitest';
import { DeterministicRailwayProvider } from '@/server/railway/providers/deterministic';
import { OpenDataRailwayProvider } from '@/server/railway/providers/opendata';
import { MockRailwayProvider } from '@/server/railway/providers/mock';
import { ETAEngine } from '@/server/railway/eta-engine';
import { getTestJourneyDate } from './test-utils';

describe('Railway Intelligence Benchmark & Multi-Provider Evaluation', () => {
  const SAMPLE_TRAINS = [
    { number: '12723', name: 'Telangana Express', from: 'SC', to: 'NDLS' },
    { number: '12951', name: 'Mumbai Rajdhani', from: 'BCT', to: 'NDLS' },
  ];

  it('evaluates latency and response integrity across candidate providers', async () => {
    const testDate = getTestJourneyDate();
    const deterministicProvider = new DeterministicRailwayProvider();
    const openDataProvider = new OpenDataRailwayProvider();
    const mockProvider = new MockRailwayProvider();

    // Warm up providers to avoid cold module loading / JIT compilation latency spikes
    await deterministicProvider.getLiveStatus(SAMPLE_TRAINS[0].number, testDate);
    await openDataProvider.getLiveStatus(SAMPLE_TRAINS[0].number, testDate);

    for (const train of SAMPLE_TRAINS) {
      // 1. Deterministic Provider Benchmark
      const startDet = Date.now();
      const detStatus = await deterministicProvider.getLiveStatus(train.number, testDate);
      const detLatency = Date.now() - startDet;

      expect(detStatus).not.toBeNull();
      expect(detStatus!.trainNumber).toBe(train.number);
      expect(detLatency).toBeLessThan(150); // In-memory graph is sub-150ms even under test suite concurrency

      // 2. Open Data Provider Benchmark
      const startOpen = Date.now();
      const openStatus = await openDataProvider.getLiveStatus(train.number, testDate);
      const openLatency = Date.now() - startOpen;

      expect(openStatus).not.toBeNull();
      expect(openStatus!.trainNumber).toBe(train.number);
      expect(openLatency).toBeLessThan(150);

      // 3. Mock Provider Benchmark
      const mockStatus = await mockProvider.getLiveStatus(train.number, testDate);
      expect(mockStatus).not.toBeNull();
      expect(mockStatus!.trainNumber).toBe(train.number);
    }
  });

  it('calculates deterministic ETA with corridor damping and confidence scoring', async () => {
    const testDate = getTestJourneyDate();
    const provider = new DeterministicRailwayProvider();
    const status = (await provider.getLiveStatus('12723', testDate))!;

    // Inject a simulated delay of 30 minutes
    status.delayMinutes = 30;

    const etaResult = ETAEngine.calculateETA(status, 'NDLS');

    expect(etaResult.targetStationCode).toBe('NDLS');
    expect(etaResult.estimatedDelayMinutes).toBeGreaterThanOrEqual(0);
    expect(etaResult.estimatedDelayMinutes).toBeLessThanOrEqual(30);
    expect(etaResult.confidenceScore).toBeGreaterThan(0);
    expect(etaResult.distanceRemainingKm).toBeGreaterThan(0);
  });

  it('extracts structured numerical feature vectors for ML models', async () => {
    const testDate = getTestJourneyDate();
    const provider = new DeterministicRailwayProvider();
    const status = (await provider.getLiveStatus('12723', testDate))!;

    const features = ETAEngine.extractMLFeatures(status, 'NDLS');

    expect(features.trainNumber).toBe('12723');
    expect(typeof features.hourOfDay).toBe('number');
    expect(typeof features.dayOfWeek).toBe('number');
    expect(typeof features.distanceRemainingKm).toBe('number');
    expect(typeof features.stopsRemaining).toBe('number');
  });
});
