import { AppError } from "@/lib/errors";
import { requireVerifiedMembership } from "@/server/authz/membership";
import { getStore } from "@/server/store";
import {
  getTrainDataProvider,
  type AdvancedLiveStatus,
} from "@/server/trains/provider";

export async function getLiveStatusForJourney(
  userId: string,
  journeyId: string,
): Promise<AdvancedLiveStatus> {
  await requireVerifiedMembership(userId, journeyId);

  const store = getStore();
  const journey = await store.getJourneyById(journeyId);

  if (!journey) {
    throw new AppError("not_found", "Journey not found");
  }

  const train = await store.getTrainById(journey.trainId);
  if (!train) {
    throw new AppError("not_found", "Train not found");
  }

  const provider = getTrainDataProvider();
  const status = await provider.getLiveStatus(
    train.number,
    journey.journeyDate,
  );

  if (!status) {
    throw new AppError("not_found", "Live status unavailable for this train");
  }

  return status;
}
