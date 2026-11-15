"use client";
import { RotateCcw } from "lucide-react";
import Link from "next/link";
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen grid place-items-center p-8">
      <div className="rb-empty-state max-w-lg">
        <span className="rb-eyebrow">A BRIEF PAUSE IN THE JOURNEY</span>
        <h1 className="rb-screen-heading my-5">Let’s get you back on track.</h1>
        <p>
          Something didn’t load as expected. Try again, or return to the home
          page.
        </p>
        <button className="rb-button" onClick={reset}>
          <RotateCcw size={16} />
          Try again
        </button>
        <p className="mt-5">
          <Link href="/home">Back to RailBandhan</Link>
        </p>
      </div>
    </main>
  );
}
