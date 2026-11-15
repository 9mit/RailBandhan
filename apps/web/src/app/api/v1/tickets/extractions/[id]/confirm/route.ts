import { requireUser } from "@/server/auth/session";
import { jsonError, jsonOk, parseJsonBody } from "@/server/http";
import { updatePrivacy } from "@/server/profiles/service";
import { confirmExtraction } from "@/server/tickets/service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser(request);
    const { id } = await params;
    const body = await parseJsonBody<{
      train_number?: string;
      journey_date?: string;
      boarding_station_code?: string;
      destination_station_code?: string;
      coach?: string;
      berth?: string;
      travel_class?: string;
      pnr?: string;
      coach_visibility?: "never" | "coach" | "coach_berth";
    }>(request);

    const { journeyId } = await confirmExtraction({
      userId: user.id,
      extractionId: id,
      overrides: {
        trainNumber: body.train_number,
        journeyDate: body.journey_date,
        boardingStationCode: body.boarding_station_code,
        destinationStationCode: body.destination_station_code,
        coach: body.coach,
        berth: body.berth,
        travelClass: body.travel_class,
        pnr: body.pnr,
      },
    });

    if (body.coach_visibility) {
      await updatePrivacy({
        userId: user.id,
        coachVisibility: body.coach_visibility,
      });
    }

    return jsonOk({ journey_id: journeyId });
  } catch (error) {
    return jsonError(error);
  }
}
