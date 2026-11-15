"use client";
import { ButtonLink } from "@/components/ui/button-link";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorBanner } from "@/components/ui/error-banner";
import { Modal } from "@/components/ui/modal";
import { apiFetch } from "@/lib/api";
import { formatErrorMessage } from "@/lib/format-error";
import type { GameSession, Journey } from "@/lib/types";
import {
  Award,
  CircleDot,
  Grid,
  Play,
  Plus,
  Train,
  Trophy,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function GamesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [selectedJourneyId, setSelectedJourneyId] = useState<string>("");
  const [games, setGames] = useState<GameSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [gameType, setGameType] = useState<"tictactoe" | "connectfour">(
    "tictactoe",
  );
  const [creating, setCreating] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadJourneys() {
      try {
        const session = await apiFetch<{ authenticated?: boolean }>(
          "/auth/session",
        );
        if (!session?.authenticated) {
          setAuthenticated(false);
          return;
        }
        setAuthenticated(true);
        const data = await apiFetch<{ journeys: Journey[] }>("/journeys");
        const list = data.journeys ?? [];
        setJourneys(list);

        const paramJourney = searchParams.get("journey");
        if (paramJourney) {
          setSelectedJourneyId(paramJourney);
        } else if (list.length > 0) {
          setSelectedJourneyId(list[0].id);
        }
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    }
    loadJourneys();
  }, [searchParams]);

  useEffect(() => {
    if (!selectedJourneyId) return;
    async function loadGames() {
      try {
        const data = await apiFetch<{ games: GameSession[] }>(
          `/journeys/${selectedJourneyId}/games`,
        );
        setGames(data.games ?? []);
      } catch {
        setGames([]);
      }
    }
    loadGames();
    const interval = setInterval(loadGames, 8000);
    return () => clearInterval(interval);
  }, [selectedJourneyId]);

  async function handleCreateGame() {
    if (!selectedJourneyId || creating) return;
    setCreating(true);
    setError("");
    try {
      const data = await apiFetch<{ game: { id: string } }>("/games", {
        method: "POST",
        body: JSON.stringify({
          journey_id: selectedJourneyId,
          game_type: gameType,
        }),
      });
      setCreateModalOpen(false);
      router.push(`/games/${data.game.id}`);
    } catch (err: unknown) {
      setError(
        formatErrorMessage(err, "Could not create challenge. Please try again."),
      );
      setCreating(false);
    }
  }

  async function handleJoinGame(gameId: string) {
    setError("");
    try {
      await apiFetch(`/games/${gameId}/join`, { method: "POST" });
      router.push(`/games/${gameId}`);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Could not join match.";
      if (message.toLowerCase().includes("already")) {
        router.push(`/games/${gameId}`);
      } else {
        setError(
          formatErrorMessage(err, "Could not join match. Please try again."),
        );
      }
    }
  }

  const activeGames = games.filter(
    (g) => g.status === "in_progress" || g.status === "active",
  );
  const waitingGames = games.filter(
    (g) => g.status === "waiting" || g.status === "open",
  );

  return (
    <div className="w-full space-y-6 text-[var(--rail-text)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E5B254]/25">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="royal" className="text-[11px] border-[#E5B254]/40">
              यात्री क्रीड़ा • JOURNEY ARENA
            </Badge>
            <Badge variant="signal" dot className="text-[11px]">
              Play with Co-Passengers
            </Badge>
          </div>
          <h1 className="rb-screen-heading text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--rail-text)] flex items-center gap-2">
            Chaupar & Train Games Arena
          </h1>
          <p className="text-sm text-[var(--rail-text-muted)] mt-0.5">
            Turn travel downtime into timeless matches with co-passengers on
            your train route.
          </p>
        </div>

        <Button
          onClick={() => setCreateModalOpen(true)}
          disabled={!selectedJourneyId}
          variant="royal"
          size="sm"
          className="shadow-sm border border-[#E5B254]/50"
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Create Challenge
        </Button>
      </div>

      {/* Error Feedback */}
      {error && (
        <ErrorBanner
          message={error}
          onDismiss={() => setError("")}
          className="my-1"
        />
      )}

      {/* Train Journey Selector */}
      {journeys.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <span className="text-xs text-[var(--rail-text)] font-bold uppercase tracking-wider shrink-0">
            Selected Train:
          </span>
          {journeys.map((j) => (
            <button
              key={j.id}
              type="button"
              onClick={() => setSelectedJourneyId(j.id)}
              className={`rounded-2xl px-3.5 py-1.5 text-xs font-semibold shrink-0 transition-all border ${
                selectedJourneyId === j.id
                  ? "bg-gradient-to-r from-[var(--rail-surface)] via-[var(--rail-surface)] to-[var(--rail-surface)] text-[#98512e] border-[#E5B254] shadow-lg"
                  : "bg-[var(--rail-surface)] border-[#E5B254]/20 text-[var(--rail-text-muted)] hover:text-[#24483f] hover:border-[#E5B254]/50"
              }`}
            >
              <Train className="h-3.5 w-3.5 inline mr-1.5 text-current" />
              {j.train?.number} ({j.boarding_station?.code} →{" "}
              {j.destination_station?.code})
            </button>
          ))}
        </div>
      )}

      {/* Featured Game Modes Banner (2 Cards side by side) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Tic Tac Toe */}
        <Card className="p-6 surreal-card flex flex-col justify-between hover:border-[#E5B254]/70 transition-all">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--rail-surface)] to-[var(--rail-surface)] text-[#98512e] border border-[#E5B254]/40 shadow-md">
                <Grid className="h-6 w-6" />
              </div>
              <Badge variant="royal" className="border-[#E5B254]/40">
                Classic 3x3
              </Badge>
            </div>
            <div>
              <h3 className="text-lg font-bold text-[var(--rail-text)]">
                Train Tic-Tac-Toe
              </h3>
              <p className="text-xs text-[var(--rail-text-muted)] mt-1 leading-relaxed">
                Connect 3 train tokens in a row. Fast-paced, high-focus mental
                duel with fellow travellers.
              </p>
            </div>
          </div>
          <div className="pt-5 mt-4 border-t border-[#E5B254]/20 flex items-center justify-between">
            <span className="text-xs text-[#98512e] flex items-center gap-1 font-medium">
              <Award className="h-3.5 w-3.5 text-[#98512e]" /> +25 Reputation
              Points
            </span>
            <Button
              size="sm"
              variant="royal"
              className="border border-[#E5B254]/40 shadow-md"
              onClick={() => {
                setGameType("tictactoe");
                setCreateModalOpen(true);
              }}
              leftIcon={<Play className="h-3.5 w-3.5" />}
            >
              Play Tic-Tac-Toe
            </Button>
          </div>
        </Card>

        {/* Connect Four */}
        <Card className="p-6 surreal-card flex flex-col justify-between hover:border-[#E5B254]/70 transition-all">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--rail-surface)] to-[var(--rail-surface)] text-indigo-200 border border-indigo-400/40 shadow-md">
                <CircleDot className="h-6 w-6" />
              </div>
              <Badge variant="signal" className="border-emerald-400/40">
                7-Column Strategy
              </Badge>
            </div>
            <div>
              <h3 className="text-lg font-bold text-[var(--rail-text)]">
                Rail Connect Four
              </h3>
              <p className="text-xs text-[var(--rail-text-muted)] mt-1 leading-relaxed">
                Drop your tokens into the vertical rack. Align 4 in a line
                vertically, horizontally, or diagonally.
              </p>
            </div>
          </div>
          <div className="pt-5 mt-4 border-t border-[#E5B254]/20 flex items-center justify-between">
            <span className="text-xs text-[#35664c] flex items-center gap-1 font-medium">
              <Award className="h-3.5 w-3.5 text-[#35664c]" /> +35 Reputation
              Points
            </span>
            <Button
              size="sm"
              variant="royal"
              className="border border-[#E5B254]/40 shadow-md"
              onClick={() => {
                setGameType("connectfour");
                setCreateModalOpen(true);
              }}
              leftIcon={<Play className="h-3.5 w-3.5" />}
            >
              Play Connect Four
            </Button>
          </div>
        </Card>
      </div>

      {/* 12-Column Split: Open Challenges & Active Matches */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Open Challenges Waiting for Opponents (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[var(--rail-text)] flex items-center gap-2">
              <Users className="h-4 w-4 text-[var(--rail-text)]" />
              Open Challenges Waiting for Opponents
            </h3>
            <span className="text-xs font-semibold text-[#98512e]">
              {waitingGames.length} Open
            </span>
          </div>

          {waitingGames.length === 0 ? (
            <Card className="surreal-card p-8 text-center space-y-2">
              <p className="text-xs text-[var(--rail-text-muted)]">
                No pending challenges on this train currently. Create a
                challenge to get matched!
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {waitingGames.map((game) => (
                <Card
                  key={game.id}
                  data-testid={`challenge-card-${game.id}`}
                  data-host-handle={game.player_1_handle}
                  className="surreal-card p-4 flex items-center justify-between gap-4 hover:border-[#E5B254] transition-all"
                >
                  <div className="flex items-center gap-3">
                    <Avatar handle={game.player_1_handle} size="sm" />
                    <div>
                      <span
                        className="font-bold text-xs text-[var(--rail-text)]"
                        data-testid="challenge-host"
                      >
                        {game.player_1_handle ?? "Passenger"}
                      </span>
                      <p className="text-[11px] text-[var(--rail-text-muted)] capitalize font-medium">
                        {game.game_type === "connectfour"
                          ? "Connect Four"
                          : "Tic-Tac-Toe"}{" "}
                        Challenge
                      </p>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="royal"
                    data-testid={`accept-challenge-${game.id}`}
                    onClick={() => handleJoinGame(game.id)}
                    className="border border-[#E5B254]/40 shadow-md"
                    leftIcon={<Play className="h-3.5 w-3.5" />}
                  >
                    Accept Challenge
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Live Matches In Progress (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[var(--rail-text)] flex items-center gap-2">
              <Trophy className="h-4 w-4 text-[var(--rail-text)]" />
              Live Matches In Progress
            </h3>
            <span className="text-xs font-semibold text-[#98512e]">
              {activeGames.length} Active
            </span>
          </div>

          {activeGames.length === 0 ? (
            <Card className="surreal-card p-8 text-center space-y-2">
              <p className="text-xs text-[var(--rail-text-muted)]">
                No games actively running right now. Join an open challenge or
                start a new game!
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {activeGames.map((game) => (
                <Card
                  key={game.id}
                  className="surreal-card p-4 flex items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-[var(--rail-text)]">
                      <span>{game.player_1_handle}</span>
                      <span className="text-[var(--rail-text)] font-semibold">
                        VS
                      </span>
                      <span>{game.player_2_handle ?? "Opponent"}</span>
                    </div>
                    <p className="text-[11px] text-[var(--rail-text-muted)] capitalize mt-0.5">
                      {game.game_type} · Turn:{" "}
                      <span className="font-semibold text-[#98512e]">
                        {game.current_turn_handle}
                      </span>
                    </p>
                  </div>
                  <ButtonLink
                    href={`/games/${game.id}`}
                    size="xs"
                    variant="outline"
                    className="border-[#E5B254]/30 text-[#98512e]"
                  >
                    View Board
                  </ButtonLink>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Game Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Game Challenge"
        description="Choose a game mode to challenge fellow travellers on your train."
      >
        <div className="space-y-5 pt-2">
          {error && (
            <ErrorBanner
              message={error}
              variant="subtle"
              onDismiss={() => setError("")}
            />
          )}
          {!selectedJourneyId && (
            <div className="rounded-xl border border-amber-200 bg-[#f2e7d3] p-3 text-xs text-amber-900 space-y-2">
              <p className="font-semibold">
                {authenticated
                  ? "Board a train journey first to challenge co-passengers."
                  : "Sign in and board a train journey to host a multiplayer challenge."}
              </p>
              <Link
                href={authenticated ? "/journeys/new" : "/login?next=/games"}
                className="inline-block font-bold text-[#3155E7] hover:underline"
              >
                {authenticated ? "Add a Journey →" : "Sign In to Continue →"}
              </Link>
            </div>
          )}

          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--rail-text)]">
              Select Game Mode
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setGameType("tictactoe")}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  gameType === "tictactoe"
                    ? "border-[#E5B254] bg-[var(--rail-surface)]/20 shadow-md"
                    : "border-[var(--rail-border)] bg-[var(--rail-surface)] hover:border-[#E5B254]/50"
                }`}
              >
                <Grid className="h-5 w-5 text-[#98512e] mb-2" />
                <span className="font-bold text-sm text-[var(--rail-text)] block">
                  Tic-Tac-Toe
                </span>
                <span className="text-xs text-[var(--rail-text-muted)]">
                  Fast 3x3 match
                </span>
              </button>

              <button
                type="button"
                onClick={() => setGameType("connectfour")}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  gameType === "connectfour"
                    ? "border-[#E5B254] bg-[var(--rail-surface)]/30 shadow-md"
                    : "border-[var(--rail-border)] bg-[var(--rail-surface)] hover:border-[#E5B254]/50"
                }`}
              >
                <CircleDot className="h-5 w-5 text-indigo-300 mb-2" />
                <span className="font-bold text-sm text-[var(--rail-text)] block">
                  Connect Four
                </span>
                <span className="text-xs text-[var(--rail-text-muted)]">
                  7-column strategy
                </span>
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-[#E5E7EB] flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="royal"
              disabled={creating || !selectedJourneyId}
              isLoading={creating}
              onClick={handleCreateGame}
            >
              Launch Challenge
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function GamesPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center animate-pulse space-y-4">
          <div className="h-6 w-32 mx-auto rounded bg-[#EEF2FF]" />
          <div className="h-64 rounded-3xl bg-white border border-[#E5E7EB]" />
        </div>
      }
    >
      <GamesContent />
    </Suspense>
  );
}
