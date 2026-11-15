import { AppError } from '@/lib/errors';
import type { Journey } from '@/server/domain/types';
import { getStore } from '@/server/store';

export async function requireVerifiedMembership(
  userId: string,
  journeyId: string,
): Promise<void> {
  const store = getStore();
  const member = await store.getJourneyMember(userId, journeyId);

  if (!member || member.status !== 'verified') {
    throw new AppError('forbidden', 'Verified journey membership required');
  }

  if (new Date(member.expiresAt).getTime() < Date.now()) {
    throw new AppError('forbidden', 'Journey membership has expired');
  }
}

export async function listVerifiedJourneyIds(userId: string): Promise<string[]> {
  const store = getStore();
  const members = await store.listJourneyMembersByUser(userId);
  const now = Date.now();

  return members
    .filter((m) => m.status === 'verified' && new Date(m.expiresAt).getTime() >= now)
    .map((m) => m.journeyId);
}

export async function assertCanAccessJourney(userId: string, journey: Journey): Promise<void> {
  await requireVerifiedMembership(userId, journey.id);
}

