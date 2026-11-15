import { AppError } from "@/lib/errors";
import { serializeJourney } from "@/server/api/serializers";
import { requireUser } from "@/server/auth/session";
import { jsonError, jsonOk, parseJsonBody } from "@/server/http";
import { createManualJourney } from "@/server/journeys/service";
import { rateLimit } from "@/server/rate-limit";

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const limit = await rateLimit(
      `manual-journey:${user.id}`,
      5,
      60 * 60 * 1000,
    );
    if (!limit.allowed) {
      throw new AppError(
        "rate_limited",
        "Too many journey additions. Try again later.",
      );
    }

    const body = await parseJsonBody<{
      train_number?: string;
      trainNumber?: string;
      journey_date?: string;
      journeyDate?: string;
      boarding_station_code?: string;
      boardingStationCode?: string;
      fromCode?: string;
      destination_station_code?: string;
      destinationStationCode?: string;
      toCode?: string;
    }>(request);

    const journey = await createManualJourney(user.id, {
      trainNumber: (body.train_number ?? body.trainNumber ?? "").trim(),
      journeyDate: (body.journey_date ?? body.journeyDate ?? "").trim(),
      fromCode: (
        body.boarding_station_code ??
        body.boardingStationCode ??
        body.fromCode ??
        ""
      ).trim(),
      toCode: (
        body.destination_station_code ??
        body.destinationStationCode ??
        body.toCode ??
        ""
      ).trim(),
    });

    return jsonOk({
      journey_id: journey.id,
      journey: serializeJourney(journey),
    });
  } catch (error) {
    return jsonError(error);
  }
}
