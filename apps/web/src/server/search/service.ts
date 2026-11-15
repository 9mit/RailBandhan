import { listVerifiedJourneyIds } from "@/server/authz/membership";
import type { PostWithReactionCount } from "@/server/domain/types";
import { getStore } from "@/server/store";
import { cosineSimilarity, createEmbedding } from "./embeddings";

export interface SearchPostsInput {
  userId: string;
  query: string;
  journeyId?: string;
  limit?: number;
}

export interface SearchPostResult {
  post: PostWithReactionCount;
  ftsScore: number;
  semanticScore: number;
  hybridScore: number;
}

export async function searchCommunityPosts(
  input: SearchPostsInput,
): Promise<SearchPostResult[]> {
  const query = input.query.trim();
  if (!query) {
    return [];
  }

  const store = getStore();
  const verifiedJourneyIds = await listVerifiedJourneyIds(input.userId);
  const targetJourneyIds = input.journeyId
    ? [input.journeyId]
    : verifiedJourneyIds;

  // 1. Gather all posts within user's verified journeys
  const allCandidatePosts: PostWithReactionCount[] = [];
  for (const jId of targetJourneyIds) {
    const communities = await store.listCommunitiesForJourney(jId);
    for (const comm of communities) {
      const posts = await store.listPostsByCommunity(comm.id);
      for (const p of posts) {
        if (p.deletedAt) continue;
        const reactions = await store.listReactionsByPost(p.id);
        allCandidatePosts.push({
          ...p,
          reactionCount: reactions.length,
          userReacted: reactions.some((r) => r.userId === input.userId),
        });
      }
    }
  }

  if (allCandidatePosts.length === 0) {
    return [];
  }

  // 2. Compute FTS score (token matching)
  const queryTokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  const queryEmbedding = await createEmbedding(query);

  const results: SearchPostResult[] = [];
  for (const post of allCandidatePosts) {
    const content = `${post.title ?? ""} ${post.body}`.toLowerCase();
    let matches = 0;
    for (const token of queryTokens) {
      if (content.includes(token)) {
        matches += 1;
      }
    }
    const ftsScore = queryTokens.length > 0 ? matches / queryTokens.length : 0;

    // Generate/compare embedding
    const postEmbedding = await createEmbedding(post.body);
    const semanticScore = cosineSimilarity(queryEmbedding, postEmbedding);

    // Reciprocal Rank Fusion / Weighted Hybrid Ranking
    const hybridScore = 0.4 * ftsScore + 0.6 * semanticScore;

    if (hybridScore > 0.1 || ftsScore > 0) {
      results.push({
        post,
        ftsScore: Number(ftsScore.toFixed(3)),
        semanticScore: Number(semanticScore.toFixed(3)),
        hybridScore: Number(hybridScore.toFixed(3)),
      });
    }
  }

  results.sort((a, b) => b.hybridScore - a.hybridScore);
  const limit = input.limit ?? 20;
  return results.slice(0, limit);
}
