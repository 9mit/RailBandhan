"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { apiFetch, isForbidden } from "@/lib/api";
import { formatErrorMessage } from "@/lib/format-error";
import type { JourneyDetail } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Calendar,
  Compass,
  MessageSquare,
  Radio,
  RotateCcw,
  Share2,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { ChatPanel } from "./chat-panel";
import { CommunityPanel } from "./community-panel";
import { LivePanel } from "./live-panel";
import { PassengersPanel } from "./passengers-panel";

type Tab = "live" | "community" | "chat" | "passengers";

const TABS: {
  id: Tab;
  label: string;
  description: string;
  icon: React.ElementType;
}[] = [
  {
    id: "live",
    label: "Live Train Status",
    description: "Live location & station stops",
    icon: Radio,
  },
  {
    id: "community",
    label: "Community Feed",
    description: "Discussions, chai tips & updates",
    icon: Compass,
  },
  {
    id: "chat",
    label: "Train Compartment Chat",
    description: "Live real-time passenger messages",
    icon: MessageSquare,
  },
  {
    id: "passengers",
    label: "Discovered Passengers",
    description: "Fellow travellers on your route",
    icon: Users,
  },
];

export default function JourneyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [journey, setJourney] = useState<JourneyDetail | null>(null);
  const [tab, setTab] = useState<Tab>("live");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const syncFromUrl = () => {
        const search = new URLSearchParams(window.location.search);
        const tabParam = search.get("tab") as Tab | null;
        const hash = window.location.hash.replace("#", "") as Tab;
        const target = tabParam || hash;
        if (
          target &&
          ["live", "community", "chat", "passengers"].includes(target)
        ) {
          setTab(target);
        }
      };
      syncFromUrl();
      window.addEventListener("hashchange", syncFromUrl);
      return () => window.removeEventListener("hashchange", syncFromUrl);
    }
  }, []);

  const switchTab = (newTab: Tab) => {
    setTab(newTab);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", newTab);
      window.history.replaceState(null, "", url.toString());
    }
  };

  useEffect(() => {
    async function load() {
      setLoadError(null);
      try {
        const data = await apiFetch<JourneyDetail>(`/journeys/${id}`);
        setJourney(data);
      } catch (err) {
        if (isForbidden(err)) {
          router.replace("/journeys/restricted");
          return;
        }
        setLoadError(
          formatErrorMessage(
            err,
            "We couldn’t connect to this train journey. Please check your connection and try again.",
          ),
        );
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, router, revision]);

  function shareJourney() {
    if (!journey) return;
    const text = `I'm travelling on ${journey.train?.name ?? "Train"} (${journey.train?.number}) from ${journey.boarding_station?.code} to ${journey.destination_station?.code} on RailBandhan!`;
    if (navigator.share) {
      navigator
        .share({
          title: "RailBandhan Journey",
          text,
          url: window.location.href,
        })
        .catch(() => {});
    } else if (navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(window.location.href)
        .then(() => alert("Journey link copied to clipboard!"))
        .catch(() => {});
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-44 rounded-2xl bg-[var(--rail-surface)] border border-[var(--rail-border)] p-6 shadow-sm" />
        <div className="h-12 rounded-xl bg-[var(--rail-surface)] border border-[var(--rail-border)]" />
        <div className="h-96 rounded-2xl bg-[var(--rail-surface)] border border-[var(--rail-border)]" />
      </div>
    );
  }

  if (!journey) {
    return (
      <div className="max-w-md mx-auto py-12 px-4 text-center space-y-6">
        <Card className="p-8 space-y-5 surreal-card">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fff2ea] text-[#96361c] border border-[#e5b9a8]">
            <Compass className="h-7 w-7" />
          </div>
          <div className="space-y-2">
            <h2 className="rb-screen-heading font-display text-2xl font-bold text-[var(--rail-text)]">
              Journey Unavailable
            </h2>
            <p className="text-xs sm:text-sm text-[var(--rail-text-muted)] leading-relaxed">
              {loadError ||
                "We couldn’t find or connect to this train journey. It may have concluded or the link may be incomplete."}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button
              variant="outline"
              size="md"
              onClick={() => {
                setLoading(true);
                setLoadError(null);
                setRevision((r) => r + 1);
              }}
              leftIcon={<RotateCcw className="h-4 w-4" />}
            >
              Retry
            </Button>
            <ButtonLink href="/journeys" variant="royal" size="md">
              View All Journeys
            </ButtonLink>
          </div>
        </Card>
      </div>
    );
  }

  const isVerified = journey.membership?.status === "verified";

  return (
    <div className="space-y-6 lg:space-y-8 text-[var(--rail-text)]">
      {/* 12-COLUMN DESKTOP SPLIT LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* LEFT COLUMN: STICKY JOURNEY CONTROL PANEL & NAV (4-5 COLS) */}
        <aside className="lg:col-span-4 space-y-5 lg:sticky lg:top-24">
          {/* Main Journey Station Card */}
          <div className="rounded-2xl surreal-card p-6 shadow-sm space-y-5">
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-red-950/60 text-red-300 border border-red-500/30 tracking-wider">
                  {journey.train?.number}
                </span>
                <Badge
                  variant={isVerified ? "verified" : "muted"}
                  dot
                  className="text-xs py-0.5"
                >
                  {isVerified
                    ? "Journey member"
                    : (journey.membership?.status ?? "Pending")}
                </Badge>
              </div>

              <div>
                <h1 className="rb-screen-heading font-display text-xl sm:text-2xl font-bold tracking-tight text-[var(--rail-text)]">
                  {journey.train?.name ?? "Train Express"}
                </h1>
                <div className="mt-2 flex items-center gap-2 text-xs font-mono text-[var(--rail-text-muted)]">
                  <Calendar className="h-3.5 w-3.5 text-[#98512e]" />
                  <span>{journey.journey_date}</span>
                </div>
              </div>

              {/* Origin to Destination Route */}
              <div className="pt-2 border-t border-[var(--rail-border)] space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-[var(--rail-text)]">
                  <span className="px-2 py-0.5 rounded bg-[var(--rail-surface)] border border-[var(--rail-border)] font-mono text-[#98512e]">
                    {journey.boarding_station?.code}
                  </span>
                  <ArrowRight className="h-4 w-4 text-[#98512e] shrink-0" />
                  <span className="px-2 py-0.5 rounded bg-[var(--rail-surface)] border border-[var(--rail-border)] font-mono text-[#98512e]">
                    {journey.destination_station?.code}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-[var(--rail-text-muted)]">
                  <span className="truncate max-w-[120px]">
                    {journey.boarding_station?.name}
                  </span>
                  <span className="truncate max-w-[120px] text-right">
                    {journey.destination_station?.name}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[var(--rail-border)] flex items-center justify-between">
              <span className="text-xs text-[#35664c] font-semibold flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#e2ecdf] animate-pulse" />
                Live Train Active
              </span>
              <Button
                variant="outline"
                size="xs"
                onClick={shareJourney}
                leftIcon={<Share2 className="h-3.5 w-3.5 text-[#98512e]" />}
              >
                Share Pass
              </Button>
            </div>
          </div>

          {/* DESKTOP VERTICAL TAB NAVIGATION */}
          <nav
            className="hidden lg:flex flex-col gap-1.5 rounded-2xl surreal-card p-2 shadow-lg"
            aria-label="Journey Sections Desktop"
          >
            {TABS.map((t) => {
              const Icon = t.icon;
              const isActive = tab === t.id;

              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => switchTab(t.id)}
                  className={cn(
                    "flex items-center gap-3.5 rounded-xl p-3 text-left transition-all",
                    isActive
                      ? "bg-gradient-to-r from-[var(--rail-surface)] to-[var(--rail-surface)] text-[var(--rail-text)] shadow-md border border-amber-400/40 font-semibold"
                      : "hover:bg-white/10 text-[var(--rail-text-muted)] hover:text-[#24483f]",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-lg border transition-colors shrink-0",
                      isActive
                        ? "bg-[var(--rail-surface)] text-[#98512e] border-amber-400/40"
                        : "bg-[var(--rail-surface)] text-[#98512e] border-[var(--rail-border)]",
                    )}
                  >
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0">
                    <span
                      className={cn(
                        "block text-xs font-bold leading-tight",
                        isActive
                          ? "text-[var(--rail-text)]"
                          : "text-[var(--rail-text)]",
                      )}
                    >
                      {t.label}
                    </span>
                    <span
                      className={cn(
                        "block text-[11px] truncate leading-tight mt-0.5",
                        isActive
                          ? "text-[#98512e]"
                          : "text-[var(--rail-text-muted)]",
                      )}
                    >
                      {t.description}
                    </span>
                  </div>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* RIGHT COLUMN: MAIN EXPANSIVE INTERACTIVE WORKSPACE (7-8 COLS) */}
        <section className="lg:col-span-8 space-y-5">
          {/* MOBILE / TABLET HORIZONTAL TAB SELECTOR */}
          <nav
            className="flex lg:hidden gap-1.5 rounded-xl surreal-card p-1.5 overflow-x-auto no-scrollbar shadow-sm"
            aria-label="Journey sections mobile"
          >
            {TABS.map((t) => {
              const Icon = t.icon;
              const isActive = tab === t.id;

              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => switchTab(t.id)}
                  className={cn(
                    "flex-1 min-w-[5.5rem] flex items-center justify-center gap-2 rounded-lg py-2 px-3 text-xs font-semibold transition-all",
                    isActive
                      ? "bg-gradient-to-r from-[var(--rail-surface)] to-[var(--rail-surface)] text-[var(--rail-text)] shadow-md border border-amber-400/30"
                      : "text-[var(--rail-text-muted)] hover:text-[#24483f] hover:bg-white/10",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{t.label.split(" ")[0]}</span>
                </button>
              );
            })}
          </nav>

          {/* Active Tab Panel Canvas */}
          <div className="animate-in fade-in duration-150">
            {tab === "live" && <LivePanel journeyId={id} />}
            {tab === "community" && <CommunityPanel journeyId={id} />}
            {tab === "chat" && <ChatPanel journeyId={id} />}
            {tab === "passengers" && (
              <PassengersPanel
                journeyId={id}
                onOpenChat={() => switchTab("chat")}
              />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
