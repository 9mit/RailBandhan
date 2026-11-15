import type { LudoState } from "./ludo";

export type { GameKind, GameSession, GameStatus } from "@/server/domain/types";

export interface TicTacToeState {
  board: (null | "X" | "O")[];
  next: "X" | "O";
  players: { X: string; O: string | null };
}

export interface ConnectFourState {
  columns: number[][];
  next: 0 | 1;
  players: [string, string | null];
  rows: number;
  cols: number;
}

export type { LudoState };

export type TicTacToeMove = { index: number };
export type ConnectFourMove = { column: number };
export type LudoMove = { action: "roll" } | { action: "move"; tokenId: number };
export type GameMove = TicTacToeMove | ConnectFourMove | LudoMove;
