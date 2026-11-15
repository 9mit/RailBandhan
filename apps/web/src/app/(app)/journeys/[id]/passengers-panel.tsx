"use client";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorBanner } from "@/components/ui/error-banner";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch, isForbidden } from "@/lib/api";
import { formatErrorMessage } from "@/lib/format-error";
import type { DiscoveredPassenger } from "@/lib/types";
import { Award, MessageSquare, Shield, UserCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export function PassengersPanel({
  journeyId,
  onOpenChat,
}: {
  journeyId: string;
  onOpenChat?: () => void;
}) {
  const router = useRouter();
  const [passengers, setPassengers] = useState<DiscoveredPassenger[]>([]);
  const [loading, setLoading] = useState(true);
  const [messaging, setMessaging] = useState<string | null>(null);
  const [dmError, setDmError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await apiFetch<{ passengers: DiscoveredPassenger[] }>(
        `/journeys/${journeyId}/passengers`,
      );
      setPassengers(data.passengers ?? []);
    } catch (err) {
      if (isForbidden(err)) {
        router.replace("/journeys/restricted");
      }
    } finally {
      setLoading(false);
    }
  }, [journeyId, router]);

  useEffect(() => {
    load();
  }, [load]);

  async function startDm(handle: string) {
    setDmError(null);
    setMessaging(handle);
    try {
      const data = await apiFetch<{ conversation: { id: string } }>(
        "/conversations",
        {
          method: "POST",
          body: JSON.stringify({
            recipient_handle: handle,
            journey_id: journeyId,
          }),
        },
      );
      router.push(`/dm/${data.conversation.id}`);
    } catch (err) {
      setDmError(
        formatErrorMessage(
          err,
          "Could not open direct message with this traveller right now.",
        ),
      );
      setMessaging(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-4 rounded-2xl border border-[var(--rail-border)] bg-[var(--rail-surface)] animate-pulse"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="h-11 w-11 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-36" />
              </div>
            </div>
            <Skeleton className="h-8 w-20 rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  if (passengers.length === 0) {
    return (
      <EmptyState
        icon="passengers"
        title="No discoverable passengers yet"
        description="Fellow passengers on this train can opt-in to discovery from their privacy settings. Be the first to say hi in the train chat!"
        onAction={onOpenChat}
        actionHref={onOpenChat ? undefined : `?tab=chat`}
        actionLabel="Open Train Chat"
      />
    );
  }

  return (
    <div className="space-y-5">
      {dmError && (
        <ErrorBanner
          message={dmError}
          onDismiss={() => setDmError(null)}
          variant="subtle"
        />
      )}
      {/* Privacy Guarantee Banner */}
      <div className="flex items-center gap-3 rounded-2xl bg-[var(--rail-surface)]/90 px-4 py-3 border border-[#E5B254]/30 text-xs font-medium text-[#98512e]">
        <Shield className="h-4 w-4 text-[#35664c] shrink-0" />
        <span>
          Safe & Private: Only fellow travellers on this train who opted into
          discovery are visible in this constellation.
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {passengers.map((p) => (
          <Card
            key={p.handle}
            data-testid={`passenger-card-${p.handle}`}
            data-handle={p.handle}
            className="surreal-card p-5 flex flex-col justify-between hover:border-[#E5B254] hover:shadow-sm transition-all text-[var(--rail-text)]"
          >
            <div className="flex items-start gap-3.5">
              <Avatar
                handle={p.handle}
                size="md"

                showReputationRing={p.reputation > 20}
                reputation={p.reputation}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm text-[var(--rail-text)] truncate">
                    {p.handle}
                  </span>
                  {p.reputation > 30 && (
                    <Badge
                      variant="royal"
                      className="text-[10px] py-0 px-2 border-[#E5B254]/40"
                    >
                      <Award className="h-2.5 w-2.5 mr-1 text-[#98512e]" />
                      Pro Voyager
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-[var(--rail-text-muted)] mt-0.5">
                  Karma Score: ★ {p.reputation} pts
                </p>
                {p.bio ? (
                  <p className="mt-2.5 text-xs text-[var(--rail-text)] line-clamp-2 italic bg-[var(--rail-surface)] p-2.5 rounded-xl border border-[var(--rail-border)]">
                    &ldquo;{p.bio}&rdquo;
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-[var(--rail-text-muted)]">
                    Co-traveler traveling on this route
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3.5 border-t border-[#E5B254]/20 flex items-center justify-between">
              <span className="text-xs text-[#35664c] bg-[#e2ecdf] border border-emerald-400/30 px-2.5 py-0.5 rounded-full flex items-center gap-1 font-semibold">
                <UserCheck className="h-3 w-3 text-[#35664c]" /> Active Onboard
              </span>
              <Button
                size="sm"
                variant="royal"
                data-testid={`message-btn-${p.handle}`}
                disabled={messaging === p.handle}
                isLoading={messaging === p.handle}
                onClick={() => startDm(p.handle)}
                className="border border-[#E5B254]/50 shadow-md"
                leftIcon={<MessageSquare className="h-3.5 w-3.5" />}
              >
                Whisper
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
