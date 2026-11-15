import type {
  AnonymousProfile,
  AuthUser,
  BadgeCode,
  Block,
  ChatRoom,
  Comment,
  Community,
  Conversation,
  DirectMessage,
  GameSession,
  Journey,
  JourneyMember,
  Message,
  Notification,
  NotificationType,
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
  TrainRouteStop,
  UserBadge,
  UserRole,
} from "@/server/domain/types";

export interface CreateAuthUserInput {
  email: string;
  passwordHash: string;
}

export interface CreateJourneyInput {
  trainId: string;
  journeyDate: string;
  boardingStationId: string;
  destinationStationId: string;
  normalizedKey: string;
  status?: Journey["status"];
  serviceInstanceId?: string | null;
}

export interface CreateJourneyMemberInput {
  userId: string;
  journeyId: string;
  status: JourneyMember["status"];
  verificationMethod: JourneyMember["verificationMethod"];
  expiresAt: string;
}

export interface CreateCommunityInput {
  trainId: string;
  journeyDate: string;
  journeyId: string | null;
  segmentId?: string | null;
  type: Community["type"];
  slug: string;
}

export interface CreatePostInput {
  communityId: string;
  authorId: string;
  postType: Post["postType"];
  title?: string | null;
  body: string;
}

export interface CreateCommentInput {
  postId: string;
  authorId: string;
  parentId?: string | null;
  body: string;
}

export interface CreateMessageInput {
  roomId: string;
  authorId: string;
  body: string;
}

export interface CreateTicketInput {
  userId: string;
  storageKey: string | null;
  mimeType: string;
  byteSize: number;
  scanStatus?: Ticket["scanStatus"];
}

export interface CreateTicketExtractionInput {
  ticketId: string;
  userId: string;
  status?: TicketExtraction["status"];
  trainNumber?: string | null;
  trainName?: string | null;
  journeyDate?: string | null;
  boardingStationCode?: string | null;
  destinationStationCode?: string | null;
  coach?: string | null;
  berth?: string | null;
  travelClass?: string | null;
  pnrHash?: string | null;
  confidence?: Record<string, number>;
  rawFields?: Record<string, unknown>;
  journeyId?: string | null;
}

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  resourceType?: string | null;
  resourceId?: string | null;
  journeyId?: string | null;
}

export interface CreateGameInput {
  journeyId: string;
  kind: GameSession["kind"];
  hostUserId: string;
  maxPlayers?: number;
  state: Record<string, unknown>;
}

export interface AuthSessionRecord {
  id: string;
  userId: string;
  accessHash: string;
  refreshHash: string;
  accessExpiresAt: string;
  refreshExpiresAt: string;
  revokedAt: string | null;
  createdAt: string;
}

export interface Store {
  healthCheck(): Promise<void>;
  getReputationStats(userId: string): Promise<{
    journeys: number;
    reports: number;
    messages: number;
    reputation: number;
  }>;
  incrementReputation(userId: string, delta: number): Promise<number>;
  listReactionsByPosts(postIds: string[]): Promise<PostReaction[]>;
  transaction<T>(work: () => Promise<T>): Promise<T>;
  createAuthSession(session: AuthSessionRecord): Promise<void>;
  getAuthSessionByHash(
    hash: string,
    kind: "access" | "refresh" | "used",
  ): Promise<AuthSessionRecord | null>;
  rotateAuthSession(
    expectedHash: string,
    session: AuthSessionRecord,
  ): Promise<boolean>;
  revokeAuthSession(id: string): Promise<void>;
  revokeUserSessions(userId: string): Promise<void>;
  pruneAuthSessions(before: string): Promise<void>;

  // Auth users
  createAuthUser(input: CreateAuthUserInput): Promise<AuthUser>;
  getAuthUserByEmail(email: string): Promise<AuthUser | null>;
  getAuthUserById(id: string): Promise<AuthUser | null>;
  setAuthUserRole(userId: string, role: UserRole): Promise<AuthUser>;
  deleteAuthUser(id: string): Promise<void>;

  // Profiles
  getProfile(userId: string): Promise<Profile | null>;
  upsertProfile(profile: Profile): Promise<Profile>;
  deleteProfile(userId: string): Promise<void>;

  getAnonymousProfile(userId: string): Promise<AnonymousProfile | null>;
  getAnonymousProfilesByUserIds(ids: string[]): Promise<AnonymousProfile[]>;
  getAnonymousProfileByHandle(handle: string): Promise<AnonymousProfile | null>;
  upsertAnonymousProfile(profile: AnonymousProfile): Promise<AnonymousProfile>;
  deleteAnonymousProfile(userId: string): Promise<void>;
  isHandleTaken(handle: string, excludeUserId?: string): Promise<boolean>;

  // Catalog
  listTrains(): Promise<Train[]>;
  getTrainById(id: string): Promise<Train | null>;
  getTrainByNumber(number: string): Promise<Train | null>;

  listStations(): Promise<Station[]>;
  getStationById(id: string): Promise<Station | null>;
  getStationByCode(code: string): Promise<Station | null>;

  getRouteStopsForTrain(trainId: string): Promise<TrainRouteStop[]>;

  // Journeys
  createJourney(input: CreateJourneyInput): Promise<Journey>;
  getJourneyById(id: string): Promise<Journey | null>;
  getJourneyByNormalizedKey(key: string): Promise<Journey | null>;
  updateJourney(journey: Journey): Promise<Journey>;
  listAllJourneys(): Promise<Journey[]>;

  createJourneyMember(input: CreateJourneyMemberInput): Promise<JourneyMember>;
  getJourneyMember(
    userId: string,
    journeyId: string,
  ): Promise<JourneyMember | null>;
  updateJourneyMember(member: JourneyMember): Promise<JourneyMember>;
  listJourneyMembersByUser(userId: string): Promise<JourneyMember[]>;
  listJourneyMembersByJourney(journeyId: string): Promise<JourneyMember[]>;
  listAllJourneyMembers(): Promise<JourneyMember[]>;
  deleteJourneyMembersByUser(userId: string): Promise<void>;

  // Communities & chat
  createCommunity(input: CreateCommunityInput): Promise<Community>;
  getCommunityById(id: string): Promise<Community | null>;
  getTrainWideCommunity(journeyId: string): Promise<Community | null>;
  listCommunitiesForJourney(journeyId: string): Promise<Community[]>;

  createChatRoom(journeyId: string, communityId: string): Promise<ChatRoom>;
  getChatRoomByJourneyId(journeyId: string): Promise<ChatRoom | null>;

  // Posts, comments, reactions
  createPost(input: CreatePostInput): Promise<Post>;
  getPostById(id: string): Promise<Post | null>;
  listPostsByCommunity(communityId: string): Promise<Post[]>;
  deletePost(postId: string): Promise<void>;
  deletePostsByAuthor(userId: string): Promise<void>;

  createComment(input: CreateCommentInput): Promise<Comment>;
  listCommentsByPost(postId: string): Promise<Comment[]>;
  deleteCommentsByAuthor(userId: string): Promise<void>;

  getReaction(
    postId: string,
    userId: string,
    reaction: string,
  ): Promise<PostReaction | null>;
  createReaction(
    postId: string,
    userId: string,
    reaction: string,
  ): Promise<PostReaction>;
  deleteReaction(id: string): Promise<void>;
  listReactionsByPost(postId: string): Promise<PostReaction[]>;
  deleteReactionsByUser(userId: string): Promise<void>;

  // Messages
  createMessage(input: CreateMessageInput): Promise<Message>;
  listMessagesByRoom(roomId: string): Promise<Message[]>;
  deleteMessagesByAuthor(userId: string): Promise<void>;

  // Tickets
  createTicket(input: CreateTicketInput): Promise<Ticket>;
  getTicketById(id: string): Promise<Ticket | null>;
  updateTicket(ticket: Ticket): Promise<Ticket>;
  listTicketsForRetention(): Promise<Ticket[]>;
  deleteTicketsByUser(userId: string): Promise<void>;

  createTicketExtraction(
    input: CreateTicketExtractionInput,
  ): Promise<TicketExtraction>;
  getTicketExtractionById(id: string): Promise<TicketExtraction | null>;
  updateTicketExtraction(
    extraction: TicketExtraction,
  ): Promise<TicketExtraction>;
  findTicketExtractionByPnrHash(
    pnrHash: string,
    excludeUserId?: string,
  ): Promise<TicketExtraction | null>;
  deleteTicketExtractionsByUser(userId: string): Promise<void>;

  // Moderation
  createBlock(blockerId: string, blockedId: string): Promise<Block>;
  listBlocksByBlocker(blockerId: string): Promise<Block[]>;
  isBlockedEitherWay(a: string, b: string): Promise<boolean>;
  listBlocksInvolving(userId: string): Promise<Block[]>;
  deleteBlocksByUser(userId: string): Promise<void>;

  createReport(
    reporterId: string,
    targetType: string,
    targetId: string,
    reason: string,
  ): Promise<Report>;
  listReports(status?: ReportStatus): Promise<Report[]>;
  updateReport(report: Report): Promise<Report>;
  deleteReportsByUser(userId: string): Promise<void>;

  // Conversations & DMs
  findConversationBetween(
    userA: string,
    userB: string,
  ): Promise<Conversation | null>;
  createConversation(
    participantIds: [string, string],
    journeyId: string,
  ): Promise<Conversation>;
  getConversation(id: string): Promise<Conversation | null>;
  listConversationsForUser(userId: string): Promise<Conversation[]>;
  listConversationParticipants(conversationId: string): Promise<string[]>;
  addDirectMessage(
    conversationId: string,
    senderId: string,
    body: string,
  ): Promise<DirectMessage>;
  listDirectMessages(conversationId: string): Promise<DirectMessage[]>;
  listDmMessages(conversationId: string): Promise<DirectMessage[]>;

  // Notifications
  createNotification(input: CreateNotificationInput): Promise<Notification>;
  listNotifications(userId: string): Promise<Notification[]>;
  markNotificationRead(
    id: string,
    userId: string,
  ): Promise<Notification | null>;
  markAllNotificationsRead(userId: string): Promise<void>;
  countUnreadNotifications(userId: string): Promise<number>;

  // Games
  createGame(input: CreateGameInput): Promise<GameSession>;
  getGame(id: string): Promise<GameSession | null>;
  updateGame(game: GameSession): Promise<GameSession>;
  listGamesByJourney(journeyId: string): Promise<GameSession[]>;

  // Polls
  createPoll(poll: Poll): Promise<Poll>;
  getPollByPostId(postId: string): Promise<Poll | null>;
  votePoll(pollId: string, optionId: string, userId: string): Promise<Poll>;
  getPoll(pollId: string): Promise<Poll | null>;
  getPollVote(
    pollId: string,
    userId: string,
  ): Promise<{ optionId: string } | null>;

  // Badges
  awardBadge(userId: string, badgeCode: BadgeCode): Promise<UserBadge | null>;
  listBadges(userId: string): Promise<UserBadge[]>;

  // Account cleanup
  anonymizeUserContent(userId: string): Promise<void>;
}
