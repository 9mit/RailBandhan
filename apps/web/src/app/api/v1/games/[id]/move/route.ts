import { serializeGame } from "@/server/api/serializers";
import { requireUser } from "@/server/auth/session";
import { makeMove } from "@/server/games/engine";
import { jsonError, jsonOk, parseJsonBody } from "@/server/http";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser(request);
    const { id } = await params;
    const body = await parseJsonBody<{
      cell?: number;
      column?: number;
      index?: number;
      action?: string;
      roll?: boolean;
      tokenId?: number;
      move?: {
        cell?: number;
        column?: number;
        index?: number;
        action?: string;
        roll?: boolean;
        tokenId?: number;
      };
    }>(request);

    const payload: Record<string, unknown> = {
      ...body,
      ...(body.move ?? {}),
    };

    if (body.cell !== undefined) {
      payload.index = body.cell;
    }
    if (body.column !== undefined) {
      payload.column = body.column;
    }
    if (body.index !== undefined) {
      payload.index = body.index;
    }
    if (body.move?.cell !== undefined) {
      payload.index = body.move.cell;
    }
    if (body.move?.index !== undefined) {
      payload.index = body.move.index;
    }
    if (body.move?.column !== undefined) {
      payload.column = body.move.column;
    }

    const game = await makeMove(user.id, id, payload);

    return jsonOk({ game: await serializeGame(game, user.id) });
  } catch (error) {
    return jsonError(error);
  }
}
