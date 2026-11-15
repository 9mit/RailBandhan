import { authorHandleForUser } from "@/server/api/serializers";
import { listVerifiedJourneyIds } from "@/server/authz/membership";
import type {
  FeedItem,
  GameSession,
  PostWithReactionCount,
} from "@/server/domain/types";
import { getStore } from "@/server/store";

export interface HomeRecommendations {
  trendingPosts: PostWithReactionCount[];
  activeGames: GameSession[];
  openGameInvites: GameSession[];
}

export async function getHomeRecommendations(
  userId: string,
): Promise<HomeRecommendations> {
  const store = getStore();
  const journeyIds = await listVerifiedJourneyIds(userId);

  const trendingPosts: PostWithReactionCount[] = [];
  const activeGames: GameSession[] = [];
  const openGameInvites: GameSession[] = [];

  for (const journeyId of journeyIds) {
    const communities = await store.listCommunitiesForJourney(journeyId);
    for (const community of communities) {
      const posts = await store.listPostsByCommunity(community.id);
      for (const post of posts) {
        const reactions = await store.listReactionsByPost(post.id);
        trendingPosts.push({
          ...post,
          reactionCount: reactions.length,
          userReacted: reactions.some((r) => r.userId === userId),
        });
      }
    }

    const games = await store.listGamesByJourney(journeyId);
    for (const game of games) {
      if (game.status === "active") {
        activeGames.push(game);
      } else if (game.status === "open" && !game.playerIds.includes(userId)) {
        openGameInvites.push(game);
      }
    }
  }

  trendingPosts.sort((a, b) => b.reactionCount - a.reactionCount);

  return {
    trendingPosts: trendingPosts.slice(0, 10),
    activeGames: activeGames.slice(0, 10),
    openGameInvites: openGameInvites.slice(0, 10),
  };
}

export async function getHomeFeed(userId: string): Promise<FeedItem[]> {
  const store = getStore();
  const recs = await getHomeRecommendations(userId);
  const items: FeedItem[] = [];

  for (const post of recs.trendingPosts) {
    const community = await store.getCommunityById(post.communityId);
    items.push({
      id: post.id,
      kind: "post",
      journeyId: community?.journeyId ?? "",
      title: post.title ?? "Trending post",
      body: post.body,
      authorHandle: await authorHandleForUser(post.authorId),
      createdAt: post.createdAt,
    });
  }

  for (const game of recs.activeGames) {
    items.push({
      id: game.id,
      kind: "game",
      journeyId: game.journeyId,
      title: `${game.kind} game`,
      body: `Status: ${game.status}`,
      authorHandle: await authorHandleForUser(game.hostUserId),
      createdAt: game.createdAt,
    });
  }

  for (const game of recs.openGameInvites) {
    items.push({
      id: game.id,
      kind: "game",
      journeyId: game.journeyId,
      title: `Open ${game.kind} invite`,
      body: "Join now",
      authorHandle: await authorHandleForUser(game.hostUserId),
      createdAt: game.createdAt,
    });
  }

  return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
