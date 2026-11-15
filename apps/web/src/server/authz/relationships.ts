import { AppError } from '@/lib/errors';
import { listVerifiedJourneyIds } from '@/server/authz/membership';
import { getStore } from '@/server/store';

export async function usersShareVerifiedJourney(
  userA: string,
  userB: string,
): Promise<string | null> {
  const [journeysA, journeysB] = await Promise.all([
    listVerifiedJourneyIds(userA),
    listVerifiedJourneyIds(userB),
  ]);

  const setB = new Set(journeysB);
  for (const journeyId of journeysA) {
    if (setB.has(journeyId)) {
      return journeyId;
    }
  }
  return null;
}

export async function assertNotBlocked(a: string, b: string): Promise<void> {
  const store = getStore();
  const blocked = await store.isBlockedEitherWay(a, b);
  if (blocked) {
    throw new AppError('forbidden', 'Messaging is blocked between these users');
  }
}

function messagingAllowed(
  policy: string,
  hasSharedJourney: boolean,
): boolean {
  if (policy === 'nobody' || policy === 'disabled') {
    return false;
  }
  return hasSharedJourney;
}

export async function assertCanMessage(senderId: string, recipientId: string): Promise<string> {
  if (senderId === recipientId) {
    throw new AppError('validation', 'Cannot message yourself');
  }

  await assertNotBlocked(senderId, recipientId);

  const sharedJourneyId = await usersShareVerifiedJourney(senderId, recipientId);
  if (!sharedJourneyId) {
    throw new AppError('forbidden', 'Users must share a verified journey to message');
  }

  const store = getStore();
  const recipientProfile = await store.getAnonymousProfile(recipientId);
  if (!recipientProfile) {
    throw new AppError('not_found', 'Recipient not found');
  }

  if (!messagingAllowed(recipientProfile.messagingPolicy, true)) {
    throw new AppError('forbidden', 'Recipient does not accept messages');
  }

  const senderProfile = await store.getAnonymousProfile(senderId);
  if (senderProfile && !messagingAllowed(senderProfile.messagingPolicy, true)) {
    throw new AppError('forbidden', 'Your messaging policy does not allow sending messages');
  }

  return sharedJourneyId;
}
