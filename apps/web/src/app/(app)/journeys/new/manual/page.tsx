"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";
import { ArrowLeft, ArrowRight, MapPin, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

type ManualResponse = {
  journey: { id: string };
};

const COMMON_STATIONS = [
  { code: "NDLS", name: "New Delhi" },
  { code: "MMCT", name: "Mumbai Central" },
  { code: "SC", name: "Secunderabad" },
  { code: "HWH", name: "Howrah" },
  { code: "MAS", name: "Chennai Central" },
  { code: "BPL", name: "Bhopal" },
  { code: "SBC", name: "Bengaluru" },
];

const KNOWN_TRAINS: Record<string, { name: string; from: string; to: string }> =
  {
    "12951": { name: "Mumbai Rajdhani Express", from: "BCT", to: "NDLS" },
    "12301": { name: "Howrah Rajdhani Express", from: "HWH", to: "NDLS" },
    "12002": { name: "Bhopal Shatabdi Express", from: "NDLS", to: "RKMP" },
    "22436": { name: "Vande Bharat Express", from: "NDLS", to: "BSB" },
    "12004": { name: "Lucknow Shatabdi Express", from: "NDLS", to: "LKO" },
    "20901": { name: "Vande Bharat Express", from: "MMCT", to: "GNC" },
    "12723": { name: "Telangana Express", from: "SC", to: "NDLS" },
  };

function ManualJourneyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const queryTrain = searchParams.get("train") ?? "";
  const queryFrom = searchParams.get("from") ?? "";
  const queryTo = searchParams.get("to") ?? "";
  const queryName = searchParams.get("name") ?? "";

  const known = KNOWN_TRAINS[queryTrain.trim()];

  const [trainNumber, setTrainNumber] = useState(queryTrain);
  const [trainName, setTrainName] = useState(
    queryName || (known ? known.name : ""),
  );
  const [journeyDate, setJourneyDate] = useState(
    searchParams.get("date") ?? new Date().toISOString().split("T")[0],
  );
  const [boardingStation, setBoardingStation] = useState(
    queryFrom || (known ? known.from : ""),
  );
  const [destinationStation, setDestinationStation] = useState(
    queryTo || (known ? known.to : ""),
  );
  const [coach, setCoach] = useState(searchParams.get("coach") ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (trainNumber.trim() && KNOWN_TRAINS[trainNumber.trim()]) {
      const info = KNOWN_TRAINS[trainNumber.trim()];
      if (!trainName) setTrainName(info.name);
      if (!boardingStation) setBoardingStation(info.from);
      if (!destinationStation) setDestinationStation(info.to);
    }
  }, [trainNumber, trainName, boardingStation, destinationStation]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<ManualResponse>("/journeys/manual", {
        method: "POST",
        body: JSON.stringify({
          train_number: trainNumber.trim(),
          train_name: trainName.trim() || undefined,
          journey_date: journeyDate,
          boarding_station_code: boardingStation.trim().toUpperCase(),
          destination_station_code: destinationStation.trim().toUpperCase(),
          coach: coach.trim() || undefined,
        }),
      });
      router.push(`/journeys/${data.journey.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create journey");
      setLoading(false);
    }
  }

  return (
    <div className="w-full space-y-6 text-[var(--rail-text)] select-none">
      {/* Back button & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#E5B254]/25">
        <div>
          <Link
            href="/journeys/new"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--rail-text)] hover:text-[#24483f] transition-colors mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Journey Options (वापस)</span>
          </Link>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="royal" className="text-[11px] border-[#E5B254]/40">
              ट्रेन प्रविष्टि • YOUR JOURNEY
            </Badge>
            <Badge variant="signal" dot className="text-[11px]">
              Direct Entry
            </Badge>
          </div>
          <h1 className="rb-screen-heading text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--rail-text)]">
            Enter Train Coordinates
          </h1>
          <p className="text-sm text-[var(--rail-text-muted)] mt-0.5">
            Enter your train number and travel date to access the train
            community feed, coach lounge, and live status.
          </p>
        </div>
      </div>

      {/* 12-Column Responsive Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 Columns: Form */}
        <div className="lg:col-span-7">
          <Card className="p-7 surreal-card space-y-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Train Number (गाड़ी संख्या)"
                  value={trainNumber}
                  onChange={(e) => setTrainNumber(e.target.value)}
                  placeholder="e.g. 12723 or 12301"
                  required
                />
                <Input
                  label="Train Name (Optional)"
                  value={trainName}
                  onChange={(e) => setTrainName(e.target.value)}
                  placeholder="e.g. Telangana Express"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Journey Date (सफ़र की तारीख़)"
                  type="date"
                  value={journeyDate}
                  onChange={(e) => setJourneyDate(e.target.value)}
                  required
                />
                <Input
                  label="Coach (Optional)"
                  value={coach}
                  onChange={(e) => setCoach(e.target.value.toUpperCase())}
                  placeholder="e.g. B4 or S2"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Boarding Station Code (प्रस्थान)"
                  value={boardingStation}
                  onChange={(e) =>
                    setBoardingStation(e.target.value.toUpperCase())
                  }
                  placeholder="e.g. NDLS"
                  required
                />
                <Input
                  label="Destination Station Code (गंतव्य)"
                  value={destinationStation}
                  onChange={(e) =>
                    setDestinationStation(e.target.value.toUpperCase())
                  }
                  placeholder="e.g. SC"
                  required
                />
              </div>

              {error && (
                <div className="p-3.5 rounded-2xl bg-rose-950/70 border border-rose-500/50 text-xs font-medium text-rose-200">
                  {error}
                </div>
              )}

              <div className="pt-2">
                <Button
                  type="submit"
                  size="md"
                  variant="royal"
                  className="w-full border border-[#E5B254]/50 shadow-sm shadow-red-950/70 font-bold"
                  isLoading={loading}
                  disabled={loading}
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  Manifest Journey & Enter Train Lounge
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Right 5 Columns: Quick Station Selector */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="p-6 surreal-card space-y-4">
            <div>
              <h3 className="text-sm font-bold text-[#98512e] flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[var(--rail-text)]" />
                Major Railway Termini Coordinates
              </h3>
              <p className="text-xs text-[var(--rail-text-muted)] mt-1">
                Click any code below to quickly autofill your departure or
                arrival station:
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              {COMMON_STATIONS.map((st) => (
                <button
                  key={st.code}
                  type="button"
                  onClick={() => {
                    if (!boardingStation) setBoardingStation(st.code);
                    else if (!destinationStation)
                      setDestinationStation(st.code);
                  }}
                  className="p-3 rounded-2xl border border-[#E5B254]/25 bg-[var(--rail-surface)]/80 hover:bg-amber-500/15 hover:border-[#E5B254] text-left transition-all group"
                >
                  <span className="font-mono font-bold text-xs text-[#98512e] block">
                    {st.code}
                  </span>
                  <span className="text-[11px] text-[var(--rail-text-muted)] group-hover:text-[#24483f]">
                    {st.name}
                  </span>
                </button>
              ))}
            </div>

            <div className="p-3.5 rounded-2xl bg-[var(--rail-surface)] border border-[#E5B254]/30 flex items-center gap-2.5 text-xs text-[#98512e]">
              <ShieldCheck className="h-4 w-4 text-[#35664c] shrink-0" />
              <span>
                You can upload your ticket at any time later to verify coach
                residency.
              </span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function ManualJourneyPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-[var(--rail-text-muted)] animate-pulse">
          Loading train journey form...
        </div>
      }
    >
      <ManualJourneyForm />
    </Suspense>
  );
}
