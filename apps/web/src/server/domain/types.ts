export type JourneyStatus = 'scheduled' | 'active' | 'completed' | 'archived';
export type JourneyMemberStatus = 'pending' | 'verified' | 'expired' | 'revoked';
export type VerificationMethod = 'manual' | 'ticket_extracted';
export type CommunityType = 'train_wide' | 'segment';
export type PostType =
  | 'discussion'
  | 'question'
  | 'help'
  | 'travel_tip'
  | 'update'
  | 'game'
  | 'meme'
  | 'poll';
export type NotificationType =
  | 'reply'
  | 'mention'
  | 'dm'
  | 'game_invite'
  | 'game_started'
  | 'journey_update'
  | 'moderation'
  | 'reaction';
export type GameKind = 'tic_tac_toe' | 'connect_four' | 'ludo';
export type GameStatus = 'open' | 'active' | 'finished' | 'cancelled';
export type BadgeCode =
  | 'first_journey'
  | 'frequent_traveller'
  | 'helpful'
  | 'ludo_champ'
  | 'chatty'
  | 'reporter';
export type UserRole = 'user' | 'moderator' | 'admin';
export type TicketScanStatus = 'pending' | 'clean' | 'rejected' | 'error';
export type TicketExtractionStatus = 'draft' | 'confirmed' | 'rejected';
export type MessagingPolicy = 'nobody' | 'same_journey' | 'eligible';
export type CoachVisibility = 'never' | 'coach' | 'coach_berth';
export type ReportStatus = 'open' | 'reviewing' | 'resolved' | 'dismissed';

export interface AuthUser {
  id: string;
  email: string;
  passwordHash: string;
  role?: UserRole;
  createdAt: string;
}

export interface Profile {
  userId: string;
  realName: string;
  age: number | null;
  gender: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AnonymousProfile {
  userId: string;
  publicHandle: string;
  avatarUrl: string | null;
  bio: string | null;
  reputation: number;
  discoveryVisible: boolean;
  messagingPolicy: MessagingPolicy;
  coachVisibility: CoachVisibility;
  onboardingComplete: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Train {
  id: string;
  number: string;
  name: string;
  createdAt: string;
}

export interface Station {
  id: string;
  code: string;
  name: string;
  createdAt: string;
}

export interface TrainRoute {
  id: string;
  trainId: string;
}

export interface TrainRouteStop {
  id: string;
  routeId: string;
  stationId: string;
  stopIndex: number;
}

export interface Journey {
  id: string;
  trainId: string;
  journeyDate: string;
  boardingStationId: string;
  destinationStationId: string;
  normalizedKey: string;
  status: JourneyStatus;
  serviceInstanceId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface JourneyMember {
  id: string;
  userId: string;
  journeyId: string;
  status: JourneyMemberStatus;
  verificationMethod: VerificationMethod;
  expiresAt: string;
  createdAt: string;
}

export interface Community {
  id: string;
  trainId: string;
  journeyDate: string;
  journeyId: string | null;
  segmentId: string | null;
  type: CommunityType;
  slug: string;
  createdAt: string;
}

export interface Post {
  id: string;
  communityId: string;
  authorId: string;
  postType: PostType;
  title: string | null;
  body: string;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  parentId: string | null;
  body: string;
  deletedAt: string | null;
  createdAt: string;
}

export interface PostReaction {
  id: string;
  postId: string;
  userId: string;
  reaction: string;
  createdAt: string;
}

export interface ChatRoom {
  id: string;
  journeyId: string;
  communityId: string;
  createdAt: string;
}

export interface Message {
  id: string;
  roomId: string;
  authorId: string;
  body: string;
  deletedAt: string | null;
  createdAt: string;
}

export interface Ticket {
  id: string;
  userId: string;
  storageKey: string | null;
  mimeType: string;
  byteSize: number;
  scanStatus: TicketScanStatus;
  deletedAt: string | null;
  createdAt: string;
}

export interface TicketExtraction {
  id: string;
  ticketId: string;
  userId: string;
  status: TicketExtractionStatus;
  trainNumber: string | null;
  trainName: string | null;
  journeyDate: string | null;
  boardingStationCode: string | null;
  destinationStationCode: string | null;
  coach: string | null;
  berth: string | null;
  travelClass: string | null;
  pnrHash: string | null;
  confidence: Record<string, number>;
  rawFields: Record<string, unknown>;
  journeyId: string | null;
  confirmedAt: string | null;
  createdAt: string;
}

export interface Block {
  id: string;
  blockerId: string;
  blockedId: string;
  createdAt: string;
}

export interface Report {
  id: string;
  reporterId: string;
  targetType: string;
  targetId: string;
  reason: string;
  status: ReportStatus;
  resolution: string | null;
  createdAt: string;
}

export interface JourneyWithRelations extends Journey {
  train?: Train;
  boardingStation?: Station;
  destinationStation?: Station;
}

export interface PostWithReactionCount extends Post {
  reactionCount: number;
  userReacted: boolean;
}

export interface Conversation {
  id: string;
  journeyId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationMember {
  id: string;
  conversationId: string;
  userId: string;
  createdAt: string;
}

export interface DirectMessage {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  resourceType: string | null;
  resourceId: string | null;
  journeyId: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface GameSession {
  id: string;
  journeyId: string;
  kind: GameKind;
  status: GameStatus;
  hostUserId: string;
  playerIds: string[];
  maxPlayers: number;
  state: Record<string, unknown>;
  winnerId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PollOption {
  id: string;
  label: string;
  votes: string[];
}

export interface Poll {
  id: string;
  postId: string;
  journeyId: string;
  question: string;
  options: PollOption[];
  closesAt: string | null;
  createdAt: string;
}

export interface UserBadge {
  userId: string;
  badgeCode: BadgeCode;
  earnedAt: string;
}

export interface FeedItem {
  id: string;
  kind: 'post' | 'poll' | 'game';
  journeyId: string;
  title: string;
  body: string;
  authorHandle: string | null;
  createdAt: string;
}
