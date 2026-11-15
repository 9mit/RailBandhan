export type AnonymousProfile = {
  public_handle: string;
  avatar_url?: string | null;
  bio?: string | null;
  reputation?: number;
  discovery_visible?: boolean;
  messaging_policy?: "nobody" | "same_journey" | "eligible";
  coach_visibility?: "never" | "coach" | "coach_berth";
  onboarding_complete?: boolean;
};

export type PrivacySettings = {
  discovery_visible?: boolean;
  allow_discovery?: boolean;
  messaging_policy?: "nobody" | "same_journey" | "eligible" | "everyone";
  coach_visibility?: "never" | "coach" | "coach_berth";
};

export type PrivateProfile = {
  real_name?: string;
  full_name?: string;
  age?: number | null;
  gender?: string | null;
};

export type Station = {
  id: string;
  code: string;
  name: string;
};

export type Train = {
  id: string;
  number: string;
  name: string;
};

export type JourneyMembership = {
  id: string;
  status: "pending" | "verified" | "expired" | "revoked";
  verification_method: "manual" | "ticket_extracted";
  expires_at: string;
};

export type Journey = {
  id: string;
  journey_date: string;
  status: "scheduled" | "active" | "completed" | "archived";
  train?: Train;
  boarding_station?: Station;
  destination_station?: Station;
  membership?: JourneyMembership;
};

export type JourneyDetail = Journey & {
  membership: JourneyMembership;
};

export type JourneyStatus = {
  status: string;
  delay_minutes?: number | null;
  current_station?: Station | null;
  progress_percent?: number;
  message?: string;
};

export type TicketExtraction = {
  id: string;
  status: "draft" | "confirmed" | "rejected";
  train_number?: string | null;
  train_name?: string | null;
  journey_date?: string | null;
  boarding_station_code?: string | null;
  destination_station_code?: string | null;
  coach?: string | null;
  berth?: string | number | null;
  travel_class?: string | null;
  confidence?: Record<string, number>;
};

export type ExtractedTicket = TicketExtraction;

export type Post = {
  id: string;
  body: string;
  title?: string | null;
  post_type?: string;
  author_handle?: string;
  created_at: string;
  reaction_count?: number;
  user_reacted?: boolean;
};

export type Message = {
  id: string;
  body: string;
  author_handle?: string;
  sender_handle?: string;
  created_at: string;
};

export type DmMessage = Message;

export type Conversation = {
  id: string;
  journey_id: string;
  other_handle: string | null;
  other_participant_handle?: string;
  last_message: string | null;
  last_message_preview?: string | null;
  last_message_at?: string;
  updated_at: string;
};

export type Notification = {
  id: string;
  kind?: string;
  type?: string;
  title: string;
  body: string;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

export type NotificationItem = Notification;

export type DiscoveredPassenger = {
  handle: string;
  reputation: number;
  bio: string | null;
};

export type Game = {
  id: string;
  journey_id: string;
  kind: "tic_tac_toe" | "connect_four" | "ludo";
  game_type?: "tictactoe" | "connectfour" | "tic_tac_toe" | "connect_four" | "ludo";
  status: "open" | "active" | "finished" | "cancelled" | "waiting" | "in_progress" | "completed" | "draw";
  is_player?: boolean;
  is_host?: boolean;
  is_your_turn?: boolean;
  you_won?: boolean;
  your_mark?: string | number | null;
  player_count?: number;
  player_1_handle?: string;
  player_2_handle?: string | null;
  current_turn_handle?: string;
  winner_handle?: string | null;
  board_state?: Record<string, unknown>;
  state: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type GameSession = Game;

export type PollOption = {
  id: string;
  label: string;
  vote_count: number;
};

export type Poll = {
  id: string;
  journey_id: string;
  question: string;
  options: PollOption[];
  voted_option_id?: string | null;
  created_at: string;
};

export type FeedItem = {
  id: string;
  kind: "post" | "poll" | "game";
  journey_id: string;
  title: string;
  body: string;
  author_handle: string | null;
  created_at: string;
};

export type Badge = {
  slug: string;
  name: string;
  description: string;
  earned_at: string;
};

export type Report = {
  id: string;
  target_type: string;
  target_id: string;
  reason: string;
  details?: string;
  reporter_handle?: string;
  status: string;
  resolution: string | null;
  created_at: string;
};

export type ModerationReport = Report;

export type Block = {
  id: string;
  blocked_user_id: string;
  blocked_handle?: string;
  created_at: string;
};

