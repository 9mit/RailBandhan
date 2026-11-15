import {
  authorHandleForUser,
  serializeConversation,
  serializeDmMessage,
} from "@/server/api/serializers";
import { requireUser } from "@/server/auth/session";
import { getConversation, getConversationMessages } from "@/server/dm/service";
import { jsonError, jsonOk } from "@/server/http";
import { getStore } from "@/server/store";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser(request);
    const { id } = await params;
    const conversation = await getConversation(user.id, id);
    const messages = await getConversationMessages(user.id, id);

    const store = getStore();
    const participants = await store.listConversationParticipants(id);
    const otherId = participants.find((pid) => pid !== user.id) ?? null;
    const otherHandle = otherId ? await authorHandleForUser(otherId) : null;

    const serialized = await Promise.all(
      messages.map(async (m) =>
        serializeDmMessage(m, await authorHandleForUser(m.senderId)),
      ),
    );

    return jsonOk({
      conversation: serializeConversation(conversation, otherHandle),
      messages: serialized,
    });
  } catch (error) {
    return jsonError(error);
  }
}
