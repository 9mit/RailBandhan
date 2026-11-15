"use client";
import { ButtonLink } from "@/components/ui/button-link";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import type { Journey } from "@/lib/types";
import {
  ArrowRight,
  ChevronRight,
  Radio,
  Search,
  Train,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const SAMPLE_TRAINS = [
  {
    number: "12301",
    name: "Howrah Rajdhani Express",
    origin: "HWH",
    dest: "NDLS",
  },
  { number: "12723", name: "Telangana Express", origin: "SC", dest: "NDLS" },
  {
    number: "12002",
    name: "Bhopal Shatabdi Express",
    origin: "NDLS",
    dest: "RKMP",
  },
  {
    number: "22436",
    name: "Vande Bharat Express",
    origin: "NDLS",
    dest: "BSB",
  },
];

export default function LiveTrainDirectoryPage() {
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTrain, setSearchTrain] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const q =
        new URLSearchParams(window.location.search).get("q") ||
        new URLSearchParams(window.location.search).get("train");
      if (q) setSearchTrain(q);
    }
    async function load() {
      try {
        const data = await apiFetch<{ journeys: Journey[] }>("/journeys");
        setJourneys(data.journeys ?? []);
      } catch {
        /* fallback */
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filteredCanonical = SAMPLE_TRAINS.filter(
    (t) =>
      !searchTrain.trim() ||
      t.number.includes(searchTrain.trim()) ||
      t.name.toLowerCase().includes(searchTrain.trim().toLowerCase()) ||
      t.origin.toLowerCase().includes(searchTrain.trim().toLowerCase()) ||
      t.dest.toLowerCase().includes(searchTrain.trim().toLowerCase()),
  );

  return (
    <div className="w-full space-y-8 select-none text-[var(--rail-text)]">
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-3xl surreal-card shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="signal" dot className="text-xs">
              Live Starlight Tracking
            </Badge>
            <Badge variant="royal" className="text-xs border-[#E5B254]/40">
              Journey Coordinates
            </Badge>
          </div>
          <h1 className="rb-screen-heading font-display text-2xl sm:text-3xl font-bold tracking-tight text-[var(--rail-text)]">
            Live Journey Train Status
          </h1>
          <p className="text-sm text-[var(--rail-text-muted)] max-w-xl">
            Real-time pacing, upcoming shared station ETAs, platform indicators,
            and delay calculations across Indian Railways.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <ButtonLink
            href="/journeys/new"
            variant="royal"
            size="md"
            leftIcon={<Train className="h-4 w-4" />}
            className="border border-[#E5B254]/50 shadow-sm"
          >
            Add Your Train
          </ButtonLink>
        </div>
      </div>

      {/* If passenger already has active journeys, highlight them */}
      {journeys.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-[var(--rail-text)] flex items-center gap-2">
              <Radio className="h-4 w-4 text-[var(--rail-text)] animate-pulse" />
              Your Active Boarded Trains
            </h2>
            <Link
              href="/journeys"
              className="text-xs font-bold text-[#98512e] hover:underline"
            >
              View All ({journeys.length}) →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {journeys.map((j) => (
              <Card
                key={j.id}
                className="p-6 surreal-card hover:border-[#E5B254]/70 transition-all space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#E5B254]/15 text-[#98512e] border border-[#E5B254]/30">
                      {j.train?.number}
                    </span>
                    <Badge variant="signal" dot>
                      Running Now
                    </Badge>
                  </div>
                  <span className="text-xs font-mono text-[var(--rail-text-muted)]">
                    {j.journey_date}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-base text-[var(--rail-text)]">
                    {j.train?.name ?? "Express Train"}
                  </h3>
                  <p className="text-xs text-[var(--rail-text-muted)] mt-1 flex items-center gap-1.5 font-mono">
                    <span>{j.boarding_station?.code}</span>
                    <ArrowRight className="h-3 w-3 text-[var(--rail-text)]" />
                    <span>{j.destination_station?.code}</span>
                  </p>
                </div>

                <div className="pt-2 border-t border-[var(--rail-border)] flex items-center justify-between">
                  <span className="text-xs text-[#35664c] font-semibold flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-[#35664c]" />
                    Live Tracking Ready
                  </span>
                  <ButtonLink
                    href={`/journeys/${j.id}`}
                    size="sm"
                    variant="royal"
                    rightIcon={<ChevronRight className="h-4 w-4" />}
                    className="border border-[#E5B254]/40"
                  >
                    Enter Train Lounge
                  </ButtonLink>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Train Lookup & Directory */}
      <div className="space-y-4">
        <div>
          <h2 className="font-display text-lg font-bold text-[var(--rail-text)]">
            Indian Railways Train Directory
          </h2>
          <p className="text-xs text-[var(--rail-text-muted)]">
            Search by train number, name, or station code to board or track.
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#98512e]" />
          <input
            type="text"
            value={searchTrain}
            onChange={(e) => setSearchTrain(e.target.value)}
            placeholder="Search train (e.g. 12301, 12723, Rajdhani, Shatabdi, NDLS)..."
            className="w-full pl-10 pr-4 py-3 bg-[var(--rail-surface)]/90 border border-[#E5B254]/30 rounded-2xl text-sm text-[var(--rail-text)] placeholder:text-gray-400 focus:outline-none focus:border-[#E5B254] shadow-inner"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCanonical.map((train) => (
            <Card
              key={train.number}
              className="p-5 surreal-card hover:border-[#E5B254]/60 transition-all flex items-center justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#E5B254]/15 text-[#98512e] border border-[#E5B254]/30">
                    {train.number}
                  </span>
                  <span className="text-xs text-[#35664c] font-semibold flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#e2ecdf]" />
                    Live Tracking
                  </span>
                </div>
                <h3 className="font-bold text-sm text-[var(--rail-text)]">
                  {train.name}
                </h3>
                <p className="text-xs text-[var(--rail-text-muted)] font-mono">
                  {train.origin} → {train.dest}
                </p>
              </div>

              <ButtonLink
                href={`/journeys/new/manual?train=${train.number}`}
                size="sm"
                variant="secondary"
                rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                className="border border-[#E5B254]/40"
              >
                Board Live
              </ButtonLink>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
