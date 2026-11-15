"use client";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ErrorBanner } from "@/components/ui/error-banner";
import { MessageSkeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api";
import { formatErrorMessage } from "@/lib/format-error";
import type { Conversation, DmMessage } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Lock,
  MoreVertical,
  Send,
  ShieldCheck,
  UserX,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useCallback, useEffect, useRef, useState } from "react";

type ConversationDetail = {
  id: string;
  other_participant_handle: string;
  is_blocked?: boolean;
};

const QUICK_PHRASES = [
  "Namaste",
  "Which Coach?",
  "Chai?",
  "All Good",
  "Game On",
  "Safe travels",
];

export default function DmThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [conv, setConv] = useState<ConversationDetail | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<DmMessage[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [currentUserHandle, setCurrentUserHandle] = useState<string | null>(
    null,
  );
  const [showOptions, setShowOptions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadData = useCallback(async () => {
    try {
      const [convData, msgData, meData, convListData] = await Promise.all([
        apiFetch<{ conversation: ConversationDetail }>(`/conversations/${id}`),
        apiFetch<{ messages: DmMessage[] }>(`/conversations/${id}/messages`),
        apiFetch<{ anonymous?: { public_handle?: string } }>("/auth/me").catch(
          () => null,
        ),
        apiFetch<{ conversations: Conversation[] }>("/conversations").catch(
          () => ({ conversations: [] }),
        ),
      ]);
      setLoadError(null);
      setConv(convData.conversation);
      setMessages(msgData.messages ?? []);
      setConversations(convListData.conversations ?? []);
      if (meData?.anonymous?.public_handle) {
        setCurrentUserHandle(meData.anonymous.public_handle);
      }
    } catch (err) {
      setLoadError(
        formatErrorMessage(
          err,
          "Conversation unavailable. The passenger or message corridor may be paused.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [loadData]);

  useEffect(() => {
    if (!loading) scrollToBottom();
  }, [messages.length, loading]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || sending) return;
    const text = body.trim();
    setSendError(null);
    setSending(true);
    try {
      await apiFetch(`/conversations/${id}/messages`, {
        method: "POST",
        body: JSON.stringify({ body: text }),
      });
      setBody("");
      await loadData();
      scrollToBottom();
    } catch (err) {
      setSendError(
        formatErrorMessage(
          err,
          "Failed to deliver message. Please check your connection.",
        ),
      );
    } finally {
      setSending(false);
    }
  }

  async function handleBlock() {
    if (!conv) return;
    if (
      confirm(
        `Block ${conv.other_participant_handle}? They will no longer be able to message you.`,
      )
    ) {
      try {
        await apiFetch(`/blocks`, {
          method: "POST",
          body: JSON.stringify({ handle: conv.other_participant_handle }),
        });
        router.push("/dm");
      } catch {
        alert("Failed to block user.");
      }
    }
  }

  return (
    <div className="w-full space-y-4 text-[var(--rail-text)] select-none">
      {/* 12-Column Responsive Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-8.5rem)] min-h-[640px]">
        {/* Left Column: Thread Navigator on Desktop (4 cols on lg, hidden on mobile) */}
        <div className="hidden lg:flex lg:col-span-4 flex-col surreal-card rounded-3xl shadow-sm overflow-hidden border border-[#E5B254]/30">
          <div className="p-4 border-b border-[#E5B254]/20 flex items-center justify-between bg-[var(--rail-surface)]">
            <div className="flex items-center gap-2">
              <Link
                href="/dm"
                className="p-1 rounded-xl text-[#98512e] hover:text-[#24483f] hover:bg-white/10 transition-colors"
                title="All Direct Messages"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <span className="font-bold text-sm text-[var(--rail-text)]">
                Journey Whispers (संवाद)
              </span>
            </div>
            <Badge variant="royal" className="text-[10px] border-[#E5B254]/40">
              Active
            </Badge>
          </div>

          <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
            {conversations.length === 0 ? (
              <div className="p-4 text-center text-xs text-[var(--rail-text-muted)]">
                No other conversations.
              </div>
            ) : (
              conversations.map((c) => {
                const handle =
                  c.other_handle ?? c.other_participant_handle ?? "Passenger";
                const isCurrent = c.id === id;
                return (
                  <Link
                    key={c.id}
                    href={`/dm/${c.id}`}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-2xl border text-left transition-all",
                      isCurrent
                        ? "bg-[#f2e7d3] border-[#E5B254] shadow-md"
                        : "bg-[var(--rail-surface)]/70 border-[var(--rail-border)] hover:border-[#E5B254]/40 hover:bg-[var(--rail-surface)]",
                    )}
                  >
                    <Avatar handle={handle} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "text-xs font-bold truncate",
                          isCurrent
                            ? "text-[#98512e]"
                            : "text-[var(--rail-text)]",
                        )}
                      >
                        {handle}
                      </p>
                      <p className="text-[11px] text-[var(--rail-text-muted)] truncate">
                        {c.last_message ??
                          c.last_message_preview ??
                          "Open chat"}
                      </p>
                    </div>
                  </Link>
                );
              })
            )}
          </div>

          <div className="p-3 bg-[var(--rail-surface)] border-t border-[#E5B254]/20 text-[11px] text-[var(--rail-text-muted)] flex items-center gap-2">
            <Lock className="h-3.5 w-3.5 text-[var(--rail-text)]" />
            <span>Safe & Private Traveler Telepathy</span>
          </div>
        </div>

        {/* Right Column: Active Conversation Stream (8 cols on lg, full on mobile) */}
        <div className="lg:col-span-8 flex flex-col surreal-card rounded-3xl shadow-sm overflow-hidden h-full border border-[#E5B254]/30">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E5B254]/20 bg-[var(--rail-surface)]">
            <div className="flex items-center gap-3">
              <Link
                href="/dm"
                className="lg:hidden p-1.5 rounded-xl text-[#98512e] hover:text-[#24483f] hover:bg-white/10 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <Avatar handle={conv?.other_participant_handle} size="md" />
              <div>
                <h2 className="font-bold text-sm text-[var(--rail-text)]">
                  {conv?.other_participant_handle ?? "Passenger"}
                </h2>
                <p className="text-xs text-[#98512e] font-semibold flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#35664c]" />{" "}
                  Verified Train Co-Traveler
                </p>
              </div>
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowOptions((v) => !v)}
                className="p-2 rounded-xl text-[var(--rail-text-muted)] hover:text-[#24483f] hover:bg-white/10 transition-colors"
              >
                <MoreVertical className="h-4 w-4" />
              </button>

              {showOptions && (
                <div className="absolute right-0 top-full mt-1 w-48 rounded-2xl bg-[var(--rail-surface)] border border-[#E5B254]/40 shadow-sm p-1.5 z-30 animate-in fade-in zoom-in-95 duration-100">
                  <button
                    type="button"
                    onClick={handleBlock}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-950/60 rounded-xl transition-colors"
                  >
                    <UserX className="h-4 w-4 text-rose-400" />
                    <span>Block Co-Passenger</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Privacy Guarantee Notice */}
          <div className="flex items-center justify-center gap-2 py-2 px-4 bg-[#f2e7d3] border-b border-[#E5B254]/20 text-xs text-[#98512e] font-medium">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-[var(--rail-text)]" />
            <span>
              Private encrypted channel between you and{" "}
              {conv?.other_participant_handle}.
            </span>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-5 overflow-y-auto space-y-3.5 bg-black/40">
            {loading ? (
              <div className="space-y-4 py-4">
                <MessageSkeleton />
                <MessageSkeleton />
              </div>
            ) : loadError && !conv ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <h3 className="font-bold text-base text-[var(--rail-text)]">
                  Conversation Unavailable
                </h3>
                <p className="text-xs text-[var(--rail-text-muted)] max-w-sm">
                  {loadError}
                </p>
                <Link
                  href="/dm"
                  className="text-xs font-semibold text-[var(--rail-text)] hover:underline"
                >
                  Back to Direct Messages
                </Link>
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <Avatar handle={conv?.other_participant_handle} size="lg" />
                <h3 className="font-bold text-base text-[var(--rail-text)]">
                  Start conversation with {conv?.other_participant_handle}
                </h3>
                <p className="text-xs text-[var(--rail-text-muted)] max-w-sm">
                  Say namaste, coordinate games in the lounge, or discuss chai
                  and window seats.
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const msgHandle = msg.sender_handle || msg.author_handle;
                const isMe = Boolean(
                  currentUserHandle && msgHandle === currentUserHandle,
                );

                return (
                  <div
                    key={msg.id}
                    data-testid="dm-message"
                    className={cn(
                      "flex items-start gap-2.5 max-w-[80%] animate-in fade-in slide-in-from-bottom-1 duration-150",
                      isMe ? "ml-auto flex-row-reverse" : "mr-auto",
                    )}
                  >
                    {!isMe && (
                      <Avatar
                        handle={msgHandle}
                        size="xs"

                        className="mt-1 shrink-0"
                      />
                    )}

                    <div
                      className={cn(
                        "flex flex-col space-y-1",
                        isMe ? "items-end" : "items-start",
                      )}
                    >
                      <div
                        className={cn(
                          "rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-lg break-words max-w-full",
                          isMe
                            ? "bg-gradient-to-r from-[var(--rail-surface)] via-[var(--rail-surface)] to-[var(--rail-surface)] text-[var(--rail-text)] border border-[#E5B254]/40 rounded-tr-xs"
                            : "surreal-card text-[var(--rail-text)] border border-[var(--rail-border)] rounded-tl-xs",
                        )}
                      >
                        <p className="whitespace-pre-wrap">{msg.body}</p>
                      </div>

                      <span className="text-[10px] text-[#98512e] font-mono px-1">
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

          {/* Quick Phrases */}
          <div className="flex items-center gap-2 px-5 py-2.5 border-t border-[#E5B254]/20 bg-[var(--rail-surface)] overflow-x-auto no-scrollbar">
            <span className="text-xs font-bold text-[#98512e] pr-1 flex items-center gap-1 font-mono shrink-0">
              <Zap className="h-3.5 w-3.5 text-[var(--rail-text)]" /> QUICK:
            </span>
            {QUICK_PHRASES.map((phrase) => (
              <button
                key={phrase}
                type="button"
                onClick={() =>
                  setBody((prev) => (prev ? `${prev} ${phrase}` : phrase))
                }
                className="shrink-0 px-3 py-1 rounded-xl bg-[var(--rail-surface)] border border-[#E5B254]/25 text-xs font-semibold text-[#98512e] hover:text-[#24483f] hover:border-[#E5B254] hover:bg-amber-500/20 transition-all"
              >
                {phrase}
              </button>
            ))}
          </div>

          {sendError && (
            <div className="px-4 py-2 border-t border-[var(--rail-border)] bg-[var(--rail-surface)]">
              <ErrorBanner
                message={sendError}
                variant="subtle"
                onDismiss={() => setSendError(null)}
              />
            </div>
          )}

          {/* Input */}
          <form
            onSubmit={handleSend}
            className="p-3.5 border-t border-[#E5B254]/20 bg-[var(--rail-surface)] flex gap-3"
          >
            <input
              type="text"
              data-testid="dm-input"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              disabled={Boolean(loadError && !conv)}
              placeholder={`Message ${conv?.other_participant_handle ?? "Passenger"}...`}
              className="flex-1 rounded-2xl border border-[#E5B254]/30 bg-[var(--rail-surface)] px-4 py-2.5 text-sm text-[var(--rail-text)] placeholder:text-amber-200/40 focus:outline-none focus:border-[#E5B254] focus:ring-2 focus:ring-[#E5B254]/30 shadow-inner transition-all"
            />
            <Button
              type="submit"
              size="md"
              variant="royal"
              data-testid="dm-send-btn"
              disabled={sending || !body.trim() || Boolean(loadError && !conv)}
              isLoading={sending}
              className="px-5 shrink-0 rounded-2xl border border-[#E5B254]/50 shadow-sm shadow-red-950/70 font-bold"
            >
              <Send className="h-4 w-4 text-[#98512e]" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
