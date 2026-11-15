"use client";
import { ErrorBanner } from "@/components/ui/error-banner";
import { apiFetch } from "@/lib/api";
import { formatErrorMessage } from "@/lib/format-error";
import { Clock3, MapPin, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
type Status = {
  status: string;
  confidence?: string;
  data_source?: string;
  last_updated?: string;
  observed_at?: string;
  delay_minutes?: number | null;
  progress_percent?: number;
  current_station?: { name: string; code: string } | null;
  next_station?: { name: string; code: string } | null;
  stations?: {
    code: string;
    name: string;
    eta?: string | null;
    status?: string;
  }[];
};
function time(value?: string | null) {
  if (!value || !Number.isFinite(Date.parse(value))) return "Not available";
  return new Date(value).toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
  });
}
export function LivePanel({ journeyId }: { journeyId: string }) {
  const [status, setStatus] = useState<Status | null>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let active = false;
    async function load() {
      if (document.hidden || active) return;
      active = true;
      try {
        const data = await apiFetch<Status>(`/journeys/${journeyId}/status`, {
          signal: controller.signal,
        });
        if (!controller.signal.aborted) {
          setStatus(data);
          setError("");
        }
      } catch (e) {
        if (!controller.signal.aborted)
          setError(
            formatErrorMessage(
              e,
              "Live running coordinates could not be refreshed right now. The last recorded status remains visible below.",
            ),
          );
      } finally {
        active = false;
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    const interval = setInterval(() => void load(), 30000);
    const visible = () => {
      if (!document.hidden) void load();
    };
    document.addEventListener("visibilitychange", visible);
    return () => {
      clearInterval(interval);
      controller.abort();
      document.removeEventListener("visibilitychange", visible);
    };
  }, [journeyId, revision]);
  if (loading)
    return (
      <div className="rb-loading" role="status">
        Checking the journey’s running status…
      </div>
    );
  if (!status)
    return (
      <div className="rb-empty-state">
        <MapPin size={29} className="mx-auto" />
        <h3>Waiting for a reliable update.</h3>
        <p>{error || "No running status is available for this journey yet."}</p>
        <button
          className="rb-button"
          onClick={() => {
            setLoading(true);
            setRevision((n) => n + 1);
          }}
        >
          Try again <RefreshCw size={16} />
        </button>
      </div>
    );
  const estimated = !["live", "cached"].includes(status.confidence || "");
  const progress = Math.min(100, Math.max(0, status.progress_percent || 0));
  return (
    <div className="space-y-6">
      {error && (
        <ErrorBanner
          message={error}
          title="Telemetry Update Paused"
          onRetry={() => setRevision((r) => r + 1)}
          onDismiss={() => setError("")}
          variant="subtle"
        />
      )}
      <div className="rb-ui-card p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="rb-eyebrow">
              {estimated ? "TIMETABLE ESTIMATE" : "PROVIDER RUNNING STATUS"}
            </span>
            <h2 className="font-display text-3xl font-normal mt-3">
              {estimated
                ? "A sense of where you are."
                : "Your journey, as reported."}
            </h2>
            <p className="text-xs text-[var(--rail-text-muted)] mt-3">
              {estimated
                ? "This is a schedule-based estimate, not a GPS observation. Check official railway information before making travel decisions."
                : `Source: ${status.data_source}. Observation: ${time(status.observed_at || status.last_updated)} IST.`}
            </p>
          </div>
          <button
            className="rb-icon-button"
            aria-label="Refresh running status"
            onClick={() => setRevision((n) => n + 1)}
          >
            <RefreshCw size={17} />
          </button>
        </div>
        <div className="grid sm:grid-cols-3 gap-6 mt-8 py-6 border-y border-[var(--rail-border)]">
          <div>
            <span className="rb-eyebrow">
              {estimated ? "ESTIMATED NEAR" : "LAST REPORTED NEAR"}
            </span>
            <p className="text-lg mt-2">
              {status.current_station?.name || "Not available"}
            </p>
          </div>
          <div>
            <span className="rb-eyebrow">NEXT SCHEDULED STOP</span>
            <p className="text-lg mt-2">
              {status.next_station?.name || "No further stop reported"}
            </p>
          </div>
          <div>
            <span className="rb-eyebrow">
              {estimated ? "PROGRESS MODEL" : "REPORTED STATUS"}
            </span>
            <p className="text-lg mt-2 capitalize">
              {estimated
                ? "Based on the timetable"
                : status.status.replaceAll("_", " ")}
            </p>
          </div>
        </div>
        <div className="flex justify-between text-xs text-[var(--rail-text-muted)] mt-6 mb-3">
          <span>
            {estimated ? "Estimated route progress" : "Reported route progress"}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <progress
          value={progress}
          max={100}
          className="w-full h-2 accent-[#24483f]"
          aria-label={
            estimated ? "Estimated route progress" : "Reported route progress"
          }
        />
        <p className="text-xs text-[var(--rail-text-muted)] mt-3">
          Source: {status.data_source || "Not available"} · Updated{" "}
          {time(status.last_updated)} IST
        </p>
      </div>
      <div className="rb-ui-card p-6 sm:p-8">
        <span className="rb-eyebrow">BETWEEN THE FIRST STOP AND THE LAST</span>
        <h3 className="font-display text-2xl font-normal mt-3 mb-6">
          The route ahead.
        </h3>
        <ol className="space-y-0">
          {(status.stations || []).map((s, i) => (
            <li
              key={`${s.code}-${i}`}
              className="relative flex gap-4 pb-7 last:pb-0"
            >
              <div className="flex flex-col items-center">
                <span
                  className={`h-3 w-3 rounded-full mt-1.5 shrink-0 ${s.status === "current" ? "bg-[#b84e2c]" : "border-2 border-[#9eac91] bg-[#f7f5ef]"}`}
                />
                {i < (status.stations?.length || 0) - 1 && (
                  <span className="w-px flex-1 bg-[#dce1d2] absolute top-5 bottom-0 left-1.5" />
                )}
              </div>
              <div className="flex-1 flex flex-wrap justify-between gap-2">
                <div>
                  <p className="font-medium text-sm">{s.name}</p>
                  <p className="text-xs text-[var(--rail-text-muted)] mt-1">
                    {s.code} ·{" "}
                    {estimated
                      ? "Scheduled route stop"
                      : s.status === "passed"
                        ? "Passed"
                        : s.status === "current"
                          ? "Current reported stop"
                          : "Upcoming stop"}
                  </p>
                </div>
                <span className="text-xs text-[var(--rail-text-muted)] flex items-start gap-2">
                  <Clock3 size={14} />
                  {time(s.eta)}
                  {s.eta ? " IST" : ""}
                </span>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
