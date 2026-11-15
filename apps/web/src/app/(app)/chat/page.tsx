"use client";
import { EmptyState } from "@/components/ui/empty-state";
import { useApiResource } from "@/hooks/use-api-resource";
import type { Conversation, Journey } from "@/lib/types";
import { ArrowUpRight, MessagesSquare, TrainFront } from "lucide-react";
import Link from "next/link";
export default function ChatPage() {
  const journeys = useApiResource<{ journeys: Journey[] }>("/journeys"),
    conversations = useApiResource<{ conversations: Conversation[] }>(
      "/conversations",
    );
  return (
    <div>
      <div className="rb-route-title">
        <span className="rb-eyebrow">PICK UP A CONVERSATION</span>
        <h1>
          Start with <em>namaste.</em>
          <br />
          See where it goes.
        </h1>
        <p>
          A train lounge for everyone on your journey. A private conversation
          when you both feel comfortable.
        </p>
      </div>
      <div className="grid lg:grid-cols-2 gap-7">
        <section className="rb-ui-card p-6">
          <h2 className="font-display text-3xl font-normal mb-6">
            Your train lounges.
          </h2>
          {journeys.loading ? (
            <p className="rb-loading" role="status">
              Finding your lounges…
            </p>
          ) : journeys.error ? (
            <p className="rb-error-message" role="alert">
              {journeys.error}
              <button className="underline ml-2" onClick={journeys.refresh}>
                Retry
              </button>
            </p>
          ) : !journeys.data?.journeys.length ? (
            <EmptyState
              icon="train"
              title="A journey brings the lounge to life."
              description="Add your train and travel date to start a conversation."
              actionLabel="Add a journey"
              actionHref="/journeys/new"
            />
          ) : (
            <div className="space-y-3">
              {journeys.data.journeys.map((j) => (
                <Link
                  key={j.id}
                  className="rb-catalog-row"
                  href={`/journeys/${j.id}?tab=chat`}
                >
                  <TrainFront size={22} />
                  <span>
                    <small>
                      {j.journey_date} · {j.train?.number}
                    </small>
                    <br />
                    <strong>{j.train?.name || "Train lounge"}</strong>
                  </span>
                  <ArrowUpRight size={18} />
                </Link>
              ))}
            </div>
          )}
        </section>
        <section className="rb-ui-card p-6">
          <h2 className="font-display text-3xl font-normal mb-6">
            A little more personal.
          </h2>
          {conversations.loading ? (
            <p className="rb-loading" role="status">
              Opening your conversations…
            </p>
          ) : conversations.error ? (
            <p className="rb-error-message" role="alert">
              {conversations.error}
              <button
                className="underline ml-2"
                onClick={conversations.refresh}
              >
                Retry
              </button>
            </p>
          ) : !conversations.data?.conversations.length ? (
            <EmptyState
              icon="chat"
              title="Good conversations take a first hello."
              description="Find fellow travellers in your journey’s passenger view. Both people must share an active journey and allow messages."
              actionLabel="My journeys"
              actionHref="/journeys"
            />
          ) : (
            <div className="space-y-3">
              {conversations.data.conversations.map((c) => (
                <Link
                  key={c.id}
                  className="rb-catalog-row"
                  href={`/dm/${c.id}`}
                >
                  <MessagesSquare size={21} />
                  <span>
                    <strong>{c.other_handle || "Fellow traveller"}</strong>
                    <br />
                    <small>{c.last_message || "Start the conversation"}</small>
                  </span>
                  <ArrowUpRight size={18} />
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
