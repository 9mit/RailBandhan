"use client";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorBanner } from "@/components/ui/error-banner";
import { MessageSkeleton } from "@/components/ui/skeleton";
import { apiFetch, isForbidden } from "@/lib/api";
import { formatErrorMessage } from "@/lib/format-error";
import type { Message } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Radio, Send, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const QUICK_CHIPS = [
  "Chai Halt",
  "Platform 1",
  "On Track",
  "Right Time",
  "All Aboard",
  "Coach Check",
];

export function ChatPanel({ journeyId }: { journeyId: string }) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [currentUserHandle, setCurrentUserHandle] = useState<string | null>(
    null,
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadMessages = useCallback(async () => {
    try {
      const [msgData, meData] = await Promise.all([
        apiFetch<{ messages: Message[] }>(`/journeys/${journeyId}/messages`),
        apiFetch<{ anonymous?: { public_handle?: string } }>("/auth/me").catch(
          () => null,
        ),
      ]);
      setMessages(msgData.messages ?? []);
      if (meData?.anonymous?.public_handle) {
        setCurrentUserHandle(meData.anonymous.public_handle);
      }
    } catch (err) {
      if (isForbidden(err)) {
        router.replace("/journeys/restricted");
      }
    } finally {
      setLoading(false);
    }
  }, [journeyId, router]);

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 10000);
    return () => clearInterval(interval);
  }, [loadMessages]);

  useEffect(() => {
    if (!loading) {
      scrollToBottom();
    }
  }, [messages.length, loading]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || sending) return;
    const text = body.trim();
    setSending(true);
    setSendError(null);
    try {
      await apiFetch(`/journeys/${journeyId}/messages`, {
        method: "POST",
        body: JSON.stringify({ body: text }),
      });
      setBody("");
      await loadMessages();
      scrollToBottom();
    } catch (err) {
      if (isForbidden(err)) {
        router.replace("/journeys/restricted");
        return;
      }
      setSendError(
        formatErrorMessage(
          err,
          "Could not deliver your message right now. Please try again.",
        ),
      );
    } finally {
      setSending(false);
    }
  }

  function insertChip(chip: string) {
    setBody((prev) => (prev ? `${prev} [${chip}]` : `[${chip}]`));
  }

  return (
    <div className="flex flex-col h-[650px] rounded-2xl border border-[var(--rail-border)] bg-[var(--rail-surface)]/90 backdrop-blur-xl overflow-hidden shadow-sm text-[var(--rail-text)]">
      {/* Train Chat Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--rail-border)] bg-[var(--rail-surface)]/80">
        <div className="flex items-center gap-2.5">
          <div className="h-2.5 w-2.5 rounded-full bg-[#e2ecdf] animate-pulse" />
          <div>
            <h3 className="font-bold text-sm text-[var(--rail-text)]">
              Train Journey Lounge
            </h3>
            <p className="text-[11px] text-[var(--rail-text-muted)] flex items-center gap-1">
              <Radio className="h-3 w-3 text-[#98512e]" />
              Live channel with passengers onboard
            </p>
          </div>
        </div>
        <Badge variant="signal" dot>
          Live
        </Badge>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 bg-transparent">
        {loading ? (
          <div className="space-y-4 py-4">
            <MessageSkeleton />
            <MessageSkeleton />
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <EmptyState
              icon="chat"
              title="Welcome to train chat"
              description="No messages yet. Send a message to start chatting with your fellow passengers."
            />
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe =
              currentUserHandle && msg.author_handle === currentUserHandle;
            const prevMsg = messages[index - 1];
            const isSameAuthor =
              prevMsg && prevMsg.author_handle === msg.author_handle;

            return (
              <div
                key={msg.id}
                className={cn(
                  "flex items-start gap-2.5 max-w-[85%] animate-in fade-in slide-in-from-bottom-1 duration-150",
                  isMe ? "ml-auto flex-row-reverse" : "mr-auto",
                )}
              >
                {!isSameAuthor && (
                  <Avatar
                    handle={msg.author_handle}
                    size="sm"

                    className="mt-0.5 shrink-0"
                  />
                )}
                {isSameAuthor && <div className="w-8 shrink-0" />}

                <div
                  className={cn(
                    "flex flex-col space-y-1",
                    isMe ? "items-end" : "items-start",
                  )}
                >
                  {!isSameAuthor && (
                    <span className="text-[11px] font-semibold text-[var(--rail-text-muted)] px-1">
                      {msg.author_handle ?? "Passenger"}
                    </span>
                  )}

                  <div
                    className={cn(
                      "rounded-2xl px-4 py-2.5 text-sm leading-relaxed break-words max-w-full",
                      isMe
                        ? "bg-gradient-to-r from-[var(--rail-surface)] to-[var(--rail-surface)] text-[var(--rail-text)] shadow-md border border-amber-400/30"
                        : "bg-[var(--rail-surface)] border border-[var(--rail-border)] text-[var(--rail-text)]",
                    )}
                  >
                    <p className="whitespace-pre-wrap">{msg.body}</p>
                  </div>

                  <span className="text-[10px] text-[var(--rail-text-muted)] font-mono px-1">
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Action Signals Bar */}
      <div className="flex items-center gap-1.5 px-4 py-2 border-t border-[var(--rail-border)] bg-[var(--rail-surface)]/90 overflow-x-auto no-scrollbar">
        <span className="text-[10px] text-[#98512e] font-bold flex items-center gap-1 pr-1 font-mono shrink-0">
          <Zap className="h-3 w-3 text-[#98512e]" /> QUICK:
        </span>
        {QUICK_CHIPS.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => insertChip(chip)}
            className="shrink-0 rounded-lg bg-[var(--rail-surface)] border border-[var(--rail-border)] px-2.5 py-1 text-[11px] font-mono text-[var(--rail-text-muted)] hover:text-amber-300 hover:border-amber-400/40 hover:bg-[var(--rail-surface)] active:scale-95 transition-all shadow-xs"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Message Input Form */}
      <div className="p-3 border-t border-[var(--rail-border)] bg-[var(--rail-surface)] space-y-2">
        {sendError && (
          <ErrorBanner
            message={sendError}
            variant="subtle"
            onDismiss={() => setSendError(null)}
          />
        )}
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Message fellow passengers onboard…"
            className="flex-1 rounded-xl border border-[var(--rail-border)] bg-[var(--rail-surface)] px-4 py-2.5 text-sm text-[var(--rail-text)] placeholder:text-[#8E867E] focus:outline-none focus:border-amber-400/60 focus:ring-2 focus:ring-amber-400/20"
          />
          <Button
            type="submit"
            size="md"
            variant="royal"
            disabled={sending || !body.trim()}
            isLoading={sending}
            className="px-4 shrink-0 rounded-xl"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
