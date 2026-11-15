import { requireVerifiedMembership } from "@/server/authz/membership";
import { getStore } from "@/server/store";

export interface PassengerCard {
  userId: string;
  publicHandle: string;
  avatarUrl: string | null;
  bio: string | null;
  reputation: number;
  badgeCount: number;
  online: boolean | null;
}

export async function listPassengers(
  userId: string,
  journeyId: string,
): Promise<PassengerCard[]> {
  await requireVerifiedMembership(userId, journeyId);

  const store = getStore();
  const members = await store.listJourneyMembersByJourney(journeyId);
  const now = Date.now();

  const verifiedUserIds = members
    .filter(
      (m) =>
        m.status === "verified" &&
        new Date(m.expiresAt).getTime() >= now &&
        m.userId !== userId,
    )
    .map((m) => m.userId);

  const profiles = await store.getAnonymousProfilesByUserIds(verifiedUserIds);
  const cards: PassengerCard[] = [];
  const blocked = new Set(
    (await store.listBlocksInvolving(userId))
      .flatMap((b) => [b.blockerId, b.blockedId])
      .filter((id) => id !== userId),
  );

  for (const profile of profiles) {
    if (!profile.discoveryVisible || blocked.has(profile.userId)) {
      continue;
    }

    const badges = await store.listBadges(profile.userId);
    cards.push({
      userId: profile.userId,
      publicHandle: profile.publicHandle,
      avatarUrl: profile.avatarUrl,
      bio: profile.bio,
      reputation: profile.reputation,
      badgeCount: badges.length,
      online: null,
    });
  }

  return cards.sort((a, b) => b.reputation - a.reputation);
}

export const listJourneyPassengers = listPassengers;
