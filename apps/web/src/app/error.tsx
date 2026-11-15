"use client";
import { Compass, RotateCcw, TrainFront } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Keep error logging clean and internal; never display stack traces to passengers
    if (process.env.NODE_ENV !== "production") {
      console.warn("Recoverable navigation pause:", error?.message);
    }
  }, [error]);

  return (
    <main className="min-h-screen grid place-items-center p-6 bg-[#f7f4ee] text-[#1f1a17]">
      <div className="rb-empty-state max-w-lg p-8 sm:p-10 rounded-3xl bg-white border border-[#e8dfcf] shadow-sm text-center space-y-6">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fff2ea] text-[#96361c] border border-[#e5b9a8]">
          <Compass className="h-7 w-7 animate-spin-slow" />
        </div>

        <div className="space-y-2">
          <span className="rb-eyebrow tracking-widest text-xs font-semibold text-[#8c4b2d]">
            A BRIEF PAUSE IN THE JOURNEY • विराम
          </span>
          <h1 className="rb-screen-heading font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#1f1a17]">
            Let’s get you back on track.
          </h1>
          <p className="text-sm text-[#665e55] leading-relaxed max-w-md mx-auto">
            This section met an unexpected delay while loading. Take a breath,
            retry this stop, or return to your journey lounge.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            className="rb-button w-full sm:w-auto inline-flex items-center justify-center gap-2"
            onClick={reset}
          >
            <RotateCcw size={16} />
            Try again
          </button>
          <Link
            href="/home"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-[#d6cbba] hover:bg-[#faf7f2] text-xs font-semibold text-[#1f1a17] transition-colors"
          >
            <TrainFront size={15} />
            Back to RailBandhan
          </Link>
        </div>
      </div>
    </main>
  );
}
