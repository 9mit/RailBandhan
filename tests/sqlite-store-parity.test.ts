import { describe, it, expect, beforeEach } from "vitest";
import { SqliteStore } from "@/server/store/sqlite-store";

describe("SQLite Store Parity & Full Feature Validation", () => {
  let sqliteStore: SqliteStore;

  beforeEach(() => {
    sqliteStore = new SqliteStore(":memory:");
  });

  it("correctly initializes and seeds canonical catalog", async () => {
    const trains = await sqliteStore.listTrains();
    expect(trains.length).toBeGreaterThanOrEqual(2);
    expect(trains.map((t) => t.number)).toContain("12723");

    const stations = await sqliteStore.listStations();
    expect(stations.length).toBeGreaterThanOrEqual(8);
    expect(stations.map((s) => s.code)).toContain("SC");
    expect(stations.map((s) => s.code)).toContain("NDLS");

    const scStation = await sqliteStore.getStationByCode("SC");
    expect(scStation?.name).toContain("Secunderabad");

    const train = await sqliteStore.getTrainByNumber("12723");
    expect(train?.name).toBe("Telangana Express");

    const stops = await sqliteStore.getRouteStopsForTrain(train!.id);
    expect(stops.length).toBeGreaterThan(6);
    const ramagundam = await sqliteStore.getStationByCode("RDM");
    expect(stops.some((stop) => stop.stationId === ramagundam?.id)).toBe(true);
    expect(stops[0].stopIndex).toBe(0);
  });

  it("manages auth users, roles, and profile lifecycles", async () => {
    const user = await sqliteStore.createAuthUser({
      email: "sqlite_test@railbandhan.in",
      passwordHash: "hashed_password_sample_123",
    });
    expect(user.id).toBeDefined();
    expect(user.email).toBe("sqlite_test@railbandhan.in");

    // Duplicate email rejected
    await expect(
      sqliteStore.createAuthUser({
        email: "sqlite_test@railbandhan.in",
        passwordHash: "another_hash",
      }),
    ).rejects.toThrow("User already exists");

    // Role assignment
    const modUser = await sqliteStore.setAuthUserRole(user.id, "moderator");
    expect(modUser.role).toBe("moderator");

    // Profile CRUD
    await sqliteStore.upsertProfile({
      userId: user.id,
      realName: "SQLite User",
      age: 28,
      gender: "other",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const fetchedProfile = await sqliteStore.getProfile(user.id);
    expect(fetchedProfile?.realName).toBe("SQLite User");
    expect(fetchedProfile?.age).toBe(28);

    // Anonymous Profile CRUD
    await sqliteStore.upsertAnonymousProfile({
      userId: user.id,
      publicHandle: "Passenger_SQLite99",
      avatarUrl: null,
      bio: "Exploring SQLite power",
      reputation: 10,
      discoveryVisible: true,
      messagingPolicy: "same_journey",
      coachVisibility: "never",
      onboardingComplete: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const anon = await sqliteStore.getAnonymousProfile(user.id);
    expect(anon?.publicHandle).toBe("Passenger_SQLite99");
    expect(anon?.reputation).toBe(10);
    expect(anon?.discoveryVisible).toBe(true);

    const isTaken = await sqliteStore.isHandleTaken("Passenger_SQLite99");
    expect(isTaken).toBe(true);

    const isTakenExcludingSelf = await sqliteStore.isHandleTaken(
      "Passenger_SQLite99",
      user.id,
    );
    expect(isTakenExcludingSelf).toBe(false);
  });

  it("handles journeys, members, communities, and chat rooms", async () => {
    const user = await sqliteStore.createAuthUser({
      email: "journey_user@railbandhan.in",
      passwordHash: "hash",
    });
    const train = (await sqliteStore.getTrainByNumber("12723"))!;
    const sc = (await sqliteStore.getStationByCode("SC"))!;
    const ndls = (await sqliteStore.getStationByCode("NDLS"))!;

    const journey = await sqliteStore.createJourney({
      trainId: train.id,
      journeyDate: "2026-08-25",
      boardingStationId: sc.id,
      destinationStationId: ndls.id,
      normalizedKey: "12723:2026-08-25:SC:NDLS",
    });

    expect(journey.id).toBeDefined();

    const member = await sqliteStore.createJourneyMember({
      userId: user.id,
      journeyId: journey.id,
      status: "verified",
      verificationMethod: "manual",
      expiresAt: "2026-08-27T23:59:59.999Z",
    });

    expect(member.status).toBe("verified");

    const fetchedMember = await sqliteStore.getJourneyMember(
      user.id,
      journey.id,
    );
    expect(fetchedMember?.id).toBe(member.id);

    const community = await sqliteStore.createCommunity({
      trainId: train.id,
      journeyDate: journey.journeyDate,
      journeyId: journey.id,
      type: "train_wide",
      slug: "12723-2026-08-25-train-wide",
    });

    expect(community.type).toBe("train_wide");

    const fetchedComm = await sqliteStore.getTrainWideCommunity(journey.id);
    expect(fetchedComm?.id).toBe(community.id);

    const room = await sqliteStore.createChatRoom(journey.id, community.id);
    expect(room.id).toBeDefined();

    const msg = await sqliteStore.createMessage({
      roomId: room.id,
      authorId: user.id,
      body: "Hello from SQLite test!",
    });

    const messages = await sqliteStore.listMessagesByRoom(room.id);
    expect(messages.length).toBe(1);
    expect(messages[0].body).toBe(msg.body);
  });

  it("supports posts, comments, reactions, and polls with JSON columns", async () => {
    const user = await sqliteStore.createAuthUser({
      email: "post_user@railbandhan.in",
      passwordHash: "hash",
    });
    const train = (await sqliteStore.getTrainByNumber("12723"))!;
    const sc = (await sqliteStore.getStationByCode("SC"))!;
    const ndls = (await sqliteStore.getStationByCode("NDLS"))!;
    const journey = await sqliteStore.createJourney({
      trainId: train.id,
      journeyDate: "2026-08-25",
      boardingStationId: sc.id,
      destinationStationId: ndls.id,
      normalizedKey: "12723:2026-08-25:SC:NDLS:poll",
    });

    const comm = await sqliteStore.createCommunity({
      trainId: train.id,
      journeyDate: "2026-08-25",
      journeyId: journey.id,
      type: "train_wide",
      slug: "posts-test-community",
    });

    const post = await sqliteStore.createPost({
      communityId: comm.id,
      authorId: user.id,
      postType: "discussion",
      title: "Chai Meetup",
      body: "Chai at Nagpur?",
    });

    const comment = await sqliteStore.createComment({
      postId: post.id,
      authorId: user.id,
      body: "Yes, count me in!",
    });

    const reaction = await sqliteStore.createReaction(post.id, user.id, "like");
    expect(reaction.reaction).toBe("like");

    const reactions = await sqliteStore.listReactionsByPost(post.id);
    expect(reactions.length).toBe(1);

    const poll = await sqliteStore.createPoll({
      id: "poll-1234",
      postId: post.id,
      journeyId: journey.id,
      question: "Tea or Coffee?",
      options: [
        { id: "opt-1", label: "Tea", votes: [] },
        { id: "opt-2", label: "Coffee", votes: [] },
      ],
      closesAt: null,
      createdAt: new Date().toISOString(),
    });

    const voted = await sqliteStore.votePoll(poll.id, "opt-1", user.id);
    expect(voted.options[0].votes).toContain(user.id);

    const checkVote = await sqliteStore.getPollVote(poll.id, user.id);
    expect(checkVote?.optionId).toBe("opt-1");
  });

  it("anonymizes and purges user content completely", async () => {
    const user = await sqliteStore.createAuthUser({
      email: "purge_me@railbandhan.in",
      passwordHash: "hash",
    });

    await sqliteStore.upsertProfile({
      userId: user.id,
      realName: "Private Purge User",
      age: 30,
      gender: "M",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await sqliteStore.upsertAnonymousProfile({
      userId: user.id,
      publicHandle: "Passenger_Purge",
      avatarUrl: null,
      bio: "Will be deleted",
      reputation: 5,
      discoveryVisible: true,
      messagingPolicy: "same_journey",
      coachVisibility: "never",
      onboardingComplete: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await sqliteStore.awardBadge(user.id, "first_journey");
    const badges = await sqliteStore.listBadges(user.id);
    expect(badges.length).toBe(1);

    // Anonymize user
    await sqliteStore.anonymizeUserContent(user.id);

    expect(await sqliteStore.getAuthUserById(user.id)).toBeNull();
    expect(await sqliteStore.getProfile(user.id)).toBeNull();
    expect(await sqliteStore.getAnonymousProfile(user.id)).toBeNull();
    expect((await sqliteStore.listBadges(user.id)).length).toBe(0);
  });
});
