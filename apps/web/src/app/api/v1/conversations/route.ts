import { AppError } from "@/lib/errors";
import {
  authorHandleForUser,
  serializeConversation,
  serializeDmMessage,
} from "@/server/api/serializers";
import { requireUser } from "@/server/auth/session";
import { listMyConversations, startConversation } from "@/server/dm/service";
import { jsonError, jsonOk, parseJsonBody } from "@/server/http";
import { rateLimit } from "@/server/rate-limit";

export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    const conversations = await listMyConversations(user.id);

    const serialized = await Promise.all(
      conversations.map(async (conv) => {
        const otherHandle = conv.otherUserId
          ? await authorHandleForUser(conv.otherUserId)
          : null;
        return serializeConversation(
          conv,
          otherHandle,
          conv.lastMessage?.body ?? null,
        );
      }),
    );

    return jsonOk({ conversations: serialized });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const limit = await rateLimit(`dm-start:${user.id}`, 20, 60 * 60 * 1000);
    if (!limit.allowed) {
      throw new AppError(
        "rate_limited",
        "Too many conversation starts. Try again later.",
      );
    }

    const body = await parseJsonBody<{
      recipient_handle?: string;
      recipientHandle?: string;
      journey_id?: string;
      journeyId?: string;
      body?: string;
    }>(request);

    const recipientHandle = body.recipient_handle ?? body.recipientHandle;
    const journeyId = body.journey_id ?? body.journeyId;
    if (!journeyId) {
      throw new AppError("validation", "journey_id is required");
    }

    const result = await startConversation({
      userId: user.id,
      recipientHandle,
      journeyId,
      body: body.body,
    });

    const conversation =
      "conversation" in result ? result.conversation : result;
    const message = "message" in result ? result.message : null;
    const otherId =
      conversation.participantIds.find((id) => id !== user.id) ?? null;
    const otherHandle = otherId ? await authorHandleForUser(otherId) : null;

    return jsonOk({
      conversation: serializeConversation(conversation, otherHandle),
      message: message
        ? serializeDmMessage(message, await authorHandleForUser(user.id))
        : undefined,
    });
  } catch (error) {
    return jsonError(error);
  }
}
