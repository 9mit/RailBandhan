"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";
import type { ExtractedTicket } from "@/lib/types";
import { ArrowRight, Eye, Train } from "lucide-react";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";

type ConfirmResponse = {
  journey: { id: string };
};

export default function ConfirmExtractionPage({
  params,
}: {
  params: Promise<{ extractionId: string }>;
}) {
  const { extractionId } = use(params);
  const router = useRouter();
  const [ticket, setTicket] = useState<ExtractedTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [trainNumber, setTrainNumber] = useState("");
  const [trainName, setTrainName] = useState("");
  const [journeyDate, setJourneyDate] = useState("");
  const [boardingStation, setBoardingStation] = useState("");
  const [destinationStation, setDestinationStation] = useState("");
  const [coach, setCoach] = useState("");
  const [berth, setBerth] = useState("");
  const [coachVisibility, setCoachVisibility] = useState<
    "never" | "coach" | "coach_berth"
  >("coach");

  useEffect(() => {
    async function load() {
      try {
        const data = await apiFetch<
          { ticket?: ExtractedTicket } & ExtractedTicket
        >(`/tickets/extractions/${extractionId}`);
        const t = data.ticket ?? data;
        setTicket(t);
        setTrainNumber(t.train_number ?? "");
        setTrainName(t.train_name ?? "");
        setJourneyDate(t.journey_date ?? "");
        setBoardingStation(t.boarding_station_code ?? "");
        setDestinationStation(t.destination_station_code ?? "");
        setCoach(t.coach ?? "");
        setBerth(t.berth != null ? String(t.berth) : "");
      } catch (err: unknown) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load extracted ticket data",
        );
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [extractionId]);

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const data = await apiFetch<{
        journey_id?: string;
        journey?: { id: string };
      }>(`/tickets/extractions/${extractionId}/confirm`, {
        method: "POST",
        body: JSON.stringify({
          train_number: trainNumber,
          train_name: trainName,
          journey_date: journeyDate,
          boarding_station_code: boardingStation,
          destination_station_code: destinationStation,
          coach: coach || undefined,
          berth: berth ? String(berth) : undefined,
          coach_visibility: coachVisibility,
        }),
      });
      const journeyId = data.journey_id ?? data.journey?.id;
      if (journeyId) {
        router.push(`/journeys/${journeyId}`);
      } else {
        router.push("/journeys");
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to confirm journey",
      );
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="w-full space-y-4 p-12 text-center animate-pulse">
        <div className="h-6 w-40 mx-auto rounded-full bg-[#E5B254]/20" />
        <div className="h-64 rounded-3xl surreal-card" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 text-[var(--rail-text)] select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#E5B254]/25">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="signal" dot className="text-[11px]">
              टिकट स्कैन • Ticket Scanned
            </Badge>
            <Badge variant="royal" className="text-[11px] border-[#E5B254]/40">
              Review extracted details
            </Badge>
          </div>
          <h1 className="rb-screen-heading text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--rail-text)]">
            Confirm your journey
          </h1>
          <p className="text-sm text-[var(--rail-text-muted)] mt-0.5">
            Review your extracted ticket coordinates below. Confirm or adjust
            details to join your coach lounge.
          </p>
        </div>
      </div>

      {/* 12-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 6 Columns: Interactive Boarding Pass Preview */}
        <div className="lg:col-span-6 space-y-5">
          <Card className="surreal-card p-6 overflow-hidden space-y-5 shadow-sm relative">
            <div className="flex items-center justify-between pb-4 border-b border-[#E5B254]/20">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-[var(--rail-surface)] via-[var(--rail-surface)] to-[var(--rail-surface)] text-[#98512e] border border-[#E5B254]/40 flex items-center justify-center font-bold shadow-md">
                  <Train className="h-5 w-5" />
                </div>
                <div>
                  <span className="font-mono text-xs font-bold text-[#98512e]">
                    {trainNumber || "TRAIN"}
                  </span>
                  <h3 className="font-bold text-sm text-[var(--rail-text)]">
                    {trainName || "Indian Railways Express"}
                  </h3>
                </div>
              </div>
              <Badge variant="verified" dot>
                Review before joining
              </Badge>
            </div>

            {/* Route Diagram */}
            <div className="p-4 rounded-2xl bg-[var(--rail-surface)]/90 border border-[#E5B254]/30 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#98512e]">
                  Boarding (प्रस्थान)
                </span>
                <p className="text-lg font-semibold text-[var(--rail-text)]">
                  {boardingStation || "ORIGIN"}
                </p>
              </div>

              <div className="flex-1 flex flex-col items-center px-4">
                <span className="text-[11px] text-[#98512e] font-mono">
                  {journeyDate || "Today"}
                </span>
                <div className="w-full flex items-center gap-1 my-1">
                  <div className="h-0.5 flex-1 bg-gradient-to-r from-emerald-400 via-amber-400 to-[#E5B254]" />
                  <Train className="h-3.5 w-3.5 text-[var(--rail-text)]" />
                  <div className="h-0.5 flex-1 bg-gradient-to-r from-[#E5B254] to-emerald-400" />
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-[#98512e]">
                  Destination (गंतव्य)
                </span>
                <p className="text-lg font-semibold text-[var(--rail-text)]">
                  {destinationStation || "DEST"}
                </p>
              </div>
            </div>

            {/* Coach & Berth Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl border border-[#E5B254]/25 bg-[var(--rail-surface)]/80">
                <span className="text-[10px] font-bold uppercase text-[var(--rail-text-muted)]">
                  Assigned Coach
                </span>
                <p className="text-base font-bold text-[#98512e] mt-0.5">
                  {coach || "Unassigned"}
                </p>
              </div>
              <div className="p-3.5 rounded-2xl border border-[#E5B254]/25 bg-[var(--rail-surface)]/80">
                <span className="text-[10px] font-bold uppercase text-[var(--rail-text-muted)]">
                  Berth / Seat
                </span>
                <p className="text-base font-bold text-[#98512e] mt-0.5">
                  {berth ? `#${berth}` : "General"}
                </p>
              </div>
            </div>

            {/* Coach Privacy Selector */}
            <div className="space-y-2 pt-2 border-t border-[#E5B254]/20">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#98512e] flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5 text-[var(--rail-text)]" />
                <span>Coach Privacy Preference (गोपनीयता)</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "never", label: "Hidden", desc: "Never show coach" },
                  { id: "coach", label: "Coach Only", desc: "Show B4 only" },
                  {
                    id: "coach_berth",
                    label: "Full Berth",
                    desc: "Show B4 / 42",
                  },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() =>
                      setCoachVisibility(opt.id as typeof coachVisibility)
                    }
                    className={`p-2.5 rounded-2xl border text-left transition-all ${
                      coachVisibility === opt.id
                        ? "border-[#E5B254] bg-[#f2e7d3] font-semibold shadow-md"
                        : "border-[var(--rail-border)] bg-[var(--rail-surface)]/60 text-[var(--rail-text-muted)] hover:border-[#E5B254]/40"
                    }`}
                  >
                    <span className="block text-xs font-bold text-[var(--rail-text)]">
                      {opt.label}
                    </span>
                    <span className="block text-[10px] text-[var(--rail-text-muted)] mt-0.5">
                      {opt.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Right 6 Columns: Editable Details Form */}
        <div className="lg:col-span-6 space-y-4">
          <Card className="p-7 surreal-card space-y-4 shadow-sm">
            <form onSubmit={handleConfirm} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Train Number (गाड़ी संख्या)"
                  value={trainNumber}
                  onChange={(e) => setTrainNumber(e.target.value)}
                  placeholder="e.g. 12723"
                  required
                />
                <Input
                  label="Train Name"
                  value={trainName}
                  onChange={(e) => setTrainName(e.target.value)}
                  placeholder="e.g. Telangana Express"
                />
              </div>

              <Input
                label="Journey Date (सफ़र की तारीख़)"
                type="date"
                value={journeyDate}
                onChange={(e) => setJourneyDate(e.target.value)}
                required
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Boarding Station Code"
                  value={boardingStation}
                  onChange={(e) =>
                    setBoardingStation(e.target.value.toUpperCase())
                  }
                  placeholder="e.g. NDLS"
                  required
                />
                <Input
                  label="Destination Station Code"
                  value={destinationStation}
                  onChange={(e) =>
                    setDestinationStation(e.target.value.toUpperCase())
                  }
                  placeholder="e.g. SC"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Coach (डिब्बा)"
                  value={coach}
                  onChange={(e) => setCoach(e.target.value.toUpperCase())}
                  placeholder="e.g. B4"
                />
                <Input
                  label="Berth Number (सीट)"
                  value={berth}
                  onChange={(e) => setBerth(e.target.value)}
                  placeholder="e.g. 42"
                />
              </div>

              {error && (
                <div className="p-3.5 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-xs font-medium text-rose-200">
                  {error}
                </div>
              )}

              <div className="pt-2">
                <Button
                  type="submit"
                  size="md"
                  variant="royal"
                  className="w-full border border-[#E5B254]/50 shadow-sm shadow-red-950/70 font-bold"
                  isLoading={submitting}
                  disabled={submitting}
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  Confirm & Enter Journey Train Lounge
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
