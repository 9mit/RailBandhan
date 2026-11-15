// Canonical application schema. Applied by the migration runner and local SQLite.
export const CORE_SCHEMA = `
      CREATE TABLE IF NOT EXISTS auth_users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS profiles (
        user_id TEXT PRIMARY KEY,
        real_name TEXT NOT NULL,
        age INTEGER,
        gender TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS anonymous_profiles (
        user_id TEXT PRIMARY KEY,
        public_handle TEXT NOT NULL UNIQUE,
        avatar_url TEXT,
        bio TEXT,
        reputation INTEGER NOT NULL DEFAULT 0,
        discovery_visible INTEGER NOT NULL DEFAULT 0,
        messaging_policy TEXT NOT NULL DEFAULT 'same_journey',
        coach_visibility TEXT NOT NULL DEFAULT 'never',
        onboarding_complete INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS stations (
        id TEXT PRIMARY KEY,
        code TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS trains (
        id TEXT PRIMARY KEY,
        number TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS train_routes (
        id TEXT PRIMARY KEY,
        train_id TEXT NOT NULL UNIQUE,
        FOREIGN KEY (train_id) REFERENCES trains(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS train_route_stops (
        id TEXT PRIMARY KEY,
        route_id TEXT NOT NULL,
        station_id TEXT NOT NULL,
        stop_index INTEGER NOT NULL,
        UNIQUE (route_id, stop_index),
        UNIQUE (route_id, station_id),
        FOREIGN KEY (route_id) REFERENCES train_routes(id) ON DELETE CASCADE,
        FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS journeys (
        id TEXT PRIMARY KEY,
        train_id TEXT NOT NULL,
        journey_date TEXT NOT NULL,
        boarding_station_id TEXT NOT NULL,
        destination_station_id TEXT NOT NULL,
        normalized_key TEXT NOT NULL UNIQUE,
        status TEXT NOT NULL DEFAULT 'scheduled',
        service_instance_id TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (train_id) REFERENCES trains(id),
        FOREIGN KEY (boarding_station_id) REFERENCES stations(id),
        FOREIGN KEY (destination_station_id) REFERENCES stations(id)
      );

      CREATE TABLE IF NOT EXISTS journey_segments (
        id TEXT PRIMARY KEY,
        train_id TEXT NOT NULL,
        journey_date TEXT NOT NULL,
        boarding_station_id TEXT NOT NULL,
        destination_station_id TEXT NOT NULL,
        UNIQUE (train_id, journey_date, boarding_station_id, destination_station_id),
        FOREIGN KEY (train_id) REFERENCES trains(id),
        FOREIGN KEY (boarding_station_id) REFERENCES stations(id),
        FOREIGN KEY (destination_station_id) REFERENCES stations(id)
      );

      CREATE TABLE IF NOT EXISTS communities (
        id TEXT PRIMARY KEY,
        train_id TEXT NOT NULL,
        journey_date TEXT NOT NULL,
        journey_id TEXT,
        segment_id TEXT,
        type TEXT NOT NULL,
        slug TEXT NOT NULL,
        created_at TEXT NOT NULL,
        UNIQUE (train_id, journey_date, type, segment_id),
        FOREIGN KEY (train_id) REFERENCES trains(id),
        FOREIGN KEY (journey_id) REFERENCES journeys(id) ON DELETE SET NULL,
        FOREIGN KEY (segment_id) REFERENCES journey_segments(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS journey_members (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        journey_id TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        verification_method TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL,
        UNIQUE (user_id, journey_id),
        FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE,
        FOREIGN KEY (journey_id) REFERENCES journeys(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS tickets (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        storage_key TEXT,
        mime_type TEXT NOT NULL,
        byte_size INTEGER NOT NULL,
        scan_status TEXT NOT NULL DEFAULT 'pending',
        deleted_at TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS ticket_extractions (
        id TEXT PRIMARY KEY,
        ticket_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'draft',
        train_number TEXT,
        train_name TEXT,
        journey_date TEXT,
        boarding_station_code TEXT,
        destination_station_code TEXT,
        coach TEXT,
        berth TEXT,
        travel_class TEXT,
        pnr_hash TEXT,
        confidence TEXT NOT NULL DEFAULT '{}',
        raw_fields TEXT NOT NULL DEFAULT '{}',
        journey_id TEXT,
        confirmed_at TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE,
        FOREIGN KEY (journey_id) REFERENCES journeys(id)
      );

      CREATE TABLE IF NOT EXISTS posts (
        id TEXT PRIMARY KEY,
        community_id TEXT NOT NULL,
        author_id TEXT NOT NULL,
        post_type TEXT NOT NULL DEFAULT 'discussion',
        title TEXT,
        body TEXT NOT NULL,
        deleted_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE,
        FOREIGN KEY (author_id) REFERENCES auth_users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS comments (
        id TEXT PRIMARY KEY,
        post_id TEXT NOT NULL,
        author_id TEXT NOT NULL,
        parent_id TEXT,
        body TEXT NOT NULL,
        deleted_at TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
        FOREIGN KEY (author_id) REFERENCES auth_users(id) ON DELETE CASCADE,
        FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS post_reactions (
        id TEXT PRIMARY KEY,
        post_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        reaction TEXT NOT NULL DEFAULT 'like',
        created_at TEXT NOT NULL,
        UNIQUE (post_id, user_id, reaction),
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS chat_rooms (
        id TEXT PRIMARY KEY,
        journey_id TEXT NOT NULL UNIQUE,
        community_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (journey_id) REFERENCES journeys(id) ON DELETE CASCADE,
        FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        room_id TEXT NOT NULL,
        author_id TEXT NOT NULL,
        body TEXT NOT NULL,
        deleted_at TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE,
        FOREIGN KEY (author_id) REFERENCES auth_users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS blocks (
        id TEXT PRIMARY KEY,
        blocker_id TEXT NOT NULL,
        blocked_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        UNIQUE (blocker_id, blocked_id),
        FOREIGN KEY (blocker_id) REFERENCES auth_users(id) ON DELETE CASCADE,
        FOREIGN KEY (blocked_id) REFERENCES auth_users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS reports (
        id TEXT PRIMARY KEY,
        reporter_id TEXT NOT NULL,
        target_type TEXT NOT NULL,
        target_id TEXT NOT NULL,
        reason TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'open',
        resolution TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (reporter_id) REFERENCES auth_users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        journey_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (journey_id) REFERENCES journeys(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS conversation_members (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        UNIQUE (conversation_id, user_id),
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS direct_messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL,
        sender_id TEXT NOT NULL,
        body TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
        FOREIGN KEY (sender_id) REFERENCES auth_users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        resource_type TEXT,
        resource_id TEXT,
        journey_id TEXT,
        read_at TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE,
        FOREIGN KEY (journey_id) REFERENCES journeys(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS game_sessions (
        id TEXT PRIMARY KEY,
        journey_id TEXT NOT NULL,
        kind TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'open',
        host_user_id TEXT NOT NULL,
        player_ids TEXT NOT NULL DEFAULT '[]',
        max_players INTEGER NOT NULL DEFAULT 2,
        state TEXT NOT NULL DEFAULT '{}',
        winner_id TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (journey_id) REFERENCES journeys(id) ON DELETE CASCADE,
        FOREIGN KEY (host_user_id) REFERENCES auth_users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS polls (
        id TEXT PRIMARY KEY,
        post_id TEXT NOT NULL UNIQUE,
        journey_id TEXT NOT NULL,
        question TEXT NOT NULL,
        options TEXT NOT NULL DEFAULT '[]',
        closes_at TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
        FOREIGN KEY (journey_id) REFERENCES journeys(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS user_badges (
        user_id TEXT NOT NULL,
        badge_code TEXT NOT NULL,
        earned_at TEXT NOT NULL,
        PRIMARY KEY (user_id, badge_code),
        FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS railway_canonical_stations (
        code TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        hindi_name TEXT,
        aliases TEXT NOT NULL DEFAULT '[]',
        latitude REAL,
        longitude REAL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS railway_canonical_routes (
        train_number TEXT NOT NULL,
        station_code TEXT NOT NULL,
        stop_index INTEGER NOT NULL,
        distance_km INTEGER NOT NULL DEFAULT 0,
        scheduled_arrival TEXT,
        scheduled_departure TEXT,
        PRIMARY KEY (train_number, stop_index),
        FOREIGN KEY (station_code) REFERENCES railway_canonical_stations(code) ON DELETE CASCADE
      );

 CREATE TABLE IF NOT EXISTS auth_sessions (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL,
  access_hash TEXT NOT NULL UNIQUE, refresh_hash TEXT NOT NULL UNIQUE,
  access_expires_at TEXT NOT NULL, refresh_expires_at TEXT NOT NULL,
  revoked_at TEXT, created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE
 );
 CREATE TABLE IF NOT EXISTS consumed_refresh_tokens (
  token_hash TEXT PRIMARY KEY, session_id TEXT NOT NULL,
  FOREIGN KEY (session_id) REFERENCES auth_sessions(id) ON DELETE CASCADE
 );
 CREATE UNIQUE INDEX IF NOT EXISTS idx_train_community ON communities(journey_id,type) WHERE segment_id IS NULL;
 CREATE UNIQUE INDEX IF NOT EXISTS idx_confirmed_pnr ON ticket_extractions(pnr_hash) WHERE status='confirmed' AND pnr_hash IS NOT NULL;
 CREATE INDEX IF NOT EXISTS idx_sessions_user ON auth_sessions(user_id);
 CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON auth_sessions(refresh_expires_at);
 CREATE INDEX IF NOT EXISTS idx_consumed_session ON consumed_refresh_tokens(session_id);
 CREATE INDEX IF NOT EXISTS idx_members_journey_status ON journey_members(journey_id, status, expires_at);
 CREATE INDEX IF NOT EXISTS idx_members_user_status ON journey_members(user_id, status, expires_at);
 CREATE INDEX IF NOT EXISTS idx_posts_community_created ON posts(community_id, created_at, id);
 CREATE INDEX IF NOT EXISTS idx_comments_post_created ON comments(post_id, created_at, id);
 CREATE INDEX IF NOT EXISTS idx_messages_room_created ON messages(room_id, created_at, id);
 CREATE INDEX IF NOT EXISTS idx_dm_conversation_created ON direct_messages(conversation_id, created_at, id);
 CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at);
 CREATE INDEX IF NOT EXISTS idx_tickets_retention ON tickets(deleted_at, created_at);
 CREATE INDEX IF NOT EXISTS idx_extractions_pnr ON ticket_extractions(pnr_hash);
 CREATE INDEX IF NOT EXISTS idx_messages_author ON messages(author_id,deleted_at);
 CREATE INDEX IF NOT EXISTS idx_dm_sender ON direct_messages(sender_id);
 CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports(reporter_id);
 CREATE INDEX IF NOT EXISTS idx_games_journey ON game_sessions(journey_id, updated_at);
`;
