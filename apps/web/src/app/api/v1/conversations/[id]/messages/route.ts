import { AppError } from "@/lib/errors";
import {
  authorHandleForUser,
  serializeDmMessage,
} from "@/server/api/serializers";
import { requireUser } from "@/server/auth/session";
import {
  getConversationMessages,
  sendDirectMessage,
} from "@/server/dm/service";
import { jsonError, jsonOk, parseJsonBody } from "@/server/http";
import { rateLimit } from "@/server/rate-limit";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser(request);
    const { id } = await params;
    const messages = await getConversationMessages(user.id, id);

    const serialized = await Promise.all(
      messages.map(async (m) =>
        serializeDmMessage(m, await authorHandleForUser(m.senderId)),
      ),
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
    const limit = await rateLimit(`dm:${user.id}`, 30, 60 * 1000);
    if (!limit.allowed) {
      throw new AppError(
        "rate_limited",
        "Too many messages. Try again shortly.",
      );
    }

    const { id } = await params;
    const body = await parseJsonBody<{ body: string }>(request);

    const message = await sendDirectMessage(user.id, id, body.body);
    const handle = await authorHandleForUser(user.id);

    return jsonOk({ message: serializeDmMessage(message, handle) });
  } catch (error) {
    return jsonError(error);
  }
}
