import { describe, it, expect } from 'vitest';
import {
  initialLudoState,
  rollLudoDice,
  getValidLudoMoves,
  moveLudoToken,
  START_POSITIONS,
  SAFE_SQUARES,
} from '@/server/games/ludo';

describe('Server-Authoritative Deterministic Ludo Engine', () => {
  it('initializes a 2-4 player Ludo game with all tokens in yard', () => {
    const state = initialLudoState(['user_1', 'user_2']);
    expect(state.players.length).toBe(2);
    expect(state.players[0].color).toBe('red');
    expect(state.players[1].color).toBe('green');
    expect(state.players[0].tokens.length).toBe(4);
    expect(state.players[0].tokens.every((t) => t.position === -1)).toBe(true);
    expect(state.mustRoll).toBe(true);
    expect(state.winner).toBeNull();
  });

  it('generates secure server-side dice roll between 1 and 6', () => {
    const state = initialLudoState(['user_1', 'user_2']);
    const rolls = new Set<number>();

    for (let i = 0; i < 50; i += 1) {
      const testState = initialLudoState(['user_1', 'user_2']);
      const { roll } = rollLudoDice(testState, 'user_1');
      expect(roll).toBeGreaterThanOrEqual(1);
      expect(roll).toBeLessThanOrEqual(6);
      rolls.add(roll);
    }
    // Verify RNG coverage
    expect(rolls.size).toBeGreaterThan(1);
  });

  it('allows moving token out of yard only when rolling a 6', () => {
    const state = initialLudoState(['user_1', 'user_2']);
    const redPlayer = state.players[0];

    // Non-6 roll with all tokens in yard yields no valid moves
    const nonSixMoves = getValidLudoMoves(redPlayer, 4);
    expect(nonSixMoves.length).toBe(0);

    // 6 roll allows taking any token out of yard
    const sixMoves = getValidLudoMoves(redPlayer, 6);
    expect(sixMoves.length).toBe(4);

    // Simulate moving token 0 out of yard
    state.diceRoll = 6;
    state.mustRoll = false;
    const nextState = moveLudoToken(state, 'user_1', 0);
    const token0 = nextState.players[0].tokens[0];

    expect(token0.position).toBe(START_POSITIONS.red); // Tile 0
    expect(token0.stepCount).toBe(1);
    // Player gets a bonus turn after rolling 6
    expect(nextState.currentTurnIndex).toBe(0);
    expect(nextState.mustRoll).toBe(true);
  });

  it('captures opponent token on non-safe tiles and sends it back to yard', () => {
    const state = initialLudoState(['user_1', 'user_2']);

    // Place Red token at position 5 (non-safe tile)
    state.players[0].tokens[0].position = 5;
    state.players[0].tokens[0].stepCount = 6;

    // Place Green token at position 0 (start of Red track, non-safe for Green)
    state.players[1].tokens[0].position = 0;
    state.players[1].tokens[0].stepCount = 40;

    // Green player's turn to move 5 steps and land on Red token
    state.currentTurnIndex = 1;
    state.diceRoll = 5;
    state.mustRoll = false;

    // Move green token to position 5
    const afterMove = moveLudoToken(state, 'user_2', 0);

    // Green token is now at position 5
    expect(afterMove.players[1].tokens[0].position).toBe(5);

    // Red token was captured and returned to yard (-1)
    expect(afterMove.players[0].tokens[0].position).toBe(-1);
    expect(afterMove.players[0].tokens[0].stepCount).toBe(0);

    // Green player gets bonus turn for capturing
    expect(afterMove.currentTurnIndex).toBe(1);
  });

  it('detects win condition when all 4 tokens reach home', () => {
    const state = initialLudoState(['user_1', 'user_2']);
    const red = state.players[0];

    // Pre-fill 3 tokens at home, 4th token at step 56 (1 step away from home)
    red.tokens[0].isHome = true;
    red.tokens[0].position = 105;
    red.tokens[1].isHome = true;
    red.tokens[1].position = 105;
    red.tokens[2].isHome = true;
    red.tokens[2].position = 105;

    red.tokens[3].position = 104;
    red.tokens[3].stepCount = 56;

    state.diceRoll = 1;
    state.mustRoll = false;

    const finishedState = moveLudoToken(state, 'user_1', 3);
    expect(finishedState.players[0].tokens[3].isHome).toBe(true);
    expect(finishedState.winner).toBe('user_1');
  });
});
