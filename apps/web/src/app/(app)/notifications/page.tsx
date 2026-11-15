"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { apiFetch } from "@/lib/api";
import type { NotificationItem } from "@/lib/types";
import { Bell, Check, MessageSquare, Train } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"all" | "unread">("all");

  async function load() {
    try {
      const data = await apiFetch<{ notifications: NotificationItem[] }>(
        "/notifications",
      );
      setNotifications(data.notifications ?? []);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function markAllAsRead() {
    try {
      await apiFetch("/notifications/read-all", { method: "POST" });
      await load();
    } catch {
      /* ignore */
    }
  }

  async function markOneAsRead(notificationId: string) {
    try {
      await apiFetch(`/notifications/${notificationId}/read`, {
        method: "POST",
      });
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId
            ? { ...n, read_at: new Date().toISOString() }
            : n,
        ),
      );
    } catch {
      /* ignore */
    }
  }

  const filtered = notifications.filter((n) =>
    activeFilter === "unread" ? !n.read_at : true,
  );

  return (
    <div className="w-full space-y-6 text-[var(--rail-text)] select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl surreal-card shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="royal" className="text-[11px] border-[#E5B254]/40">
              नक्षत्र संदेश • ASTRAL DISPATCH
            </Badge>
            <Badge variant="signal" dot className="text-[11px]">
              Live Starlight Feed
            </Badge>
          </div>
          <h1 className="rb-screen-heading font-display text-2xl sm:text-3xl font-bold tracking-tight text-[var(--rail-text)] flex items-center gap-2">
            Activity & Notifications
          </h1>
          <p className="text-sm text-[var(--rail-text-muted)] mt-0.5">
            Real-time shared signals on your train journeys, co-passenger
            messages, and game invites.
          </p>
        </div>

        {notifications.some((n) => !n.read_at) && (
          <Button
            size="sm"
            variant="royal"
            onClick={markAllAsRead}
            className="border border-[#E5B254]/40 text-[#98512e] shadow-lg"
            leftIcon={<Check className="h-4 w-4 text-[#98512e]" />}
          >
            Mark all as read
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2.5">
        <button
          type="button"
          onClick={() => setActiveFilter("all")}
          className={`rounded-2xl px-4 py-2 text-xs font-bold transition-all border ${
            activeFilter === "all"
              ? "bg-gradient-to-r from-[var(--rail-surface)] via-[var(--rail-surface)] to-[var(--rail-surface)] text-[var(--rail-text)] border-[#E5B254] shadow-lg shadow-red-950/50"
              : "bg-[var(--rail-surface)]/80 border-[var(--rail-border)] text-[var(--rail-text-muted)] hover:border-[#E5B254]/40 hover:text-[#24483f]"
          }`}
        >
          All Activity ({notifications.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter("unread")}
          className={`rounded-2xl px-4 py-2 text-xs font-bold transition-all border ${
            activeFilter === "unread"
              ? "bg-gradient-to-r from-[var(--rail-surface)] via-[var(--rail-surface)] to-[var(--rail-surface)] text-[var(--rail-text)] border-[#E5B254] shadow-lg shadow-red-950/50"
              : "bg-[var(--rail-surface)]/80 border-[var(--rail-border)] text-[var(--rail-text-muted)] hover:border-[#E5B254]/40 hover:text-[#24483f]"
          }`}
        >
          Unread Only ({notifications.filter((n) => !n.read_at).length})
        </button>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="p-5 rounded-3xl surreal-card animate-pulse space-y-2"
            >
              <div className="h-4 w-40 bg-[#f2e7d3] rounded-full" />
              <div className="h-3 w-64 bg-[#f2e7d3] rounded-full" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="bell"
          title="You’re all caught up."
          description="You have no pending travel signals right now. Journey halts, replies, and game challenges will appear here."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const isUnread = !item.read_at;
            const kind = item.type ?? item.kind;
            const isJourney = kind === "journey";
            const isMessage = kind === "message" || kind === "dm";

            return (
              <Card
                key={item.id}
                className={`p-5 transition-all surreal-card hover:border-[#E5B254]/70 shadow-lg ${
                  isUnread
                    ? "border-l-4 border-l-[#E5B254] bg-[var(--rail-surface)]/90 shadow-[0_0_20px_rgba(229,178,84,0.15)]"
                    : ""
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-2xl shrink-0 shadow-md border ${
                      isJourney
                        ? "bg-gradient-to-br from-[var(--rail-surface)] to-[var(--rail-surface)] text-[#98512e] border-[#E5B254]/50"
                        : isMessage
                          ? "bg-gradient-to-br from-[var(--rail-surface)] to-[var(--rail-surface)] text-indigo-200 border-indigo-400/40"
                          : "bg-[#f2e7d3] text-[#98512e] border-amber-400/40"
                    }`}
                  >
                    {isJourney ? (
                      <Train className="h-5 w-5" />
                    ) : isMessage ? (
                      <MessageSquare className="h-5 w-5" />
                    ) : (
                      <Bell className="h-5 w-5" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-bold text-sm text-[var(--rail-text)]">
                        {item.title}
                      </h4>
                      <time className="text-[11px] font-mono text-[#98512e] shrink-0">
                        {new Date(item.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </time>
                    </div>

                    <p className="text-xs text-[var(--rail-text-muted)] mt-1 leading-relaxed">
                      {item.body}
                    </p>

                    <div className="mt-3 flex items-center gap-4">
                      {item.link && (
                        <Link
                          href={item.link}
                          onClick={() => {
                            if (isUnread) {
                              void markOneAsRead(item.id);
                            }
                          }}
                          className="text-xs font-bold text-[#98512e] hover:text-[#24483f] hover:underline flex items-center gap-1"
                        >
                          View Details →
                        </Link>
                      )}
                      {isUnread && (
                        <button
                          type="button"
                          onClick={() => void markOneAsRead(item.id)}
                          className="text-xs font-semibold text-[var(--rail-text-muted)] hover:text-[#24483f] hover:underline"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
