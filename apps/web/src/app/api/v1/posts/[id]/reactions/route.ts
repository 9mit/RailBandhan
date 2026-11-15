import { requireUser } from "@/server/auth/session";
import { toggleReaction } from "@/server/community/service";
import { jsonError, jsonOk, parseJsonBody } from "@/server/http";

async function handleToggle(request: Request, postId: string) {
  const user = await requireUser(request);
  const result = await toggleReaction(user.id, postId, "like");

  return jsonOk({
    reacted: result.reacted,
    reaction_count: result.reactionCount,
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await parseJsonBody<{ reaction?: string }>(request);
    return handleToggle(request, id);
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    return handleToggle(request, id);
  } catch (error) {
    return jsonError(error);
  }
}
