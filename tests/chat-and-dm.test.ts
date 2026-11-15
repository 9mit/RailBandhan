import { describe, it, expect, beforeEach } from 'vitest';
import { createUser } from '@/server/auth/session';
import { completeOnboarding } from '@/server/profiles/service';
import { createManualJourney } from '@/server/journeys/service';
import { sendMessage, listMessages } from '@/server/chat/service';
import {
  startConversation,
  sendDirectMessage,
  getConversationMessages,
  listMyConversations,
} from '@/server/dm/service';
import { blockUser } from '@/server/moderation/service';
import { getStore, resetStore } from '@/server/store';
import { getTestJourneyDate } from './test-utils';

describe('Train Lounge Chat & 1-on-1 Direct Messaging', () => {
  beforeEach(() => {
    resetStore();
  });

  it('allows co-passengers on the same train to participate in live train chat', async () => {
    const user1 = await createUser('chat_user1@railbandhan.in', 'Password1234!');
    const user2 = await createUser('chat_user2@railbandhan.in', 'Password1234!');
    const testDate = getTestJourneyDate();

    await completeOnboarding({
      userId: user1.id,
      realName: 'Passenger One',
      publicHandle: 'Passenger_Pilot1',
    });
    await completeOnboarding({
      userId: user2.id,
      realName: 'Passenger Two',
      publicHandle: 'Passenger_Pilot2',
    });

    const journey = await createManualJourney(user1.id, {
      trainNumber: '12723',
      journeyDate: testDate,
      fromCode: 'SC',
      toCode: 'NDLS',
    });

    // User 2 joins same train
    await createManualJourney(user2.id, {
      trainNumber: '12723',
      journeyDate: testDate,
      fromCode: 'SC',
      toCode: 'NDLS',
    });

    // User 1 sends message
    await sendMessage({
      userId: user1.id,
      journeyId: journey.id,
      body: 'Hello fellow passengers!',
    });

    // User 2 reads messages
    const messages = await listMessages(user2.id, journey.id);
    expect(messages.length).toBe(1);
    expect(messages[0].body).toBe('Hello fellow passengers!');
  });

  it('allows co-passengers to start direct conversations and enforces blocking', async () => {
    const user1 = await createUser('dm_user1@railbandhan.in', 'Password1234!');
    const user2 = await createUser('dm_user2@railbandhan.in', 'Password1234!');
    const testDate = getTestJourneyDate();

    await completeOnboarding({
      userId: user1.id,
      realName: 'Passenger Alpha',
      publicHandle: 'Passenger_Alpha99',
    });
    await completeOnboarding({
      userId: user2.id,
      realName: 'Passenger Beta',
      publicHandle: 'Passenger_Beta88',
    });

    const journey = await createManualJourney(user1.id, {
      trainNumber: '12723',
      journeyDate: testDate,
      fromCode: 'SC',
      toCode: 'NDLS',
    });
    await createManualJourney(user2.id, {
      trainNumber: '12723',
      journeyDate: testDate,
      fromCode: 'SC',
      toCode: 'NDLS',
    });

    // User 1 starts DM with User 2
    const startResult = await startConversation({
      userId: user1.id,
      recipientHandle: 'Passenger_Beta88',
      journeyId: journey.id,
      body: 'Would you like to play chess?',
    });

    const conv = 'conversation' in startResult ? startResult.conversation : startResult;
    expect(conv.id).toBeDefined();

    // User 2 replies
    await sendDirectMessage(user2.id, conv.id, 'Sure, let’s do it!');

    const thread = await getConversationMessages(user1.id, conv.id);
    expect(thread.length).toBe(2);

    const { serializeDmMessage, serializeConversation } = await import('@/server/api/serializers');
    const serializedMsg = serializeDmMessage(thread[0], 'Passenger_Alpha99');
    expect(serializedMsg.author_handle).toBe('Passenger_Alpha99');
    expect(serializedMsg.sender_handle).toBe('Passenger_Alpha99');

    const serializedConv = serializeConversation(conv as any, 'Passenger_Beta88');
    expect(serializedConv.other_handle).toBe('Passenger_Beta88');
    expect(serializedConv.other_participant_handle).toBe('Passenger_Beta88');

    // User 2 blocks User 1
    await blockUser(user2.id, user1.id);

    // User 1 attempts to send another DM -> Blocked
    await expect(
      sendDirectMessage(user1.id, conv.id, 'Are you still there?'),
    ).rejects.toThrow('Messaging is blocked between these users');
  });
});
