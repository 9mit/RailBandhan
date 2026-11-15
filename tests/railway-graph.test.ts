import { describe, it, expect } from 'vitest';
import { RailwayGraph } from '@/server/railway/graph';
import { normalizeStationInput, levenshteinDistance } from '@/server/railway/stations';
import { OpenDataRailwayRepository } from '@/server/railway/repository';

describe('Deterministic Railway Graph & Station Normalization Engine', () => {
  it('correctly retrieves canonical train route and validates station stop order', () => {
    const route = RailwayGraph.getRoute('12723');
    expect(route).not.toBeNull();
    expect(route?.trainName).toBe('Telangana Express');
    expect(route?.stops.length).toBe(16);

    const validation = RailwayGraph.validateRoute('12723', 'SC', 'NDLS');
    expect(validation.boardingStop.stationCode).toBe('SC');
    expect(validation.destinationStop.stationCode).toBe('NDLS');
    expect(validation.boardingStop.stopIndex).toBe(0);
    expect(validation.destinationStop.stopIndex).toBe(15);
  });

  it('rejects invalid or out-of-order route queries', () => {
    // Reverse direction
    expect(() => RailwayGraph.validateRoute('12723', 'NDLS', 'SC')).toThrow(
      'Destination must be after boarding station on route',
    );

    // Identical boarding and destination
    expect(() => RailwayGraph.validateRoute('12723', 'SC', 'SC')).toThrow(
      'Boarding and destination stations must differ',
    );

    // Station not on route
    expect(() => RailwayGraph.validateRoute('12723', 'SC', 'CSMT')).toThrow(
      'does not stop at CSMT',
    );
  });

  it('accurately computes deterministic segment overlap matrix', () => {
    // Passenger A travels from Stop 0 (SC) to Stop 9 (NGP)
    // Community Segment 1: Stop 1 (KZJ) to Stop 2 (WL) -> Overlaps
    expect(RailwayGraph.doSegmentsOverlap(0, 9, 1, 2)).toBe(true);

    // Community Segment 2: Stop 9 (NGP) to Stop 15 (NDLS) -> Does NOT overlap (endpoint boundary)
    expect(RailwayGraph.doSegmentsOverlap(0, 9, 9, 15)).toBe(false);

    // Community Segment 3: Stop 10 (BPL) to Stop 15 (NDLS) -> Completely outside
    expect(RailwayGraph.doSegmentsOverlap(0, 9, 10, 15)).toBe(false);

    // Passenger B travels from Stop 10 (BPL) to Stop 15 (NDLS) -> Overlaps Segment 3
    expect(RailwayGraph.doSegmentsOverlap(10, 15, 10, 15)).toBe(true);
  });

  it('normalizes station names, aliases, and handles OCR typos with Levenshtein distance', () => {
    // Exact code
    expect(normalizeStationInput('SC')?.code).toBe('SC');
    expect(normalizeStationInput('NDLS')?.code).toBe('NDLS');

    // Full name and alias
    expect(normalizeStationInput('Secunderabad')?.code).toBe('SC');
    expect(normalizeStationInput('New Delhi')?.code).toBe('NDLS');
    expect(normalizeStationInput('BOMBAY CENTRAL')?.code).toBe('BCT');

    // Minor typo / OCR noise (Levenshtein)
    expect(normalizeStationInput('SECUNDERBD')?.code).toBe('SC');
    expect(normalizeStationInput('NEW DELH1')?.code).toBe('NDLS');
    expect(normalizeStationInput('KAZIPET JN')?.code).toBe('KZJ');
  });

  it('calculates journey progress and distance remaining accurately', () => {
    // Boarding at 0km, Destination at 1000km, Current at 450km
    const progress = RailwayGraph.calculateProgress(0, 1000, 450);
    expect(progress.progressPercent).toBe(45);
    expect(progress.distanceRemainingKm).toBe(550);

    // Beyond destination
    const completed = RailwayGraph.calculateProgress(0, 1000, 1050);
    expect(completed.progressPercent).toBe(100);
    expect(completed.distanceRemainingKm).toBe(0);
  });

  it('retrieves full train schedule via OpenDataRailwayRepository', async () => {
    const repo = new OpenDataRailwayRepository();
    const train = await repo.getTrain('12951');
    expect(train).not.toBeNull();
    expect(train?.name).toBe('Mumbai Rajdhani Express');
    expect(train?.origin.code).toBe('BCT');
    expect(train?.destination.code).toBe('NDLS');

    const live = await repo.getLiveStatus('12951', '2026-08-20');
    expect(live).not.toBeNull();
    expect(live?.trainNumber).toBe('12951');
    expect(live?.status).toBe('on_time');
  });
});
