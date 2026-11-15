"use client";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorBanner } from "@/components/ui/error-banner";
import { useApiResource } from "@/hooks/use-api-resource";
import type { Conversation } from "@/lib/types";
import { ArrowUpRight, MessagesSquare } from "lucide-react";
import Link from "next/link";
export default function ConversationsPage() {
  const { data, loading, error, refresh } = useApiResource<{
    conversations: Conversation[];
  }>("/conversations");
  return (
    <div>
      <div className="rb-route-title">
        <span className="rb-eyebrow">IN GOOD COMPANY</span>
        <h1>
          Keep the
          <br />
          <em>conversation going.</em>
        </h1>
        <p>Private conversations with people on a shared journey.</p>
      </div>
      {loading ? (
        <div role="status" className="rb-loading">
          Opening your conversations…
        </div>
      ) : error ? (
        <ErrorBanner
          message={error}
          onRetry={refresh}
          variant="subtle"
          className="mb-4"
        />
      ) : !data?.conversations.length ? (
        <EmptyState
          icon="chat"
          title="Your first hello is waiting."
          description="Open your journey’s passenger view to meet fellow travellers who allow messages."
          actionHref="/journeys"
          actionLabel="Find my people"
        />
      ) : (
        <div className="space-y-3 max-w-3xl">
          {data.conversations.map((c) => (
            <Link key={c.id} className="rb-catalog-row" href={`/dm/${c.id}`}>
              <MessagesSquare size={22} />
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
    </div>
  );
}
