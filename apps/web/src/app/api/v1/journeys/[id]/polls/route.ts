import { serializePoll } from "@/server/api/serializers";
import { requireUser } from "@/server/auth/session";
import { jsonError, jsonOk, parseJsonBody } from "@/server/http";
import { createPoll, listJourneyPolls } from "@/server/polls/service";
import { getStore } from "@/server/store";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser(request);
    const { id } = await params;
    const polls = await listJourneyPolls(user.id, id);
    const store = getStore();

    const serialized = await Promise.all(
      polls.map(async (poll) => {
        const userVote = await store.getPollVote(poll.id, user.id);
        return serializePoll(poll, userVote?.optionId ?? null);
      }),
    );

    return jsonOk({ polls: serialized });
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
    const body = await parseJsonBody<{ question: string; options: string[] }>(
      request,
    );

    const poll = await createPoll({
      userId: user.id,
      journeyId: id,
      question: body.question,
      options: body.options,
    });

    return jsonOk({ poll: serializePoll(poll) });
  } catch (error) {
    return jsonError(error);
  }
}
