"use client";

import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { ErrorBanner } from "@/components/ui/error-banner";
import { apiFetch } from "@/lib/api";
import { formatErrorMessage } from "@/lib/format-error";
import type { GameSession } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ArrowLeft, Dice5 } from "lucide-react";
import { use, useEffect, useRef, useState } from "react";

type LudoBoard = {
  players?: {
    color: string;
    is_you: boolean;
    tokens: {
      id: number;
      position: number;
      stepCount: number;
      isHome: boolean;
    }[];
  }[];
  diceRoll?: number | null;
  mustRoll?: boolean;
};

export default function GameSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [game, setGame] = useState<GameSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const mutation = useRef(0);

  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    async function load() {
      const revision = mutation.current;
      try {
        const data = await apiFetch<{ game: GameSession }>(`/games/${id}`, {
          signal: controller.signal,
        });
        if (!controller.signal.aborted && revision === mutation.current) {
          setGame(data.game);
          setError("");
        }
      } catch (e) {
        if (!controller.signal.aborted)
          setError(
            formatErrorMessage(e, "Unable to refresh the match coordinates."),
          );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          timer = setTimeout(load, 4000);
        }
      }
    }
    setGame(null);
    setLoading(true);
    load();
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [id]);

  async function send(
    action: "join" | "move",
    move?: Record<string, number | string>,
  ) {
    if (busy) return;
    setBusy(true);
    setError("");
    mutation.current++;
    try {
      const data = await apiFetch<{ game: GameSession }>(
        `/games/${id}/${action}`,
        {
          method: "POST",
          ...(move ? { body: JSON.stringify({ move }) } : {}),
        },
      );
      setGame(data.game);
    } catch (e) {
      setError(
        formatErrorMessage(e, "The move could not be saved. Please try again."),
      );
    } finally {
      mutation.current++;
      setBusy(false);
    }
  }

  const active = game?.status === "in_progress";
  const yourTurn = Boolean(active && game?.is_your_turn && !busy);
  const board = game?.board_state as
    { grid?: (string | null)[]; columns?: (string | null)[][] } | undefined;
  const ludo = game?.state as LudoBoard | undefined;
  const you = ludo?.players?.find((player) => player.is_you);
  const name =
    game?.kind === "ludo"
      ? "Ludo"
      : game?.kind === "connect_four"
        ? "Connect Four"
        : "Tic-Tac-Toe";
  const status =
    game?.status === "waiting"
      ? "Waiting for a fellow traveller"
      : game?.status === "draw"
        ? "A well-played draw"
        : game?.status === "completed"
          ? game.you_won
            ? "You won this round"
            : `${game.winner_handle ?? "Your opponent"} won this round`
          : game?.is_your_turn
            ? "Your turn"
            : `${game?.current_turn_handle ?? "Your opponent"}’s turn`;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-7">
      <ButtonLink
        href="/games"
        variant="ghost"
        leftIcon={<ArrowLeft className="h-4 w-4" />}
      >
        Games lounge
      </ButtonLink>
      <header className="space-y-3">
        <p className="eyebrow">A little play. A longer friendship.</p>
        <h1 className="font-display text-4xl sm:text-6xl">
          {loading ? "Setting the table…" : name}
        </h1>
        <p className="text-[var(--rail-text-muted)]">
          Play with people on your journey. Moves are checked and saved by the
          server.
        </p>
      </header>
      {error && (
        <ErrorBanner
          message={error}
          onDismiss={() => setError("")}
          className="mb-4"
        />
      )}
      {loading ? (
        <Card className="p-12 text-center" aria-busy="true">
          Opening your match…
        </Card>
      ) : !game ? (
        <Card className="p-8">
          This match is unavailable. Return to the lounge to choose another
          game.
        </Card>
      ) : (
        <>
          <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
            <div>
              <p className="text-xs uppercase tracking-widest text-[var(--rail-text-muted)]">
                {game.player_count ?? 0} players · Your mark:{" "}
                {game.your_mark ?? "spectator"}
              </p>
              <p className="mt-2 font-medium" role="status" aria-live="polite">
                {status}
              </p>
            </div>
            {game.status === "waiting" && !game.is_player && (
              <Button disabled={busy} onClick={() => send("join")}>
                Join this match
              </Button>
            )}
          </Card>
          {(active ||
            game.status === "completed" ||
            game.status === "draw") && (
            <div className="flex justify-center">
              {game.kind === "tic_tac_toe" && (
                <div
                  className="grid w-full max-w-sm grid-cols-3 gap-3"
                  role="group"
                  aria-label="Tic-Tac-Toe board"
                >
                  {(board?.grid ?? Array(9).fill(null)).map((cell, index) => (
                    <button
                      key={index}
                      type="button"
                      className={cn(
                        "aspect-square rounded-2xl border border-[var(--rail-border)] bg-[var(--rail-surface)] text-4xl font-semibold transition-colors hover:bg-[var(--rail-surface-soft)]",
                        cell === "X"
                          ? "text-[var(--rail-terracotta)]"
                          : "text-[var(--rail-forest)]",
                      )}
                      aria-label={`Row ${Math.floor(index / 3) + 1}, column ${(index % 3) + 1}: ${cell || "empty"}`}
                      disabled={!yourTurn || Boolean(cell)}
                      onClick={() => send("move", { index })}
                    >
                      {cell}
                    </button>
                  ))}
                </div>
              )}
              {game.kind === "connect_four" && (
                <div className="w-full max-w-lg space-y-3">
                  <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: 7 }, (_, column) => (
                      <button
                        key={column}
                        type="button"
                        className="min-h-11 rounded-xl border border-[var(--rail-border)] bg-[var(--rail-surface)]"
                        aria-label={`Drop in column ${column + 1}`}
                        disabled={
                          !yourTurn ||
                          (board?.columns?.[column]?.length ?? 0) >= 6
                        }
                        onClick={() => send("move", { column })}
                      >
                        ↓
                      </button>
                    ))}
                  </div>
                  <div
                    className="grid grid-cols-7 gap-2 rounded-2xl bg-[var(--rail-forest)] p-3"
                    role="img"
                    aria-label="Connect Four board. Your mark and turn are shown above."
                  >
                    {Array.from({ length: 42 }, (_, index) => {
                      const row = Math.floor(index / 7),
                        column = index % 7,
                        mark = board?.columns?.[column]?.[5 - row];
                      return (
                        <span
                          key={index}
                          className={cn(
                            "flex aspect-square items-center justify-center rounded-full text-sm font-bold",
                            mark === "X"
                              ? "bg-[#e9ba72] text-[#192c2d]"
                              : mark === "O"
                                ? "bg-[#f7f5ef] text-[#192c2d]"
                                : "bg-black/25 text-white",
                          )}
                          aria-label={`Row ${row + 1}, column ${column + 1}: ${mark ?? "empty"}`}
                        >
                          {mark ?? ""}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
              {game.kind === "ludo" && (
                <Card className="w-full max-w-xl space-y-6 p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="eyebrow">The dice is server rolled</p>
                      <p className="mt-2 text-2xl">
                        {ludo?.diceRoll
                          ? `Rolled ${ludo.diceRoll}`
                          : "Ready for the next roll"}
                      </p>
                    </div>
                    <Button
                      disabled={!yourTurn || !ludo?.mustRoll}
                      leftIcon={<Dice5 className="h-4 w-4" />}
                      onClick={() => send("move", { action: "roll" })}
                    >
                      Roll dice
                    </Button>
                  </div>
                  <p className="text-sm text-[var(--rail-text-muted)]">
                    Roll a six to leave the yard. Move all four tokens home.
                    Choose a token after rolling.
                  </p>
                  {ludo?.players?.map((player) => (
                    <div key={player.color} className="space-y-2">
                      <p className="text-sm font-medium capitalize">
                        {player.color}
                        {player.is_you ? " · You" : " · Fellow traveller"}
                      </p>
                      <div className="grid grid-cols-4 gap-2">
                        {player.tokens.map((token) => {
                          const legal = Boolean(
                            yourTurn &&
                            player.is_you &&
                            !ludo.mustRoll &&
                            ludo.diceRoll &&
                            !token.isHome &&
                            (token.position === -1
                              ? ludo.diceRoll === 6
                              : token.stepCount + ludo.diceRoll <= 57),
                          );
                          return (
                            <button
                              key={token.id}
                              type="button"
                              disabled={!legal}
                              onClick={() =>
                                send("move", {
                                  action: "move",
                                  tokenId: token.id,
                                })
                              }
                              className="rounded-xl border border-[var(--rail-border)] bg-[var(--rail-surface-soft)] p-3 text-center"
                            >
                              <span className="block text-sm font-medium">
                                Token {token.id + 1}
                              </span>
                              <span className="mt-1 block text-xs">
                                {token.isHome
                                  ? "Home"
                                  : token.position === -1
                                    ? "Yard"
                                    : `Step ${token.stepCount}/57`}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </Card>
              )}
            </div>
          )}
          {(game.status === "completed" || game.status === "draw") && (
            <Card className="space-y-4 p-8 text-center">
              <p className="font-display text-3xl">{status}</p>
              <ButtonLink href="/games">Find another match</ButtonLink>
            </Card>
          )}
          <p className="text-center text-xs text-[var(--rail-text-muted)]">
            Match updates refresh every four seconds while this page is open.
          </p>
        </>
      )}
    </div>
  );
}
