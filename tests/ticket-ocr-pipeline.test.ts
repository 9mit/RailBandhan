import { ticketPdf } from "./fixtures/ticket";
import { getTestJourneyDate } from "./test-utils";
import { describe, it, expect, beforeEach } from "vitest";
import { createUser } from "@/server/auth/session";
import { uploadTicket, confirmExtraction } from "@/server/tickets/service";
import { HeuristicTicketParser } from "@/server/tickets/parser";
import { getStore, resetStore } from "@/server/store";

describe("Ticket Upload, OCR Extraction & Confirmation", () => {
  beforeEach(() => {
    resetStore();
  });

  it("parses raw ticket text into structured train fields accurately", async () => {
    const rawOcr = `
      INDIAN RAILWAYS E-TICKET
      PNR: 8472910482
      TRAIN: 12723 / TELANGANA EXP
      DATE OF JOURNEY: 20-08-2026
      FROM SC TO NDLS
      COACH: B2
      BERTH: 34
      CLASS: 3A
    `;

    const parser = new HeuristicTicketParser(getStore());
    const parsed = await parser.parse(rawOcr);

    expect(parsed.trainNumber).toBe("12723");
    expect(parsed.boardingStationCode).toBe("SC");
    expect(parsed.destinationStationCode).toBe("NDLS");
    expect(parsed.coach).toBe("B2");
    expect(parsed.berth).toBe("34");
    expect(parsed.travelClass).toBe("3A");
  });

  it("handles ticket upload and extraction pipeline end-to-end", async () => {
    const user = await createUser(
      "ticket_owner@railbandhan.in",
      "Password1234!",
    );

    const sampleTicketBuffer = ticketPdf([
      "PNR: 9876543210",
      "Train: 12723 Telangana Express",
      `Date: ${getTestJourneyDate()}`,
      "FROM SC TO NDLS",
      "Coach: B1 Berth: 12 Class: 3A",
    ]);
    const { ticket, extraction } = await uploadTicket({
      userId: user.id,
      filename: "12723_ticket.pdf",
      mimeType: "application/pdf",
      buffer: sampleTicketBuffer,
    });

    expect(ticket.id).toBeDefined();
    expect(extraction.id).toBeDefined();
    expect(extraction.trainNumber).toBe("12723");
    expect(extraction.boardingStationCode).toBe("SC");

    // Confirm ticket extraction into confirmed journey membership
    const confirmed = await confirmExtraction({
      userId: user.id,
      extractionId: extraction.id,
      overrides: {
        journeyDate: getTestJourneyDate(),
      },
    });

    expect(confirmed.journeyId).toBeDefined();
  });
});
