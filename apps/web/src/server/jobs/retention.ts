import { logger } from "@/lib/logger";
import { assertOperationalCredential } from "@/server/operations";
import { getStore } from "@/server/store";
import { unlink } from "node:fs/promises";

/**
 * Retention / cleanup job (invoke via cron or POST /api/v1/jobs/retention with CRON_SECRET).
 * - Deletes abandoned raw ticket files older than TICKET_RAW_MAX_AGE_HOURS
 * - Expires memberships past expires_at
 * - Marks completed journeys past journey_date + MEMBERSHIP_EXPIRE_DAYS_AFTER_JOURNEY
 */
export async function runRetentionJob(): Promise<{
  ticketsScrubbed: number;
  membershipsExpired: number;
  journeysCompleted: number;
}> {
  const store = getStore();
  const maxAgeHours = Number(process.env.TICKET_RAW_MAX_AGE_HOURS ?? 24);
  const cutoff = Date.now() - maxAgeHours * 60 * 60 * 1000;

  let ticketsScrubbed = 0;
  let membershipsExpired = 0;
  let journeysCompleted = 0;

  const tickets = await store.listTicketsForRetention();
  for (const ticket of tickets) {
    if (ticket.deletedAt || !ticket.storageKey) continue;
    if (new Date(ticket.createdAt).getTime() > cutoff) continue;

    try {
      await unlink(ticket.storageKey);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        logger.error("retention_file_cleanup_failed", { ticketId: ticket.id });
        continue;
      }
    }

    await store.updateTicket({
      ...ticket,
      storageKey: null,
      deletedAt: new Date().toISOString(),
    });
    ticketsScrubbed += 1;
  }

  const members = await store.listAllJourneyMembers();
  const now = Date.now();
  for (const member of members) {
    if (member.status !== "verified") continue;
    if (new Date(member.expiresAt).getTime() >= now) continue;
    await store.updateJourneyMember({ ...member, status: "expired" });
    membershipsExpired += 1;
  }

  const journeys = await store.listAllJourneys();
  for (const journey of journeys) {
    if (journey.status === "completed" || journey.status === "archived")
      continue;
    const end = new Date(`${journey.journeyDate}T23:59:59.000Z`).getTime();
    if (end >= now) continue;
    await store.updateJourney({
      ...journey,
      status: "completed",
      updatedAt: new Date().toISOString(),
    });
    journeysCompleted += 1;
  }

  await store.pruneAuthSessions(new Date().toISOString());
  logger.info("retention_job_completed", {
    ticketsScrubbed,
    membershipsExpired,
    journeysCompleted,
  });

  return { ticketsScrubbed, membershipsExpired, journeysCompleted };
}

export function assertCronAuthorized(request: Request): void {
  assertOperationalCredential(request, "CRON_SECRET");
}
