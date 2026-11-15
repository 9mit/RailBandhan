import { serializeGame } from "@/server/api/serializers";
import { requireUser } from "@/server/auth/session";
import type { GameKind } from "@/server/domain/types";
import { createGame, listGames } from "@/server/games/engine";
import { jsonError, jsonOk, parseJsonBody } from "@/server/http";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser(request);
    const { id } = await params;
    const games = await listGames(user.id, id);
    const serialized = await Promise.all(
      games.map((game) => serializeGame(game, user.id)),
    );
    return jsonOk({ games: serialized });
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
    const body = await parseJsonBody<{ kind: GameKind }>(request);

    const game = await createGame(user.id, id, body.kind);

    return jsonOk({ game: await serializeGame(game, user.id) });
  } catch (error) {
    return jsonError(error);
  }
}
