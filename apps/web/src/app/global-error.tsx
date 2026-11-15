"use client";
import { Compass, RotateCcw } from "lucide-react";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-[#f7f4ee] text-[#1f1a17] min-h-screen grid place-items-center p-6 font-sans">
        <div className="max-w-md w-full p-8 sm:p-10 rounded-3xl bg-white border border-[#e8dfcf] shadow-sm text-center space-y-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fff2ea] text-[#96361c] border border-[#e5b9a8]">
            <Compass className="h-7 w-7" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-semibold tracking-widest text-[#8c4b2d] uppercase">
              Momentary Delay • यात्रा विश्राम
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-[#1f1a17]">
              Let’s get you back on track.
            </h1>
            <p className="text-sm text-[#665e55] leading-relaxed">
              We encountered a brief interruption while loading the platform.
              Please try again to resume your journey.
            </p>
          </div>

          <div className="pt-2 flex justify-center">
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#96361c] hover:bg-[#7e2c16] text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <RotateCcw size={16} />
              Resume Journey
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
