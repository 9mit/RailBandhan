import { AppError } from "@/lib/errors";
import { authorHandleForUser, serializeBlock } from "@/server/api/serializers";
import { requireUser } from "@/server/auth/session";
import { jsonError, jsonOk, parseJsonBody } from "@/server/http";
import { blockUser, listMyBlocks } from "@/server/moderation/service";
import { getStore } from "@/server/store";

export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    const blocks = await listMyBlocks(user.id);

    const serialized = await Promise.all(
      blocks.map(async (b) =>
        serializeBlock(b, await authorHandleForUser(b.blockedId)),
      ),
    );

    return jsonOk({ blocks: serialized });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const body = await parseJsonBody<{
      blocked_user_id?: string;
      handle?: string;
    }>(request);

    let targetUserId = body.blocked_user_id;
    if (!targetUserId && body.handle) {
      const store = getStore();
      const profile = await store.getAnonymousProfileByHandle(body.handle);
      if (!profile) {
        throw new AppError("not_found", "User not found");
      }
      targetUserId = profile.userId;
    }

    if (!targetUserId) {
      throw new AppError("validation", "blocked_user_id or handle is required");
    }

    const block = await blockUser(user.id, targetUserId);
    const handle = await authorHandleForUser(block.blockedId);

    return jsonOk({ block: serializeBlock(block, handle) });
  } catch (error) {
    return jsonError(error);
  }
}
