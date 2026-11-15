"use client";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorBanner } from "@/components/ui/error-banner";
import { Input } from "@/components/ui/input";
import { useApiResource } from "@/hooks/use-api-resource";
import type { Journey } from "@/lib/types";
import {
  ArrowRight,
  ArrowUpRight,
  Plus,
  Search,
  TrainFront,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
export default function JourneysPage() {
  const { data, loading, error, refresh } = useApiResource<{
    journeys: Journey[];
  }>("/journeys");
  const [query, setQuery] = useState("");
  const journeys = (data?.journeys || []).filter((j) =>
    `${j.train?.name} ${j.train?.number} ${j.boarding_station?.name} ${j.destination_station?.name}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <div>
      <div className="rb-section-heading">
        <div className="rb-route-title !mb-0">
          <span className="rb-eyebrow">YOUR ROUTES. YOUR STORIES.</span>
          <h1>
            Every journey has
            <br />
            <em>a little more to it.</em>
          </h1>
          <p>
            Find your train community, pick up a conversation and follow the
            route ahead.
          </p>
        </div>
        <Link
          href="/journeys/new"
          className="rb-button !text-[#fff9e9] !text-xs !max-w-none"
        >
          <Plus size={16} /> Add a journey
        </Link>
      </div>
      <div className="rb-search-catalog">
        <Input
          id="journey-search"
          label="Find one of your journeys"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          leftIcon={<Search size={17} />}
          placeholder="Search by train, number or station"
        />
      </div>
      {loading ? (
        <div className="rb-loading" role="status">
          Opening your journeys…
        </div>
      ) : error ? (
        <ErrorBanner
          message={error}
          onRetry={refresh}
          className="mb-6"
        />
      ) : journeys.length === 0 ? (
        <EmptyState
          title={
            query ? "No matching journey." : "Your first story is waiting."
          }
          description={
            query
              ? "Try another train name or station."
              : "Add the details from your ticket to join your journey’s community."
          }
          actionLabel="Add my journey"
          actionHref="/journeys/new"
        />
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {journeys.map((j) => (
            <Link
              className="rb-journey-preview"
              key={j.id}
              href={`/journeys/${j.id}`}
            >
              <span className="rb-icon-tile">
                <TrainFront size={25} />
              </span>
              <div>
                <span className="rb-eyebrow">
                  {j.train?.number} · {j.journey_date}
                </span>
                <h3>{j.train?.name || "Your train"}</h3>
                <p>
                  {j.boarding_station?.name || j.boarding_station?.code}
                  <ArrowRight size={14} />
                  {j.destination_station?.name || j.destination_station?.code}
                </p>
                <span className="text-xs text-[var(--rail-text-muted)] mt-2 block">
                  Open the community
                </span>
              </div>
              <ArrowUpRight size={20} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
