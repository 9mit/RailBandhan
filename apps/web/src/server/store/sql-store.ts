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
  Poll,
  PollOption,
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
import { CANONICAL_TRAIN_ROUTES, RailwayGraph } from "@/server/railway/graph";
import { CANONICAL_STATIONS } from "@/server/railway/stations";
import { SEED_IDS } from "@/server/store/memory-store";
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
import { CORE_SCHEMA } from "./schema";
import type { SqlConnection } from "./sql-connection";

const SEED_TIMESTAMP = "2026-08-10T00:00:00.000Z";

function nowIso(): string {
  return new Date().toISOString();
}

function newId(): string {
  return crypto.randomUUID();
}

export class SqlStore implements Store {
  protected db: SqlConnection;
  protected ready: Promise<void>;
  constructor(connection: SqlConnection, initialize = false) {
    this.db = connection;
    this.ready = (async () => {
      if (initialize) await connection.exec(CORE_SCHEMA);
      else {
        const migration = await connection
          .prepare("SELECT version FROM app_migrations WHERE version = ?")
          .get("001-core");
        if (!migration)
          throw new Error(
            "Database migrations are missing. Run npm run db:migrate.",
          );
      }
      await this.seedCatalog();
    })();
    this.ready.catch(() => {});
  }

  async getReputationStats(userId: string): Promise<{
    journeys: number;
    reports: number;
    messages: number;
    reputation: number;
  }> {
    await this.ready;
    const row = await this.db
      .prepare(
        `SELECT (SELECT COUNT(*) FROM journey_members WHERE user_id=? AND status='verified') AS journeys,(SELECT COUNT(*) FROM reports WHERE reporter_id=?) AS reports,((SELECT COUNT(*) FROM messages WHERE author_id=? AND deleted_at IS NULL)+(SELECT COUNT(*) FROM direct_messages WHERE sender_id=?)) AS messages,(SELECT reputation FROM anonymous_profiles WHERE user_id=?) AS reputation`,
      )
      .get(userId, userId, userId, userId, userId);
    return {
      journeys: Number(row.journeys),
      reports: Number(row.reports),
      messages: Number(row.messages),
      reputation: Number(row.reputation) || 0,
    };
  }
  async incrementReputation(userId: string, delta: number): Promise<number> {
    await this.ready;
    await this.db
      .prepare(
        "UPDATE anonymous_profiles SET reputation=CASE WHEN reputation+?<0 THEN 0 ELSE reputation+? END,updated_at=? WHERE user_id=?",
      )
      .run(delta, delta, nowIso(), userId);
    return (await this.getAnonymousProfile(userId))?.reputation ?? 0;
  }
  async listReactionsByPosts(postIds: string[]): Promise<PostReaction[]> {
    await this.ready;
    if (!postIds.length) return [];
    const ids = postIds.slice(0, 200);
    const rows = await this.db
      .prepare(
        `SELECT id,post_id,user_id,reaction,created_at FROM post_reactions WHERE post_id IN (${ids.map(() => "?").join(",")})`,
      )
      .all(...ids);
    return rows.map((row) => ({
      id: row.id,
      postId: row.post_id,
      userId: row.user_id,
      reaction: row.reaction,
      createdAt: row.created_at,
    }));
  }
  async healthCheck(): Promise<void> {
    await this.ready;
    await this.db.prepare("SELECT 1 AS ok").get();
  }
  async transaction<T>(work: () => Promise<T>): Promise<T> {
    await this.ready;
    return this.db.transaction(work);
  }
  async createAuthSession(session: AuthSessionRecord): Promise<void> {
    await this.ready;
    await this.db
      .prepare(
        "INSERT INTO auth_sessions (id,user_id,access_hash,refresh_hash,access_expires_at,refresh_expires_at,revoked_at,created_at) VALUES (?,?,?,?,?,?,?,?)",
      )
      .run(
        session.id,
        session.userId,
        session.accessHash,
        session.refreshHash,
        session.accessExpiresAt,
        session.refreshExpiresAt,
        session.revokedAt,
        session.createdAt,
      );
  }
  async getAuthSessionByHash(
    hash: string,
    kind: "access" | "refresh" | "used",
  ): Promise<AuthSessionRecord | null> {
    await this.ready;
    const column = kind === "access" ? "access_hash" : "refresh_hash";
    const row =
      kind === "used"
        ? await this.db
            .prepare(
              "SELECT s.* FROM auth_sessions s JOIN consumed_refresh_tokens t ON t.session_id=s.id WHERE t.token_hash=?",
            )
            .get(hash)
        : await this.db
            .prepare(`SELECT * FROM auth_sessions WHERE ${column}=?`)
            .get(hash);
    return row
      ? {
          id: row.id,
          userId: row.user_id,
          accessHash: row.access_hash,
          refreshHash: row.refresh_hash,
          accessExpiresAt: row.access_expires_at,
          refreshExpiresAt: row.refresh_expires_at,
          revokedAt: row.revoked_at,
          createdAt: row.created_at,
        }
      : null;
  }
  async rotateAuthSession(
    expectedHash: string,
    session: AuthSessionRecord,
  ): Promise<boolean> {
    await this.ready;
    return this.db.transaction(async () => {
      const result = await this.db
        .prepare(
          "UPDATE auth_sessions SET access_hash=?,refresh_hash=?,access_expires_at=? WHERE id=? AND refresh_hash=? AND revoked_at IS NULL AND refresh_expires_at>?",
        )
        .run(
          session.accessHash,
          session.refreshHash,
          session.accessExpiresAt,
          session.id,
          expectedHash,
          new Date().toISOString(),
        );
      if (!result.changes) return false;
      await this.db
        .prepare(
          "INSERT INTO consumed_refresh_tokens (token_hash,session_id) VALUES (?,?)",
        )
        .run(expectedHash, session.id);
      return true;
    });
  }
  async revokeAuthSession(id: string): Promise<void> {
    await this.ready;
    await this.db
      .prepare("UPDATE auth_sessions SET revoked_at=? WHERE id=?")
      .run(new Date().toISOString(), id);
  }
  async revokeUserSessions(userId: string): Promise<void> {
    await this.ready;
    await this.db
      .prepare("UPDATE auth_sessions SET revoked_at=? WHERE user_id=?")
      .run(new Date().toISOString(), userId);
  }
  async pruneAuthSessions(before: string): Promise<void> {
    await this.ready;
    await this.db
      .prepare("DELETE FROM auth_sessions WHERE refresh_expires_at<?")
      .run(before);
  }

  private async seedCatalog(): Promise<void> {
    await this.db.transaction(async () => {
      if (this.db.dialect === "postgres")
        await this.db.prepare("SELECT pg_advisory_xact_lock(728219002)").get();
      const insert = async (
        table: string,
        columns: string[],
        rows: unknown[][],
      ) => {
        if (!rows.length) return;
        await this.db
          .prepare(
            `INSERT OR IGNORE INTO ${table} (${columns.join(",")}) VALUES ${rows.map(() => `(${columns.map(() => "?").join(",")})`).join(",")}`,
          )
          .run(...rows.flat());
      };
      const stationIds = SEED_IDS.stations as Record<string, string>;
      await insert(
        "stations",
        ["id", "code", "name", "created_at"],
        CANONICAL_STATIONS.map((station) => [
          stationIds[station.code] ?? `st-${station.code.toLowerCase()}-id`,
          station.code,
          station.name,
          SEED_TIMESTAMP,
        ]),
      );
      await insert(
        "trains",
        ["id", "number", "name", "created_at"],
        CANONICAL_TRAIN_ROUTES.map((route) => [
          route.trainNumber === "12723"
            ? SEED_IDS.trains.telangana
            : route.trainNumber === "12951"
              ? SEED_IDS.trains.rajdhani
              : `tr-${route.trainNumber}-id`,
          route.trainNumber,
          route.trainName,
          SEED_TIMESTAMP,
        ]),
      );
      const trains = await this.db
        .prepare("SELECT id,number FROM trains")
        .all();
      const stations = await this.db
        .prepare("SELECT id,code FROM stations")
        .all();
      const trainByNumber = new Map(trains.map((row) => [row.number, row.id]));
      const stationByCode = new Map(stations.map((row) => [row.code, row.id]));
      await insert(
        "train_routes",
        ["id", "train_id"],
        CANONICAL_TRAIN_ROUTES.map((route) => [
          route.trainNumber === "12723"
            ? SEED_IDS.routes.telangana
            : route.trainNumber === "12951"
              ? SEED_IDS.routes.rajdhani
              : `rt-${route.trainNumber}-id`,
          trainByNumber.get(route.trainNumber),
        ]),
      );
      const routes = await this.db
        .prepare("SELECT id,train_id FROM train_routes")
        .all();
      const routeByTrain = new Map(routes.map((row) => [row.train_id, row.id]));
      const routeIds = CANONICAL_TRAIN_ROUTES.map((route) =>
        routeByTrain.get(trainByNumber.get(route.trainNumber)),
      );
      // These are catalog stops, not passenger records. Replace incomplete legacy seeds.
      await this.db
        .prepare(
          `DELETE FROM train_route_stops WHERE route_id IN (${routeIds.map(() => "?").join(",")})`,
        )
        .run(...routeIds);
      await insert(
        "train_route_stops",
        ["id", "route_id", "station_id", "stop_index"],
        CANONICAL_TRAIN_ROUTES.flatMap((route) =>
          route.stops.map((stop) => [
            newId(),
            routeByTrain.get(trainByNumber.get(route.trainNumber)),
            stationByCode.get(stop.stationCode),
            stop.stopIndex,
          ]),
        ),
      );
    });
  }

  // --- Auth Users ---
  async createAuthUser(input: CreateAuthUserInput): Promise<AuthUser> {
    await this.ready;
    const normalizedEmail = input.email.trim().toLowerCase();
    const user: AuthUser = {
      id: newId(),
      email: normalizedEmail,
      passwordHash: input.passwordHash,
      role: "user",
      createdAt: nowIso(),
    };

    try {
      await this.db
        .prepare(
          "INSERT INTO auth_users (id, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)",
        )
        .run(
          user.id,
          user.email,
          user.passwordHash,
          user.role ?? "user",
          user.createdAt,
        );
      return user;
    } catch (err: unknown) {
      if (
        err instanceof Error &&
        err.message.includes("UNIQUE constraint failed")
      ) {
        throw new Error("User already exists");
      }
      throw err;
    }
  }

  async getAuthUserByEmail(email: string): Promise<AuthUser | null> {
    await this.ready;
    const row = (await this.db
      .prepare(
        "SELECT id, email, password_hash, role, created_at FROM auth_users WHERE email = ?",
      )
      .get(email.trim().toLowerCase())) as
      | {
          id: string;
          email: string;
          password_hash: string;
          role: UserRole;
          created_at: string;
        }
      | undefined;

    if (!row) return null;
    return {
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      role: row.role,
      createdAt: row.created_at,
    };
  }

  async getAuthUserById(id: string): Promise<AuthUser | null> {
    await this.ready;
    const row = (await this.db
      .prepare(
        "SELECT id, email, password_hash, role, created_at FROM auth_users WHERE id = ?",
      )
      .get(id)) as
      | {
          id: string;
          email: string;
          password_hash: string;
          role: UserRole;
          created_at: string;
        }
      | undefined;

    if (!row) return null;
    return {
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      role: row.role,
      createdAt: row.created_at,
    };
  }

  async setAuthUserRole(userId: string, role: UserRole): Promise<AuthUser> {
    await this.ready;
    const user = await this.getAuthUserById(userId);
    if (!user) {
      throw new Error("User not found");
    }
    await this.db
      .prepare("UPDATE auth_users SET role = ? WHERE id = ?")
      .run(role, userId);
    return { ...user, role };
  }

  async deleteAuthUser(id: string): Promise<void> {
    await this.ready;
    await this.db.prepare("DELETE FROM auth_users WHERE id = ?").run(id);
  }

  // --- Profiles ---
  async getProfile(userId: string): Promise<Profile | null> {
    await this.ready;
    const row = (await this.db
      .prepare(
        "SELECT user_id, real_name, age, gender, created_at, updated_at FROM profiles WHERE user_id = ?",
      )
      .get(userId)) as
      | {
          user_id: string;
          real_name: string;
          age: number | null;
          gender: string | null;
          created_at: string;
          updated_at: string;
        }
      | undefined;

    if (!row) return null;
    return {
      userId: row.user_id,
      realName: row.real_name,
      age: row.age,
      gender: row.gender,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async upsertProfile(profile: Profile): Promise<Profile> {
    await this.ready;
    await this.db
      .prepare(
        `INSERT INTO profiles (user_id, real_name, age, gender, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT (user_id) DO UPDATE SET
           real_name = excluded.real_name,
           age = excluded.age,
           gender = excluded.gender,
           updated_at = excluded.updated_at`,
      )
      .run(
        profile.userId,
        profile.realName,
        profile.age,
        profile.gender,
        profile.createdAt,
        profile.updatedAt,
      );
    return profile;
  }

  async deleteProfile(userId: string): Promise<void> {
    await this.ready;
    await this.db.prepare("DELETE FROM profiles WHERE user_id = ?").run(userId);
  }

  async getAnonymousProfile(userId: string): Promise<AnonymousProfile | null> {
    await this.ready;
    const row = (await this.db
      .prepare(
        `SELECT user_id, public_handle, avatar_url, bio, reputation, discovery_visible,
                messaging_policy, coach_visibility, onboarding_complete, created_at, updated_at
         FROM anonymous_profiles WHERE user_id = ?`,
      )
      .get(userId)) as any;

    if (!row) return null;
    return {
      userId: row.user_id,
      publicHandle: row.public_handle,
      avatarUrl: row.avatar_url,
      bio: row.bio,
      reputation: Number(row.reputation),
      discoveryVisible: Boolean(row.discovery_visible),
      messagingPolicy: row.messaging_policy,
      coachVisibility: row.coach_visibility,
      onboardingComplete: Boolean(row.onboarding_complete),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async getAnonymousProfilesByUserIds(
    ids: string[],
  ): Promise<AnonymousProfile[]> {
    await this.ready;
    if (ids.length === 0) return [];
    const placeholders = ids.map(() => "?").join(",");
    const rows = (await this.db
      .prepare(
        `SELECT user_id, public_handle, avatar_url, bio, reputation, discovery_visible,
                messaging_policy, coach_visibility, onboarding_complete, created_at, updated_at
         FROM anonymous_profiles WHERE user_id IN (${placeholders})`,
      )
      .all(...ids)) as any[];

    return rows.map((row) => ({
      userId: row.user_id,
      publicHandle: row.public_handle,
      avatarUrl: row.avatar_url,
      bio: row.bio,
      reputation: Number(row.reputation),
      discoveryVisible: Boolean(row.discovery_visible),
      messagingPolicy: row.messaging_policy,
      coachVisibility: row.coach_visibility,
      onboardingComplete: Boolean(row.onboarding_complete),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  async getAnonymousProfileByHandle(
    handle: string,
  ): Promise<AnonymousProfile | null> {
    await this.ready;
    const row = (await this.db
      .prepare(
        `SELECT user_id, public_handle, avatar_url, bio, reputation, discovery_visible,
                messaging_policy, coach_visibility, onboarding_complete, created_at, updated_at
         FROM anonymous_profiles WHERE public_handle = ?`,
      )
      .get(handle)) as any;

    if (!row) return null;
    return {
      userId: row.user_id,
      publicHandle: row.public_handle,
      avatarUrl: row.avatar_url,
      bio: row.bio,
      reputation: Number(row.reputation),
      discoveryVisible: Boolean(row.discovery_visible),
      messagingPolicy: row.messaging_policy,
      coachVisibility: row.coach_visibility,
      onboardingComplete: Boolean(row.onboarding_complete),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async upsertAnonymousProfile(
    profile: AnonymousProfile,
  ): Promise<AnonymousProfile> {
    await this.ready;
    await this.db
      .prepare(
        `INSERT INTO anonymous_profiles (
           user_id, public_handle, avatar_url, bio, reputation, discovery_visible,
           messaging_policy, coach_visibility, onboarding_complete, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT (user_id) DO UPDATE SET
           public_handle = excluded.public_handle,
           avatar_url = excluded.avatar_url,
           bio = excluded.bio,
           reputation = excluded.reputation,
           discovery_visible = excluded.discovery_visible,
           messaging_policy = excluded.messaging_policy,
           coach_visibility = excluded.coach_visibility,
           onboarding_complete = excluded.onboarding_complete,
           updated_at = excluded.updated_at`,
      )
      .run(
        profile.userId,
        profile.publicHandle,
        profile.avatarUrl,
        profile.bio,
        profile.reputation,
        profile.discoveryVisible ? 1 : 0,
        profile.messagingPolicy,
        profile.coachVisibility,
        profile.onboardingComplete ? 1 : 0,
        profile.createdAt,
        profile.updatedAt,
      );
    return profile;
  }

  async deleteAnonymousProfile(userId: string): Promise<void> {
    await this.ready;
    await this.db
      .prepare("DELETE FROM anonymous_profiles WHERE user_id = ?")
      .run(userId);
  }

  async isHandleTaken(
    handle: string,
    excludeUserId?: string,
  ): Promise<boolean> {
    await this.ready;
    let row;
    if (excludeUserId) {
      row = await this.db
        .prepare(
          "SELECT user_id FROM anonymous_profiles WHERE public_handle = ? AND user_id != ?",
        )
        .get(handle, excludeUserId);
    } else {
      row = await this.db
        .prepare(
          "SELECT user_id FROM anonymous_profiles WHERE public_handle = ?",
        )
        .get(handle);
    }
    return Boolean(row);
  }

  // --- Catalog ---
  async listTrains(): Promise<Train[]> {
    await this.ready;
    const rows = (await this.db
      .prepare(
        "SELECT id, number, name, created_at FROM trains ORDER BY number ASC",
      )
      .all()) as any[];
    return rows.map((r) => ({
      id: r.id,
      number: r.number,
      name: r.name,
      createdAt: r.created_at,
    }));
  }

  async getTrainById(id: string): Promise<Train | null> {
    await this.ready;
    const row = (await this.db
      .prepare("SELECT id, number, name, created_at FROM trains WHERE id = ?")
      .get(id)) as any;
    if (!row) return null;
    return {
      id: row.id,
      number: row.number,
      name: row.name,
      createdAt: row.created_at,
    };
  }

  async getTrainByNumber(number: string): Promise<Train | null> {
    await this.ready;
    const normalized = number.replace(/\s+/g, "");
    const row = (await this.db
      .prepare(
        "SELECT id, number, name, created_at FROM trains WHERE number = ?",
      )
      .get(normalized)) as any;
    if (!row) return null;
    return {
      id: row.id,
      number: row.number,
      name: row.name,
      createdAt: row.created_at,
    };
  }

  async listStations(): Promise<Station[]> {
    await this.ready;
    const rows = (await this.db
      .prepare(
        "SELECT id, code, name, created_at FROM stations ORDER BY code ASC",
      )
      .all()) as any[];
    return rows.map((r) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      createdAt: r.created_at,
    }));
  }

  async getStationById(id: string): Promise<Station | null> {
    await this.ready;
    const row = (await this.db
      .prepare("SELECT id, code, name, created_at FROM stations WHERE id = ?")
      .get(id)) as any;
    if (!row) return null;
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      createdAt: row.created_at,
    };
  }

  async getStationByCode(code: string): Promise<Station | null> {
    await this.ready;
    const row = (await this.db
      .prepare("SELECT id, code, name, created_at FROM stations WHERE code = ?")
      .get(code.toUpperCase())) as any;
    if (!row) return null;
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      createdAt: row.created_at,
    };
  }

  async getRouteStopsForTrain(trainId: string): Promise<TrainRouteStop[]> {
    await this.ready;
    let route = (await this.db
      .prepare("SELECT id FROM train_routes WHERE train_id = ?")
      .get(trainId)) as { id: string } | undefined;

    let rows: any[] = [];
    if (route) {
      rows = (await this.db
        .prepare(
          "SELECT id, route_id, station_id, stop_index FROM train_route_stops WHERE route_id = ? ORDER BY stop_index ASC",
        )
        .all(route.id)) as any[];
    }

    if (rows.length > 0) {
      return rows.map((r) => ({
        id: r.id,
        routeId: r.route_id,
        stationId: r.station_id,
        stopIndex: Number(r.stop_index),
      }));
    }

    // Dynamic fallback to RailwayGraph if stops were not yet populated in the table
    const train = await this.getTrainById(trainId);
    if (!train) return [];

    const canonical = RailwayGraph.getRoute(train.number);
    if (!canonical) return [];

    const effectiveRouteId = route ? route.id : newId();
    if (!route) {
      await this.db
        .prepare(
          "INSERT OR IGNORE INTO train_routes (id, train_id) VALUES (?, ?)",
        )
        .run(effectiveRouteId, trainId);
    }

    const insertStop = this.db.prepare(
      "INSERT OR IGNORE INTO train_route_stops (id, route_id, station_id, stop_index) VALUES (?, ?, ?, ?)",
    );

    const stops: TrainRouteStop[] = [];
    for (const s of canonical.stops) {
      let st = await this.getStationByCode(s.stationCode);
      if (!st) {
        const stationId = newId();
        await this.db
          .prepare(
            "INSERT OR IGNORE INTO stations (id, code, name, created_at) VALUES (?, ?, ?, ?)",
          )
          .run(stationId, s.stationCode, s.stationCode, nowIso());
        st = await this.getStationByCode(s.stationCode);
      }
      if (!st) continue;

      const stopId = newId();
      await insertStop.run(stopId, effectiveRouteId, st.id, s.stopIndex);
      stops.push({
        id: stopId,
        routeId: effectiveRouteId,
        stationId: st.id,
        stopIndex: s.stopIndex,
      });
    }

    return stops;
  }

  // --- Journeys ---
  async createJourney(input: CreateJourneyInput): Promise<Journey> {
    await this.ready;
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

    await this.db
      .prepare(
        `INSERT OR IGNORE INTO journeys (
           id, train_id, journey_date, boarding_station_id, destination_station_id,
           normalized_key, status, service_instance_id, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        journey.id,
        journey.trainId,
        journey.journeyDate,
        journey.boardingStationId,
        journey.destinationStationId,
        journey.normalizedKey,
        journey.status,
        journey.serviceInstanceId,
        journey.createdAt,
        journey.updatedAt,
      );

    return (
      (await this.getJourneyByNormalizedKey(input.normalizedKey)) ?? journey
    );
  }

  async getJourneyById(id: string): Promise<Journey | null> {
    await this.ready;
    const row = (await this.db
      .prepare(
        `SELECT id, train_id, journey_date, boarding_station_id, destination_station_id,
                normalized_key, status, service_instance_id, created_at, updated_at
         FROM journeys WHERE id = ?`,
      )
      .get(id)) as any;

    if (!row) return null;
    return {
      id: row.id,
      trainId: row.train_id,
      journeyDate: row.journey_date,
      boardingStationId: row.boarding_station_id,
      destinationStationId: row.destination_station_id,
      normalizedKey: row.normalized_key,
      status: row.status,
      serviceInstanceId: row.service_instance_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async getJourneyByNormalizedKey(key: string): Promise<Journey | null> {
    await this.ready;
    const row = (await this.db
      .prepare(
        `SELECT id, train_id, journey_date, boarding_station_id, destination_station_id,
                normalized_key, status, service_instance_id, created_at, updated_at
         FROM journeys WHERE normalized_key = ?`,
      )
      .get(key)) as any;

    if (!row) return null;
    return {
      id: row.id,
      trainId: row.train_id,
      journeyDate: row.journey_date,
      boardingStationId: row.boarding_station_id,
      destinationStationId: row.destination_station_id,
      normalizedKey: row.normalized_key,
      status: row.status,
      serviceInstanceId: row.service_instance_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async updateJourney(journey: Journey): Promise<Journey> {
    await this.ready;
    const updated = { ...journey, updatedAt: nowIso() };
    await this.db
      .prepare(
        `UPDATE journeys SET
           train_id = ?, journey_date = ?, boarding_station_id = ?, destination_station_id = ?,
           normalized_key = ?, status = ?, service_instance_id = ?, updated_at = ?
         WHERE id = ?`,
      )
      .run(
        updated.trainId,
        updated.journeyDate,
        updated.boardingStationId,
        updated.destinationStationId,
        updated.normalizedKey,
        updated.status,
        updated.serviceInstanceId,
        updated.updatedAt,
        updated.id,
      );
    return updated;
  }

  async listAllJourneys(): Promise<Journey[]> {
    await this.ready;
    const rows = (await this.db
      .prepare(
        `SELECT id, train_id, journey_date, boarding_station_id, destination_station_id,
                normalized_key, status, service_instance_id, created_at, updated_at
         FROM journeys`,
      )
      .all()) as any[];

    return rows.map((row) => ({
      id: row.id,
      trainId: row.train_id,
      journeyDate: row.journey_date,
      boardingStationId: row.boarding_station_id,
      destinationStationId: row.destination_station_id,
      normalizedKey: row.normalized_key,
      status: row.status,
      serviceInstanceId: row.service_instance_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  // --- Journey Members ---
  async createJourneyMember(
    input: CreateJourneyMemberInput,
  ): Promise<JourneyMember> {
    await this.ready;
    const existing = await this.getJourneyMember(input.userId, input.journeyId);
    if (existing) return existing;

    const member: JourneyMember = {
      id: newId(),
      userId: input.userId,
      journeyId: input.journeyId,
      status: input.status,
      verificationMethod: input.verificationMethod,
      expiresAt: input.expiresAt,
      createdAt: nowIso(),
    };

    await this.db
      .prepare(
        `INSERT OR IGNORE INTO journey_members (
           id, user_id, journey_id, status, verification_method, expires_at, created_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        member.id,
        member.userId,
        member.journeyId,
        member.status,
        member.verificationMethod,
        member.expiresAt,
        member.createdAt,
      );

    return (
      (await this.getJourneyMember(input.userId, input.journeyId)) ?? member
    );
  }

  async getJourneyMember(
    userId: string,
    journeyId: string,
  ): Promise<JourneyMember | null> {
    await this.ready;
    const row = (await this.db
      .prepare(
        `SELECT id, user_id, journey_id, status, verification_method, expires_at, created_at
         FROM journey_members WHERE user_id = ? AND journey_id = ?`,
      )
      .get(userId, journeyId)) as any;

    if (!row) return null;
    return {
      id: row.id,
      userId: row.user_id,
      journeyId: row.journey_id,
      status: row.status,
      verificationMethod: row.verification_method,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
    };
  }

  async updateJourneyMember(member: JourneyMember): Promise<JourneyMember> {
    await this.ready;
    await this.db
      .prepare(
        `UPDATE journey_members SET
           status = ?, verification_method = ?, expires_at = ?
         WHERE user_id = ? AND journey_id = ?`,
      )
      .run(
        member.status,
        member.verificationMethod,
        member.expiresAt,
        member.userId,
        member.journeyId,
      );
    return member;
  }

  async listJourneyMembersByUser(userId: string): Promise<JourneyMember[]> {
    await this.ready;
    const rows = (await this.db
      .prepare(
        `SELECT id, user_id, journey_id, status, verification_method, expires_at, created_at
         FROM journey_members WHERE user_id = ?`,
      )
      .all(userId)) as any[];

    return rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      journeyId: r.journey_id,
      status: r.status,
      verificationMethod: r.verification_method,
      expiresAt: r.expires_at,
      createdAt: r.created_at,
    }));
  }

  async listJourneyMembersByJourney(
    journeyId: string,
  ): Promise<JourneyMember[]> {
    await this.ready;
    const rows = (await this.db
      .prepare(
        `SELECT id, user_id, journey_id, status, verification_method, expires_at, created_at
         FROM journey_members WHERE journey_id = ?`,
      )
      .all(journeyId)) as any[];

    return rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      journeyId: r.journey_id,
      status: r.status,
      verificationMethod: r.verification_method,
      expiresAt: r.expires_at,
      createdAt: r.created_at,
    }));
  }

  async listAllJourneyMembers(): Promise<JourneyMember[]> {
    await this.ready;
    const rows = (await this.db
      .prepare(
        `SELECT id, user_id, journey_id, status, verification_method, expires_at, created_at
         FROM journey_members`,
      )
      .all()) as any[];

    return rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      journeyId: r.journey_id,
      status: r.status,
      verificationMethod: r.verification_method,
      expiresAt: r.expires_at,
      createdAt: r.created_at,
    }));
  }

  async deleteJourneyMembersByUser(userId: string): Promise<void> {
    await this.ready;
    await this.db
      .prepare("DELETE FROM journey_members WHERE user_id = ?")
      .run(userId);
  }

  // --- Communities & Chat ---
  async createCommunity(input: CreateCommunityInput): Promise<Community> {
    await this.ready;
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

    await this.db
      .prepare(
        `INSERT OR IGNORE INTO communities (
           id, train_id, journey_date, journey_id, segment_id, type, slug, created_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        community.id,
        community.trainId,
        community.journeyDate,
        community.journeyId,
        community.segmentId,
        community.type,
        community.slug,
        community.createdAt,
      );

    return input.journeyId && !input.segmentId
      ? ((await this.getTrainWideCommunity(input.journeyId)) ?? community)
      : community;
  }

  async getCommunityById(id: string): Promise<Community | null> {
    await this.ready;
    const row = (await this.db
      .prepare(
        `SELECT id, train_id, journey_date, journey_id, segment_id, type, slug, created_at
         FROM communities WHERE id = ?`,
      )
      .get(id)) as any;

    if (!row) return null;
    return {
      id: row.id,
      trainId: row.train_id,
      journeyDate: row.journey_date,
      journeyId: row.journey_id,
      segmentId: row.segment_id,
      type: row.type,
      slug: row.slug,
      createdAt: row.created_at,
    };
  }

  async getTrainWideCommunity(journeyId: string): Promise<Community | null> {
    await this.ready;
    const row = (await this.db
      .prepare(
        `SELECT id, train_id, journey_date, journey_id, segment_id, type, slug, created_at
         FROM communities WHERE journey_id = ? AND type = 'train_wide'`,
      )
      .get(journeyId)) as any;

    if (!row) return null;
    return {
      id: row.id,
      trainId: row.train_id,
      journeyDate: row.journey_date,
      journeyId: row.journey_id,
      segmentId: row.segment_id,
      type: row.type,
      slug: row.slug,
      createdAt: row.created_at,
    };
  }

  async listCommunitiesForJourney(journeyId: string): Promise<Community[]> {
    await this.ready;
    const rows = (await this.db
      .prepare(
        `SELECT id, train_id, journey_date, journey_id, segment_id, type, slug, created_at
         FROM communities WHERE journey_id = ?`,
      )
      .all(journeyId)) as any[];

    return rows.map((r) => ({
      id: r.id,
      trainId: r.train_id,
      journeyDate: r.journey_date,
      journeyId: r.journey_id,
      segmentId: r.segment_id,
      type: r.type,
      slug: r.slug,
      createdAt: r.created_at,
    }));
  }

  async createChatRoom(
    journeyId: string,
    communityId: string,
  ): Promise<ChatRoom> {
    await this.ready;
    const existing = await this.getChatRoomByJourneyId(journeyId);
    if (existing) return existing;

    const room: ChatRoom = {
      id: newId(),
      journeyId,
      communityId,
      createdAt: nowIso(),
    };

    await this.db
      .prepare(
        "INSERT OR IGNORE INTO chat_rooms (id, journey_id, community_id, created_at) VALUES (?, ?, ?, ?)",
      )
      .run(room.id, room.journeyId, room.communityId, room.createdAt);

    return (await this.getChatRoomByJourneyId(journeyId)) ?? room;
  }

  async getChatRoomByJourneyId(journeyId: string): Promise<ChatRoom | null> {
    await this.ready;
    const row = (await this.db
      .prepare(
        "SELECT id, journey_id, community_id, created_at FROM chat_rooms WHERE journey_id = ?",
      )
      .get(journeyId)) as any;

    if (!row) return null;
    return {
      id: row.id,
      journeyId: row.journey_id,
      communityId: row.community_id,
      createdAt: row.created_at,
    };
  }

  // --- Posts, Comments, Reactions ---
  async createPost(input: CreatePostInput): Promise<Post> {
    await this.ready;
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

    await this.db
      .prepare(
        `INSERT INTO posts (id, community_id, author_id, post_type, title, body, deleted_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        post.id,
        post.communityId,
        post.authorId,
        post.postType,
        post.title,
        post.body,
        post.deletedAt,
        post.createdAt,
        post.updatedAt,
      );

    return post;
  }

  async getPostById(id: string): Promise<Post | null> {
    await this.ready;
    const row = (await this.db
      .prepare(
        "SELECT id, community_id, author_id, post_type, title, body, deleted_at, created_at, updated_at FROM posts WHERE id = ?",
      )
      .get(id)) as any;

    if (!row) return null;
    return {
      id: row.id,
      communityId: row.community_id,
      authorId: row.author_id,
      postType: row.post_type,
      title: row.title,
      body: row.body,
      deletedAt: row.deleted_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async listPostsByCommunity(communityId: string): Promise<Post[]> {
    await this.ready;
    const rows = (await this.db
      .prepare(
        `SELECT id, community_id, author_id, post_type, title, body, deleted_at, created_at, updated_at
         FROM posts WHERE community_id = ? AND deleted_at IS NULL
         ORDER BY created_at DESC, id DESC LIMIT 100`,
      )
      .all(communityId)) as any[];

    return rows.map((r) => ({
      id: r.id,
      communityId: r.community_id,
      authorId: r.author_id,
      postType: r.post_type,
      title: r.title,
      body: r.body,
      deletedAt: r.deleted_at,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }

  async deletePost(postId: string): Promise<void> {
    await this.ready;
    await this.db
      .prepare("UPDATE posts SET deleted_at = ? WHERE id = ?")
      .run(nowIso(), postId);
  }

  async deletePostsByAuthor(userId: string): Promise<void> {
    await this.ready;
    await this.db
      .prepare("UPDATE posts SET deleted_at = ? WHERE author_id = ?")
      .run(nowIso(), userId);
  }

  async createComment(input: CreateCommentInput): Promise<Comment> {
    await this.ready;
    const comment: Comment = {
      id: newId(),
      postId: input.postId,
      authorId: input.authorId,
      parentId: input.parentId ?? null,
      body: input.body,
      deletedAt: null,
      createdAt: nowIso(),
    };

    await this.db
      .prepare(
        `INSERT INTO comments (id, post_id, author_id, parent_id, body, deleted_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        comment.id,
        comment.postId,
        comment.authorId,
        comment.parentId,
        comment.body,
        comment.deletedAt,
        comment.createdAt,
      );

    return comment;
  }

  async listCommentsByPost(postId: string): Promise<Comment[]> {
    await this.ready;
    const rows = (await this.db
      .prepare(
        `SELECT id, post_id, author_id, parent_id, body, deleted_at, created_at
         FROM comments WHERE post_id = ? AND deleted_at IS NULL
         ORDER BY created_at DESC, id DESC LIMIT 200`,
      )
      .all(postId)) as any[];

    return rows.reverse().map((r) => ({
      id: r.id,
      postId: r.post_id,
      authorId: r.author_id,
      parentId: r.parent_id,
      body: r.body,
      deletedAt: r.deleted_at,
      createdAt: r.created_at,
    }));
  }

  async deleteCommentsByAuthor(userId: string): Promise<void> {
    await this.ready;
    await this.db
      .prepare("UPDATE comments SET deleted_at = ? WHERE author_id = ?")
      .run(nowIso(), userId);
  }

  async getReaction(
    postId: string,
    userId: string,
    reaction: string,
  ): Promise<PostReaction | null> {
    await this.ready;
    const row = (await this.db
      .prepare(
        "SELECT id, post_id, user_id, reaction, created_at FROM post_reactions WHERE post_id = ? AND user_id = ? AND reaction = ?",
      )
      .get(postId, userId, reaction)) as any;

    if (!row) return null;
    return {
      id: row.id,
      postId: row.post_id,
      userId: row.user_id,
      reaction: row.reaction,
      createdAt: row.created_at,
    };
  }

  async createReaction(
    postId: string,
    userId: string,
    reaction: string,
  ): Promise<PostReaction> {
    await this.ready;
    const entry: PostReaction = {
      id: newId(),
      postId,
      userId,
      reaction,
      createdAt: nowIso(),
    };

    await this.db
      .prepare(
        "INSERT OR IGNORE INTO post_reactions (id, post_id, user_id, reaction, created_at) VALUES (?, ?, ?, ?, ?)",
      )
      .run(
        entry.id,
        entry.postId,
        entry.userId,
        entry.reaction,
        entry.createdAt,
      );

    return (await this.getReaction(postId, userId, reaction)) ?? entry;
  }

  async deleteReaction(id: string): Promise<void> {
    await this.ready;
    await this.db.prepare("DELETE FROM post_reactions WHERE id = ?").run(id);
  }

  async listReactionsByPost(postId: string): Promise<PostReaction[]> {
    await this.ready;
    const rows = (await this.db
      .prepare(
        "SELECT id, post_id, user_id, reaction, created_at FROM post_reactions WHERE post_id = ?",
      )
      .all(postId)) as any[];

    return rows.map((r) => ({
      id: r.id,
      postId: r.post_id,
      userId: r.user_id,
      reaction: r.reaction,
      createdAt: r.created_at,
    }));
  }

  async deleteReactionsByUser(userId: string): Promise<void> {
    await this.ready;
    await this.db
      .prepare("DELETE FROM post_reactions WHERE user_id = ?")
      .run(userId);
  }

  // --- Messages ---
  async createMessage(input: CreateMessageInput): Promise<Message> {
    await this.ready;
    const message: Message = {
      id: newId(),
      roomId: input.roomId,
      authorId: input.authorId,
      body: input.body,
      deletedAt: null,
      createdAt: nowIso(),
    };

    await this.db
      .prepare(
        "INSERT INTO messages (id, room_id, author_id, body, deleted_at, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      )
      .run(
        message.id,
        message.roomId,
        message.authorId,
        message.body,
        message.deletedAt,
        message.createdAt,
      );

    return message;
  }

  async listMessagesByRoom(roomId: string): Promise<Message[]> {
    await this.ready;
    const rows = (await this.db
      .prepare(
        `SELECT id, room_id, author_id, body, deleted_at, created_at
         FROM messages WHERE room_id = ? AND deleted_at IS NULL
         ORDER BY created_at DESC, id DESC LIMIT 200`,
      )
      .all(roomId)) as any[];

    return rows.reverse().map((r) => ({
      id: r.id,
      roomId: r.room_id,
      authorId: r.author_id,
      body: r.body,
      deletedAt: r.deleted_at,
      createdAt: r.created_at,
    }));
  }

  async deleteMessagesByAuthor(userId: string): Promise<void> {
    await this.ready;
    await this.db
      .prepare("UPDATE messages SET deleted_at = ? WHERE author_id = ?")
      .run(nowIso(), userId);
  }

  // --- Tickets ---
  async createTicket(input: CreateTicketInput): Promise<Ticket> {
    await this.ready;
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

    await this.db
      .prepare(
        `INSERT INTO tickets (id, user_id, storage_key, mime_type, byte_size, scan_status, deleted_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        ticket.id,
        ticket.userId,
        ticket.storageKey,
        ticket.mimeType,
        ticket.byteSize,
        ticket.scanStatus,
        ticket.deletedAt,
        ticket.createdAt,
      );

    return ticket;
  }

  async getTicketById(id: string): Promise<Ticket | null> {
    await this.ready;
    const row = (await this.db
      .prepare(
        "SELECT id, user_id, storage_key, mime_type, byte_size, scan_status, deleted_at, created_at FROM tickets WHERE id = ?",
      )
      .get(id)) as any;

    if (!row) return null;
    return {
      id: row.id,
      userId: row.user_id,
      storageKey: row.storage_key,
      mimeType: row.mime_type,
      byteSize: Number(row.byte_size),
      scanStatus: row.scan_status,
      deletedAt: row.deleted_at,
      createdAt: row.created_at,
    };
  }

  async updateTicket(ticket: Ticket): Promise<Ticket> {
    await this.ready;
    await this.db
      .prepare(
        `UPDATE tickets SET
           user_id = ?, storage_key = ?, mime_type = ?, byte_size = ?, scan_status = ?, deleted_at = ?
         WHERE id = ?`,
      )
      .run(
        ticket.userId,
        ticket.storageKey,
        ticket.mimeType,
        ticket.byteSize,
        ticket.scanStatus,
        ticket.deletedAt,
        ticket.id,
      );
    return ticket;
  }

  async listTicketsForRetention(): Promise<Ticket[]> {
    await this.ready;
    const rows = (await this.db
      .prepare(
        "SELECT id, user_id, storage_key, mime_type, byte_size, scan_status, deleted_at, created_at FROM tickets",
      )
      .all()) as any[];

    return rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      storageKey: r.storage_key,
      mimeType: r.mime_type,
      byteSize: Number(r.byte_size),
      scanStatus: r.scan_status,
      deletedAt: r.deleted_at,
      createdAt: r.created_at,
    }));
  }

  async deleteTicketsByUser(userId: string): Promise<void> {
    await this.ready;
    await this.db.prepare("DELETE FROM tickets WHERE user_id = ?").run(userId);
  }

  async createTicketExtraction(
    input: CreateTicketExtractionInput,
  ): Promise<TicketExtraction> {
    await this.ready;
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

    await this.db
      .prepare(
        `INSERT INTO ticket_extractions (
           id, ticket_id, user_id, status, train_number, train_name, journey_date,
           boarding_station_code, destination_station_code, coach, berth, travel_class,
           pnr_hash, confidence, raw_fields, journey_id, confirmed_at, created_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        extraction.id,
        extraction.ticketId,
        extraction.userId,
        extraction.status,
        extraction.trainNumber,
        extraction.trainName,
        extraction.journeyDate,
        extraction.boardingStationCode,
        extraction.destinationStationCode,
        extraction.coach,
        extraction.berth,
        extraction.travelClass,
        extraction.pnrHash,
        JSON.stringify(extraction.confidence),
        JSON.stringify(extraction.rawFields),
        extraction.journeyId,
        extraction.confirmedAt,
        extraction.createdAt,
      );

    return extraction;
  }

  async getTicketExtractionById(id: string): Promise<TicketExtraction | null> {
    await this.ready;
    const row = (await this.db
      .prepare(
        `SELECT id, ticket_id, user_id, status, train_number, train_name, journey_date,
                boarding_station_code, destination_station_code, coach, berth, travel_class,
                pnr_hash, confidence, raw_fields, journey_id, confirmed_at, created_at
         FROM ticket_extractions WHERE id = ?${this.db.dialect === "postgres" ? " FOR UPDATE" : ""}`,
      )
      .get(id)) as any;

    if (!row) return null;
    return {
      id: row.id,
      ticketId: row.ticket_id,
      userId: row.user_id,
      status: row.status,
      trainNumber: row.train_number,
      trainName: row.train_name,
      journeyDate: row.journey_date,
      boardingStationCode: row.boarding_station_code,
      destinationStationCode: row.destination_station_code,
      coach: row.coach,
      berth: row.berth,
      travelClass: row.travel_class,
      pnrHash: row.pnr_hash,
      confidence: JSON.parse(row.confidence || "{}"),
      rawFields: JSON.parse(row.raw_fields || "{}"),
      journeyId: row.journey_id,
      confirmedAt: row.confirmed_at,
      createdAt: row.created_at,
    };
  }

  async updateTicketExtraction(
    extraction: TicketExtraction,
  ): Promise<TicketExtraction> {
    await this.ready;
    await this.db
      .prepare(
        `UPDATE ticket_extractions SET
           ticket_id = ?, user_id = ?, status = ?, train_number = ?, train_name = ?, journey_date = ?,
           boarding_station_code = ?, destination_station_code = ?, coach = ?, berth = ?, travel_class = ?,
           pnr_hash = ?, confidence = ?, raw_fields = ?, journey_id = ?, confirmed_at = ?
         WHERE id = ?`,
      )
      .run(
        extraction.ticketId,
        extraction.userId,
        extraction.status,
        extraction.trainNumber,
        extraction.trainName,
        extraction.journeyDate,
        extraction.boardingStationCode,
        extraction.destinationStationCode,
        extraction.coach,
        extraction.berth,
        extraction.travelClass,
        extraction.pnrHash,
        JSON.stringify(extraction.confidence),
        JSON.stringify(extraction.rawFields),
        extraction.journeyId,
        extraction.confirmedAt,
        extraction.id,
      );
    return extraction;
  }

  async findTicketExtractionByPnrHash(
    pnrHash: string,
    excludeUserId?: string,
  ): Promise<TicketExtraction | null> {
    await this.ready;
    let row: any;
    if (excludeUserId) {
      row = await this.db
        .prepare(
          `SELECT id, ticket_id, user_id, status, train_number, train_name, journey_date,
                  boarding_station_code, destination_station_code, coach, berth, travel_class,
                  pnr_hash, confidence, raw_fields, journey_id, confirmed_at, created_at
           FROM ticket_extractions
           WHERE pnr_hash = ? AND status = 'confirmed' AND user_id != ?`,
        )
        .get(pnrHash, excludeUserId);
    } else {
      row = await this.db
        .prepare(
          `SELECT id, ticket_id, user_id, status, train_number, train_name, journey_date,
                  boarding_station_code, destination_station_code, coach, berth, travel_class,
                  pnr_hash, confidence, raw_fields, journey_id, confirmed_at, created_at
           FROM ticket_extractions
           WHERE pnr_hash = ? AND status = 'confirmed'`,
        )
        .get(pnrHash);
    }

    if (!row) return null;
    return {
      id: row.id,
      ticketId: row.ticket_id,
      userId: row.user_id,
      status: row.status,
      trainNumber: row.train_number,
      trainName: row.train_name,
      journeyDate: row.journey_date,
      boardingStationCode: row.boarding_station_code,
      destinationStationCode: row.destination_station_code,
      coach: row.coach,
      berth: row.berth,
      travelClass: row.travel_class,
      pnrHash: row.pnr_hash,
      confidence: JSON.parse(row.confidence || "{}"),
      rawFields: JSON.parse(row.raw_fields || "{}"),
      journeyId: row.journey_id,
      confirmedAt: row.confirmed_at,
      createdAt: row.created_at,
    };
  }

  async deleteTicketExtractionsByUser(userId: string): Promise<void> {
    await this.ready;
    await this.db
      .prepare("DELETE FROM ticket_extractions WHERE user_id = ?")
      .run(userId);
  }

  // --- Moderation ---
  async createBlock(blockerId: string, blockedId: string): Promise<Block> {
    await this.ready;
    const block: Block = {
      id: newId(),
      blockerId,
      blockedId,
      createdAt: nowIso(),
    };

    await this.db
      .prepare(
        "INSERT OR IGNORE INTO blocks (id, blocker_id, blocked_id, created_at) VALUES (?, ?, ?, ?)",
      )
      .run(block.id, block.blockerId, block.blockedId, block.createdAt);

    return block;
  }

  async listBlocksByBlocker(blockerId: string): Promise<Block[]> {
    await this.ready;
    const rows = (await this.db
      .prepare(
        "SELECT id, blocker_id, blocked_id, created_at FROM blocks WHERE blocker_id = ?",
      )
      .all(blockerId)) as any[];

    return rows.map((r) => ({
      id: r.id,
      blockerId: r.blocker_id,
      blockedId: r.blocked_id,
      createdAt: r.created_at,
    }));
  }

  async isBlockedEitherWay(a: string, b: string): Promise<boolean> {
    await this.ready;
    const row = await this.db
      .prepare(
        "SELECT id FROM blocks WHERE (blocker_id = ? AND blocked_id = ?) OR (blocker_id = ? AND blocked_id = ?)",
      )
      .get(a, b, b, a);
    return Boolean(row);
  }

  async listBlocksInvolving(userId: string): Promise<Block[]> {
    await this.ready;
    const rows = (await this.db
      .prepare(
        "SELECT id, blocker_id, blocked_id, created_at FROM blocks WHERE blocker_id = ? OR blocked_id = ?",
      )
      .all(userId, userId)) as any[];

    return rows.map((r) => ({
      id: r.id,
      blockerId: r.blocker_id,
      blockedId: r.blocked_id,
      createdAt: r.created_at,
    }));
  }

  async deleteBlocksByUser(userId: string): Promise<void> {
    await this.ready;
    await this.db
      .prepare("DELETE FROM blocks WHERE blocker_id = ? OR blocked_id = ?")
      .run(userId, userId);
  }

  async createReport(
    reporterId: string,
    targetType: string,
    targetId: string,
    reason: string,
  ): Promise<Report> {
    await this.ready;
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

    await this.db
      .prepare(
        `INSERT INTO reports (id, reporter_id, target_type, target_id, reason, status, resolution, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        report.id,
        report.reporterId,
        report.targetType,
        report.targetId,
        report.reason,
        report.status,
        report.resolution,
        report.createdAt,
      );

    return report;
  }

  async listReports(status?: ReportStatus): Promise<Report[]> {
    await this.ready;
    let rows: any[];
    if (status) {
      rows = (await this.db
        .prepare(
          "SELECT id, reporter_id, target_type, target_id, reason, status, resolution, created_at FROM reports WHERE status = ? ORDER BY created_at DESC",
        )
        .all(status)) as any[];
    } else {
      rows = (await this.db
        .prepare(
          "SELECT id, reporter_id, target_type, target_id, reason, status, resolution, created_at FROM reports ORDER BY created_at DESC",
        )
        .all()) as any[];
    }

    return rows.map((r) => ({
      id: r.id,
      reporterId: r.reporter_id,
      targetType: r.target_type,
      targetId: r.target_id,
      reason: r.reason,
      status: r.status,
      resolution: r.resolution,
      createdAt: r.created_at,
    }));
  }

  async updateReport(report: Report): Promise<Report> {
    await this.ready;
    await this.db
      .prepare(
        `UPDATE reports SET
           reporter_id = ?, target_type = ?, target_id = ?, reason = ?, status = ?, resolution = ?
         WHERE id = ?`,
      )
      .run(
        report.reporterId,
        report.targetType,
        report.targetId,
        report.reason,
        report.status,
        report.resolution,
        report.id,
      );
    return report;
  }

  async deleteReportsByUser(userId: string): Promise<void> {
    await this.ready;
    await this.db
      .prepare("DELETE FROM reports WHERE reporter_id = ?")
      .run(userId);
  }

  // --- Conversations & DMs ---
  async findConversationBetween(
    userA: string,
    userB: string,
  ): Promise<Conversation | null> {
    await this.ready;
    const row = (await this.db
      .prepare(
        `SELECT c.id, c.journey_id, c.created_at, c.updated_at
         FROM conversations c
         JOIN conversation_members cm1 ON cm1.conversation_id = c.id AND cm1.user_id = ?
         JOIN conversation_members cm2 ON cm2.conversation_id = c.id AND cm2.user_id = ?`,
      )
      .get(userA, userB)) as any;

    if (!row) return null;
    return {
      id: row.id,
      journeyId: row.journey_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async createConversation(
    participantIds: [string, string],
    journeyId: string,
  ): Promise<Conversation> {
    await this.ready;
    const existing = await this.findConversationBetween(
      participantIds[0],
      participantIds[1],
    );
    if (existing) return existing;

    const timestamp = nowIso();
    const conversation: Conversation = {
      id: newId(),
      journeyId,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await this.db
      .prepare(
        "INSERT INTO conversations (id, journey_id, created_at, updated_at) VALUES (?, ?, ?, ?)",
      )
      .run(
        conversation.id,
        conversation.journeyId,
        conversation.createdAt,
        conversation.updatedAt,
      );

    const insertMember = this.db.prepare(
      "INSERT INTO conversation_members (id, conversation_id, user_id, created_at) VALUES (?, ?, ?, ?)",
    );

    for (const userId of participantIds) {
      await insertMember.run(newId(), conversation.id, userId, timestamp);
    }

    return conversation;
  }

  async getConversation(id: string): Promise<Conversation | null> {
    await this.ready;
    const row = (await this.db
      .prepare(
        "SELECT id, journey_id, created_at, updated_at FROM conversations WHERE id = ?",
      )
      .get(id)) as any;

    if (!row) return null;
    return {
      id: row.id,
      journeyId: row.journey_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async listConversationsForUser(userId: string): Promise<Conversation[]> {
    await this.ready;
    const rows = (await this.db
      .prepare(
        `SELECT c.id, c.journey_id, c.created_at, c.updated_at
         FROM conversations c
         JOIN conversation_members cm ON cm.conversation_id = c.id
         WHERE cm.user_id = ?
         ORDER BY c.updated_at DESC`,
      )
      .all(userId)) as any[];

    return rows.map((r) => ({
      id: r.id,
      journeyId: r.journey_id,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }

  async listConversationParticipants(
    conversationId: string,
  ): Promise<string[]> {
    await this.ready;
    const rows = (await this.db
      .prepare(
        "SELECT user_id FROM conversation_members WHERE conversation_id = ?",
      )
      .all(conversationId)) as any[];

    return rows.map((r) => r.user_id);
  }

  async addDirectMessage(
    conversationId: string,
    senderId: string,
    body: string,
  ): Promise<DirectMessage> {
    await this.ready;
    const timestamp = nowIso();
    const message: DirectMessage = {
      id: newId(),
      conversationId,
      senderId,
      body,
      createdAt: timestamp,
    };

    await this.db
      .prepare(
        "INSERT INTO direct_messages (id, conversation_id, sender_id, body, created_at) VALUES (?, ?, ?, ?, ?)",
      )
      .run(
        message.id,
        message.conversationId,
        message.senderId,
        message.body,
        message.createdAt,
      );

    await this.db
      .prepare("UPDATE conversations SET updated_at = ? WHERE id = ?")
      .run(timestamp, conversationId);

    return message;
  }

  async listDirectMessages(conversationId: string): Promise<DirectMessage[]> {
    await this.ready;
    const rows = (await this.db
      .prepare(
        `SELECT id, conversation_id, sender_id, body, created_at
         FROM direct_messages WHERE conversation_id = ?
         ORDER BY created_at DESC, id DESC LIMIT 200`,
      )
      .all(conversationId)) as any[];

    return rows.reverse().map((r) => ({
      id: r.id,
      conversationId: r.conversation_id,
      senderId: r.sender_id,
      body: r.body,
      createdAt: r.created_at,
    }));
  }

  async listDmMessages(conversationId: string): Promise<DirectMessage[]> {
    await this.ready;
    return this.listDirectMessages(conversationId);
  }

  // --- Notifications ---
  async createNotification(
    input: CreateNotificationInput,
  ): Promise<Notification> {
    await this.ready;
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

    await this.db
      .prepare(
        `INSERT INTO notifications (
           id, user_id, type, title, body, resource_type, resource_id, journey_id, read_at, created_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        notification.id,
        notification.userId,
        notification.type,
        notification.title,
        notification.body,
        notification.resourceType,
        notification.resourceId,
        notification.journeyId,
        notification.readAt,
        notification.createdAt,
      );

    return notification;
  }

  async listNotifications(userId: string): Promise<Notification[]> {
    await this.ready;
    const rows = (await this.db
      .prepare(
        `SELECT id, user_id, type, title, body, resource_type, resource_id, journey_id, read_at, created_at
         FROM notifications WHERE user_id = ?
         ORDER BY created_at DESC, id DESC LIMIT 100`,
      )
      .all(userId)) as any[];

    return rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      type: r.type,
      title: r.title,
      body: r.body,
      resourceType: r.resource_type,
      resourceId: r.resource_id,
      journeyId: r.journey_id,
      readAt: r.read_at,
      createdAt: r.created_at,
    }));
  }

  async markNotificationRead(
    id: string,
    userId: string,
  ): Promise<Notification | null> {
    await this.ready;
    const row = await this.db
      .prepare(
        "SELECT id, user_id FROM notifications WHERE id = ? AND user_id = ?",
      )
      .get(id, userId);

    if (!row) return null;

    const readAt = nowIso();
    await this.db
      .prepare("UPDATE notifications SET read_at = ? WHERE id = ?")
      .run(readAt, id);

    const full = (await this.db
      .prepare(
        `SELECT id, user_id, type, title, body, resource_type, resource_id, journey_id, read_at, created_at
         FROM notifications WHERE id = ?`,
      )
      .get(id)) as any;

    if (!full) return null;
    return {
      id: full.id,
      userId: full.user_id,
      type: full.type,
      title: full.title,
      body: full.body,
      resourceType: full.resource_type,
      resourceId: full.resource_id,
      journeyId: full.journey_id,
      readAt: full.read_at,
      createdAt: full.created_at,
    };
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    await this.ready;
    await this.db
      .prepare(
        "UPDATE notifications SET read_at = ? WHERE user_id = ? AND read_at IS NULL",
      )
      .run(nowIso(), userId);
  }

  async countUnreadNotifications(userId: string): Promise<number> {
    await this.ready;
    const row = (await this.db
      .prepare(
        "SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read_at IS NULL",
      )
      .get(userId)) as { count: number | bigint };

    return Number(row.count);
  }

  // --- Games ---
  async createGame(input: CreateGameInput): Promise<GameSession> {
    await this.ready;
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

    await this.db
      .prepare(
        `INSERT INTO game_sessions (
           id, journey_id, kind, status, host_user_id, player_ids, max_players, state, winner_id, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        game.id,
        game.journeyId,
        game.kind,
        game.status,
        game.hostUserId,
        JSON.stringify(game.playerIds),
        game.maxPlayers,
        JSON.stringify(game.state),
        game.winnerId,
        game.createdAt,
        game.updatedAt,
      );

    return game;
  }

  async getGame(id: string): Promise<GameSession | null> {
    await this.ready;
    const row = (await this.db
      .prepare(
        `SELECT id, journey_id, kind, status, host_user_id, player_ids, max_players, state, winner_id, created_at, updated_at
         FROM game_sessions WHERE id = ?${this.db.dialect === "postgres" ? " FOR UPDATE" : ""}`,
      )
      .get(id)) as any;

    if (!row) return null;
    return {
      id: row.id,
      journeyId: row.journey_id,
      kind: row.kind,
      status: row.status,
      hostUserId: row.host_user_id,
      playerIds: JSON.parse(row.player_ids || "[]"),
      maxPlayers: Number(row.max_players),
      state: JSON.parse(row.state || "{}"),
      winnerId: row.winner_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async updateGame(game: GameSession): Promise<GameSession> {
    await this.ready;
    const updated = { ...game, updatedAt: nowIso() };
    await this.db
      .prepare(
        `UPDATE game_sessions SET
           journey_id = ?, kind = ?, status = ?, host_user_id = ?, player_ids = ?,
           max_players = ?, state = ?, winner_id = ?, updated_at = ?
         WHERE id = ?`,
      )
      .run(
        updated.journeyId,
        updated.kind,
        updated.status,
        updated.hostUserId,
        JSON.stringify(updated.playerIds),
        updated.maxPlayers,
        JSON.stringify(updated.state),
        updated.winnerId,
        updated.updatedAt,
        updated.id,
      );
    return updated;
  }

  async listGamesByJourney(journeyId: string): Promise<GameSession[]> {
    await this.ready;
    const rows = (await this.db
      .prepare(
        `SELECT id, journey_id, kind, status, host_user_id, player_ids, max_players, state, winner_id, created_at, updated_at
         FROM game_sessions WHERE journey_id = ?
         ORDER BY created_at DESC, id DESC LIMIT 100`,
      )
      .all(journeyId)) as any[];

    return rows.map((r) => ({
      id: r.id,
      journeyId: r.journey_id,
      kind: r.kind,
      status: r.status,
      hostUserId: r.host_user_id,
      playerIds: JSON.parse(r.player_ids || "[]"),
      maxPlayers: Number(r.max_players),
      state: JSON.parse(r.state || "{}"),
      winnerId: r.winner_id,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }

  // --- Polls ---
  async createPoll(poll: Poll): Promise<Poll> {
    await this.ready;
    await this.db
      .prepare(
        `INSERT INTO polls (id, post_id, journey_id, question, options, closes_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        poll.id,
        poll.postId,
        poll.journeyId,
        poll.question,
        JSON.stringify(poll.options),
        poll.closesAt,
        poll.createdAt,
      );

    return poll;
  }

  async getPollByPostId(postId: string): Promise<Poll | null> {
    await this.ready;
    const row = (await this.db
      .prepare(
        "SELECT id, post_id, journey_id, question, options, closes_at, created_at FROM polls WHERE post_id = ?",
      )
      .get(postId)) as any;

    if (!row) return null;
    return {
      id: row.id,
      postId: row.post_id,
      journeyId: row.journey_id,
      question: row.question,
      options: JSON.parse(row.options || "[]"),
      closesAt: row.closes_at,
      createdAt: row.created_at,
    };
  }

  async votePoll(
    pollId: string,
    optionId: string,
    userId: string,
  ): Promise<Poll> {
    await this.ready;
    const poll = await this.getPoll(pollId);
    if (!poll) {
      throw new Error("Poll not found");
    }

    const options: PollOption[] = poll.options.map((option) => {
      const votes = option.votes.filter((v) => v !== userId);
      if (option.id === optionId) {
        votes.push(userId);
      }
      return { ...option, votes };
    });

    const updated: Poll = { ...poll, options };
    await this.db
      .prepare("UPDATE polls SET options = ? WHERE id = ?")
      .run(JSON.stringify(options), pollId);

    return updated;
  }

  async getPoll(pollId: string): Promise<Poll | null> {
    await this.ready;
    const row = (await this.db
      .prepare(
        `SELECT id, post_id, journey_id, question, options, closes_at, created_at FROM polls WHERE id = ?${this.db.dialect === "postgres" ? " FOR UPDATE" : ""}`,
      )
      .get(pollId)) as any;

    if (!row) return null;
    return {
      id: row.id,
      postId: row.post_id,
      journeyId: row.journey_id,
      question: row.question,
      options: JSON.parse(row.options || "[]"),
      closesAt: row.closes_at,
      createdAt: row.created_at,
    };
  }

  async getPollVote(
    pollId: string,
    userId: string,
  ): Promise<{ optionId: string } | null> {
    await this.ready;
    const poll = await this.getPoll(pollId);
    if (!poll) return null;

    for (const option of poll.options) {
      if (option.votes.includes(userId)) {
        return { optionId: option.id };
      }
    }
    return null;
  }

  // --- Badges ---
  async awardBadge(
    userId: string,
    badgeCode: BadgeCode,
  ): Promise<UserBadge | null> {
    await this.ready;
    const existing = (await this.db
      .prepare(
        "SELECT user_id, badge_code, earned_at FROM user_badges WHERE user_id = ? AND badge_code = ?",
      )
      .get(userId, badgeCode)) as any;

    if (existing) {
      return {
        userId: existing.user_id,
        badgeCode: existing.badge_code,
        earnedAt: existing.earned_at,
      };
    }

    const badge: UserBadge = {
      userId,
      badgeCode,
      earnedAt: nowIso(),
    };

    await this.db
      .prepare(
        "INSERT INTO user_badges (user_id, badge_code, earned_at) VALUES (?, ?, ?)",
      )
      .run(badge.userId, badge.badgeCode, badge.earnedAt);

    return badge;
  }

  async listBadges(userId: string): Promise<UserBadge[]> {
    await this.ready;
    const rows = (await this.db
      .prepare(
        "SELECT user_id, badge_code, earned_at FROM user_badges WHERE user_id = ?",
      )
      .all(userId)) as any[];

    return rows.map((r) => ({
      userId: r.user_id,
      badgeCode: r.badge_code,
      earnedAt: r.earned_at,
    }));
  }

  // --- Account Anonymization & Cleanup ---
  async anonymizeUserContent(userId: string): Promise<void> {
    await this.ready;
    await this.deletePostsByAuthor(userId);
    await this.deleteCommentsByAuthor(userId);
    await this.deleteMessagesByAuthor(userId);
    await this.deleteReactionsByUser(userId);
    await this.deleteTicketsByUser(userId);
    await this.deleteTicketExtractionsByUser(userId);
    await this.deleteJourneyMembersByUser(userId);
    await this.deleteBlocksByUser(userId);
    await this.deleteReportsByUser(userId);

    // Delete conversations where user is a participant
    const userConvs = (await this.db
      .prepare(
        "SELECT conversation_id FROM conversation_members WHERE user_id = ?",
      )
      .all(userId)) as { conversation_id: string }[];

    for (const { conversation_id } of userConvs) {
      await this.db
        .prepare("DELETE FROM direct_messages WHERE conversation_id = ?")
        .run(conversation_id);
      await this.db
        .prepare("DELETE FROM conversation_members WHERE conversation_id = ?")
        .run(conversation_id);
      await this.db
        .prepare("DELETE FROM conversations WHERE id = ?")
        .run(conversation_id);
    }

    await this.db
      .prepare("DELETE FROM notifications WHERE user_id = ?")
      .run(userId);
    await this.db
      .prepare("DELETE FROM game_sessions WHERE host_user_id = ?")
      .run(userId);
    await this.db
      .prepare("DELETE FROM user_badges WHERE user_id = ?")
      .run(userId);

    // Remove user votes from all polls
    const allPolls = (await this.db
      .prepare("SELECT id, options FROM polls")
      .all()) as any[];
    for (const pollRow of allPolls) {
      const options: PollOption[] = JSON.parse(pollRow.options || "[]");
      let modified = false;
      const cleaned = options.map((opt) => {
        if (opt.votes.includes(userId)) {
          modified = true;
          return { ...opt, votes: opt.votes.filter((v) => v !== userId) };
        }
        return opt;
      });
      if (modified) {
        await this.db
          .prepare("UPDATE polls SET options = ? WHERE id = ?")
          .run(JSON.stringify(cleaned), pollRow.id);
      }
    }

    await this.deleteProfile(userId);
    await this.deleteAnonymousProfile(userId);
    await this.deleteAuthUser(userId);
  }

  reset(): void {
    if (process.env.NODE_ENV === "production")
      throw new Error("Refusing to reset production data");
    this.ready = this.ready.then(async () => {
      await this.db.exec(`
      DELETE FROM consumed_refresh_tokens;
      DELETE FROM auth_sessions;
      DELETE FROM user_badges;
      DELETE FROM polls;
      DELETE FROM game_sessions;
      DELETE FROM notifications;
      DELETE FROM direct_messages;
      DELETE FROM conversation_members;
      DELETE FROM conversations;
      DELETE FROM reports;
      DELETE FROM blocks;
      DELETE FROM messages;
      DELETE FROM chat_rooms;
      DELETE FROM post_reactions;
      DELETE FROM comments;
      DELETE FROM posts;
      DELETE FROM ticket_extractions;
      DELETE FROM tickets;
      DELETE FROM journey_members;
      DELETE FROM communities;
      DELETE FROM journeys;
      DELETE FROM anonymous_profiles;
      DELETE FROM profiles;
      DELETE FROM auth_users;
    `);
      await this.seedCatalog();
    });
  }
  async close(): Promise<void> {
    await this.ready;
    await this.db.close();
  }
}
