import { serializeGame } from "@/server/api/serializers";
import { requireUser } from "@/server/auth/session";
import { getGame } from "@/server/games/engine";
import { jsonError, jsonOk } from "@/server/http";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser(request);
    const { id } = await params;
    const game = await getGame(user.id, id);
    return jsonOk({ game: await serializeGame(game, user.id) });
  } catch (error) {
    return jsonError(error);
  }
}
