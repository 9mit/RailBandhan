import { describe, it, expect, beforeEach } from 'vitest';
import { createUser } from '@/server/auth/session';
import { createManualJourney, getJourneyForUser } from '@/server/journeys/service';
import { createPost, listPosts } from '@/server/community/service';
import { sendMessage, listMessages } from '@/server/chat/service';
import { createGame, listGames } from '@/server/games/engine';
import { listPassengers } from '@/server/discovery/service';
import { getStore, resetStore } from '@/server/store';
import { getTestJourneyDate } from './test-utils';

describe('Cross-Journey Security & Adversarial Isolation', () => {
  beforeEach(() => {
    resetStore();
  });

  it('blocks User A on Train A from accessing, viewing, posting, chatting, or playing in Train B', async () => {
    // 1. Create two separate users
    const userA = await createUser('passenger_a@railbandhan.in', 'Password1234!');
    const userB = await createUser('passenger_b@railbandhan.in', 'Password1234!');
    const testDate = getTestJourneyDate();

    // 2. User A joins Telangana Express (12723) from SC to NDLS
    const journeyA = await createManualJourney(userA.id, {
      trainNumber: '12723',
      journeyDate: testDate,
      fromCode: 'SC',
      toCode: 'NDLS',
    });

    // 3. User B joins Mumbai Rajdhani (12951) from BCT to NDLS
    const journeyB = await createManualJourney(userB.id, {
      trainNumber: '12951',
      journeyDate: testDate,
      fromCode: 'BCT',
      toCode: 'NDLS',
    });

    // --- ATTACK ATTEMPT 1: User A tries to view Journey B details ---
    await expect(getJourneyForUser(userA.id, journeyB.id)).rejects.toThrow(
      "You don't have access to this journey",
    );

    // --- ATTACK ATTEMPT 2: User A tries to list posts in Journey B ---
    const store = getStore();
    const communityB = await store.getTrainWideCommunity(journeyB.id);
    const communityBId = communityB?.id ?? journeyB.id;
    await expect(listPosts(userA.id, communityBId)).rejects.toThrow();

    // --- ATTACK ATTEMPT 3: User A tries to create a post in Journey B ---
    await expect(
      createPost({
        userId: userA.id,
        communityId: communityBId,
        postType: 'discussion',
        body: 'Malicious cross-journey post',
      }),
    ).rejects.toThrow();

    // --- ATTACK ATTEMPT 4: User A tries to read chat messages in Journey B ---
    await expect(listMessages(userA.id, journeyB.id)).rejects.toThrow();

    // --- ATTACK ATTEMPT 5: User A tries to send chat messages to Journey B ---
    await expect(
      sendMessage({
        userId: userA.id,
        journeyId: journeyB.id,
        body: 'Spam in Journey B chat',
      }),
    ).rejects.toThrow();

    // --- ATTACK ATTEMPT 6: User A tries to list or create games in Journey B ---
    await expect(listGames(userA.id, journeyB.id)).rejects.toThrow();
    await expect(createGame(userA.id, journeyB.id, 'tic_tac_toe')).rejects.toThrow();

    // --- ATTACK ATTEMPT 7: User A tries to discover passengers in Journey B ---
    await expect(listPassengers(userA.id, journeyB.id)).rejects.toThrow();
  });
});
