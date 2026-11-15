"use client";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PostCardSkeleton } from "@/components/ui/skeleton";
import { apiFetch, isForbidden } from "@/lib/api";
import type { Poll, Post } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  BarChart3,
  BookOpen,
  Coffee,
  Heart,
  HelpCircle,
  MessageSquare,
  Plus,
  Send,
  Share2,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const CATEGORIES = [
  { id: "general", label: "General Lounge", icon: MessageSquare },
  { id: "food", label: "Catering & Chai", icon: Coffee },
  { id: "question", label: "Station Enquiry", icon: HelpCircle },
  { id: "update", label: "Train & Track Update", icon: AlertCircle },
  { id: "story", label: "Travelogue", icon: BookOpen },
];

export function CommunityPanel({ journeyId }: { journeyId: string }) {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("general");
  const [showPollForm, setShowPollForm] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [pollPosting, setPollPosting] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [actionError, setActionError] = useState<string | null>(null);

  const loadContent = useCallback(async () => {
    try {
      const [postsData, pollsData] = await Promise.all([
        apiFetch<{ posts: Post[] }>(`/journeys/${journeyId}/posts`),
        apiFetch<{ polls: Poll[] }>(`/journeys/${journeyId}/polls`).catch(
          () => ({
            polls: [],
          }),
        ),
      ]);
      setPosts(postsData.posts ?? []);
      setPolls(pollsData.polls ?? []);
    } catch (err) {
      if (isForbidden(err)) {
        router.replace("/journeys/restricted");
      }
    } finally {
      setLoading(false);
    }
  }, [journeyId, router]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  async function handlePost(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setActionError(null);
    setPosting(true);
    try {
      await apiFetch(`/journeys/${journeyId}/posts`, {
        method: "POST",
        body: JSON.stringify({
          body: body.trim(),
          post_type: category,
        }),
      });
      setBody("");
      await loadContent();
    } catch (err) {
      if (isForbidden(err)) {
        router.replace("/journeys/restricted");
        return;
      }
      setActionError(
        err instanceof Error ? err.message : "Failed to publish post.",
      );
    } finally {
      setPosting(false);
    }
  }

  async function handlePoll(e: React.FormEvent) {
    e.preventDefault();
    const options = pollOptions.map((o) => o.trim()).filter(Boolean);
    if (!pollQuestion.trim() || options.length < 2) return;
    setActionError(null);
    setPollPosting(true);
    try {
      await apiFetch(`/journeys/${journeyId}/polls`, {
        method: "POST",
        body: JSON.stringify({ question: pollQuestion.trim(), options }),
      });
      setPollQuestion("");
      setPollOptions(["", ""]);
      setShowPollForm(false);
      await loadContent();
    } catch (err) {
      if (isForbidden(err)) {
        router.replace("/journeys/restricted");
        return;
      }
      setActionError(
        err instanceof Error ? err.message : "Failed to create poll.",
      );
    } finally {
      setPollPosting(false);
    }
  }

  async function vote(pollId: string, optionId: string) {
    setActionError(null);
    try {
      await apiFetch(`/polls/${pollId}/vote`, {
        method: "POST",
        body: JSON.stringify({ option_id: optionId }),
      });
      await loadContent();
    } catch (err) {
      if (isForbidden(err)) {
        router.replace("/journeys/restricted");
        return;
      }
      setActionError(
        err instanceof Error ? err.message : "Failed to submit vote.",
      );
    }
  }

  async function toggleReaction(postId: string, reacted: boolean) {
    setActionError(null);
    const applyDelta = (invert: boolean) => {
      const targetReacted = invert ? reacted : !reacted;
      const delta = invert ? (reacted ? 1 : -1) : reacted ? -1 : 1;
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                user_reacted: targetReacted,
                reaction_count: Math.max(0, (p.reaction_count ?? 0) + delta),
              }
            : p,
        ),
      );
    };

    try {
      // Optimistic update
      applyDelta(false);

      if (reacted) {
        await apiFetch(`/posts/${postId}/reactions`, { method: "DELETE" });
      } else {
        await apiFetch(`/posts/${postId}/reactions`, {
          method: "POST",
          body: JSON.stringify({ reaction: "like" }),
        });
      }
      await loadContent();
    } catch (err) {
      applyDelta(true);
      if (isForbidden(err)) {
        router.replace("/journeys/restricted");
        return;
      }
      setActionError(
        err instanceof Error ? err.message : "Failed to update reaction.",
      );
    }
  }

  function handleShare(postBody: string) {
    if (navigator.share) {
      navigator
        .share({
          title: "RailBandhan Train Post",
          text: postBody,
          url: window.location.href,
        })
        .catch(() => {});
    } else if (navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(postBody)
        .then(() => alert("Post text copied to clipboard!"))
        .catch(() => {});
    }
  }

  const totalVotes = (poll: Poll) =>
    poll.options.reduce((sum, o) => sum + o.vote_count, 0);

  return (
    <div className="space-y-6">
      {actionError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-medium text-red-700">
          {actionError}
        </div>
      )}
      {/* Post Composer Card */}
      <Card className="surreal-card p-5 space-y-4">
        <form onSubmit={handlePost} className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#98512e]">
              Post to Co-Passengers • यात्रा संवाद
            </span>
            <button
              type="button"
              onClick={() => setShowPollForm((v) => !v)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all border",
                showPollForm
                  ? "bg-[#f2e7d3] text-[#98512e] border-amber-400/40 shadow-sm"
                  : "bg-[#edf0e5] text-[var(--rail-text-muted)] hover:bg-white/10 hover:text-[#24483f] border-[var(--rail-border)]",
              )}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <span>{showPollForm ? "Cancel Poll" : "+ Create Poll"}</span>
            </button>
          </div>

          {/* Category Chips */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={cn(
                    "shrink-0 inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all border",
                    category === cat.id
                      ? "bg-gradient-to-r from-[var(--rail-surface)] to-[var(--rail-surface)] text-[var(--rail-text)] border-amber-400/40 shadow-sm"
                      : "bg-[var(--rail-surface)] text-[var(--rail-text-muted)] hover:text-[#FFF3DC] hover:bg-[var(--rail-surface)] border-[var(--rail-border)]",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Share coach updates, station recommendations, chai reviews, or travel lore..."
            rows={3}
            className="w-full rounded-xl border border-[var(--rail-border)] bg-[var(--rail-surface)] p-3.5 text-sm text-[var(--rail-text)] resize-none focus:outline-none focus:border-amber-400/60 focus:ring-2 focus:ring-amber-400/20 placeholder:text-[#8E867E] transition-all"
          />

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-[var(--rail-text-muted)]">
              {body.length > 0
                ? `${body.length} characters`
                : "Broadcasted live to co-passengers on this train"}
            </span>
            <Button
              type="submit"
              size="sm"
              variant="royal"
              disabled={posting || !body.trim()}
              isLoading={posting}
              rightIcon={<Send className="h-3.5 w-3.5" />}
            >
              Broadcast
            </Button>
          </div>
        </form>
      </Card>

      {/* Poll Creation Form (Collapsible) */}
      {showPollForm && (
        <Card className="border-amber-400/30 bg-[var(--rail-surface)] p-5 animate-in fade-in zoom-in-95 duration-150">
          <form onSubmit={handlePoll} className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-[#98512e] uppercase tracking-wider">
                Create Live Co-Passenger Poll
              </span>
            </div>
            <input
              value={pollQuestion}
              onChange={(e) => setPollQuestion(e.target.value)}
              placeholder="Ask a question (e.g. Which station has the finest kulhad chai?)"
              className="w-full rounded-xl border border-[var(--rail-border)] bg-[var(--rail-surface)] px-3.5 py-2.5 text-sm text-[var(--rail-text)] placeholder:text-[#8E867E] focus:outline-none focus:border-amber-400/60 focus:ring-2 focus:ring-amber-400/20"
            />
            <div className="space-y-2">
              {pollOptions.map((opt, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={opt}
                    onChange={(e) => {
                      const next = [...pollOptions];
                      next[i] = e.target.value;
                      setPollOptions(next);
                    }}
                    placeholder={`Option ${i + 1}`}
                    className="flex-1 rounded-xl border border-[var(--rail-border)] bg-[var(--rail-surface)] px-3.5 py-2 text-sm text-[var(--rail-text)] placeholder:text-[#8E867E] focus:outline-none focus:border-amber-400/60"
                  />
                  {pollOptions.length > 2 && (
                    <button
                      type="button"
                      onClick={() =>
                        setPollOptions(
                          pollOptions.filter((_, idx) => idx !== i),
                        )
                      }
                      className="p-2 text-red-400 hover:text-red-300 rounded-lg"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between pt-1">
              {pollOptions.length < 4 ? (
                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  onClick={() => setPollOptions([...pollOptions, ""])}
                  leftIcon={<Plus className="h-3 w-3" />}
                >
                  Add Option
                </Button>
              ) : (
                <span />
              )}
              <Button
                type="submit"
                size="sm"
                variant="royal"
                disabled={pollPosting}
                isLoading={pollPosting}
              >
                Publish Poll
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Feed Loading & Items */}
      {loading ? (
        <div className="space-y-4">
          <PostCardSkeleton />
          <PostCardSkeleton />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Active Polls Section */}
          {polls.length > 0 && (
            <div className="space-y-3">
              {polls.map((poll) => {
                const votes = totalVotes(poll);
                const voted = poll.voted_option_id;

                return (
                  <Card key={poll.id} className="surreal-card p-5">
                    <div className="flex items-center justify-between pb-2">
                      <Badge variant="royal" className="text-[10px]">
                        <BarChart3 className="h-3 w-3 mr-1" />
                        Train Poll
                      </Badge>
                      <span className="text-xs text-[var(--rail-text-muted)] font-medium">
                        {votes} {votes === 1 ? "response" : "responses"}
                      </span>
                    </div>

                    <h4 className="font-bold text-base text-[var(--rail-text)] mt-1">
                      {poll.question}
                    </h4>

                    <div className="mt-3.5 space-y-2">
                      {poll.options.map((opt) => {
                        const pct =
                          votes > 0
                            ? Math.round((opt.vote_count / votes) * 100)
                            : 0;
                        const isSelected = voted === opt.id;

                        return (
                          <button
                            key={opt.id}
                            type="button"
                            disabled={!!voted}
                            onClick={() => vote(poll.id, opt.id)}
                            className={cn(
                              "relative w-full overflow-hidden rounded-xl border p-3.5 text-left text-sm transition-all",
                              isSelected
                                ? "border-amber-400 bg-[#f2e7d3] font-semibold text-[#98512e]"
                                : "border-[var(--rail-border)] hover:bg-white/5 text-[var(--rail-text)]",
                            )}
                          >
                            <div
                              className="absolute inset-y-0 left-0 bg-[#f2e7d3] transition-all duration-700"
                              style={{ width: `${pct}%` }}
                            />
                            <div className="relative flex items-center justify-between">
                              <span>{opt.label}</span>
                              <span className="font-mono text-xs text-[#98512e] font-bold">
                                {voted || votes > 0 ? `${pct}%` : ""}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Posts Feed */}
          {posts.length === 0 && polls.length === 0 ? (
            <EmptyState
              icon="chat"
              title="No posts in this train community yet"
              description="Be the first to share an update, ask a travel question, or start a lively discussion with fellow passengers!"
            />
          ) : (
            posts.map((post) => (
              <Card key={post.id} className="surreal-card p-5 transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar handle={post.author_handle} size="sm" />
                    <div>
                      <span className="font-bold text-sm text-[var(--rail-text)]">
                        {post.author_handle ?? "Passenger"}
                      </span>
                      <p className="text-xs text-[var(--rail-text-muted)]">
                        {new Date(post.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        · Traveling onboard
                      </p>
                    </div>
                  </div>

                  {post.post_type && post.post_type !== "general" && (
                    <Badge variant="subtle" className="text-[10px] capitalize">
                      {post.post_type}
                    </Badge>
                  )}
                </div>

                {post.title && (
                  <h4 className="mt-3 font-bold text-base text-[var(--rail-text)]">
                    {post.title}
                  </h4>
                )}

                <p className="mt-2.5 text-sm text-[var(--rail-text)] leading-relaxed whitespace-pre-line">
                  {post.body}
                </p>

                <div className="mt-4 pt-3 border-t border-[var(--rail-border)] flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() =>
                      toggleReaction(post.id, post.user_reacted ?? false)
                    }
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border",
                      post.user_reacted
                        ? "text-rose-400 bg-rose-500/20 border-rose-500/30"
                        : "text-[var(--rail-text-muted)] hover:text-rose-400 hover:bg-rose-500/10 border-[var(--rail-border)]",
                    )}
                  >
                    <Heart
                      className="h-4 w-4"
                      fill={post.user_reacted ? "currentColor" : "none"}
                    />
                    <span>{post.reaction_count ?? 0}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleShare(post.body)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[var(--rail-text-muted)] hover:text-[#24483f] hover:bg-white/5 transition-colors border border-[var(--rail-border)]"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    <span>Share</span>
                  </button>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
