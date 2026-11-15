"use client";
import { AlertCircle, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export default function AppRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.warn("App route recovery event:", error?.message);
    }
  }, [error]);

  return (
    <div className="w-full max-w-lg mx-auto py-12 px-4 text-center space-y-6">
      <div className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-[#1a1412] border border-[#e8dfcf] dark:border-[#382822] shadow-sm space-y-5 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fff2ea] dark:bg-[#331c15] text-[#96361c] dark:text-[#f2947d] border border-[#e5b9a8] dark:border-[#522b20]">
          <AlertCircle className="h-7 w-7" />
        </div>

        <div className="space-y-2">
          <span className="rb-eyebrow text-xs font-semibold tracking-wider text-[#8c4b2d] dark:text-[#dca08e]">
            A BRIEF DELAY ON THIS TRACK • मार्ग में अल्प विराम
          </span>
          <h2 className="rb-screen-heading font-display text-2xl font-bold tracking-tight text-[#1f1a17] dark:text-[#f5efe6]">
            This compartment couldn’t load.
          </h2>
          <p className="text-xs sm:text-sm text-[#665e55] dark:text-[#a89e94] leading-relaxed max-w-md mx-auto">
            Something interrupted this view. You can reload this section or head
            back to your train lounge.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={reset}
            className="rb-button w-full sm:w-auto inline-flex items-center justify-center gap-2"
          >
            <RotateCcw size={16} />
            Try again
          </button>
          <Link
            href="/home"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-[#d6cbba] dark:border-[#45332c] hover:bg-[#faf7f2] dark:hover:bg-[#261c18] text-xs font-semibold text-[#1f1a17] dark:text-[#f5efe6] transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
