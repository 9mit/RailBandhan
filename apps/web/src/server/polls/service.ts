import { AppError } from "@/lib/errors";
import { requireVerifiedMembership } from "@/server/authz/membership";
import type { Poll, Post } from "@/server/domain/types";
import { getStore } from "@/server/store";

function newId(): string {
  return crypto.randomUUID();
}

async function getCommunityJourneyId(communityId: string): Promise<string> {
  const store = getStore();
  const community = await store.getCommunityById(communityId);
  if (!community?.journeyId) {
    throw new AppError("not_found", "Community not found");
  }
  return community.journeyId;
}

export async function createPollPost(
  userId: string,
  journeyId: string,
  question: string,
  options: string[],
): Promise<{ post: Post; poll: Poll }> {
  return getStore().transaction(async () => {
    if (!question.trim()) {
      throw new AppError("validation", "Poll question is required");
    }
    if (options.length < 2) {
      throw new AppError("validation", "Poll must have at least 2 options");
    }

    await requireVerifiedMembership(userId, journeyId);

    const store = getStore();
    const community = await store.getTrainWideCommunity(journeyId);
    if (!community) {
      throw new AppError("not_found", "Community not found for journey");
    }

    const post = await store.createPost({
      communityId: community.id,
      authorId: userId,
      postType: "poll",
      title: question.trim(),
      body: question.trim(),
    });

    const poll: Poll = {
      id: newId(),
      postId: post.id,
      journeyId,
      question: question.trim(),
      options: options.map((label) => ({
        id: newId(),
        label: label.trim(),
        votes: [],
      })),
      closesAt: null,
      createdAt: new Date().toISOString(),
    };

    const created = await store.createPoll(poll);
    return { post, poll: created };
  });
}

export async function createPoll(input: {
  userId: string;
  journeyId: string;
  question: string;
  options: string[];
}): Promise<Poll> {
  const result = await createPollPost(
    input.userId,
    input.journeyId,
    input.question,
    input.options,
  );
  return result.poll;
}

export async function listJourneyPolls(
  userId: string,
  journeyId: string,
): Promise<Poll[]> {
  await requireVerifiedMembership(userId, journeyId);
  const store = getStore();
  const community = await store.getTrainWideCommunity(journeyId);
  if (!community) {
    return [];
  }

  const posts = await store.listPostsByCommunity(community.id);
  const polls: Poll[] = [];
  for (const post of posts) {
    if (post.postType !== "poll") {
      continue;
    }
    const poll = await store.getPollByPostId(post.id);
    if (poll) {
      polls.push(poll);
    }
  }
  return polls;
}

export async function vote(
  userIdOrInput: string | { userId: string; pollId: string; optionId: string },
  pollId?: string,
  optionId?: string,
): Promise<Poll> {
  return getStore().transaction(async () => {
    const input =
      typeof userIdOrInput === "string"
        ? { userId: userIdOrInput, pollId: pollId!, optionId: optionId! }
        : userIdOrInput;

    const store = getStore();
    const poll = await store.getPoll(input.pollId);
    if (!poll) {
      throw new AppError("not_found", "Poll not found");
    }

    await requireVerifiedMembership(input.userId, poll.journeyId);

    const validOption = poll.options.some((o) => o.id === input.optionId);
    if (!validOption) {
      throw new AppError("validation", "Invalid poll option");
    }

    if (poll.closesAt && new Date(poll.closesAt).getTime() < Date.now()) {
      throw new AppError("validation", "Poll is closed");
    }

    return store.votePoll(input.pollId, input.optionId, input.userId);
  });
}

export const voteOnPoll = vote;
export const votePoll = vote;

export async function getPollForPost(
  userId: string,
  postId: string,
): Promise<Poll> {
  const store = getStore();
  const post = await store.getPostById(postId);
  if (!post || post.deletedAt) {
    throw new AppError("not_found", "Post not found");
  }

  const journeyId = await getCommunityJourneyId(post.communityId);
  await requireVerifiedMembership(userId, journeyId);

  const poll = await store.getPollByPostId(postId);
  if (!poll) {
    throw new AppError("not_found", "Poll not found");
  }

  return poll;
}
