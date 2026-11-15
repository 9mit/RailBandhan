import { AppError } from "@/lib/errors";
import { requireVerifiedMembership } from "@/server/authz/membership";
import { assertCanMessage } from "@/server/authz/relationships";
import type { Conversation, DirectMessage } from "@/server/domain/types";
import { createNotification } from "@/server/notifications/service";
import { maybeAwardBadges } from "@/server/reputation/service";
import { getStore } from "@/server/store";

export interface ConversationWithParticipants extends Conversation {
  participantIds: [string, string];
}

export interface ConversationSummary extends ConversationWithParticipants {
  otherUserId: string | null;
  lastMessage: DirectMessage | null;
}

async function withParticipantIds(
  conversation: Conversation,
): Promise<ConversationWithParticipants> {
  const store = getStore();
  const participants = await store.listConversationParticipants(
    conversation.id,
  );
  if (participants.length < 2) {
    throw new AppError("not_found", "Conversation participants not found");
  }
  const sorted = [...participants].sort() as [string, string];
  return { ...conversation, participantIds: sorted };
}

export const listConversations = listMyConversations;

export async function listMyConversations(
  userId: string,
): Promise<ConversationSummary[]> {
  const store = getStore();
  const conversations = await store.listConversationsForUser(userId);

  const entries = await Promise.all(
    conversations.map(
      async (conversation): Promise<ConversationSummary | null> => {
        try {
          await requireVerifiedMembership(userId, conversation.journeyId);
        } catch {
          return null;
        }
        const messages = await store.listDirectMessages(conversation.id);
        const lastMessage =
          messages.length > 0 ? messages[messages.length - 1]! : null;
        const participants = await store.listConversationParticipants(
          conversation.id,
        );
        const otherUserId = participants.find((id) => id !== userId) ?? null;
        const withParticipants = await withParticipantIds(conversation);

        return {
          ...withParticipants,
          otherUserId,
          lastMessage,
        };
      },
    ),
  );

  return entries.filter(
    (entry): entry is ConversationSummary => entry !== null,
  );
}

async function resolveRecipientId(
  recipientHandle?: string,
  recipientId?: string,
): Promise<string> {
  if (recipientId) {
    return recipientId;
  }
  if (!recipientHandle?.trim()) {
    throw new AppError("validation", "Recipient handle or id is required");
  }

  const store = getStore();
  const profile = await store.getAnonymousProfileByHandle(
    recipientHandle.trim(),
  );
  if (!profile) {
    throw new AppError("not_found", "Recipient not found");
  }
  return profile.userId;
}

export const listConversationMessages = getConversationMessages;

export async function getConversation(
  userId: string,
  conversationId: string,
): Promise<ConversationWithParticipants> {
  const store = getStore();
  const conversation = await store.getConversation(conversationId);
  if (!conversation) {
    throw new AppError("not_found", "Conversation not found");
  }

  await requireVerifiedMembership(userId, conversation.journeyId);
  const myConversations = await store.listConversationsForUser(userId);
  if (!myConversations.some((c) => c.id === conversationId)) {
    throw new AppError("forbidden", "Not a participant in this conversation");
  }

  return withParticipantIds(conversation);
}

export async function getConversationMessages(
  userId: string,
  conversationId: string,
): Promise<DirectMessage[]> {
  const store = getStore();
  const conversation = await store.getConversation(conversationId);
  if (!conversation) {
    throw new AppError("not_found", "Conversation not found");
  }

  await requireVerifiedMembership(userId, conversation.journeyId);

  const conversations = await store.listConversationsForUser(userId);
  if (!conversations.some((c) => c.id === conversationId)) {
    throw new AppError("forbidden", "Not a participant in this conversation");
  }

  return store.listDirectMessages(conversationId);
}

export interface StartConversationInput {
  userId: string;
  journeyId: string;
  recipientHandle?: string;
  recipientId?: string;
  body?: string;
}

export async function startConversation(
  senderOrInput: string | StartConversationInput,
  journeyId?: string,
  options?: { recipientHandle?: string; recipientId?: string },
): Promise<
  | ConversationWithParticipants
  | {
      conversation: ConversationWithParticipants;
      message: DirectMessage | null;
    }
> {
  const input: StartConversationInput =
    typeof senderOrInput === "string"
      ? {
          userId: senderOrInput,
          journeyId: journeyId!,
          recipientHandle: options?.recipientHandle,
          recipientId: options?.recipientId,
        }
      : senderOrInput;

  await requireVerifiedMembership(input.userId, input.journeyId);

  const recipientId = await resolveRecipientId(
    input.recipientHandle,
    input.recipientId,
  );
  await requireVerifiedMembership(recipientId, input.journeyId);
  await assertCanMessage(input.userId, recipientId);

  const store = getStore();
  const conversation = await withParticipantIds(
    await store.createConversation(
      [input.userId, recipientId],
      input.journeyId,
    ),
  );

  await createNotification({
    userId: recipientId,
    type: "dm",
    title: "New conversation",
    body: "A passenger started a conversation with you",
    resourceType: "conversation",
    resourceId: conversation.id,
    journeyId: input.journeyId,
  });

  if (input.body?.trim()) {
    const message = await sendDirectMessage(
      input.userId,
      conversation.id,
      input.body,
    );
    return { conversation, message };
  }

  if (typeof senderOrInput === "object") {
    return { conversation, message: null };
  }

  return conversation;
}

export async function sendDirectMessage(
  senderId: string,
  conversationId: string,
  body: string,
): Promise<DirectMessage> {
  if (!body.trim()) {
    throw new AppError("validation", "Message body is required");
  }

  const store = getStore();
  const conversation = await store.getConversation(conversationId);
  if (!conversation) {
    throw new AppError("not_found", "Conversation not found");
  }

  await requireVerifiedMembership(senderId, conversation.journeyId);

  const myConversations = await store.listConversationsForUser(senderId);
  if (!myConversations.some((c) => c.id === conversationId)) {
    throw new AppError("forbidden", "Not a participant in this conversation");
  }

  const participantIds =
    await store.listConversationParticipants(conversationId);
  const recipientId = participantIds.find((id) => id !== senderId);
  if (!recipientId) {
    throw new AppError("forbidden", "Not a participant in this conversation");
  }

  await assertCanMessage(senderId, recipientId);

  const senderProfile = await store.getAnonymousProfile(senderId);
  const message = await store.addDirectMessage(
    conversationId,
    senderId,
    body.trim(),
  );

  await createNotification({
    userId: recipientId,
    type: "dm",
    title: "New message",
    body: `${senderProfile?.publicHandle ?? "A passenger"} sent you a message`,
    resourceType: "conversation",
    resourceId: conversationId,
    journeyId: conversation.journeyId,
  });

  await maybeAwardBadges(senderId);
  return message;
}

export const sendDmMessage = sendDirectMessage;
