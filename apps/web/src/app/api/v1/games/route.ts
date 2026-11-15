import { AppError } from "@/lib/errors";
import { serializeGame } from "@/server/api/serializers";
import { requireUser } from "@/server/auth/session";
import type { GameKind } from "@/server/domain/types";
import { createGame } from "@/server/games/engine";
import { jsonError, jsonOk, parseJsonBody } from "@/server/http";

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const body = await parseJsonBody<{
      journey_id?: string;
      journeyId?: string;
      game_type?: string;
      kind?: GameKind;
    }>(request);

    const journeyId = body.journey_id || body.journeyId;
    if (!journeyId) {
      throw new AppError("validation", "journey_id is required");
    }

    let kind: GameKind = "tic_tac_toe";
    if (body.kind) {
      kind = body.kind;
    } else if (
      body.game_type === "connectfour" ||
      body.game_type === "connect_four"
    ) {
      kind = "connect_four";
    } else if (
      body.game_type === "tictactoe" ||
      body.game_type === "tic_tac_toe"
    ) {
      kind = "tic_tac_toe";
    } else if (body.game_type === "ludo") {
      kind = "ludo";
    }

    const game = await createGame(user.id, journeyId, kind);
    return jsonOk({ game: await serializeGame(game, user.id) });
  } catch (error) {
    return jsonError(error);
  }
}
