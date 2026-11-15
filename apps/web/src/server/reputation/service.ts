import type { BadgeCode } from "@/server/domain/types";
import { getStore } from "@/server/store";

const BADGE_META: Record<
  BadgeCode,
  { slug: string; name: string; description: string }
> = {
  first_journey: {
    slug: "first_journey",
    name: "First Journey",
    description: "Joined your first journey",
  },
  frequent_traveller: {
    slug: "frequent_traveller",
    name: "Frequent Traveller",
    description: "Joined 3 or more journeys",
  },
  helpful: {
    slug: "helpful",
    name: "Helpful",
    description: "Earned 20+ reputation",
  },
  ludo_champ: {
    slug: "ludo_champ",
    name: "Game Champ",
    description: "Won a journey game",
  },
  chatty: {
    slug: "chatty",
    name: "Chatty",
    description: "Sent 10+ messages",
  },
  reporter: {
    slug: "reporter",
    name: "Reporter",
    description: "Submitted a moderation report",
  },
};

export async function addReputation(
  userId: string,
  delta: number,
  _reason: string,
): Promise<number> {
  return getStore().incrementReputation(userId, delta);
}

export async function maybeAwardBadges(userId: string): Promise<void> {
  const store = getStore();
  const stats = await store.getReputationStats(userId);
  const checks: Array<[BadgeCode, boolean]> = [
    ["first_journey", stats.journeys >= 1],
    ["frequent_traveller", stats.journeys >= 3],
    ["chatty", stats.messages >= 10],
    ["helpful", stats.reputation >= 20],
    ["reporter", stats.reports >= 1],
  ];

  for (const [badgeCode, earned] of checks) {
    if (earned) {
      await store.awardBadge(userId, badgeCode);
    }
  }
}

export async function getPublicProfileByHandle(handle: string) {
  const store = getStore();
  const profile = await store.getAnonymousProfileByHandle(handle);
  if (!profile) {
    return null;
  }

  const badges = await store.listBadges(profile.userId);
  return {
    public_handle: profile.publicHandle,
    avatar_url: profile.avatarUrl,
    bio: profile.bio,
    reputation: profile.reputation,
    badge_count: badges.length,
  };
}

export async function getUserBadges(userId: string) {
  const store = getStore();
  const badges = await store.listBadges(userId);
  return badges.map((entry) => ({
    badge: BADGE_META[entry.badgeCode],
    earnedAt: entry.earnedAt,
  }));
}
