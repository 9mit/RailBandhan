import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { getStore } from "@/server/store";
import { unlink } from "node:fs/promises";

export async function deleteAccount(userId: string): Promise<void> {
  const store = getStore();
  const user = await store.getAuthUserById(userId);

  if (!user) {
    throw new AppError("not_found", "Account not found");
  }

  const tickets = (await store.listTicketsForRetention()).filter(
    (ticket) => ticket.userId === userId && ticket.storageKey,
  );
  for (const ticket of tickets) {
    try {
      await unlink(ticket.storageKey!);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT")
        throw new AppError(
          "unavailable",
          "Ticket cleanup failed. Please retry account deletion.",
        );
    }
  }

  await store.transaction(async () => {
    await store.revokeUserSessions(userId);
    await store.anonymizeUserContent(userId);
  });

  logger.info("account_deleted", { userId });
}
