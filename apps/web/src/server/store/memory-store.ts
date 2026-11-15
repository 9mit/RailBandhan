import type {
  AnonymousProfile,
  AuthUser,
  BadgeCode,
  Block,
  ChatRoom,
  Comment,
  Community,
  Conversation,
  ConversationMember,
  DirectMessage,
  GameSession,
  Journey,
  JourneyMember,
  Message,
  Notification,
  Poll,
  Post,
  PostReaction,
  Profile,
  Report,
  ReportStatus,
  Station,
  Ticket,
  TicketExtraction,
  Train,
  TrainRoute,
  TrainRouteStop,
  UserBadge,
  UserRole,
} from "@/server/domain/types";
import { CANONICAL_TRAIN_ROUTES, RailwayGraph } from "@/server/railway/graph";
import { CANONICAL_STATIONS } from "@/server/railway/stations";
import type {
  AuthSessionRecord,
  CreateAuthUserInput,
  CreateCommentInput,
  CreateCommunityInput,
  CreateGameInput,
  CreateJourneyInput,
  CreateJourneyMemberInput,
  CreateMessageInput,
  CreateNotificationInput,
  CreatePostInput,
  CreateTicketExtractionInput,
  CreateTicketInput,
  Store,
} from "@/server/store/types";

// Fixed UUIDs matching supabase/seed/seed.sql
export const SEED_IDS = {
  stations: {
    SC: "11111111-1111-1111-1111-111111111111",
    KZJ: "22222222-2222-2222-2222-222222222222",
    WL: "33333333-3333-3333-3333-333333333333",
    NGP: "44444444-4444-4444-4444-444444444444",
    BPL: "55555555-5555-5555-5555-555555555555",
    NDLS: "66666666-6666-6666-6666-666666666666",
    CSMT: "77777777-7777-7777-7777-777777777777",
    BCT: "88888888-8888-8888-8888-888888888888",
  },
  trains: {
    telangana: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    rajdhani: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
  },
  routes: {
    telangana: "cccccccc-cccc-cccc-cccc-cccccccccccc",
    rajdhani: "dddddddd-dddd-dddd-dddd-dddddddddddd",
  },
} as const;

const SEED_TIMESTAMP = "2026-08-10T00:00:00.000Z";

function nowIso(): string {
  return new Date().toISOString();
}

function newId(): string {
  return crypto.randomUUID();
}

function seedStations(): Station[] {
  const data: Array<[string, string, string]> = [
    [SEED_IDS.stations.SC, "SC", "Secunderabad"],
    [SEED_IDS.stations.KZJ, "KZJ", "Kazipet"],
    [SEED_IDS.stations.WL, "WL", "Warangal"],
    [SEED_IDS.stations.NGP, "NGP", "Nagpur"],
    [SEED_IDS.stations.BPL, "BPL", "Bhopal"],
    [SEED_IDS.stations.NDLS, "NDLS", "New Delhi"],
    [SEED_IDS.stations.CSMT, "CSMT", "Mumbai CSMT"],
    [SEED_IDS.stations.BCT, "BCT", "Mumbai Central"],
  ];

  return data.map(([id, code, name]) => ({
    id,
    code,
    name,
    createdAt: SEED_TIMESTAMP,
  }));
}

function seedTrains(): Train[] {
  return [
    {
      id: SEED_IDS.trains.telangana,
      number: "12723",
      name: "Telangana Express",
      createdAt: SEED_TIMESTAMP,
    },
    {
      id: SEED_IDS.trains.rajdhani,
      number: "12951",
      name: "Mumbai Rajdhani",
      createdAt: SEED_TIMESTAMP,
    },
    {
      id: "tr-12002-id",
      number: "12002",
      name: "Bhopal Shatabdi Express",
      createdAt: SEED_TIMESTAMP,
    },
    {
      id: "tr-22436-id",
      number: "22436",
      name: "Vande Bharat Express (NDLS-BSB)",
      createdAt: SEED_TIMESTAMP,
    },
    {
      id: "tr-12301-id",
      number: "12301",
      name: "Howrah Rajdhani Express",
      createdAt: SEED_TIMESTAMP,
    },
    {
      id: "tr-20901-id",
      number: "20901",
      name: "Vande Bharat Express (MMCT-GNC)",
      createdAt: SEED_TIMESTAMP,
    },
    {
      id: "tr-12004-id",
      number: "12004",
      name: "Lucknow Shatabdi Express",
      createdAt: SEED_TIMESTAMP,
    },
  ];
}

function seedRoutes(): TrainRoute[] {
  return [
    { id: SEED_IDS.routes.telangana, trainId: SEED_IDS.trains.telangana },
    { id: SEED_IDS.routes.rajdhani, trainId: SEED_IDS.trains.rajdhani },
  ];
}

function seedRouteStops(): TrainRouteStop[] {
  const telanganaStops = [
    SEED_IDS.stations.SC,
    SEED_IDS.stations.KZJ,
    SEED_IDS.stations.WL,
    SEED_IDS.stations.NGP,
    SEED_IDS.stations.BPL,
    SEED_IDS.stations.NDLS,
  ];

  const rajdhaniStops = [
    SEED_IDS.stations.BCT,
    SEED_IDS.stations.BPL,
    SEED_IDS.stations.NDLS,
  ];

  const stops: TrainRouteStop[] = [];

  telanganaStops.forEach((stationId, stopIndex) => {
    stops.push({
      id: newId(),
      routeId: SEED_IDS.routes.telangana,
      stationId,
      stopIndex,
    });
  });

  rajdhaniStops.forEach((stationId, stopIndex) => {
    stops.push({
      id: newId(),
      routeId: SEED_IDS.routes.rajdhani,
      stationId,
      stopIndex,
    });
  });

  return stops;
}

class MemoryStore implements Store {
  async getReputationStats(userId: string): Promise<{
    journeys: number;
    reports: number;
    messages: number;
    reputation: number;
  }> {
    return {
      journeys: [...this.journeyMembers.values()].filter(
        (m) => m.userId === userId && m.status === "verified",
      ).length,
      reports: [...this.reports.values()].filter((r) => r.reporterId === userId)
        .length,
      messages:
        [...this.messages.values()].filter(
          (m) => m.authorId === userId && !m.deletedAt,
        ).length +
        [...this.directMessages.values()].filter((m) => m.senderId === userId)
          .length,
      reputation: this.anonymousProfiles.get(userId)?.reputation ?? 0,
    };
  }
  async incrementReputation(userId: string, delta: number): Promise<number> {
    const profile = this.anonymousProfiles.get(userId);
    if (!profile) return 0;
    profile.reputation = Math.max(0, profile.reputation + delta);
    return profile.reputation;
  }
  async listReactionsByPosts(ids: string[]): Promise<PostReaction[]> {
    const wanted = new Set(ids);
    return [...this.reactions.values()].filter((r) => wanted.has(r.postId));
  }
  async healthCheck(): Promise<void> {}
  private authSessions = new Map<string, AuthSessionRecord>();
  private consumedRefreshTokens = new Map<string, string>();
  async transaction<T>(work: () => Promise<T>): Promise<T> {
    // Memory mode is test-only; production always uses a transactional SQL store.
    const snapshot = Object.fromEntries(
      Object.entries(this)
        .filter(([, v]) => v instanceof Map)
        .map(([k, v]) => [k, structuredClone(v)]),
    );
    try {
      return await work();
    } catch (error) {
      Object.assign(this, snapshot);
      throw error;
    }
  }
  async createAuthSession(session: AuthSessionRecord): Promise<void> {
    this.authSessions.set(session.id, { ...session });
  }
  async getAuthSessionByHash(
    hash: string,
    kind: "access" | "refresh" | "used",
  ): Promise<AuthSessionRecord | null> {
    const session =
      kind === "used"
        ? this.authSessions.get(this.consumedRefreshTokens.get(hash) || "")
        : [...this.authSessions.values()].find(
            (s) => (kind === "access" ? s.accessHash : s.refreshHash) === hash,
          );
    return session ? { ...session } : null;
  }
  async rotateAuthSession(
    expectedHash: string,
    session: AuthSessionRecord,
  ): Promise<boolean> {
    const previous = this.authSessions.get(session.id);
    if (
      !previous ||
      previous.revokedAt ||
      previous.refreshHash !== expectedHash ||
      previous.refreshExpiresAt <= new Date().toISOString()
    )
      return false;
    this.consumedRefreshTokens.set(expectedHash, session.id);
    this.authSessions.set(session.id, { ...session });
    return true;
  }
  async revokeAuthSession(id: string): Promise<void> {
    const session = this.authSessions.get(id);
    if (session) session.revokedAt = new Date().toISOString();
  }
  async revokeUserSessions(userId: string): Promise<void> {
    for (const session of this.authSessions.values())
      if (session.userId === userId)
        session.revokedAt = new Date().toISOString();
  }
  async pruneAuthSessions(before: string): Promise<void> {
    for (const session of this.authSessions.values())
      if (session.refreshExpiresAt < before)
        this.authSessions.delete(session.id);
    for (const [hash, id] of this.consumedRefreshTokens)
      if (!this.authSessions.has(id)) this.consumedRefreshTokens.delete(hash);
  }
  private authUsers = new Map<string, AuthUser>();
  private authUsersByEmail = new Map<string, string>();

  private profiles = new Map<string, Profile>();
  private anonymousProfiles = new Map<string, AnonymousProfile>();

  private trains = new Map<string, Train>();
  private stations = new Map<string, Station>();
  private stationsByCode = new Map<string, string>();
  private routes = new Map<string, TrainRoute>();
  private routeStops = new Map<string, TrainRouteStop[]>();

  private journeys = new Map<string, Journey>();
  private journeysByKey = new Map<string, string>();
  private journeyMembers = new Map<string, JourneyMember>();
  private journeyMembersByUser = new Map<string, Set<string>>();
  private journeyMembersByJourney = new Map<string, Set<string>>();

  private communities = new Map<string, Community>();
  private communitiesByJourney = new Map<string, Set<string>>();

  private chatRooms = new Map<string, ChatRoom>();
  private chatRoomsByJourney = new Map<string, string>();

  private posts = new Map<string, Post>();
  private postsByCommunity = new Map<string, Set<string>>();

  private comments = new Map<string, Comment>();
  private commentsByPost = new Map<string, Set<string>>();

  private reactions = new Map<string, PostReaction>();
  private reactionsByPost = new Map<string, Set<string>>();

  private messages = new Map<string, Message>();
  private messagesByRoom = new Map<string, Set<string>>();

  private tickets = new Map<string, Ticket>();
  private ticketExtractions = new Map<string, TicketExtraction>();

  private blocks = new Map<string, Block>();
  private reports = new Map<string, Report>();

  private conversations = new Map<string, Conversation>();
  private conversationMembers = new Map<string, ConversationMember>();
  private conversationsByUser = new Map<string, Set<string>>();
  private conversationPairIndex = new Map<string, string>();

  private directMessages = new Map<string, DirectMessage>();
  private directMessagesByConversation = new Map<string, Set<string>>();

  private notifications = new Map<string, Notification>();
  private notificationsByUser = new Map<string, Set<string>>();

  private games = new Map<string, GameSession>();
  private gamesByJourney = new Map<string, Set<string>>();

  private polls = new Map<string, Poll>();
  private pollsByPost = new Map<string, string>();

  private userBadges = new Map<string, UserBadge>();
  private userBadgesByUser = new Map<string, Set<string>>();

  constructor() {
    this.seedCatalog();
  }

  private seedCatalog(): void {
    for (const station of seedStations()) {
      this.stations.set(station.id, station);
      this.stationsByCode.set(station.code, station.id);
    }

    for (const train of seedTrains()) {
      this.trains.set(train.id, train);
    }

    for (const route of seedRoutes()) {
      this.routes.set(route.id, route);
    }

    const stopsByRoute = new Map<string, TrainRouteStop[]>();
    for (const stop of seedRouteStops()) {
      const existing = stopsByRoute.get(stop.routeId) ?? [];
      existing.push(stop);
      stopsByRoute.set(stop.routeId, existing);
    }

    for (const [routeId, stops] of stopsByRoute) {
      this.routeStops.set(
        routeId,
        stops.sort((a, b) => a.stopIndex - b.stopIndex),
      );
    }
    for (const station of CANONICAL_STATIONS) {
      if (!this.stationsByCode.has(station.code)) {
        const id = `st-${station.code.toLowerCase()}-id`;
        this.stations.set(id, {
          id,
          code: station.code,
          name: station.name,
          createdAt: SEED_TIMESTAMP,
        });
        this.stationsByCode.set(station.code, id);
      }
    }
    for (const route of CANONICAL_TRAIN_ROUTES) {
      let train = [...this.trains.values()].find(
        (t) => t.number === route.trainNumber,
      );
      if (!train) {
        train = {
          id: `tr-${route.trainNumber}-id`,
          number: route.trainNumber,
          name: route.trainName,
          createdAt: SEED_TIMESTAMP,
        };
        this.trains.set(train.id, train);
      }
      let storedRoute = [...this.routes.values()].find(
        (r) => r.trainId === train.id,
      );
      if (!storedRoute) {
        storedRoute = { id: `rt-${route.trainNumber}-id`, trainId: train.id };
        this.routes.set(storedRoute.id, storedRoute);
      }
      this.routeStops.set(
        storedRoute.id,
        route.stops.map((stop) => ({
          id: newId(),
          routeId: storedRoute!.id,
          stationId: this.stationsByCode.get(stop.stationCode)!,
          stopIndex: stop.stopIndex,
        })),
      );
    }
  }

  private memberKey(userId: string, journeyId: string): string {
    return `${userId}:${journeyId}`;
  }

  private conversationPairKey(userA: string, userB: string): string {
    return [userA, userB].sort().join(":");
  }

  private badgeKey(userId: string, badgeCode: BadgeCode): string {
    return `${userId}:${badgeCode}`;
  }

  async createAuthUser(input: CreateAuthUserInput): Promise<AuthUser> {
    const normalizedEmail = input.email.trim().toLowerCase();
    if (this.authUsersByEmail.has(normalizedEmail)) {
      throw new Error("User already exists");
    }

    const user: AuthUser = {
      id: newId(),
      email: normalizedEmail,
      passwordHash: input.passwordHash,
      createdAt: nowIso(),
    };

    this.authUsers.set(user.id, user);
    this.authUsersByEmail.set(normalizedEmail, user.id);
    return user;
  }

  async getAuthUserByEmail(email: string): Promise<AuthUser | null> {
    const id = this.authUsersByEmail.get(email.trim().toLowerCase());
    return id ? (this.authUsers.get(id) ?? null) : null;
  }

  async getAuthUserById(id: string): Promise<AuthUser | null> {
    return this.authUsers.get(id) ?? null;
  }

  async setAuthUserRole(userId: string, role: UserRole): Promise<AuthUser> {
    const user = this.authUsers.get(userId);
    if (!user) {
      throw new Error("User not found");
    }
    const updated = { ...user, role };
    this.authUsers.set(userId, updated);
    return updated;
  }

  async deleteAuthUser(id: string): Promise<void> {
    const user = this.authUsers.get(id);
    if (!user) {
      return;
    }
    this.authUsers.delete(id);
    this.authUsersByEmail.delete(user.email);
  }

  async getProfile(userId: string): Promise<Profile | null> {
    return this.profiles.get(userId) ?? null;
  }

  async upsertProfile(profile: Profile): Promise<Profile> {
    this.profiles.set(profile.userId, profile);
    return profile;
  }

  async deleteProfile(userId: string): Promise<void> {
    this.profiles.delete(userId);
  }

  async getAnonymousProfile(userId: string): Promise<AnonymousProfile | null> {
    return this.anonymousProfiles.get(userId) ?? null;
  }

  async getAnonymousProfilesByUserIds(
    ids: string[],
  ): Promise<AnonymousProfile[]> {
    return ids
      .map((id) => this.anonymousProfiles.get(id))
      .filter((p): p is AnonymousProfile => p !== undefined);
  }

  async getAnonymousProfileByHandle(
    handle: string,
  ): Promise<AnonymousProfile | null> {
    for (const profile of this.anonymousProfiles.values()) {
      if (profile.publicHandle === handle) {
        return profile;
      }
    }
    return null;
  }

  async upsertAnonymousProfile(
    profile: AnonymousProfile,
  ): Promise<AnonymousProfile> {
    this.anonymousProfiles.set(profile.userId, profile);
    return profile;
  }

  async deleteAnonymousProfile(userId: string): Promise<void> {
    this.anonymousProfiles.delete(userId);
  }

  async isHandleTaken(
    handle: string,
    excludeUserId?: string,
  ): Promise<boolean> {
    for (const profile of this.anonymousProfiles.values()) {
      if (profile.publicHandle === handle && profile.userId !== excludeUserId) {
        return true;
      }
    }
    return false;
  }

  async listTrains(): Promise<Train[]> {
    return [...this.trains.values()].sort((a, b) =>
      a.number.localeCompare(b.number),
    );
  }

  async getTrainById(id: string): Promise<Train | null> {
    return this.trains.get(id) ?? null;
  }

  async getTrainByNumber(number: string): Promise<Train | null> {
    const normalized = number.replace(/\s+/g, "");
    for (const train of this.trains.values()) {
      if (train.number === normalized) {
        return train;
      }
    }
    return null;
  }

  async listStations(): Promise<Station[]> {
    return [...this.stations.values()].sort((a, b) =>
      a.code.localeCompare(b.code),
    );
  }

  async getStationById(id: string): Promise<Station | null> {
    return this.stations.get(id) ?? null;
  }

  async getStationByCode(code: string): Promise<Station | null> {
    const id = this.stationsByCode.get(code.toUpperCase());
    return id ? (this.stations.get(id) ?? null) : null;
  }

  async getRouteStopsForTrain(trainId: string): Promise<TrainRouteStop[]> {
    let existingRoute: TrainRoute | undefined;
    for (const r of this.routes.values()) {
      if (r.trainId === trainId) {
        const existing = this.routeStops.get(r.id);
        if (existing && existing.length > 0) {
          return [...existing];
        }
        existingRoute = r;
      }
    }

    const train = this.trains.get(trainId);
    if (!train) return [];

    const canonical = RailwayGraph.getRoute(train.number);
    if (!canonical) return [];

    const effectiveRoute: TrainRoute = existingRoute ?? {
      id: newId(),
      trainId,
    };
    if (!existingRoute) {
      this.routes.set(effectiveRoute.id, effectiveRoute);
    }

    const stops: TrainRouteStop[] = [];
    for (const s of canonical.stops) {
      let st = await this.getStationByCode(s.stationCode);
      if (!st) {
        const newSt: Station = {
          id: newId(),
          code: s.stationCode,
          name: s.stationCode,
          createdAt: nowIso(),
        };
        this.stations.set(newSt.id, newSt);
        this.stationsByCode.set(newSt.code, newSt.id);
        st = newSt;
      }
      stops.push({
        id: newId(),
        routeId: effectiveRoute.id,
        stationId: st.id,
        stopIndex: s.stopIndex,
      });
    }
    this.routeStops.set(effectiveRoute.id, stops);
    return [...stops];
  }

  async createJourney(input: CreateJourneyInput): Promise<Journey> {
    const timestamp = nowIso();
    const journey: Journey = {
      id: newId(),
      trainId: input.trainId,
      journeyDate: input.journeyDate,
      boardingStationId: input.boardingStationId,
      destinationStationId: input.destinationStationId,
      normalizedKey: input.normalizedKey,
      status: input.status ?? "scheduled",
      serviceInstanceId: input.serviceInstanceId ?? null,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.journeys.set(journey.id, journey);
    this.journeysByKey.set(journey.normalizedKey, journey.id);
    return journey;
  }

  async getJourneyById(id: string): Promise<Journey | null> {
    return this.journeys.get(id) ?? null;
  }

  async getJourneyByNormalizedKey(key: string): Promise<Journey | null> {
    const id = this.journeysByKey.get(key);
    return id ? (this.journeys.get(id) ?? null) : null;
  }

  async updateJourney(journey: Journey): Promise<Journey> {
    const updated = { ...journey, updatedAt: nowIso() };
    this.journeys.set(updated.id, updated);
    return updated;
  }

  async listAllJourneys(): Promise<Journey[]> {
    return [...this.journeys.values()];
  }

  async createJourneyMember(
    input: CreateJourneyMemberInput,
  ): Promise<JourneyMember> {
    const key = this.memberKey(input.userId, input.journeyId);
    const existing = this.journeyMembers.get(key);
    if (existing) {
      return existing;
    }

    const member: JourneyMember = {
      id: newId(),
      userId: input.userId,
      journeyId: input.journeyId,
      status: input.status,
      verificationMethod: input.verificationMethod,
      expiresAt: input.expiresAt,
      createdAt: nowIso(),
    };

    this.journeyMembers.set(key, member);

    const userSet = this.journeyMembersByUser.get(input.userId) ?? new Set();
    userSet.add(key);
    this.journeyMembersByUser.set(input.userId, userSet);

    const journeySet =
      this.journeyMembersByJourney.get(input.journeyId) ?? new Set();
    journeySet.add(key);
    this.journeyMembersByJourney.set(input.journeyId, journeySet);

    return member;
  }

  async getJourneyMember(
    userId: string,
    journeyId: string,
  ): Promise<JourneyMember | null> {
    return this.journeyMembers.get(this.memberKey(userId, journeyId)) ?? null;
  }

  async updateJourneyMember(member: JourneyMember): Promise<JourneyMember> {
    this.journeyMembers.set(
      this.memberKey(member.userId, member.journeyId),
      member,
    );
    return member;
  }

  async listJourneyMembersByUser(userId: string): Promise<JourneyMember[]> {
    const keys = this.journeyMembersByUser.get(userId);
    if (!keys) {
      return [];
    }
    return [...keys]
      .map((key) => this.journeyMembers.get(key))
      .filter((m): m is JourneyMember => m !== undefined);
  }

  async listJourneyMembersByJourney(
    journeyId: string,
  ): Promise<JourneyMember[]> {
    const keys = this.journeyMembersByJourney.get(journeyId);
    if (!keys) {
      return [];
    }
    return [...keys]
      .map((key) => this.journeyMembers.get(key))
      .filter((m): m is JourneyMember => m !== undefined);
  }

  async listAllJourneyMembers(): Promise<JourneyMember[]> {
    return [...this.journeyMembers.values()];
  }

  async deleteJourneyMembersByUser(userId: string): Promise<void> {
    const keys = this.journeyMembersByUser.get(userId);
    if (!keys) {
      return;
    }

    for (const key of keys) {
      const member = this.journeyMembers.get(key);
      if (!member) {
        continue;
      }
      this.journeyMembers.delete(key);
      const journeySet = this.journeyMembersByJourney.get(member.journeyId);
      journeySet?.delete(key);
    }
    this.journeyMembersByUser.delete(userId);
  }

  async createCommunity(input: CreateCommunityInput): Promise<Community> {
    const community: Community = {
      id: newId(),
      trainId: input.trainId,
      journeyDate: input.journeyDate,
      journeyId: input.journeyId,
      segmentId: input.segmentId ?? null,
      type: input.type,
      slug: input.slug,
      createdAt: nowIso(),
    };

    this.communities.set(community.id, community);

    if (community.journeyId) {
      const set =
        this.communitiesByJourney.get(community.journeyId) ?? new Set();
      set.add(community.id);
      this.communitiesByJourney.set(community.journeyId, set);
    }

    return community;
  }

  async getCommunityById(id: string): Promise<Community | null> {
    return this.communities.get(id) ?? null;
  }

  async getTrainWideCommunity(journeyId: string): Promise<Community | null> {
    const ids = this.communitiesByJourney.get(journeyId);
    if (!ids) {
      return null;
    }
    for (const id of ids) {
      const community = this.communities.get(id);
      if (community?.type === "train_wide") {
        return community;
      }
    }
    return null;
  }

  async listCommunitiesForJourney(journeyId: string): Promise<Community[]> {
    const ids = this.communitiesByJourney.get(journeyId);
    if (!ids) {
      return [];
    }
    return [...ids]
      .map((id) => this.communities.get(id))
      .filter((c): c is Community => c !== undefined);
  }

  async createChatRoom(
    journeyId: string,
    communityId: string,
  ): Promise<ChatRoom> {
    const existingId = this.chatRoomsByJourney.get(journeyId);
    if (existingId) {
      const existing = this.chatRooms.get(existingId);
      if (existing) {
        return existing;
      }
    }

    const room: ChatRoom = {
      id: newId(),
      journeyId,
      communityId,
      createdAt: nowIso(),
    };

    this.chatRooms.set(room.id, room);
    this.chatRoomsByJourney.set(journeyId, room.id);
    return room;
  }

  async getChatRoomByJourneyId(journeyId: string): Promise<ChatRoom | null> {
    const id = this.chatRoomsByJourney.get(journeyId);
    return id ? (this.chatRooms.get(id) ?? null) : null;
  }

  async createPost(input: CreatePostInput): Promise<Post> {
    const timestamp = nowIso();
    const post: Post = {
      id: newId(),
      communityId: input.communityId,
      authorId: input.authorId,
      postType: input.postType,
      title: input.title ?? null,
      body: input.body,
      deletedAt: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.posts.set(post.id, post);
    const set = this.postsByCommunity.get(post.communityId) ?? new Set();
    set.add(post.id);
    this.postsByCommunity.set(post.communityId, set);
    return post;
  }

  async getPostById(id: string): Promise<Post | null> {
    return this.posts.get(id) ?? null;
  }

  async listPostsByCommunity(communityId: string): Promise<Post[]> {
    const ids = this.postsByCommunity.get(communityId);
    if (!ids) {
      return [];
    }
    return [...ids]
      .map((id) => this.posts.get(id))
      .filter((p): p is Post => p !== undefined && p.deletedAt === null)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async deletePost(postId: string): Promise<void> {
    const post = this.posts.get(postId);
    if (post) {
      post.deletedAt = nowIso();
      this.posts.set(postId, post);
    }
  }

  async deletePostsByAuthor(userId: string): Promise<void> {
    for (const post of this.posts.values()) {
      if (post.authorId === userId) {
        post.deletedAt = nowIso();
        this.posts.set(post.id, post);
      }
    }
  }

  async createComment(input: CreateCommentInput): Promise<Comment> {
    const comment: Comment = {
      id: newId(),
      postId: input.postId,
      authorId: input.authorId,
      parentId: input.parentId ?? null,
      body: input.body,
      deletedAt: null,
      createdAt: nowIso(),
    };

    this.comments.set(comment.id, comment);
    const set = this.commentsByPost.get(comment.postId) ?? new Set();
    set.add(comment.id);
    this.commentsByPost.set(comment.postId, set);
    return comment;
  }

  async listCommentsByPost(postId: string): Promise<Comment[]> {
    const ids = this.commentsByPost.get(postId);
    if (!ids) {
      return [];
    }
    return [...ids]
      .map((id) => this.comments.get(id))
      .filter((c): c is Comment => c !== undefined && c.deletedAt === null)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async deleteCommentsByAuthor(userId: string): Promise<void> {
    for (const comment of this.comments.values()) {
      if (comment.authorId === userId) {
        comment.deletedAt = nowIso();
        this.comments.set(comment.id, comment);
      }
    }
  }

  async getReaction(
    postId: string,
    userId: string,
    reaction: string,
  ): Promise<PostReaction | null> {
    for (const r of this.reactions.values()) {
      if (
        r.postId === postId &&
        r.userId === userId &&
        r.reaction === reaction
      ) {
        return r;
      }
    }
    return null;
  }

  async createReaction(
    postId: string,
    userId: string,
    reaction: string,
  ): Promise<PostReaction> {
    const entry: PostReaction = {
      id: newId(),
      postId,
      userId,
      reaction,
      createdAt: nowIso(),
    };

    this.reactions.set(entry.id, entry);
    const set = this.reactionsByPost.get(postId) ?? new Set();
    set.add(entry.id);
    this.reactionsByPost.set(postId, set);
    return entry;
  }

  async deleteReaction(id: string): Promise<void> {
    const reaction = this.reactions.get(id);
    if (!reaction) {
      return;
    }
    this.reactions.delete(id);
    const set = this.reactionsByPost.get(reaction.postId);
    set?.delete(id);
  }

  async listReactionsByPost(postId: string): Promise<PostReaction[]> {
    const ids = this.reactionsByPost.get(postId);
    if (!ids) {
      return [];
    }
    return [...ids]
      .map((id) => this.reactions.get(id))
      .filter((r): r is PostReaction => r !== undefined);
  }

  async deleteReactionsByUser(userId: string): Promise<void> {
    const toDelete: string[] = [];
    for (const [id, reaction] of this.reactions) {
      if (reaction.userId === userId) {
        toDelete.push(id);
      }
    }
    for (const id of toDelete) {
      const reaction = this.reactions.get(id);
      if (reaction) {
        this.reactions.delete(id);
        this.reactionsByPost.get(reaction.postId)?.delete(id);
      }
    }
  }

  async createMessage(input: CreateMessageInput): Promise<Message> {
    const message: Message = {
      id: newId(),
      roomId: input.roomId,
      authorId: input.authorId,
      body: input.body,
      deletedAt: null,
      createdAt: nowIso(),
    };

    this.messages.set(message.id, message);
    const set = this.messagesByRoom.get(message.roomId) ?? new Set();
    set.add(message.id);
    this.messagesByRoom.set(message.roomId, set);
    return message;
  }

  async listMessagesByRoom(roomId: string): Promise<Message[]> {
    const ids = this.messagesByRoom.get(roomId);
    if (!ids) {
      return [];
    }
    return [...ids]
      .map((id) => this.messages.get(id))
      .filter((m): m is Message => m !== undefined && m.deletedAt === null)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async deleteMessagesByAuthor(userId: string): Promise<void> {
    for (const message of this.messages.values()) {
      if (message.authorId === userId) {
        message.deletedAt = nowIso();
        this.messages.set(message.id, message);
      }
    }
  }

  async createTicket(input: CreateTicketInput): Promise<Ticket> {
    const ticket: Ticket = {
      id: newId(),
      userId: input.userId,
      storageKey: input.storageKey,
      mimeType: input.mimeType,
      byteSize: input.byteSize,
      scanStatus: input.scanStatus ?? "pending",
      deletedAt: null,
      createdAt: nowIso(),
    };

    this.tickets.set(ticket.id, ticket);
    return ticket;
  }

  async getTicketById(id: string): Promise<Ticket | null> {
    return this.tickets.get(id) ?? null;
  }

  async updateTicket(ticket: Ticket): Promise<Ticket> {
    this.tickets.set(ticket.id, ticket);
    return ticket;
  }

  async listTicketsForRetention(): Promise<Ticket[]> {
    return [...this.tickets.values()];
  }

  async deleteTicketsByUser(userId: string): Promise<void> {
    for (const ticket of this.tickets.values()) {
      if (ticket.userId === userId) {
        this.tickets.delete(ticket.id);
      }
    }
  }

  async createTicketExtraction(
    input: CreateTicketExtractionInput,
  ): Promise<TicketExtraction> {
    const extraction: TicketExtraction = {
      id: newId(),
      ticketId: input.ticketId,
      userId: input.userId,
      status: input.status ?? "draft",
      trainNumber: input.trainNumber ?? null,
      trainName: input.trainName ?? null,
      journeyDate: input.journeyDate ?? null,
      boardingStationCode: input.boardingStationCode ?? null,
      destinationStationCode: input.destinationStationCode ?? null,
      coach: input.coach ?? null,
      berth: input.berth ?? null,
      travelClass: input.travelClass ?? null,
      pnrHash: input.pnrHash ?? null,
      confidence: input.confidence ?? {},
      rawFields: input.rawFields ?? {},
      journeyId: input.journeyId ?? null,
      confirmedAt: null,
      createdAt: nowIso(),
    };

    this.ticketExtractions.set(extraction.id, extraction);
    return extraction;
  }

  async getTicketExtractionById(id: string): Promise<TicketExtraction | null> {
    return this.ticketExtractions.get(id) ?? null;
  }

  async updateTicketExtraction(
    extraction: TicketExtraction,
  ): Promise<TicketExtraction> {
    this.ticketExtractions.set(extraction.id, extraction);
    return extraction;
  }

  async findTicketExtractionByPnrHash(
    pnrHash: string,
    excludeUserId?: string,
  ): Promise<TicketExtraction | null> {
    for (const extraction of this.ticketExtractions.values()) {
      if (
        extraction.pnrHash === pnrHash &&
        extraction.status === "confirmed" &&
        extraction.userId !== excludeUserId
      ) {
        return extraction;
      }
    }
    return null;
  }

  async deleteTicketExtractionsByUser(userId: string): Promise<void> {
    for (const [id, extraction] of this.ticketExtractions) {
      if (extraction.userId === userId) {
        this.ticketExtractions.delete(id);
      }
    }
  }

  async createBlock(blockerId: string, blockedId: string): Promise<Block> {
    const block: Block = {
      id: newId(),
      blockerId,
      blockedId,
      createdAt: nowIso(),
    };
    this.blocks.set(block.id, block);
    return block;
  }

  async listBlocksByBlocker(blockerId: string): Promise<Block[]> {
    return [...this.blocks.values()].filter((b) => b.blockerId === blockerId);
  }

  async isBlockedEitherWay(a: string, b: string): Promise<boolean> {
    for (const block of this.blocks.values()) {
      if (
        (block.blockerId === a && block.blockedId === b) ||
        (block.blockerId === b && block.blockedId === a)
      ) {
        return true;
      }
    }
    return false;
  }

  async listBlocksInvolving(userId: string): Promise<Block[]> {
    return [...this.blocks.values()].filter(
      (b) => b.blockerId === userId || b.blockedId === userId,
    );
  }

  async deleteBlocksByUser(userId: string): Promise<void> {
    for (const [id, block] of this.blocks) {
      if (block.blockerId === userId || block.blockedId === userId) {
        this.blocks.delete(id);
      }
    }
  }

  async createReport(
    reporterId: string,
    targetType: string,
    targetId: string,
    reason: string,
  ): Promise<Report> {
    const report: Report = {
      id: newId(),
      reporterId,
      targetType,
      targetId,
      reason,
      status: "open",
      resolution: null,
      createdAt: nowIso(),
    };
    this.reports.set(report.id, report);
    return report;
  }

  async listReports(status?: ReportStatus): Promise<Report[]> {
    const all = [...this.reports.values()];
    if (!status) {
      return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    return all
      .filter((r) => r.status === status)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async updateReport(report: Report): Promise<Report> {
    this.reports.set(report.id, report);
    return report;
  }

  async deleteReportsByUser(userId: string): Promise<void> {
    for (const [id, report] of this.reports) {
      if (report.reporterId === userId) {
        this.reports.delete(id);
      }
    }
  }

  async findConversationBetween(
    userA: string,
    userB: string,
  ): Promise<Conversation | null> {
    const pairKey = this.conversationPairKey(userA, userB);
    const conversationId = this.conversationPairIndex.get(pairKey);
    return conversationId
      ? (this.conversations.get(conversationId) ?? null)
      : null;
  }

  async createConversation(
    participantIds: [string, string],
    journeyId: string,
  ): Promise<Conversation> {
    const existing = await this.findConversationBetween(
      participantIds[0],
      participantIds[1],
    );
    if (existing) {
      return existing;
    }

    const timestamp = nowIso();
    const conversation: Conversation = {
      id: newId(),
      journeyId,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.conversations.set(conversation.id, conversation);
    this.conversationPairIndex.set(
      this.conversationPairKey(participantIds[0], participantIds[1]),
      conversation.id,
    );

    for (const userId of participantIds) {
      const member: ConversationMember = {
        id: newId(),
        conversationId: conversation.id,
        userId,
        createdAt: timestamp,
      };
      this.conversationMembers.set(member.id, member);
      const set = this.conversationsByUser.get(userId) ?? new Set();
      set.add(conversation.id);
      this.conversationsByUser.set(userId, set);
    }

    return conversation;
  }

  async getConversation(id: string): Promise<Conversation | null> {
    return this.conversations.get(id) ?? null;
  }

  async listConversationsForUser(userId: string): Promise<Conversation[]> {
    const ids = this.conversationsByUser.get(userId);
    if (!ids) {
      return [];
    }
    return [...ids]
      .map((id) => this.conversations.get(id))
      .filter((c): c is Conversation => c !== undefined)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async listConversationParticipants(
    conversationId: string,
  ): Promise<string[]> {
    const participants: string[] = [];
    for (const member of this.conversationMembers.values()) {
      if (member.conversationId === conversationId) {
        participants.push(member.userId);
      }
    }
    return participants;
  }

  async addDirectMessage(
    conversationId: string,
    senderId: string,
    body: string,
  ): Promise<DirectMessage> {
    const message: DirectMessage = {
      id: newId(),
      conversationId,
      senderId,
      body,
      createdAt: nowIso(),
    };

    this.directMessages.set(message.id, message);
    const set =
      this.directMessagesByConversation.get(conversationId) ?? new Set();
    set.add(message.id);
    this.directMessagesByConversation.set(conversationId, set);

    const conversation = this.conversations.get(conversationId);
    if (conversation) {
      this.conversations.set(conversationId, {
        ...conversation,
        updatedAt: message.createdAt,
      });
    }

    return message;
  }

  async listDirectMessages(conversationId: string): Promise<DirectMessage[]> {
    const ids = this.directMessagesByConversation.get(conversationId);
    if (!ids) {
      return [];
    }
    return [...ids]
      .map((id) => this.directMessages.get(id))
      .filter((m): m is DirectMessage => m !== undefined)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async listDmMessages(conversationId: string): Promise<DirectMessage[]> {
    return this.listDirectMessages(conversationId);
  }

  async createNotification(
    input: CreateNotificationInput,
  ): Promise<Notification> {
    const notification: Notification = {
      id: newId(),
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      resourceType: input.resourceType ?? null,
      resourceId: input.resourceId ?? null,
      journeyId: input.journeyId ?? null,
      readAt: null,
      createdAt: nowIso(),
    };

    this.notifications.set(notification.id, notification);
    const set = this.notificationsByUser.get(notification.userId) ?? new Set();
    set.add(notification.id);
    this.notificationsByUser.set(notification.userId, set);
    return notification;
  }

  async listNotifications(userId: string): Promise<Notification[]> {
    const ids = this.notificationsByUser.get(userId);
    if (!ids) {
      return [];
    }
    return [...ids]
      .map((id) => this.notifications.get(id))
      .filter((n): n is Notification => n !== undefined)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async markNotificationRead(
    id: string,
    userId: string,
  ): Promise<Notification | null> {
    const notification = this.notifications.get(id);
    if (!notification || notification.userId !== userId) {
      return null;
    }
    const updated = { ...notification, readAt: nowIso() };
    this.notifications.set(id, updated);
    return updated;
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    const ids = this.notificationsByUser.get(userId);
    if (!ids) {
      return;
    }
    const timestamp = nowIso();
    for (const id of ids) {
      const notification = this.notifications.get(id);
      if (notification && !notification.readAt) {
        this.notifications.set(id, { ...notification, readAt: timestamp });
      }
    }
  }

  async countUnreadNotifications(userId: string): Promise<number> {
    const ids = this.notificationsByUser.get(userId);
    if (!ids) {
      return 0;
    }
    let count = 0;
    for (const id of ids) {
      const notification = this.notifications.get(id);
      if (notification && !notification.readAt) {
        count += 1;
      }
    }
    return count;
  }

  async createGame(input: CreateGameInput): Promise<GameSession> {
    const timestamp = nowIso();
    const game: GameSession = {
      id: newId(),
      journeyId: input.journeyId,
      kind: input.kind,
      status: "open",
      hostUserId: input.hostUserId,
      playerIds: [input.hostUserId],
      maxPlayers: input.maxPlayers ?? 2,
      state: input.state,
      winnerId: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.games.set(game.id, game);
    const set = this.gamesByJourney.get(game.journeyId) ?? new Set();
    set.add(game.id);
    this.gamesByJourney.set(game.journeyId, set);
    return game;
  }

  async getGame(id: string): Promise<GameSession | null> {
    return this.games.get(id) ?? null;
  }

  async updateGame(game: GameSession): Promise<GameSession> {
    const updated = { ...game, updatedAt: nowIso() };
    this.games.set(updated.id, updated);
    return updated;
  }

  async listGamesByJourney(journeyId: string): Promise<GameSession[]> {
    const ids = this.gamesByJourney.get(journeyId);
    if (!ids) {
      return [];
    }
    return [...ids]
      .map((id) => this.games.get(id))
      .filter((g): g is GameSession => g !== undefined)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async createPoll(poll: Poll): Promise<Poll> {
    this.polls.set(poll.id, poll);
    this.pollsByPost.set(poll.postId, poll.id);
    return poll;
  }

  async getPollByPostId(postId: string): Promise<Poll | null> {
    const id = this.pollsByPost.get(postId);
    return id ? (this.polls.get(id) ?? null) : null;
  }

  async votePoll(
    pollId: string,
    optionId: string,
    userId: string,
  ): Promise<Poll> {
    const poll = this.polls.get(pollId);
    if (!poll) {
      throw new Error("Poll not found");
    }

    const options = poll.options.map((option) => {
      const votes = option.votes.filter((v) => v !== userId);
      if (option.id === optionId) {
        votes.push(userId);
      }
      return { ...option, votes };
    });

    const updated: Poll = { ...poll, options };
    this.polls.set(pollId, updated);
    return updated;
  }

  async getPoll(pollId: string): Promise<Poll | null> {
    return this.polls.get(pollId) ?? null;
  }

  async getPollVote(
    pollId: string,
    userId: string,
  ): Promise<{ optionId: string } | null> {
    const poll = this.polls.get(pollId);
    if (!poll) {
      return null;
    }
    for (const option of poll.options) {
      if (option.votes.includes(userId)) {
        return { optionId: option.id };
      }
    }
    return null;
  }

  async awardBadge(
    userId: string,
    badgeCode: BadgeCode,
  ): Promise<UserBadge | null> {
    const key = this.badgeKey(userId, badgeCode);
    if (this.userBadges.has(key)) {
      return this.userBadges.get(key) ?? null;
    }

    const badge: UserBadge = {
      userId,
      badgeCode,
      earnedAt: nowIso(),
    };

    this.userBadges.set(key, badge);
    const set = this.userBadgesByUser.get(userId) ?? new Set();
    set.add(key);
    this.userBadgesByUser.set(userId, set);
    return badge;
  }

  async listBadges(userId: string): Promise<UserBadge[]> {
    const keys = this.userBadgesByUser.get(userId);
    if (!keys) {
      return [];
    }
    return [...keys]
      .map((key) => this.userBadges.get(key))
      .filter((b): b is UserBadge => b !== undefined);
  }

  async anonymizeUserContent(userId: string): Promise<void> {
    await this.deletePostsByAuthor(userId);
    await this.deleteCommentsByAuthor(userId);
    await this.deleteMessagesByAuthor(userId);
    await this.deleteReactionsByUser(userId);
    await this.deleteTicketsByUser(userId);
    await this.deleteTicketExtractionsByUser(userId);
    await this.deleteJourneyMembersByUser(userId);
    await this.deleteBlocksByUser(userId);
    await this.deleteReportsByUser(userId);

    const conversationIds = [...(this.conversationsByUser.get(userId) ?? [])];
    for (const conversationId of conversationIds) {
      const messageIds =
        this.directMessagesByConversation.get(conversationId) ?? new Set();
      for (const messageId of messageIds) {
        this.directMessages.delete(messageId);
      }
      this.directMessagesByConversation.delete(conversationId);
      for (const [key, member] of this.conversationMembers) {
        if (member.conversationId === conversationId) {
          this.conversationMembers.delete(key);
          const otherSet = this.conversationsByUser.get(member.userId);
          otherSet?.delete(conversationId);
        }
      }
      this.conversations.delete(conversationId);
    }
    this.conversationsByUser.delete(userId);
    for (const [pairKey, conversationId] of this.conversationPairIndex) {
      if (conversationIds.includes(conversationId)) {
        this.conversationPairIndex.delete(pairKey);
      }
    }

    for (const [id, notification] of this.notifications) {
      if (
        notification.userId === userId ||
        (notification.resourceId &&
          conversationIds.includes(notification.resourceId))
      ) {
        this.notifications.delete(id);
        this.notificationsByUser.get(notification.userId)?.delete(id);
      }
    }
    this.notificationsByUser.delete(userId);

    for (const [id, game] of this.games) {
      if (game.hostUserId === userId || game.playerIds.includes(userId)) {
        this.games.delete(id);
        this.gamesByJourney.get(game.journeyId)?.delete(id);
      }
    }

    for (const poll of this.polls.values()) {
      poll.options = poll.options.map((option) => ({
        ...option,
        votes: option.votes.filter((voteUserId) => voteUserId !== userId),
      }));
    }

    const badgeKeys = [...(this.userBadgesByUser.get(userId) ?? [])];
    for (const key of badgeKeys) {
      this.userBadges.delete(key);
    }
    this.userBadgesByUser.delete(userId);

    await this.deleteProfile(userId);
    await this.deleteAnonymousProfile(userId);
    await this.deleteAuthUser(userId);
  }

  reset(): void {
    this.authSessions.clear();
    this.consumedRefreshTokens.clear();
    resetMemoryStore();
  }
}

let singleton: MemoryStore | null = null;

export function getMemoryStore(): MemoryStore {
  if (!singleton) {
    singleton = new MemoryStore();
  }
  return singleton;
}

export function resetMemoryStore(): void {
  singleton = new MemoryStore();
}
