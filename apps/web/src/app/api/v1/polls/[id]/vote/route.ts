import { serializePoll } from "@/server/api/serializers";
import { requireUser } from "@/server/auth/session";
import { jsonError, jsonOk, parseJsonBody } from "@/server/http";
import { vote } from "@/server/polls/service";
import { getStore } from "@/server/store";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser(request);
    const { id } = await params;
    const body = await parseJsonBody<{ option_id: string }>(request);

    const poll = await vote(user.id, id, body.option_id);
    const userVote = await getStore().getPollVote(poll.id, user.id);

    return jsonOk({ poll: serializePoll(poll, userVote?.optionId ?? null) });
  } catch (error) {
    return jsonError(error);
  }
}
