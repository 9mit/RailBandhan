import type {
  AnonymousProfile,
  Block,
  Conversation,
  DirectMessage,
  FeedItem,
  GameSession,
  JourneyMember,
  JourneyWithRelations,
  Message,
  Notification,
  Poll,
  Post,
  PostWithReactionCount,
  Profile,
  Report,
  Station,
  TicketExtraction,
} from "@/server/domain/types";
import { getStore } from "@/server/store";
import type { AdvancedLiveStatus } from "@/server/trains/provider";

export function serializeStation(station: Station) {
  return {
    id: station.id,
    code: station.code,
    name: station.name,
  };
}

export function serializeAnonymousProfile(profile: AnonymousProfile) {
  return {
    public_handle: profile.publicHandle,
    avatar_url: profile.avatarUrl,
    bio: profile.bio,
    reputation: profile.reputation,
    discovery_visible: profile.discoveryVisible,
    messaging_policy: profile.messagingPolicy,
    coach_visibility: profile.coachVisibility,
    onboarding_complete: profile.onboardingComplete,
  };
}

export function serializePrivateProfile(profile: Profile) {
  return {
    real_name: profile.realName,
    age: profile.age,
    gender: profile.gender,
  };
}

export function serializeMembership(member: JourneyMember) {
  return {
    id: member.id,
    status: member.status,
    verification_method: member.verificationMethod,
    expires_at: member.expiresAt,
  };
}

export function serializeJourney(
  journey: JourneyWithRelations,
  membership?: JourneyMember | null,
) {
  return {
    id: journey.id,
    journey_date: journey.journeyDate,
    status: journey.status,
    train: journey.train
      ? {
          id: journey.train.id,
          number: journey.train.number,
          name: journey.train.name,
        }
      : undefined,
    boarding_station: journey.boardingStation
      ? serializeStation(journey.boardingStation)
      : undefined,
    destination_station: journey.destinationStation
      ? serializeStation(journey.destinationStation)
      : undefined,
    membership: membership ? serializeMembership(membership) : undefined,
  };
}

export function serializePost(
  post: Post | PostWithReactionCount,
  authorHandle?: string | null,
  authorAvatarUrl?: string | null,
) {
  const withReactions = post as PostWithReactionCount;
  return {
    id: post.id,
    body: post.body,
    title: post.title,
    post_type: post.postType,
    author_handle: authorHandle ?? undefined,
    author_avatar_url: authorAvatarUrl ?? undefined,
    created_at: post.createdAt,
    reaction_count: withReactions.reactionCount ?? 0,
    user_reacted: withReactions.userReacted ?? false,
  };
}

export function serializeMessage(
  message: Message,
  authorHandle?: string | null,
) {
  return {
    id: message.id,
    body: message.body,
    author_handle: authorHandle ?? undefined,
    created_at: message.createdAt,
  };
}

export function serializeTicketExtraction(extraction: TicketExtraction) {
  return {
    id: extraction.id,
    status: extraction.status,
    train_number: extraction.trainNumber,
    train_name: extraction.trainName,
    journey_date: extraction.journeyDate,
    boarding_station_code: extraction.boardingStationCode,
    destination_station_code: extraction.destinationStationCode,
    coach: extraction.coach,
    berth: extraction.berth,
    travel_class: extraction.travelClass,
    confidence: extraction.confidence,
  };
}

export async function serializeLiveStatus(
  journeyId: string,
  liveStatus: AdvancedLiveStatus,
) {
  const store = getStore();
  const journey = await store.getJourneyById(journeyId);

  let currentStation: Station | null = null;
  const progressPercent = liveStatus.progressPercent;

  const observedStation = liveStatus.stations.find(
    (s) => s.stopIndex === liveStatus.currentStopIndex,
  );
  if (observedStation)
    currentStation = (await store.getStationByCode(
      observedStation.stationCode,
    )) ?? {
      id: observedStation.stationCode,
      code: observedStation.stationCode,
      name: observedStation.stationName,
      createdAt: new Date().toISOString(),
    };

  const statusLabel =
    liveStatus.status === "on_time"
      ? "on time"
      : liveStatus.status === "delayed"
        ? "delayed"
        : liveStatus.status;

  const stations = liveStatus.stations.map((station) => {
    let status: "passed" | "current" | "upcoming" = "upcoming";
    if (station.stopIndex < liveStatus.currentStopIndex) status = "passed";
    else if (station.stopIndex === liveStatus.currentStopIndex)
      status = "current";

    return {
      code: station.stationCode,
      name: station.stationName,
      stop_index: station.stopIndex,
      eta: station.eta,
      status,
    };
  });

  const nextStationRaw = liveStatus.stations.find(
    (s) => s.stopIndex === liveStatus.nextStopIndex,
  );

  return {
    status: statusLabel,
    delay_minutes: liveStatus.delayMinutes,
    current_station: currentStation ? serializeStation(currentStation) : null,
    next_station: nextStationRaw
      ? { code: nextStationRaw.stationCode, name: nextStationRaw.stationName }
      : null,
    progress_percent: progressPercent,
    message: `${liveStatus.trainName} (${liveStatus.trainNumber}) is ${statusLabel}`,
    next_stop_index: liveStatus.nextStopIndex,
    distance_travelled_km: liveStatus.distanceTravelledKm,
    distance_remaining_km: liveStatus.distanceRemainingKm,
    platform: liveStatus.platformHint,
    stations,
    last_updated: liveStatus.lastUpdated,
    data_source: liveStatus.sourceProvider ?? "unknown",
    confidence: liveStatus.confidence ?? "estimated",
    observed_at: liveStatus.observedAt ?? null,
  };
}

export async function authorHandleForUser(
  userId: string,
): Promise<string | null> {
  const store = getStore();
  const anon = await store.getAnonymousProfile(userId);
  return anon?.publicHandle ?? null;
}

export function serializeConversation(
  conversation: Conversation & { participantIds?: [string, string] },
  otherHandle: string | null,
  lastBody?: string | null,
) {
  return {
    id: conversation.id,
    journey_id: conversation.journeyId,
    other_handle: otherHandle,
    other_participant_handle: otherHandle ?? "Passenger",
    last_message: lastBody ?? null,
    last_message_preview: lastBody ?? null,
    updated_at: conversation.updatedAt,
  };
}

export function serializeDmMessage(
  message: DirectMessage,
  authorHandle?: string | null,
) {
  return {
    id: message.id,
    body: message.body,
    author_handle: authorHandle ?? undefined,
    sender_handle: authorHandle ?? undefined,
    created_at: message.createdAt,
  };
}

export function serializeNotification(notification: Notification) {
  let link: string | null = null;
  if (notification.resourceType === "conversation" && notification.resourceId) {
    link = `/dm/${notification.resourceId}`;
  } else if (notification.resourceType === "game" && notification.resourceId) {
    link = `/games/${notification.resourceId}`;
  } else if (
    notification.resourceType === "journey" &&
    notification.resourceId
  ) {
    link = `/journeys/${notification.resourceId}`;
  } else if (notification.resourceType === "post" && notification.journeyId) {
    link = `/journeys/${notification.journeyId}`;
  } else if (notification.resourceType && notification.resourceId) {
    link = `/${notification.resourceType}/${notification.resourceId}`;
  }

  return {
    id: notification.id,
    kind: notification.type,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    link,
    read_at: notification.readAt,
    created_at: notification.createdAt,
  };
}

export function serializeReport(report: Report) {
  return {
    id: report.id,
    target_type: report.targetType,
    target_id: report.targetId,
    reason: report.reason,
    status: report.status,
    resolution: report.resolution,
    created_at: report.createdAt,
  };
}

export function serializeBlock(block: Block, blockedHandle?: string | null) {
  return {
    id: block.id,
    blocked_user_id: block.blockedId,
    blocked_handle: blockedHandle ?? undefined,
    created_at: block.createdAt,
  };
}

function currentTurnUserId(game: GameSession): string | null {
  if (game.kind === "tic_tac_toe") {
    const state = game.state as {
      next?: "X" | "O";
      players?: { X: string; O: string | null };
    };
    const symbol = state.next;
    if (symbol && state.players) {
      return state.players[symbol];
    }
  } else if (game.kind === "connect_four") {
    const state = game.state as {
      next?: 0 | 1;
      players?: [string, string | null];
    };
    if (state.players && state.next !== undefined) {
      return state.players[state.next] ?? null;
    }
  } else if (game.kind === "ludo") {
    const state = game.state as {
      currentTurnIndex?: number;
      players?: Array<{ userId: string }>;
    };
    if (state.players && state.currentTurnIndex !== undefined) {
      return state.players[state.currentTurnIndex]?.userId ?? null;
    }
  }
  return null;
}

export async function serializeGame(game: GameSession, viewerId?: string) {
  const turnUserId = currentTurnUserId(game);
  const isPlayer = Boolean(viewerId && game.playerIds.includes(viewerId));
  let yourMark: string | number | null = null;
  let redactedState: Record<string, unknown> = { ...game.state };
  let boardState: Record<string, unknown> = {};

  let player1Id: string | null = game.hostUserId;
  let player2Id: string | null =
    game.playerIds.find((id) => id !== game.hostUserId) ?? null;

  if (game.kind === "tic_tac_toe") {
    const state = game.state as {
      board?: (string | null)[];
      next?: "X" | "O";
      players?: { X?: string; O?: string | null };
    };
    if (state.players?.X) player1Id = state.players.X;
    if (state.players?.O) player2Id = state.players.O;

    if (viewerId && state.players?.X === viewerId) yourMark = "X";
    if (viewerId && state.players?.O === viewerId) yourMark = "O";

    const board = Array.isArray(state.board)
      ? state.board
      : Array(9).fill(null);
    boardState = { grid: board };

    redactedState = {
      board,
      grid: board,
      next: state.next,
      players: {
        X:
          state.players?.X === viewerId
            ? "you"
            : state.players?.X
              ? "opponent"
              : null,
        O:
          state.players?.O === viewerId
            ? "you"
            : state.players?.O
              ? "opponent"
              : null,
      },
    };
  } else if (game.kind === "connect_four") {
    const state = game.state as {
      columns?: unknown[][];
      next?: number;
      players?: [string, string | null];
      rows?: number;
      cols?: number;
    };
    if (state.players?.[0]) player1Id = state.players[0];
    if (state.players?.[1]) player2Id = state.players[1];

    if (viewerId && state.players?.[0] === viewerId) yourMark = 0;
    if (viewerId && state.players?.[1] === viewerId) yourMark = 1;

    const mappedColumns = Array.isArray(state.columns)
      ? state.columns.map((col) =>
          Array.isArray(col)
            ? col.map((cell) => (cell === 0 ? "X" : cell === 1 ? "O" : null))
            : [],
        )
      : Array.from({ length: 7 }, () => []);

    boardState = { columns: mappedColumns };

    redactedState = {
      columns: mappedColumns,
      raw_columns: state.columns,
      next: state.next,
      rows: state.rows ?? 6,
      cols: state.cols ?? 7,
      players: [
        state.players?.[0] === viewerId
          ? "you"
          : state.players?.[0]
            ? "opponent"
            : null,
        state.players?.[1] === viewerId
          ? "you"
          : state.players?.[1]
            ? "opponent"
            : null,
      ],
    };
  } else if (game.kind === "ludo") {
    const state = game.state as {
      players?: Array<{ userId: string; color: string; tokens: unknown[] }>;
      currentTurnIndex?: number;
      diceRoll?: number | null;
      mustRoll?: boolean;
      winner?: string | null;
    };
    const playerIndex =
      state.players?.findIndex((p) => p.userId === viewerId) ?? -1;
    if (playerIndex >= 0) yourMark = playerIndex;
    redactedState = {
      players: state.players?.map((p) => ({
        color: p.color,
        tokens: p.tokens,
        is_you: p.userId === viewerId,
      })),
      currentTurnIndex: state.currentTurnIndex,
      diceRoll: state.diceRoll,
      mustRoll: state.mustRoll,
    };
  }

  const [player1Handle, player2Handle, currentTurnHandle, winnerHandle] =
    await Promise.all([
      player1Id ? authorHandleForUser(player1Id) : Promise.resolve(null),
      player2Id ? authorHandleForUser(player2Id) : Promise.resolve(null),
      turnUserId ? authorHandleForUser(turnUserId) : Promise.resolve(null),
      game.winnerId
        ? authorHandleForUser(game.winnerId)
        : Promise.resolve(null),
    ]);

  let status: string = game.status;
  if (game.status === "open") {
    status = "waiting";
  } else if (game.status === "active") {
    status = "in_progress";
  } else if (game.status === "finished") {
    status = game.winnerId ? "completed" : "draw";
  }

  const gameType =
    game.kind === "connect_four"
      ? "connectfour"
      : game.kind === "tic_tac_toe"
        ? "tictactoe"
        : "ludo";

  return {
    id: game.id,
    journey_id: game.journeyId,
    kind: game.kind,
    game_type: gameType,
    status,
    raw_status: game.status,
    is_player: isPlayer,
    is_host: Boolean(viewerId && game.hostUserId === viewerId),
    is_your_turn: Boolean(viewerId && turnUserId === viewerId),
    you_won: Boolean(viewerId && game.winnerId === viewerId),
    your_mark: yourMark,
    player_count: game.playerIds.length,
    player_1_handle: player1Handle ?? undefined,
    player_2_handle: player2Handle ?? undefined,
    current_turn_handle: currentTurnHandle ?? undefined,
    winner_handle: winnerHandle ?? undefined,
    board_state: boardState,
    state: redactedState,
    created_at: game.createdAt,
    updated_at: game.updatedAt,
  };
}

export function serializePoll(poll: Poll, votedOptionId?: string | null) {
  return {
    id: poll.id,
    journey_id: poll.journeyId,
    question: poll.question,
    options: poll.options.map((o) => ({
      id: o.id,
      label: o.label,
      vote_count: o.votes.length,
    })),
    voted_option_id: votedOptionId ?? null,
    created_at: poll.createdAt,
  };
}

export function serializeFeedItem(item: FeedItem) {
  return {
    id: item.id,
    kind: item.kind,
    journey_id: item.journeyId,
    title: item.title,
    body: item.body,
    author_handle: item.authorHandle,
    created_at: item.createdAt,
  };
}

export function serializeBadge(badge: {
  slug: string;
  name: string;
  description: string;
  earned_at: string;
}) {
  return {
    slug: badge.slug,
    name: badge.name,
    description: badge.description,
    earned_at: badge.earned_at,
  };
}
