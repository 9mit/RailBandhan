import { beforeEach, describe, expect, it } from "vitest";
import { readFile, stat } from "node:fs/promises";
import { createUser } from "@/server/auth/session";
import { resetStore, getStore } from "@/server/store";
import { uploadTicket, confirmExtraction } from "@/server/tickets/service";
import { HeuristicTicketParser } from "@/server/tickets/parser";
import { encryptTicket, decryptTicket } from "@/server/tickets/vault";
import { ticketPdf } from "./fixtures/ticket";
import { getTestJourneyDate } from "./test-utils";
describe("Ticket integrity and confidentiality", () => {
  beforeEach(() => resetStore());
  it("does not fabricate fields from a filename", async () => {
    const parsed = await new HeuristicTicketParser(getStore()).parse(
      "",
      "12723_rajdhani_ticket.pdf",
    );
    expect(parsed.pnr).toBeNull();
    expect(parsed.trainNumber).toBeNull();
    expect(parsed.journeyDate).toBeNull();
  });
  it("rejects invalid PDFs and creates no ticket row", async () => {
    const user = await createUser(
      "invalidpdf@example.com",
      "long-passphrase-123",
    );
    await expect(
      uploadTicket({
        userId: user.id,
        filename: "12723.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.from("%PDF-1.4 fake"),
      }),
    ).rejects.toThrow("could not be read");
    expect(await getStore().listTicketsForRetention()).toHaveLength(0);
  });
  it("encrypts stored documents, never persists plaintext PNRs, and removes the file at confirmation", async () => {
    const user = await createUser(
      "privatepdf@example.com",
      "long-passphrase-123",
    );
    const result = await uploadTicket({
      userId: user.id,
      filename: "../../arbitrary-name.pdf",
      mimeType: "application/pdf",
      buffer: ticketPdf([
        "PNR: 8472910482",
        "TRAIN 12723 Telangana Express",
        `DATE ${getTestJourneyDate()}`,
        "FROM SC TO NDLS",
        "COACH B1 BERTH 12",
      ]),
    });
    const disk = await readFile(result.ticket.storageKey!);
    expect(disk.subarray(0, 4).toString()).toBe("RBV1");
    expect(disk.includes(Buffer.from("8472910482"))).toBe(false);
    expect(JSON.stringify(result.extraction)).not.toContain("8472910482");
    if (process.platform !== "win32") {
      expect((await stat(result.ticket.storageKey!)).mode & 0o777).toBe(0o600);
    }
    await confirmExtraction({
      userId: user.id,
      extractionId: result.extraction.id,
    });
    await expect(stat(result.ticket.storageKey!)).rejects.toThrow();
  });
  it("detects ciphertext tampering", () => {
    const original = Buffer.from("private ticket");
    const encrypted = encryptTicket(original);
    expect(decryptTicket(encrypted)).toEqual(original);
    encrypted[encrypted.length - 1] ^= 1;
    expect(() => decryptTicket(encrypted)).toThrow();
  });
});
