import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { hmacPnr } from "@/server/crypto/pnr";
import type { Ticket, TicketExtraction } from "@/server/domain/types";
import {
  createManualJourney,
  ensureTrainWideCommunityAndChat,
  membershipExpiry,
} from "@/server/journeys/service";
import { getStore } from "@/server/store";
import { HeuristicTicketParser } from "@/server/tickets/parser";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { encryptTicket } from "./vault";

const MAX_TICKET_BYTES = 8 * 1024 * 1024;

type DetectedTicketType = "application/pdf" | "image/jpeg" | "image/png";

function detectTicketMime(buffer: Buffer): DetectedTicketType | null {
  if (
    buffer.length >= 5 &&
    buffer.subarray(0, 5).toString("ascii") === "%PDF-"
  ) {
    return "application/pdf";
  }
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return "image/jpeg";
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }
  return null;
}

function ticketStorageDir(): string {
  return (
    process.env.TICKET_STORAGE_DIR ??
    path.join(process.cwd(), ".data", "tickets")
  );
}

export interface UploadTicketInput {
  userId: string;
  filename: string;
  mimeType: string;
  buffer: Buffer;
}

export interface UploadTicketResult {
  ticket: Ticket;
  extraction: TicketExtraction;
}

export async function uploadTicket(
  input: UploadTicketInput,
): Promise<UploadTicketResult> {
  if (input.buffer.byteLength > MAX_TICKET_BYTES) {
    throw new AppError("validation", "Ticket file must be 8MB or smaller");
  }

  if (input.buffer.byteLength === 0) {
    throw new AppError("validation", "Ticket file is empty");
  }

  const detectedMime = detectTicketMime(input.buffer);
  if (!detectedMime) {
    throw new AppError(
      "validation",
      "Ticket must be a valid PDF, JPEG, or PNG file",
    );
  }

  const store = getStore();
  // Decode and extract before persisting anything; a failed OCR leaves no raw file.
  const preprocessor = (await import("./preprocessor")).getImagePreprocessor();
  const preprocessed = await preprocessor.preprocess(
    input.buffer,
    detectedMime,
  );
  const ocr = await (
    await import("./ocr-engine")
  )
    .getLocalOcrEngine()
    .recognize(preprocessed.buffer, preprocessed.mimeType);
  const textToParse = ocr.text;
  const parser = new HeuristicTicketParser(store);
  const parsed = await parser.parse(textToParse);

  if (parsed.trainNumber) {
    const train = await store.getTrainByNumber(parsed.trainNumber);
    if (!train) {
      throw new AppError(
        "validation",
        `Unknown train number: ${parsed.trainNumber}`,
      );
    }
    parsed.trainName = train.name;
  }

  const storageDir = ticketStorageDir();
  await mkdir(storageDir, { recursive: true, mode: 0o700 });
  const storageKey = path.join(storageDir, `${crypto.randomUUID()}.rbv`);
  await writeFile(storageKey, encryptTicket(input.buffer), {
    mode: 0o600,
    flag: "wx",
  });
  let ticket: Ticket;
  let extraction: TicketExtraction;
  try {
    const created = await store.transaction(async () => {
      const ticket = await store.createTicket({
        userId: input.userId,
        storageKey,
        mimeType: detectedMime,
        byteSize: input.buffer.byteLength,
        scanStatus: "pending",
      });
      const rawFields: Record<string, unknown> = {
        sourceLength: textToParse.length,
        engine: ocr.engine,
      };
      const extraction = await store.createTicketExtraction({
        ticketId: ticket.id,
        userId: input.userId,
        status: "draft",
        trainNumber: parsed.trainNumber,
        trainName: parsed.trainName,
        journeyDate: parsed.journeyDate,
        boardingStationCode: parsed.boardingStationCode,
        destinationStationCode: parsed.destinationStationCode,
        coach: parsed.coach,
        berth: parsed.berth,
        travelClass: parsed.travelClass,
        pnrHash: parsed.pnr ? hmacPnr(parsed.pnr) : null,
        confidence: parsed.confidence,
        rawFields,
      });

      return { ticket, extraction };
    });
    ticket = created.ticket;
    extraction = created.extraction;
  } catch (error) {
    await unlink(storageKey).catch(() => {});
    throw error;
  }

  logger.info("ticket_uploaded", {
    ticketId: ticket.id,
    userId: input.userId,
    mimeType: detectedMime,
    byteSize: input.buffer.byteLength,
  });

  return { ticket, extraction };
}

export interface ConfirmExtractionInput {
  userId: string;
  extractionId: string;
  overrides?: Partial<{
    trainNumber: string;
    journeyDate: string;
    boardingStationCode: string;
    destinationStationCode: string;
    coach: string;
    berth: string;
    travelClass: string;
    pnr: string;
  }>;
}

export async function confirmExtraction(
  input: ConfirmExtractionInput,
): Promise<{
  extraction: TicketExtraction;
  journeyId: string;
}> {
  return getStore().transaction(async () => {
    const store = getStore();
    const extraction = await store.getTicketExtractionById(input.extractionId);

    if (!extraction || extraction.userId !== input.userId) {
      throw new AppError("not_found", "Ticket extraction not found");
    }

    if (extraction.status !== "draft") {
      throw new AppError("validation", "Extraction is not in draft status");
    }

    const trainNumber = input.overrides?.trainNumber ?? extraction.trainNumber;
    const journeyDate = input.overrides?.journeyDate ?? extraction.journeyDate;
    const boardingStationCode =
      input.overrides?.boardingStationCode ?? extraction.boardingStationCode;
    const destinationStationCode =
      input.overrides?.destinationStationCode ??
      extraction.destinationStationCode;

    if (
      !trainNumber ||
      !journeyDate ||
      !boardingStationCode ||
      !destinationStationCode
    ) {
      throw new AppError(
        "validation",
        "Missing required journey fields for confirmation",
      );
    }

    const pnrPlain = input.overrides?.pnr;
    let pnrHash = extraction.pnrHash;

    if (pnrPlain) {
      pnrHash = hmacPnr(pnrPlain);
    }

    if (pnrHash) {
      const duplicate = await store.findTicketExtractionByPnrHash(
        pnrHash,
        input.userId,
      );
      if (duplicate) {
        throw new AppError(
          "conflict",
          "This PNR is already linked to another account",
        );
      }
    }

    const journey = await createManualJourney(input.userId, {
      trainNumber,
      journeyDate,
      fromCode: boardingStationCode,
      toCode: destinationStationCode,
    });

    await ensureTrainWideCommunityAndChat(journey);

    const member = await store.getJourneyMember(input.userId, journey.id);
    if (member) {
      await store.updateJourneyMember({
        ...member,
        status: "verified",
        verificationMethod: "ticket_extracted",
        expiresAt: membershipExpiry(journey.journeyDate),
      });
    } else {
      await store.createJourneyMember({
        userId: input.userId,
        journeyId: journey.id,
        status: "verified",
        verificationMethod: "ticket_extracted",
        expiresAt: membershipExpiry(journey.journeyDate),
      });
    }

    const ticket = await store.getTicketById(extraction.ticketId);
    if (ticket?.storageKey) {
      try {
        await unlink(ticket.storageKey);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT")
          throw new AppError(
            "unavailable",
            "Ticket cleanup failed. Please try confirming again.",
          );
      }

      await store.updateTicket({
        ...ticket,
        storageKey: null,
        deletedAt: new Date().toISOString(),
      });
    }

    const cleanedRawFields = {
      sourceLength: extraction.rawFields.sourceLength ?? 0,
      engine: extraction.rawFields.engine ?? "legacy",
    };

    const updatedExtraction = await store.updateTicketExtraction({
      ...extraction,
      status: "confirmed",
      trainNumber,
      journeyDate,
      boardingStationCode,
      destinationStationCode,
      coach: input.overrides?.coach ?? extraction.coach,
      berth: input.overrides?.berth ?? extraction.berth,
      travelClass: input.overrides?.travelClass ?? extraction.travelClass,
      pnrHash,
      rawFields: cleanedRawFields,
      journeyId: journey.id,
      confirmedAt: new Date().toISOString(),
    });

    logger.info("ticket_extraction_confirmed", {
      extractionId: updatedExtraction.id,
      userId: input.userId,
      journeyId: journey.id,
    });

    return { extraction: updatedExtraction, journeyId: journey.id };
  });
}
