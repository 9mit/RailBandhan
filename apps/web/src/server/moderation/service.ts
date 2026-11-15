import { AppError } from "@/lib/errors";
import type { Block, Report, ReportStatus } from "@/server/domain/types";
import { maybeAwardBadges } from "@/server/reputation/service";
import { getStore } from "@/server/store";

async function requireModerator(userId: string): Promise<void> {
  const store = getStore();
  const user = await store.getAuthUserById(userId);
  const role = user?.role ?? "user";
  if (role !== "moderator" && role !== "admin") {
    throw new AppError("forbidden", "Moderator access required");
  }
}

export async function createReport(
  reporterIdOrInput:
    | string
    | {
        reporterId: string;
        targetType: string;
        targetId: string;
        reason: string;
      },
  targetType?: string,
  targetId?: string,
  reason?: string,
): Promise<Report> {
  const input =
    typeof reporterIdOrInput === "string"
      ? {
          reporterId: reporterIdOrInput,
          targetType: targetType!,
          targetId: targetId!,
          reason: reason!,
        }
      : reporterIdOrInput;

  if (!input.reason.trim()) {
    throw new AppError("validation", "Report reason is required");
  }

  const store = getStore();
  const report = await store.createReport(
    input.reporterId,
    input.targetType,
    input.targetId,
    input.reason.trim(),
  );
  await maybeAwardBadges(input.reporterId);
  return report;
}

export async function listReports(userId: string): Promise<Report[]> {
  await requireModerator(userId);
  const store = getStore();
  return store.listReports();
}

export async function resolveReport(
  userIdOrInput:
    | string
    | {
        userId: string;
        reportId: string;
        status: ReportStatus;
        resolution?: string;
      },
  reportId?: string,
  resolution?: string,
  status: "resolved" | "dismissed" = "resolved",
): Promise<Report> {
  const input =
    typeof userIdOrInput === "string"
      ? {
          userId: userIdOrInput,
          reportId: reportId!,
          status,
          resolution,
        }
      : userIdOrInput;

  await requireModerator(input.userId);
  const store = getStore();
  const reports = await store.listReports();
  const report = reports.find((r) => r.id === input.reportId);
  if (!report) {
    throw new AppError("not_found", "Report not found");
  }

  const nextStatus =
    input.status === "dismissed" || input.status === "resolved"
      ? input.status
      : "resolved";

  return store.updateReport({
    ...report,
    status: nextStatus,
    resolution: input.resolution?.trim() || null,
  });
}

export async function listOpenReports(userId: string): Promise<Report[]> {
  await requireModerator(userId);
  const store = getStore();
  return store.listReports("open");
}

export async function blockUser(
  blockerId: string,
  blockedId: string,
): Promise<Block> {
  if (blockerId === blockedId) {
    throw new AppError("validation", "Cannot block yourself");
  }

  const store = getStore();
  const existing = await store.listBlocksByBlocker(blockerId);
  const alreadyBlocked = existing.some((b) => b.blockedId === blockedId);
  if (alreadyBlocked) {
    return existing.find((b) => b.blockedId === blockedId)!;
  }

  return store.createBlock(blockerId, blockedId);
}

export async function listMyBlocks(userId: string): Promise<Block[]> {
  const store = getStore();
  return store.listBlocksByBlocker(userId);
}

export const listBlocks = listMyBlocks;
