import { AppError } from "@/lib/errors";
import { requireVerifiedMembership } from "@/server/authz/membership";
import type { GameKind, GameSession } from "@/server/domain/types";
import type {
  ConnectFourMove,
  ConnectFourState,
  TicTacToeMove,
  TicTacToeState,
} from "@/server/games/types";
import { createNotification } from "@/server/notifications/service";
import { getStore } from "@/server/store";

const TTT_WINS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function initialTicTacToeState(hostUserId: string): TicTacToeState {
  return {
    board: Array<null | "X" | "O">(9).fill(null),
    next: "X",
    players: { X: hostUserId, O: null },
  };
}

function initialConnectFourState(hostUserId: string): ConnectFourState {
  return {
    columns: Array.from({ length: 7 }, () => [] as number[]),
    next: 0,
    players: [hostUserId, null],
    rows: 6,
    cols: 7,
  };
}

function checkTicTacToeWinner(
  board: (null | "X" | "O")[],
): "X" | "O" | "draw" | null {
  for (const [a, b, c] of TTT_WINS) {
    const line = board[a];
    if (line && line === board[b] && line === board[c]) {
      return line;
    }
  }
  if (board.every((cell) => cell !== null)) {
    return "draw";
  }
  return null;
}

function checkConnectFourWinner(
  columns: number[][],
  rows: number,
  lastCol: number,
): 0 | 1 | "draw" | null {
  const col = columns[lastCol];
  if (!col || col.length === 0) {
    return null;
  }

  const player = col[col.length - 1]!;
  const row = col.length - 1;

  const directions = [
    [1, 0],
    [0, 1],
    [1, 1],
    [1, -1],
  ] as const;

  for (const [dx, dy] of directions) {
    let count = 1;

    for (const sign of [-1, 1] as const) {
      let c = lastCol;
      let r = row;
      while (true) {
        c += dx * sign;
        r += dy * sign;
        if (c < 0 || c >= columns.length || r < 0 || r >= rows) {
          break;
        }
        const stack = columns[c];
        if (!stack || stack[r] !== player) {
          break;
        }
        count += 1;
      }
    }

    if (count >= 4) {
      return player as 0 | 1;
    }
  }

  const full = columns.every((stack) => stack.length >= rows);
  return full ? "draw" : null;
}

function parseTicTacToeState(state: Record<string, unknown>): TicTacToeState {
  const board = state.board as (null | "X" | "O")[];
  const next = state.next as "X" | "O";
  const players = state.players as { X: string; O: string | null };
  return { board, next, players };
}

function parseConnectFourState(
  state: Record<string, unknown>,
): ConnectFourState {
  return state as unknown as ConnectFourState;
}

function getPlayerSymbol(
  game: GameSession,
  userId: string,
): "X" | "O" | 0 | 1 | null {
  if (game.kind === "tic_tac_toe") {
    const state = parseTicTacToeState(game.state);
    if (state.players.X === userId) return "X";
    if (state.players.O === userId) return "O";
    return null;
  }

  const state = parseConnectFourState(game.state);
  if (state.players[0] === userId) return 0;
  if (state.players[1] === userId) return 1;
  return null;
}

function parseLudoState(
  state: Record<string, unknown>,
): import("./ludo").LudoState {
  return state as unknown as import("./ludo").LudoState;
}

export async function createGame(
  userIdOrInput:
    | string
    | {
        userId: string;
        journeyId: string;
        kind: GameKind;
        maxPlayers?: number;
      },
  journeyId?: string,
  kind?: GameKind,
): Promise<GameSession> {
  const input =
    typeof userIdOrInput === "string"
      ? {
          userId: userIdOrInput,
          journeyId: journeyId!,
          kind: kind!,
          maxPlayers: 2,
        }
      : userIdOrInput;

  await requireVerifiedMembership(input.userId, input.journeyId);

  const store = getStore();
  let state: Record<string, unknown>;
  let maxPlayers = input.maxPlayers ?? 2;

  if (input.kind === "tic_tac_toe") {
    state = initialTicTacToeState(input.userId) as unknown as Record<
      string,
      unknown
    >;
    maxPlayers = 2;
  } else if (input.kind === "connect_four") {
    state = initialConnectFourState(input.userId) as unknown as Record<
      string,
      unknown
    >;
    maxPlayers = 2;
  } else {
    // Ludo supports up to 4 players
    const { initialLudoState } = await import("./ludo");
    state = initialLudoState([
      input.userId,
      "pending_opponent",
    ]) as unknown as Record<string, unknown>;
    maxPlayers = Math.min(4, Math.max(2, input.maxPlayers ?? 4));
  }

  const game = await store.createGame({
    journeyId: input.journeyId,
    kind: input.kind,
    hostUserId: input.userId,
    maxPlayers,
    state,
  });

  return game;
}

export async function joinGame(
  userId: string,
  gameId: string,
): Promise<GameSession> {
  return getStore().transaction(async () => {
    const store = getStore();
    const game = await store.getGame(gameId);
    if (!game) {
      throw new AppError("not_found", "Game not found");
    }

    await requireVerifiedMembership(userId, game.journeyId);

    if (game.status !== "open") {
      throw new AppError("validation", "Game is not open for joining");
    }

    if (game.playerIds.includes(userId)) {
      return game;
    }

    if (game.playerIds.length >= game.maxPlayers) {
      throw new AppError("validation", "Game is full");
    }

    let state = game.state;
    if (game.kind === "tic_tac_toe") {
      const ttt = parseTicTacToeState(state);
      if (ttt.players.O) {
        throw new AppError("validation", "Game is full");
      }
      ttt.players.O = userId;
      state = ttt as unknown as Record<string, unknown>;
    } else if (game.kind === "connect_four") {
      const c4 = parseConnectFourState(state);
      if (c4.players[1]) {
        throw new AppError("validation", "Game is full");
      }
      c4.players[1] = userId;
      state = c4 as unknown as Record<string, unknown>;
    } else if (game.kind === "ludo") {
      const { initialLudoState } = await import("./ludo");
      const newPlayerIds = [...game.playerIds, userId];
      state = initialLudoState(newPlayerIds) as unknown as Record<
        string,
        unknown
      >;
    }

    const updated = await store.updateGame({
      ...game,
      playerIds: [...game.playerIds, userId],
      status: "active",
      state,
    });

    await createNotification({
      userId: game.hostUserId,
      type: "game_started",
      title: "Game started",
      body: "An opponent joined your game",
      resourceType: "game",
      resourceId: game.id,
      journeyId: game.journeyId,
    });

    return updated;
  });
}

function applyTicTacToeMove(
  game: GameSession,
  userId: string,
  move: TicTacToeMove,
): GameSession {
  const state = parseTicTacToeState(game.state);
  const symbol = getPlayerSymbol(game, userId);
  if (symbol !== "X" && symbol !== "O") {
    throw new AppError("forbidden", "Only players can make moves");
  }
  if (state.next !== symbol) {
    throw new AppError("validation", "Not your turn");
  }
  if (move.index < 0 || move.index > 8 || state.board[move.index] !== null) {
    throw new AppError("validation", "Illegal move");
  }

  state.board[move.index] = symbol;
  const outcome = checkTicTacToeWinner(state.board);

  let winnerId: string | null = null;
  let status: GameSession["status"] = game.status;

  if (outcome === "X" || outcome === "O") {
    winnerId = state.players[outcome];
    status = "finished";
  } else if (outcome === "draw") {
    status = "finished";
  } else {
    state.next = symbol === "X" ? "O" : "X";
  }

  return {
    ...game,
    state: state as unknown as Record<string, unknown>,
    winnerId,
    status,
  };
}

function applyConnectFourMove(
  game: GameSession,
  userId: string,
  move: ConnectFourMove,
): GameSession {
  const state = parseConnectFourState(game.state);
  const player = getPlayerSymbol(game, userId);
  if (player !== 0 && player !== 1) {
    throw new AppError("forbidden", "Only players can make moves");
  }
  if (state.next !== player) {
    throw new AppError("validation", "Not your turn");
  }
  if (move.column < 0 || move.column >= state.cols) {
    throw new AppError("validation", "Illegal column");
  }
  if (state.columns[move.column]!.length >= state.rows) {
    throw new AppError("validation", "Column is full");
  }

  state.columns[move.column]!.push(player);
  const outcome = checkConnectFourWinner(
    state.columns,
    state.rows,
    move.column,
  );

  let winnerId: string | null = null;
  let status: GameSession["status"] = game.status;

  if (outcome === 0 || outcome === 1) {
    winnerId = state.players[outcome];
    status = "finished";
  } else if (outcome === "draw") {
    status = "finished";
  } else {
    state.next = player === 0 ? 1 : 0;
  }

  return {
    ...game,
    state: state as unknown as Record<string, unknown>,
    winnerId,
    status,
  };
}

export async function makeMove(
  userId: string,
  gameId: string,
  payload: Record<string, unknown>,
): Promise<GameSession> {
  return getStore().transaction(async () => {
    const store = getStore();
    const game = await store.getGame(gameId);
    if (!game) {
      throw new AppError("not_found", "Game not found");
    }

    await requireVerifiedMembership(userId, game.journeyId);

    if (game.status !== "active") {
      throw new AppError("validation", "Game is not active");
    }

    let nextGame: GameSession;
    if (game.kind === "tic_tac_toe") {
      const index =
        typeof payload.index === "number"
          ? payload.index
          : typeof payload.cell === "number"
            ? payload.cell
            : null;
      if (index === null) {
        throw new AppError("validation", "Move must include index");
      }
      nextGame = applyTicTacToeMove(game, userId, { index });
    } else if (game.kind === "connect_four") {
      const column =
        typeof payload.column === "number"
          ? payload.column
          : typeof payload.cell === "number"
            ? payload.cell
            : null;
      if (column === null) {
        throw new AppError("validation", "Move must include column");
      }
      nextGame = applyConnectFourMove(game, userId, { column });
    } else {
      // Ludo Move Dispatch
      const { rollLudoDice, moveLudoToken } = await import("./ludo");
      let ludoState = parseLudoState(game.state);

      if (payload.action === "roll" || payload.roll === true) {
        const { state: updatedState } = rollLudoDice(ludoState, userId);
        ludoState = updatedState;
      } else {
        const tokenId =
          typeof payload.tokenId === "number" ? payload.tokenId : 0;
        ludoState = moveLudoToken(ludoState, userId, tokenId);
      }

      nextGame = {
        ...game,
        state: ludoState as unknown as Record<string, unknown>,
        winnerId: ludoState.winner,
        status: ludoState.winner ? "finished" : "active",
      };
    }

    return store.updateGame(nextGame);
  });
}

export async function listGames(
  userId: string,
  journeyId: string,
): Promise<GameSession[]> {
  await requireVerifiedMembership(userId, journeyId);
  const store = getStore();
  return store.listGamesByJourney(journeyId);
}

export const listJourneyGames = listGames;

export async function getGame(
  userId: string,
  gameId: string,
): Promise<GameSession> {
  const store = getStore();
  const game = await store.getGame(gameId);
  if (!game) {
    throw new AppError("not_found", "Game not found");
  }

  await requireVerifiedMembership(userId, game.journeyId);
  return game;
}

export const applyMove = makeMove;
