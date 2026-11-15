import { AppError } from "@/lib/errors";
import { serializeTicketExtraction } from "@/server/api/serializers";
import { requireUser } from "@/server/auth/session";
import { jsonError, jsonOk } from "@/server/http";
import { getStore } from "@/server/store";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser(request);
    const { id } = await params;
    const store = getStore();
    const extraction = await store.getTicketExtractionById(id);

    if (!extraction || extraction.userId !== user.id) {
      throw new AppError("not_found", "Ticket extraction not found");
    }

    return jsonOk(serializeTicketExtraction(extraction));
  } catch (error) {
    return jsonError(error);
  }
}
