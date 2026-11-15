import { describe, it, expect, beforeEach } from 'vitest';
import { createUser } from '@/server/auth/session';
import { createManualJourney } from '@/server/journeys/service';
import { createGame, joinGame, makeMove, getGame } from '@/server/games/engine';
import { resetStore } from '@/server/store';
import { getTestJourneyDate } from './test-utils';

describe('Multiplayer Games Engine (Tic-Tac-Toe & Connect Four)', () => {
  beforeEach(() => {
    resetStore();
  });

  it('runs a complete game of Tic-Tac-Toe with move validation, turn switching, and victory declaration', async () => {
    const p1 = await createUser('player1@railbandhan.in', 'Password1234!');
    const p2 = await createUser('player2@railbandhan.in', 'Password1234!');
    const testDate = getTestJourneyDate();

    const journey = await createManualJourney(p1.id, {
      trainNumber: '12723',
      journeyDate: testDate,
      fromCode: 'SC',
      toCode: 'NDLS',
    });
    await createManualJourney(p2.id, {
      trainNumber: '12723',
      journeyDate: testDate,
      fromCode: 'SC',
      toCode: 'NDLS',
    });

    // P1 creates Tic-Tac-Toe
    const game = await createGame(p1.id, journey.id, 'tic_tac_toe');
    expect(game.status).toBe('open');

    // P2 joins
    const joined = await joinGame(p2.id, game.id);
    expect(joined.status).toBe('active');
    expect(joined.playerIds).toHaveLength(2);

    // Turn 1: P1 plays X at cell 0
    let state = await makeMove(p1.id, game.id, { cell: 0 });
    expect(state.status).toBe('active');

    // P1 attempts out-of-turn move -> Rejected
    await expect(makeMove(p1.id, game.id, { cell: 1 })).rejects.toThrow('Not your turn');

    // Turn 2: P2 plays O at cell 3
    state = await makeMove(p2.id, game.id, { cell: 3 });

    // Turn 3: P1 plays X at cell 1
    state = await makeMove(p1.id, game.id, { cell: 1 });

    // Turn 4: P2 plays O at cell 4
    state = await makeMove(p2.id, game.id, { cell: 4 });

    // Turn 5: P1 plays X at cell 2 (Winning top row: 0, 1, 2)
    state = await makeMove(p1.id, game.id, { cell: 2 });
    expect(state.status).toBe('finished');
    expect(state.winnerId).toBe(p1.id);
  });

  it('runs a Connect Four game with valid column drops and turn alternation', async () => {
    const p1 = await createUser('c4_p1@railbandhan.in', 'Password1234!');
    const p2 = await createUser('c4_p2@railbandhan.in', 'Password1234!');
    const testDate = getTestJourneyDate();

    const journey = await createManualJourney(p1.id, {
      trainNumber: '12723',
      journeyDate: testDate,
      fromCode: 'SC',
      toCode: 'NDLS',
    });
    await createManualJourney(p2.id, {
      trainNumber: '12723',
      journeyDate: testDate,
      fromCode: 'SC',
      toCode: 'NDLS',
    });

    const game = await createGame(p1.id, journey.id, 'connect_four');
    await joinGame(p2.id, game.id);

    // P1 drops in column 3
    let state = await makeMove(p1.id, game.id, { column: 3 });
    expect(state.status).toBe('active');

    // P2 drops in column 3
    state = await makeMove(p2.id, game.id, { column: 3 });
    expect(state.status).toBe('active');

    // Out-of-bounds column -> Rejected
    await expect(makeMove(p1.id, game.id, { column: 10 })).rejects.toThrow('Illegal column');
  });

  it('serializes game with full UI contracts (board_state, handles, and status normalization)', async () => {
    const { completeOnboarding } = await import('@/server/profiles/service');
    const { serializeGame } = await import('@/server/api/serializers');

    const p1 = await createUser('p1_ser@railbandhan.in', 'Password1234!');
    const p2 = await createUser('p2_ser@railbandhan.in', 'Password1234!');
    await completeOnboarding({ userId: p1.id, realName: 'Player One', publicHandle: 'RiderOne' });
    await completeOnboarding({ userId: p2.id, realName: 'Player Two', publicHandle: 'RiderTwo' });

    const journey = await createManualJourney(p1.id, {
      trainNumber: '12723',
      journeyDate: getTestJourneyDate(),
      fromCode: 'SC',
      toCode: 'NDLS',
    });
    await createManualJourney(p2.id, {
      trainNumber: '12723',
      journeyDate: getTestJourneyDate(),
      fromCode: 'SC',
      toCode: 'NDLS',
    });

    const game = await createGame(p1.id, journey.id, 'tic_tac_toe');
    await joinGame(p2.id, game.id);
    const activeGame = await makeMove(p1.id, game.id, { cell: 0 });

    const serialized = await serializeGame(activeGame, p1.id);
    expect(serialized.status).toBe('in_progress');
    expect(serialized.game_type).toBe('tictactoe');
    expect(serialized.player_1_handle).toBe('RiderOne');
    expect(serialized.player_2_handle).toBe('RiderTwo');
    expect(serialized.current_turn_handle).toBe('RiderTwo');
    expect(serialized.board_state).toBeDefined();
    expect((serialized.board_state as any).grid[0]).toBe('X');
    expect(serialized.is_your_turn).toBe(false);
  });
});
