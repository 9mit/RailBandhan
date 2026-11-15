import { AppError } from "@/lib/errors";
import { requireVerifiedMembership } from "@/server/authz/membership";
import type { Message } from "@/server/domain/types";
import { rateLimit } from "@/server/rate-limit";
import { maybeAwardBadges } from "@/server/reputation/service";
import { getStore } from "@/server/store";

const CHAT_RATE_LIMIT = 30;
const CHAT_WINDOW_MS = 60_000;

export async function listMessages(
  userId: string,
  journeyId: string,
): Promise<Message[]> {
  await requireVerifiedMembership(userId, journeyId);

  const store = getStore();
  const room = await store.getChatRoomByJourneyId(journeyId);

  if (!room) {
    throw new AppError("not_found", "Chat room not found for journey");
  }

  const blocked = new Set(
    (await store.listBlocksInvolving(userId))
      .flatMap((b) => [b.blockerId, b.blockedId])
      .filter((id) => id !== userId),
  );
  return (await store.listMessagesByRoom(room.id)).filter(
    (m) => !blocked.has(m.authorId),
  );
}

export interface SendMessageInput {
  userId: string;
  journeyId: string;
  body: string;
}

export async function sendMessage(input: SendMessageInput): Promise<Message> {
  if (!input.body.trim()) {
    throw new AppError("validation", "Message body is required");
  }

  await requireVerifiedMembership(input.userId, input.journeyId);

  const limit = await rateLimit(
    `chat:${input.userId}`,
    CHAT_RATE_LIMIT,
    CHAT_WINDOW_MS,
  );
  if (!limit.allowed) {
    throw new AppError(
      "rate_limited",
      "Chat rate limit exceeded. Try again shortly.",
    );
  }

  const store = getStore();
  const room = await store.getChatRoomByJourneyId(input.journeyId);

  if (!room) {
    throw new AppError("not_found", "Chat room not found for journey");
  }

  const message = await store.createMessage({
    roomId: room.id,
    authorId: input.userId,
    body: input.body.trim(),
  });

  await maybeAwardBadges(input.userId);
  return message;
}
