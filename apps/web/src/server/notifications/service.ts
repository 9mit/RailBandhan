import { AppError } from "@/lib/errors";
import type { Notification, NotificationType } from "@/server/domain/types";
import { getStore } from "@/server/store";

export async function listNotifications(
  userId: string,
): Promise<Notification[]> {
  const store = getStore();
  return store.listNotifications(userId);
}

export async function markNotificationRead(
  userId: string,
  notificationId: string,
): Promise<Notification> {
  const store = getStore();
  const notification = await store.markNotificationRead(notificationId, userId);
  if (!notification) {
    throw new AppError("not_found", "Notification not found");
  }
  return notification;
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const store = getStore();
  await store.markAllNotificationsRead(userId);
}

export async function countUnreadNotifications(
  userId: string,
): Promise<number> {
  const store = getStore();
  return store.countUnreadNotifications(userId);
}

export const countUnread = countUnreadNotifications;

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  resourceType?: string | null;
  resourceId?: string | null;
  journeyId?: string | null;
}

export async function createNotification(
  params: CreateNotificationParams,
): Promise<Notification> {
  const store = getStore();
  return store.createNotification(params);
}
