import { AppError } from "@/lib/errors";
import { assertCanAccessJourney } from "@/server/authz/membership";
import type { Journey, JourneyWithRelations } from "@/server/domain/types";
import { normalizeStationInput } from "@/server/railway/stations";
import { maybeAwardBadges } from "@/server/reputation/service";
import { getStore } from "@/server/store";
import { addDays } from "date-fns";

export interface CreateManualJourneyInput {
  trainNumber: string;
  journeyDate: string;
  fromCode: string;
  toCode: string;
}

export function normalizeJourneyKey(
  trainNumber: string,
  date: string,
  fromCode: string,
  toCode: string,
): string {
  const normalizedTrain = trainNumber.replace(/\s+/g, "").toUpperCase();
  const normalizedFrom = fromCode.trim().toUpperCase();
  const normalizedTo = toCode.trim().toUpperCase();
  return `${normalizedTrain}:${date}:${normalizedFrom}:${normalizedTo}`;
}

export function membershipExpiry(journeyDate: string): string {
  const daysRaw = process.env.MEMBERSHIP_EXPIRE_DAYS_AFTER_JOURNEY;
  const days = daysRaw !== undefined ? Number(daysRaw) : 2;
  const addCount = Number.isNaN(days) ? 2 : days;
  return addDays(
    new Date(`${journeyDate}T23:59:59.999+05:30`),
    addCount,
  ).toISOString();
}

async function enrichJourney(journey: Journey): Promise<JourneyWithRelations> {
  const store = getStore();
  const [train, boardingStation, destinationStation] = await Promise.all([
    store.getTrainById(journey.trainId),
    store.getStationById(journey.boardingStationId),
    store.getStationById(journey.destinationStationId),
  ]);

  return {
    ...journey,
    train: train ?? undefined,
    boardingStation: boardingStation ?? undefined,
    destinationStation: destinationStation ?? undefined,
  };
}

export async function ensureTrainWideCommunityAndChat(
  journey: Journey,
): Promise<void> {
  const store = getStore();
  const train = await store.getTrainById(journey.trainId);
  if (!train) {
    throw new AppError("not_found", "Train not found for journey");
  }

  let community = await store.getTrainWideCommunity(journey.id);
  if (!community) {
    const slug = `${train.number}-${journey.journeyDate}-train-wide`;
    community = await store.createCommunity({
      trainId: journey.trainId,
      journeyDate: journey.journeyDate,
      journeyId: journey.id,
      type: "train_wide",
      slug,
    });
  }

  const existingRoom = await store.getChatRoomByJourneyId(journey.id);
  if (!existingRoom) {
    await store.createChatRoom(journey.id, community.id);
  }
}

const MAX_ACTIVE_JOURNEYS = 8;

export async function createManualJourney(
  userId: string,
  input: CreateManualJourneyInput,
): Promise<JourneyWithRelations> {
  return getStore().transaction(async () => {
    const store = getStore();

    const existingMemberships = await store.listJourneyMembersByUser(userId);
    const activeCount = existingMemberships.filter(
      (member) =>
        member.status === "verified" &&
        new Date(member.expiresAt).getTime() >= Date.now(),
    ).length;
    if (activeCount >= MAX_ACTIVE_JOURNEYS) {
      throw new AppError(
        "rate_limited",
        "Too many active journeys on this account",
      );
    }

    const train = await store.getTrainByNumber(input.trainNumber);
    if (!train) {
      throw new AppError(
        "validation",
        `Unknown train number: ${input.trainNumber}`,
      );
    }

    const routeStops = await store.getRouteStopsForTrain(train.id);
    const normFromCode =
      normalizeStationInput(input.fromCode)?.code ??
      input.fromCode.trim().toUpperCase();
    const normToCode =
      normalizeStationInput(input.toCode)?.code ??
      input.toCode.trim().toUpperCase();

    const boardingStation = await store.getStationByCode(normFromCode);
    const destinationStation = await store.getStationByCode(normToCode);

    if (!boardingStation || !destinationStation) {
      throw new AppError(
        "validation",
        "Invalid boarding or destination station code",
      );
    }

    if (boardingStation.id === destinationStation.id) {
      throw new AppError(
        "validation",
        "Boarding and destination stations must differ",
      );
    }

    const stopIndexByStation = new Map(
      routeStops.map((s) => [s.stationId, s.stopIndex]),
    );

    const fromIndex = stopIndexByStation.get(boardingStation.id);
    const toIndex = stopIndexByStation.get(destinationStation.id);

    if (fromIndex === undefined || toIndex === undefined) {
      throw new AppError("validation", "Stations are not on this train route");
    }

    if (fromIndex >= toIndex) {
      throw new AppError(
        "validation",
        "Destination must be after boarding station on route",
      );
    }

    const date = Date.parse(`${input.journeyDate}T12:00:00+05:30`);
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(input.journeyDate) ||
      !Number.isFinite(date) ||
      new Date(date).toISOString().slice(0, 10) !== input.journeyDate
    )
      throw new AppError("validation", "Enter a valid journey date");
    if (date < Date.now() - 3 * 86400000 || date > Date.now() + 366 * 86400000)
      throw new AppError(
        "validation",
        "Choose a recent journey date or one within the next year",
      );

    const normalizedKey = normalizeJourneyKey(
      input.trainNumber,
      input.journeyDate,
      normFromCode,
      normToCode,
    );

    let journey = await store.getJourneyByNormalizedKey(normalizedKey);
    if (!journey) {
      journey = await store.createJourney({
        trainId: train.id,
        journeyDate: input.journeyDate,
        boardingStationId: boardingStation.id,
        destinationStationId: destinationStation.id,
        normalizedKey,
      });
    }

    await store.createJourneyMember({
      userId,
      journeyId: journey.id,
      status: "verified",
      verificationMethod: "manual",
      expiresAt: membershipExpiry(journey.journeyDate),
    });

    await ensureTrainWideCommunityAndChat(journey);

    await maybeAwardBadges(userId);

    return enrichJourney(journey);
  });
}

export async function getJourneyForUser(
  userId: string,
  journeyId: string,
): Promise<JourneyWithRelations> {
  const store = getStore();
  const journey = await store.getJourneyById(journeyId);

  // Always 403 for missing or unauthorized — do not leak journey existence
  if (!journey) {
    throw new AppError("forbidden", "You don't have access to this journey");
  }

  try {
    await assertCanAccessJourney(userId, journey);
  } catch {
    throw new AppError("forbidden", "You don't have access to this journey");
  }

  return enrichJourney(journey);
}

export async function listMyJourneys(
  userId: string,
): Promise<JourneyWithRelations[]> {
  const store = getStore();
  const members = await store.listJourneyMembersByUser(userId);
  const now = Date.now();

  const verified = members.filter(
    (m) => m.status === "verified" && new Date(m.expiresAt).getTime() >= now,
  );

  const journeys = await Promise.all(
    verified.map(async (member) => {
      const journey = await store.getJourneyById(member.journeyId);
      return journey ? enrichJourney(journey) : null;
    }),
  );

  return journeys
    .filter((j): j is JourneyWithRelations => j !== null)
    .sort((a, b) => b.journeyDate.localeCompare(a.journeyDate));
}
