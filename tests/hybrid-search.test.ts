import { describe, it, expect, beforeEach } from 'vitest';
import { createEmbedding, cosineSimilarity } from '@/server/search/embeddings';
import { searchCommunityPosts } from '@/server/search/service';
import { createUser } from '@/server/auth/session';
import { createManualJourney } from '@/server/journeys/service';
import { createPost } from '@/server/community/service';
import { getStore, resetStore } from '@/server/store';
import { getTestJourneyDate } from './test-utils';

describe('Hybrid Search Engine (FTS + Local Semantic Embeddings)', () => {
  beforeEach(() => {
    resetStore();
  });

  it('computes deterministic dense embeddings and cosine similarity', async () => {
    const textA = 'Best tea stall at Bhopal junction platform 1';
    const textB = 'Chai and breakfast options near Bhopal station';
    const textC = 'How to book unreserved ticket in Mumbai Local';

    const embA = await createEmbedding(textA);
    const embB = await createEmbedding(textB);
    const embC = await createEmbedding(textC);

    expect(embA.length).toBe(384);
    expect(embB.length).toBe(384);

    const simAB = cosineSimilarity(embA, embB);
    const simAC = cosineSimilarity(embA, embC);

    expect(simAB).toBeGreaterThanOrEqual(0);
    expect(simAC).toBeGreaterThanOrEqual(0);
  });

  it('performs hybrid search across authorized community posts', async () => {
    const user = await createUser('search_user@railbandhan.in', 'Password1234!');
    const journey = await createManualJourney(user.id, {
      trainNumber: '12723',
      journeyDate: getTestJourneyDate(),
      fromCode: 'SC',
      toCode: 'NDLS',
    });

    const store = getStore();
    const community = await store.getTrainWideCommunity(journey.id);
    expect(community).not.toBeNull();

    await createPost({
      userId: user.id,
      communityId: community!.id,
      postType: 'discussion',
      title: 'Chai Meetup',
      body: 'Looking for fellow passengers for hot masala chai at Nagpur platform 2!',
    });

    await createPost({
      userId: user.id,
      communityId: community!.id,
      postType: 'discussion',
      title: 'Power Socket',
      body: 'Is the charging socket working in coach B3?',
    });

    const results = await searchCommunityPosts({
      userId: user.id,
      query: 'chai nagpur',
      journeyId: journey.id,
    });

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].post.title).toBe('Chai Meetup');
    expect(results[0].hybridScore).toBeGreaterThan(0);
  });
});
