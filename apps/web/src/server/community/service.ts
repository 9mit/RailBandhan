import { AppError } from "@/lib/errors";
import { requireVerifiedMembership } from "@/server/authz/membership";
import type {
  Comment,
  Post,
  PostWithReactionCount,
} from "@/server/domain/types";
import { addReputation, maybeAwardBadges } from "@/server/reputation/service";
import { getStore } from "@/server/store";

async function getCommunityJourneyId(communityId: string): Promise<string> {
  const store = getStore();
  const community = await store.getCommunityById(communityId);

  if (!community?.journeyId) {
    throw new AppError("not_found", "Community not found");
  }

  return community.journeyId;
}

export async function listPosts(
  userId: string,
  communityId: string,
): Promise<PostWithReactionCount[]> {
  const journeyId = await getCommunityJourneyId(communityId);
  await requireVerifiedMembership(userId, journeyId);

  const store = getStore();
  const blocked = new Set(
    (await store.listBlocksInvolving(userId))
      .flatMap((b) => [b.blockerId, b.blockedId])
      .filter((id) => id !== userId),
  );
  const posts = (await store.listPostsByCommunity(communityId)).filter(
    (p) => !blocked.has(p.authorId),
  );

  const reactions = await store.listReactionsByPosts(posts.map((p) => p.id));
  const grouped = new Map<string, typeof reactions>();
  for (const reaction of reactions) {
    const list = grouped.get(reaction.postId) ?? [];
    list.push(reaction);
    grouped.set(reaction.postId, list);
  }
  return posts.map((post) => ({
    ...post,
    reactionCount: grouped.get(post.id)?.length ?? 0,
    userReacted:
      grouped.get(post.id)?.some((r) => r.userId === userId) ?? false,
  }));
}

export interface CreatePostInput {
  userId: string;
  communityId: string;
  postType: Post["postType"];
  title?: string | null;
  body: string;
}

export async function createPost(input: CreatePostInput): Promise<Post> {
  if (!input.body.trim()) {
    throw new AppError("validation", "Post body is required");
  }

  const journeyId = await getCommunityJourneyId(input.communityId);
  await requireVerifiedMembership(input.userId, journeyId);

  const store = getStore();
  return store.createPost({
    communityId: input.communityId,
    authorId: input.userId,
    postType: input.postType,
    title: input.title ?? null,
    body: input.body.trim(),
  });
}

export async function deletePost(
  userId: string,
  postId: string,
): Promise<void> {
  const store = getStore();
  const post = await store.getPostById(postId);

  if (!post || post.deletedAt) {
    throw new AppError("not_found", "Post not found");
  }

  const user = await store.getAuthUserById(userId);
  const isMod = user?.role === "moderator" || user?.role === "admin";

  if (post.authorId !== userId && !isMod) {
    throw new AppError("forbidden", "You can only delete your own posts");
  }

  await store.deletePost(postId);
}

export async function listComments(
  userId: string,
  postId: string,
): Promise<Comment[]> {
  const store = getStore();
  const post = await store.getPostById(postId);

  if (!post || post.deletedAt) {
    throw new AppError("not_found", "Post not found");
  }

  const journeyId = await getCommunityJourneyId(post.communityId);
  await requireVerifiedMembership(userId, journeyId);

  const blocked = new Set(
    (await store.listBlocksInvolving(userId))
      .flatMap((b) => [b.blockerId, b.blockedId])
      .filter((id) => id !== userId),
  );
  return (await store.listCommentsByPost(postId)).filter(
    (c) => !blocked.has(c.authorId),
  );
}

export interface CreateCommentInput {
  userId: string;
  postId: string;
  parentId?: string | null;
  body: string;
}

export async function createComment(
  input: CreateCommentInput,
): Promise<Comment> {
  if (!input.body.trim()) {
    throw new AppError("validation", "Comment body is required");
  }

  const store = getStore();
  const post = await store.getPostById(input.postId);

  if (!post || post.deletedAt) {
    throw new AppError("not_found", "Post not found");
  }

  const journeyId = await getCommunityJourneyId(post.communityId);
  await requireVerifiedMembership(input.userId, journeyId);

  if (
    input.parentId &&
    !(await store.listCommentsByPost(input.postId)).some(
      (c) => c.id === input.parentId,
    )
  )
    throw new AppError("validation", "Parent comment must belong to this post");
  return store.createComment({
    postId: input.postId,
    authorId: input.userId,
    parentId: input.parentId ?? null,
    body: input.body.trim(),
  });
}

export async function toggleReaction(
  userId: string,
  postId: string,
  reaction = "like",
): Promise<{ reacted: boolean; reactionCount: number }> {
  const store = getStore();
  const post = await store.getPostById(postId);

  if (!post || post.deletedAt) {
    throw new AppError("not_found", "Post not found");
  }

  const journeyId = await getCommunityJourneyId(post.communityId);
  await requireVerifiedMembership(userId, journeyId);

  const existing = await store.getReaction(postId, userId, reaction);

  if (existing) {
    await store.deleteReaction(existing.id);
    if (post.authorId !== userId)
      await addReputation(post.authorId, -1, "reaction_removed");
  } else {
    await store.createReaction(postId, userId, reaction);
    if (post.authorId !== userId) {
      await addReputation(post.authorId, 1, "reaction_received");
      await maybeAwardBadges(post.authorId);
    }
  }

  const reactions = await store.listReactionsByPost(postId);
  return {
    reacted: !existing,
    reactionCount: reactions.length,
  };
}
