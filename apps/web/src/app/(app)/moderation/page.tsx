"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorBanner } from "@/components/ui/error-banner";
import { apiFetch, isForbidden } from "@/lib/api";
import { formatErrorMessage } from "@/lib/format-error";
import type { ModerationReport } from "@/lib/types";
import { useEffect, useState } from "react";

export default function ModerationPage() {
  const [reports, setReports] = useState<ModerationReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);

  async function load() {
    setErrorMsg(null);
    setForbidden(false);
    try {
      const data = await apiFetch<{ reports: ModerationReport[] }>(
        "/moderation/reports",
      );
      setReports(data.reports ?? []);
    } catch (err) {
      setReports([]);
      if (isForbidden(err)) {
        setForbidden(true);
      } else {
        setErrorMsg(
          formatErrorMessage(err, "Failed to load moderation queue."),
        );
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleResolve(
    reportId: string,
    action: "resolve" | "dismiss",
  ) {
    setActing(reportId);
    setErrorMsg(null);
    try {
      await apiFetch("/moderation/reports", {
        method: "PATCH",
        body: JSON.stringify({
          report_id: reportId,
          status: action === "resolve" ? "resolved" : "dismissed",
          resolution:
            action === "resolve"
              ? "Resolved by moderator"
              : "Dismissed by moderator",
        }),
      });
      await load();
    } catch (err) {
      setErrorMsg(formatErrorMessage(err, "Failed to update report."));
    } finally {
      setActing(null);
    }
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E5E7EB]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="royal" className="text-[11px]">
              Safety Administration
            </Badge>
            <Badge variant="signal" dot className="text-[11px]">
              Active Moderation
            </Badge>
          </div>
          <h1 className="rb-screen-heading text-2xl sm:text-3xl font-semibold tracking-tight text-[#111318]">
            Moderation & Safety Queue
          </h1>
          <p className="text-sm text-[#666B78] mt-0.5">
            Review reported co-passengers and messages to enforce RailBandhan
            safe lounge guidelines.
          </p>
        </div>
      </div>

      {errorMsg && (
        <ErrorBanner
          message={errorMsg}
          onDismiss={() => setErrorMsg(null)}
          variant="subtle"
        />
      )}

      {loading ? (
        <div className="space-y-4">
          <div className="h-32 rounded-2xl bg-white border border-[#E5E7EB] animate-pulse" />
          <div className="h-32 rounded-2xl bg-white border border-[#E5E7EB] animate-pulse" />
        </div>
      ) : forbidden ? (
        <EmptyState
          icon="compass"
          title="Moderator access required"
          description="Only designated safety moderators and administrators can review passenger safety reports."
          actionHref="/home"
          actionLabel="Back to Home"
        />
      ) : reports.length === 0 ? (
        <EmptyState
          icon="compass"
          title="Moderation queue is clean"
          description="No pending passenger or message reports. All train lounges are operating peacefully and safely."
        />
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <Card
              key={report.id}
              className="p-6 bg-white border-[#E5E7EB] shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <Badge variant="delay">{report.reason}</Badge>
                  <Badge
                    variant={report.status === "open" ? "signal" : "muted"}
                  >
                    {report.status}
                  </Badge>
                  <span className="text-xs text-[#666B78]">
                    Target Type:{" "}
                    <strong className="text-[#111318] capitalize font-bold">
                      {report.target_type}
                    </strong>
                  </span>
                </div>
                <time className="text-xs font-mono text-[#94A3B8]">
                  {new Date(report.created_at).toLocaleDateString()}
                </time>
              </div>

              {report.details && (
                <p className="text-xs text-[#111318] bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E5E7EB] leading-relaxed">
                  <strong className="text-[#666B78]">Report Details:</strong>{" "}
                  {report.details}
                </p>
              )}

              <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-between gap-3 flex-wrap">
                <span className="text-xs text-[#666B78]">
                  Filed by passenger:{" "}
                  <span className="font-mono font-bold text-[#111318]">
                    {report.reporter_handle || "Anonymous"}
                  </span>
                </span>

                {report.status === "open" ? (
                  <div className="flex gap-2.5">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={acting === report.id}
                      onClick={() => handleResolve(report.id, "dismiss")}
                    >
                      Dismiss Report
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      disabled={acting === report.id}
                      isLoading={acting === report.id}
                      onClick={() => handleResolve(report.id, "resolve")}
                    >
                      Take Action
                    </Button>
                  </div>
                ) : (
                  <span className="text-xs font-medium text-[#666B78]">
                    {report.resolution || `Marked as ${report.status}`}
                  </span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
