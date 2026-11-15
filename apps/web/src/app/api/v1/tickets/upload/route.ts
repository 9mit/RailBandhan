import { AppError } from "@/lib/errors";
import { serializeTicketExtraction } from "@/server/api/serializers";
import { requireUser } from "@/server/auth/session";
import { jsonError, jsonOk, parseTicketForm } from "@/server/http";
import { rateLimit } from "@/server/rate-limit";
import { uploadTicket } from "@/server/tickets/service";

const UPLOAD_LIMIT = 5;
const UPLOAD_WINDOW_MS = 60 * 60 * 1000;

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);

    const limit = await rateLimit(
      `ticket-upload:${user.id}`,
      UPLOAD_LIMIT,
      UPLOAD_WINDOW_MS,
    );
    if (!limit.allowed) {
      throw new AppError(
        "rate_limited",
        "Ticket upload limit exceeded. Try again later.",
      );
    }

    const form = await parseTicketForm(request);
    const file = form.get("file");

    if (!(file instanceof File)) {
      throw new AppError("validation", "File field is required");
    }

    if (file.size > 8 * 1024 * 1024)
      throw new AppError(
        "payload_too_large",
        "Ticket file must be 8MB or smaller",
      );
    const buffer = Buffer.from(await file.arrayBuffer());

    const { ticket, extraction } = await uploadTicket({
      userId: user.id,
      filename: file.name,
      mimeType: file.type || "application/octet-stream",
      buffer,
    });

    return jsonOk({
      ticket_id: ticket.id,
      extraction_id: extraction.id,
      extraction: serializeTicketExtraction(extraction),
    });
  } catch (error) {
    return jsonError(error);
  }
}
