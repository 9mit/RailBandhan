import { AppError } from "@/lib/errors";
import { randomInt } from "node:crypto";

export type LudoColor = "red" | "green" | "yellow" | "blue";

export interface LudoToken {
  id: number; // 0, 1, 2, 3
  // -1 = In Yard, 0..51 = Main Track, 100..105 = Home Column (105 = Finished)
  position: number;
  stepCount: number; // 0 = Yard, 1..51 on track, 52..57 in home stretch, 57 = Home
  isHome: boolean;
}

export interface LudoPlayer {
  userId: string;
  color: LudoColor;
  tokens: LudoToken[];
  rank?: number;
}

export interface LudoState {
  players: LudoPlayer[];
  currentTurnIndex: number;
  diceRoll: number | null;
  mustRoll: boolean;
  consecutiveSixes: number;
  winner: string | null;
  turnDeadline: string;
}

// Safe starting indices on main 52-tile track
export const START_POSITIONS: Record<LudoColor, number> = {
  red: 0,
  green: 13,
  yellow: 26,
  blue: 39,
};

// Safe squares where tokens cannot be captured
export const SAFE_SQUARES = [0, 8, 13, 21, 26, 34, 39, 47];

export function initialLudoState(playerIds: string[]): LudoState {
  if (playerIds.length < 2 || playerIds.length > 4) {
    throw new AppError("validation", "Ludo requires between 2 and 4 players");
  }

  const colors: LudoColor[] = ["red", "green", "yellow", "blue"];
  const players: LudoPlayer[] = playerIds.map((userId, i) => ({
    userId,
    color: colors[i],
    tokens: [
      { id: 0, position: -1, stepCount: 0, isHome: false },
      { id: 1, position: -1, stepCount: 0, isHome: false },
      { id: 2, position: -1, stepCount: 0, isHome: false },
      { id: 3, position: -1, stepCount: 0, isHome: false },
    ],
  }));

  return {
    players,
    currentTurnIndex: 0,
    diceRoll: null,
    mustRoll: true,
    consecutiveSixes: 0,
    winner: null,
    turnDeadline: new Date(Date.now() + 30_000).toISOString(),
  };
}

/**
 * Server-authoritative secure dice roll (1 to 6).
 */
export function rollLudoDice(
  state: LudoState,
  userId: string,
): { state: LudoState; roll: number } {
  if (state.winner) {
    throw new AppError("validation", "Game is already finished");
  }

  const currentPlayer = state.players[state.currentTurnIndex];
  if (currentPlayer.userId !== userId) {
    throw new AppError("forbidden", "Not your turn to roll the dice");
  }

  if (!state.mustRoll) {
    throw new AppError(
      "validation",
      "You must move a token with your current roll",
    );
  }

  // Cryptographically secure RNG
  const roll = randomInt(1, 7);
  let consecutiveSixes = roll === 6 ? state.consecutiveSixes + 1 : 0;

  // Penalty: 3 consecutive sixes forfeits turn
  if (consecutiveSixes === 3) {
    state.mustRoll = true;
    state.diceRoll = null;
    state.consecutiveSixes = 0;
    state.currentTurnIndex =
      (state.currentTurnIndex + 1) % state.players.length;
    state.turnDeadline = new Date(Date.now() + 30_000).toISOString();
    return { state, roll };
  }

  state.diceRoll = roll;
  state.consecutiveSixes = consecutiveSixes;

  // Check if player has any valid moves
  const validTokenIds = getValidLudoMoves(currentPlayer, roll);
  if (validTokenIds.length === 0) {
    // Pass turn if no legal moves
    state.mustRoll = true;
    state.diceRoll = null;
    state.consecutiveSixes = 0;
    state.currentTurnIndex =
      (state.currentTurnIndex + 1) % state.players.length;
    state.turnDeadline = new Date(Date.now() + 30_000).toISOString();
  } else {
    state.mustRoll = false;
  }

  return { state, roll };
}

export function getValidLudoMoves(player: LudoPlayer, roll: number): number[] {
  const valid: number[] = [];

  for (const token of player.tokens) {
    if (token.isHome) continue;

    if (token.position === -1) {
      if (roll === 6) valid.push(token.id);
    } else {
      if (token.stepCount + roll <= 57) {
        valid.push(token.id);
      }
    }
  }

  return valid;
}

export function moveLudoToken(
  state: LudoState,
  userId: string,
  tokenId: number,
): LudoState {
  if (state.winner) {
    throw new AppError("validation", "Game is already finished");
  }

  const currentPlayer = state.players[state.currentTurnIndex];
  if (currentPlayer.userId !== userId) {
    throw new AppError("forbidden", "Not your turn");
  }

  if (state.mustRoll || state.diceRoll === null) {
    throw new AppError("validation", "You must roll the dice first");
  }

  const roll = state.diceRoll;
  const token = currentPlayer.tokens.find((t) => t.id === tokenId);
  if (!token) {
    throw new AppError("validation", "Invalid token id");
  }

  const validMoves = getValidLudoMoves(currentPlayer, roll);
  if (!validMoves.includes(tokenId)) {
    throw new AppError("validation", "Illegal move for selected token");
  }

  let capturedOpponent = false;

  // Moving out of yard
  if (token.position === -1) {
    token.position = START_POSITIONS[currentPlayer.color];
    token.stepCount = 1;
  } else {
    token.stepCount += roll;
    if (token.stepCount === 57) {
      token.isHome = true;
      token.position = 105;
    } else if (token.stepCount > 51) {
      token.position = 100 + (token.stepCount - 52);
    } else {
      token.position =
        (START_POSITIONS[currentPlayer.color] + token.stepCount - 1) % 52;
    }
  }

  // Capture check: If on main track and not on safe square, check if landing on opponent
  if (
    token.position >= 0 &&
    token.position < 52 &&
    !SAFE_SQUARES.includes(token.position)
  ) {
    for (const otherPlayer of state.players) {
      if (otherPlayer.userId === userId) continue;
      for (const opponentToken of otherPlayer.tokens) {
        if (opponentToken.position === token.position) {
          // Send opponent token back to yard
          opponentToken.position = -1;
          opponentToken.stepCount = 0;
          capturedOpponent = true;
        }
      }
    }
  }

  // Check Win Condition: All 4 tokens home
  if (currentPlayer.tokens.every((t) => t.isHome)) {
    state.winner = userId;
    state.mustRoll = false;
    state.diceRoll = null;
    return state;
  }

  // Extra turn granted on rolling 6 or capturing an opponent
  const grantsBonusTurn = roll === 6 || capturedOpponent;
  if (!grantsBonusTurn) {
    state.currentTurnIndex =
      (state.currentTurnIndex + 1) % state.players.length;
    state.consecutiveSixes = 0;
  }

  state.mustRoll = true;
  state.diceRoll = null;
  state.turnDeadline = new Date(Date.now() + 30_000).toISOString();

  return state;
}
