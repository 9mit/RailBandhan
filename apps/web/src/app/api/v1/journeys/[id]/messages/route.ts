import {
  authorHandleForUser,
  serializeMessage,
} from "@/server/api/serializers";
import { requireUser } from "@/server/auth/session";
import { listMessages, sendMessage } from "@/server/chat/service";
import { jsonError, jsonOk, parseJsonBody } from "@/server/http";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser(request);
    const { id } = await params;
    const messages = await listMessages(user.id, id);

    const serialized = await Promise.all(
      messages.map(async (message) => {
        const handle = await authorHandleForUser(message.authorId);
        return serializeMessage(message, handle);
      }),
    );

    return jsonOk({ messages: serialized });
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
    const body = await parseJsonBody<{ body: string }>(request);

    const message = await sendMessage({
      userId: user.id,
      journeyId: id,
      body: body.body,
    });

    const handle = await authorHandleForUser(message.authorId);

    return jsonOk({ message: serializeMessage(message, handle) });
  } catch (error) {
    return jsonError(error);
  }
}
