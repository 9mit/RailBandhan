import { AppError } from "@/lib/errors";
import { authorHandleForUser, serializePost } from "@/server/api/serializers";
import { requireUser } from "@/server/auth/session";
import { createPost, listPosts } from "@/server/community/service";
import type { PostType } from "@/server/domain/types";
import { jsonError, jsonOk, parseJsonBody } from "@/server/http";
import { getStore } from "@/server/store";

async function communityIdForJourney(journeyId: string): Promise<string> {
  const store = getStore();
  const community = await store.getTrainWideCommunity(journeyId);

  if (!community) {
    throw new AppError("not_found", "Community not found for journey");
  }

  return community.id;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser(request);
    const { id } = await params;
    const communityId = await communityIdForJourney(id);
    const posts = await listPosts(user.id, communityId);

    const store = getStore();
    const serialized = await Promise.all(
      posts.map(async (post) => {
        const handle = await authorHandleForUser(post.authorId);
        const anon = await store.getAnonymousProfile(post.authorId);
        return serializePost(post, handle, anon?.avatarUrl);
      }),
    );

    return jsonOk({ posts: serialized });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser(request);
    const { id } = await params;
    const communityId = await communityIdForJourney(id);
    const body = await parseJsonBody<{
      title?: string;
      body: string;
      post_type?: string;
    }>(request);

    const post = await createPost({
      userId: user.id,
      communityId,
      title: body.title,
      body: body.body,
      postType: (body.post_type as PostType | undefined) ?? "discussion",
    });

    const handle = await authorHandleForUser(post.authorId);

    return jsonOk({ post: serializePost(post, handle) });
  } catch (error) {
    return jsonError(error);
  }
}
