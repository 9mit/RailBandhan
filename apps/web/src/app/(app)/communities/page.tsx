"use client";
import { EmptyState } from "@/components/ui/empty-state";
import { useApiResource } from "@/hooks/use-api-resource";
import type { Journey } from "@/lib/types";
import { ArrowUpRight, MessagesSquare } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
export default function CommunitiesPage() {
  const { data, loading, error, refresh } = useApiResource<{
    journeys: Journey[];
  }>("/journeys");
  return (
    <div>
      <div className="rb-route-title">
        <span className="rb-eyebrow">THE PEOPLE BETWEEN YOUR STOPS</span>
        <h1>
          Strangers at the station.
          <br />
          <em>Stories by the destination.</em>
        </h1>
        <p>
          Every train community belongs to a shared journey. Meet your fellow
          travellers through an anonymous handle, at your own pace.
        </p>
      </div>
      <section className="rb-story-banner !mt-0 !min-h-[250px]">
        <div className="rb-story-image !min-h-[250px]">
          <Image
            src="/images/surreal_celestial_junction.webp"
            fill
            sizes="(max-width:768px) 90vw, 40vw"
            alt="An imaginative Indian station bringing many journeys together"
          />
        </div>
        <div className="rb-story-copy">
          <span className="rb-eyebrow">A LITTLE HELLO GOES A LONG WAY</span>
          <h2 className="!text-3xl">
            There’s a place
            <br />
            for <em>your story.</em>
          </h2>
          <p>
            Share a window-seat moment, ask a travel question, or start with a
            simple namaste.
          </p>
          <Link href="/journeys/new" className="rb-button">
            Find my train community <ArrowUpRight size={16} />
          </Link>
        </div>
      </section>
      <section className="mt-10">
        <div className="rb-section-heading">
          <div>
            <span className="rb-eyebrow">YOUR SHARED JOURNEYS</span>
            <h2>The company you keep.</h2>
          </div>
          <Link href="/explore">
            Explore the route catalog <ArrowUpRight size={17} />
          </Link>
        </div>
        {loading ? (
          <div className="rb-loading" role="status">
            Finding your communities…
          </div>
        ) : error ? (
          <div className="rb-error-message" role="alert">
            {error}
            <button onClick={refresh} className="ml-3 underline">
              Try again
            </button>
          </div>
        ) : !data?.journeys.length ? (
          <EmptyState
            icon="passengers"
            title="Your community starts with a journey."
            description="Add your train and travel date to find the right space. Your community will appear here once you add a journey."
            actionHref="/journeys/new"
            actionLabel="Add a journey"
          />
        ) : (
          <div className="grid md:grid-cols-2 gap-5">
            {data.journeys.map((j) => (
              <Link
                key={j.id}
                href={`/journeys/${j.id}?tab=community`}
                className="rb-catalog-row"
              >
                <span className="rb-icon-tile">
                  <MessagesSquare size={22} />
                </span>
                <span>
                  <small>
                    {j.train?.number} · {j.journey_date}
                  </small>
                  <br />
                  <strong>{j.train?.name || "Your train community"}</strong>
                </span>
                <ArrowUpRight size={19} />
              </Link>
            ))}
          </div>
        )}
      </section>
      <p className="text-xs text-[var(--rail-text-muted)] mt-8">
        Membership is self-declared. Respect boundaries and use the{" "}
        <Link href="/help" className="underline">
          safety tools
        </Link>{" "}
        when you need them.
      </p>
    </div>
  );
}
