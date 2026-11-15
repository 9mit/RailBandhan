import { authorHandleForUser } from "@/server/api/serializers";
import { requireUser } from "@/server/auth/session";
import { createComment, listComments } from "@/server/community/service";
import { jsonError, jsonOk, parseJsonBody } from "@/server/http";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser(request);
    const { id } = await params;
    const comments = await listComments(user.id, id);

    const serialized = await Promise.all(
      comments.map(async (comment) => ({
        id: comment.id,
        post_id: comment.postId,
        author_handle: await authorHandleForUser(comment.authorId),
        parent_id: comment.parentId,
        body: comment.body,
        created_at: comment.createdAt,
      })),
    );

    return jsonOk({ comments: serialized });
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
    const body = await parseJsonBody<{ body: string; parent_id?: string }>(
      request,
    );

    const comment = await createComment({
      userId: user.id,
      postId: id,
      parentId: body.parent_id,
      body: body.body,
    });

    return jsonOk({
      comment: {
        id: comment.id,
        post_id: comment.postId,
        author_handle: await authorHandleForUser(comment.authorId),
        parent_id: comment.parentId,
        body: comment.body,
        created_at: comment.createdAt,
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
