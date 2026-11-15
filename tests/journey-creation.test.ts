import { describe, it, expect, beforeEach } from 'vitest';
import { createUser } from '@/server/auth/session';
import {
  createManualJourney,
  getJourneyForUser,
  listMyJourneys,
  normalizeJourneyKey,
} from '@/server/journeys/service';
import { resetStore } from '@/server/store';
import { getTestJourneyDate } from './test-utils';

describe('Journey Creation & Route Validation', () => {
  beforeEach(() => {
    resetStore();
  });

  it('normalizes journey keys consistently', () => {
    const testDate = getTestJourneyDate();
    const key1 = normalizeJourneyKey('12723', testDate, 'SC', 'NDLS');
    const key2 = normalizeJourneyKey(' 12723 ', testDate, 'sc', 'ndls');
    expect(key1).toBe(`12723:${testDate}:SC:NDLS`);
    expect(key2).toBe(`12723:${testDate}:SC:NDLS`);
  });

  it('successfully creates a valid manual journey with train and route stops', async () => {
    const user = await createUser('rail_fan@railbandhan.in', 'Password1234!');
    const testDate = getTestJourneyDate();

    const journey = await createManualJourney(user.id, {
      trainNumber: '12723',
      journeyDate: testDate,
      fromCode: 'SC',
      toCode: 'NDLS',
    });

    expect(journey.id).toBeDefined();
    expect(journey.train?.number).toBe('12723');
    expect(journey.boardingStation?.code).toBe('SC');
    expect(journey.destinationStation?.code).toBe('NDLS');

    const fetched = await getJourneyForUser(user.id, journey.id);
    expect(fetched.id).toBe(journey.id);

    const myJourneys = await listMyJourneys(user.id);
    expect(myJourneys.length).toBe(1);
    expect(myJourneys[0].id).toBe(journey.id);
  });

  it('rejects invalid train numbers', async () => {
    const user = await createUser('invalid_train@railbandhan.in', 'Password1234!');

    await expect(
      createManualJourney(user.id, {
        trainNumber: '99999',
        journeyDate: '2026-08-20',
        fromCode: 'SC',
        toCode: 'NDLS',
      }),
    ).rejects.toThrow('Unknown train number');
  });

  it('rejects identical boarding and destination stations', async () => {
    const user = await createUser('same_station@railbandhan.in', 'Password1234!');

    await expect(
      createManualJourney(user.id, {
        trainNumber: '12723',
        journeyDate: '2026-08-20',
        fromCode: 'NDLS',
        toCode: 'NDLS',
      }),
    ).rejects.toThrow('must differ');
  });

  it('rejects reverse-order stations not following the train route', async () => {
    const user = await createUser('reverse_station@railbandhan.in', 'Password1234!');

    await expect(
      createManualJourney(user.id, {
        trainNumber: '12723',
        journeyDate: '2026-08-20',
        fromCode: 'NDLS',
        toCode: 'SC',
      }),
    ).rejects.toThrow('Destination must be after boarding station on route');
  });
});
