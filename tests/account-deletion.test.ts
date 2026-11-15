import { describe, it, expect, beforeEach } from 'vitest';
import { createUser } from '@/server/auth/session';
import { completeOnboarding } from '@/server/profiles/service';
import { createManualJourney } from '@/server/journeys/service';
import { sendMessage } from '@/server/chat/service';
import { deleteAccount } from '@/server/account/service';
import { getStore, resetStore } from '@/server/store';
import { getTestJourneyDate } from './test-utils';

describe('Account Deletion & Data Anonymization', () => {
  beforeEach(() => {
    resetStore();
  });

  it('permanently removes personal profile, tickets, and anonymizes posts upon account deletion', async () => {
    const user = await createUser('delete_me@railbandhan.in', 'Password1234!');

    await completeOnboarding({
      userId: user.id,
      realName: 'Private Name',
      publicHandle: 'Passenger_Leaving',
    });

    const journey = await createManualJourney(user.id, {
      trainNumber: '12723',
      journeyDate: getTestJourneyDate(),
      fromCode: 'SC',
      toCode: 'NDLS',
    });

    await sendMessage({
      userId: user.id,
      journeyId: journey.id,
      body: 'My message before leaving',
    });

    const store = getStore();
    expect(await store.getProfile(user.id)).not.toBeNull();
    expect(await store.getAuthUserById(user.id)).not.toBeNull();

    // Perform account deletion
    await deleteAccount(user.id);

    // Auth user and private profile must be purged
    expect(await store.getAuthUserById(user.id)).toBeNull();
    expect(await store.getProfile(user.id)).toBeNull();
    expect(await store.getAnonymousProfile(user.id)).toBeNull();
  });
});
