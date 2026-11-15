import { describe, it, expect, beforeEach } from 'vitest';
import { createUser } from '@/server/auth/session';
import { completeOnboarding } from '@/server/profiles/service';
import { createManualJourney } from '@/server/journeys/service';
import {
  createPost,
  listPosts,
  deletePost,
  createComment,
} from '@/server/community/service';
import { createPoll, votePoll } from '@/server/polls/service';
import {
  startConversation,
  sendDirectMessage,
  getConversationMessages,
} from '@/server/dm/service';
import { blockUser } from '@/server/moderation/service';
import { getStore, resetStore } from '@/server/store';
import { getTestJourneyDate } from './test-utils';

describe('Adversarial E2E Security & Segment Isolation Matrix', () => {
  beforeEach(() => {
    resetStore();
  });

  it('enforces rigorous adversarial security boundaries across users, journeys, and permissions', async () => {
    // 1. Setup Role Matrix: USER_A, USER_B, USER_C, ATTACKER, MODERATOR
    const userA = await createUser('user_a@railbandhan.in', 'Password1234!');
    const userB = await createUser('user_b@railbandhan.in', 'Password1234!');
    const userC = await createUser('user_c@railbandhan.in', 'Password1234!');
    const attacker = await createUser('attacker@railbandhan.in', 'Password1234!');
    const moderator = await createUser('moderator@railbandhan.in', 'Password1234!');

    const store = getStore();
    await store.setAuthUserRole(moderator.id, 'moderator');

    await completeOnboarding({
      userId: userA.id,
      realName: 'Alice Passenger',
      publicHandle: 'Passenger_Alice',
    });
    await completeOnboarding({
      userId: userB.id,
      realName: 'Bob Passenger',
      publicHandle: 'Passenger_Bob',
    });
    await completeOnboarding({
      userId: userC.id,
      realName: 'Charlie Passenger',
      publicHandle: 'Passenger_Charlie',
    });
    await completeOnboarding({
      userId: attacker.id,
      realName: 'Attacker Malory',
      publicHandle: 'Passenger_Attacker',
    });

    // 2. Setup Journeys
    const testDate = getTestJourneyDate();

    // Journey A: Telangana Express (12723) from SC to NGP
    const journeyA = await createManualJourney(userA.id, {
      trainNumber: '12723',
      journeyDate: testDate,
      fromCode: 'SC',
      toCode: 'NGP',
    });

    // User B joins same Train Journey (12723:testDate:SC:NGP)
    await createManualJourney(userB.id, {
      trainNumber: '12723',
      journeyDate: testDate,
      fromCode: 'SC',
      toCode: 'NGP',
    });

    // Journey Rajdhani: Mumbai Rajdhani (12951) from BCT to NDLS
    await createManualJourney(userC.id, {
      trainNumber: '12951',
      journeyDate: testDate,
      fromCode: 'BCT',
      toCode: 'NDLS',
    });

    const communityA = await store.getTrainWideCommunity(journeyA.id);
    expect(communityA).not.toBeNull();
    const communityAId = communityA!.id;

    // Attacker joins NO journeys or is on a totally different journey
    // =========================================================================
    // ADVERSARIAL TEST 1: Attacker attempts to list/create posts in Journey A
    // =========================================================================
    await expect(listPosts(attacker.id, communityAId)).rejects.toThrow();
    await expect(
      createPost({
        userId: attacker.id,
        communityId: communityAId,
        postType: 'discussion',
        body: 'Attacker injected post',
      }),
    ).rejects.toThrow();

    // =========================================================================
    // ADVERSARIAL TEST 2: User A creates a post, Attacker tries to delete it
    // =========================================================================
    const postA = await createPost({
      userId: userA.id,
      communityId: communityAId,
      postType: 'discussion',
      body: 'Welcome to Telangana Express! Chai meetup at Bhopal?',
    });
    expect(postA.id).toBeDefined();

    // Attacker attempts unauthorized deletion -> Denied
    await expect(deletePost(attacker.id, postA.id)).rejects.toThrow();

    // User B (co-passenger) tries to delete User A's post -> Denied
    await expect(deletePost(userB.id, postA.id)).rejects.toThrow();

    // =========================================================================
    // ADVERSARIAL TEST 3: User B comments on User A's post, Attacker cannot
    // =========================================================================
    const commentB = await createComment({
      userId: userB.id,
      postId: postA.id,
      body: 'Count me in for chai!',
    });
    expect(commentB.id).toBeDefined();

    await expect(
      createComment({
        userId: attacker.id,
        postId: postA.id,
        body: 'Spam from outside',
      }),
    ).rejects.toThrow();

    // =========================================================================
    // ADVERSARIAL TEST 4: Poll duplicate voting and unauthorized voting
    // =========================================================================
    const poll = await createPoll({
      userId: userA.id,
      journeyId: journeyA.id,
      question: 'What time is dinner?',
      options: ['8:00 PM', '8:30 PM', '9:00 PM'],
    });

    const optId = poll.options[0].id;

    // User B votes
    const votedPoll = await votePoll(userB.id, poll.id, optId);
    expect(votedPoll.options[0].votes).toContain(userB.id);

    // User B votes again on different option -> changes vote
    const revote = await votePoll(userB.id, poll.id, poll.options[1].id);
    expect(revote.options[1].votes).toContain(userB.id);
    expect(revote.options[0].votes).not.toContain(userB.id);

    // Attacker attempts to vote on Journey A's poll -> Denied
    await expect(votePoll(attacker.id, poll.id, optId)).rejects.toThrow();

    // =========================================================================
    // ADVERSARIAL TEST 5: Direct message hijacking & blocking bypass
    // =========================================================================
    const convResult = await startConversation({
      userId: userA.id,
      recipientHandle: 'Passenger_Bob',
      journeyId: journeyA.id,
      body: 'Hey Bob, see you at coach B2.',
    });

    const conv = 'conversation' in convResult ? convResult.conversation : convResult;

    // Attacker tries to read messages between Alice and Bob -> Denied
    await expect(getConversationMessages(attacker.id, conv.id)).rejects.toThrow();

    // Attacker tries to inject message into Alice and Bob's conversation -> Denied
    await expect(
      sendDirectMessage(attacker.id, conv.id, 'Phishing message'),
    ).rejects.toThrow();

    // Bob blocks Alice
    await blockUser(userB.id, userA.id);

    // Alice tries to message Bob after being blocked -> Denied
    await expect(
      sendDirectMessage(userA.id, conv.id, 'Are you there Bob?'),
    ).rejects.toThrow('Messaging is blocked between these users');

    // =========================================================================
    // ADVERSARIAL TEST 6: Author or Moderator can delete posts
    // =========================================================================
    await deletePost(userA.id, postA.id);
    const postAfterDeletion = await store.getPostById(postA.id);
    expect(postAfterDeletion?.deletedAt).not.toBeNull();
  });
});
