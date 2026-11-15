"use client";
import React from "react";
import { AlertCircle, RotateCcw, X } from "lucide-react";

export interface ErrorBannerProps {
  /** The error message string to display */
  message?: string | null;
  /** Optional title for the alert */
  title?: string;
  /** Optional callback to retry the failed action */
  onRetry?: () => void;
  /** Optional callback to dismiss the alert */
  onDismiss?: () => void;
  /** Optional className for custom layout positioning */
  className?: string;
  /** Layout style variant */
  variant?: "inline" | "card" | "subtle";
}

/**
 * An editorial error banner designed in the warm terracotta & paper aesthetic
 * of RailBandhan. Replaces harsh red alerts with graceful, supportive guidance.
 */
export function ErrorBanner({
  message,
  title,
  onRetry,
  onDismiss,
  className = "",
  variant = "inline",
}: ErrorBannerProps) {
  if (!message) return null;

  if (variant === "subtle") {
    return (
      <div
        role="alert"
        aria-live="polite"
        className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-[#fff2ea] dark:bg-[#2b1812] border border-[#f0c8b8] dark:border-[#522b20] text-xs text-[#8c3218] dark:text-[#f4a894] transition-all animate-in fade-in duration-200 ${className}`}
      >
        <AlertCircle className="h-4 w-4 shrink-0 text-[#b54628] dark:text-[#ea7252]" />
        <span className="flex-1 leading-relaxed">{message}</span>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1 font-semibold text-[#8c3218] dark:text-[#f4a894] hover:underline shrink-0 ml-1"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Retry</span>
          </button>
        )}
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss error"
            className="text-[#b54628]/70 hover:text-[#b54628] dark:text-[#ea7252]/70 dark:hover:text-[#ea7252] shrink-0 p-0.5 rounded"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div
        role="alert"
        aria-live="assertive"
        className={`p-5 rounded-2xl bg-gradient-to-br from-[#fff4ee] to-[#faebe3] dark:from-[#261510] dark:to-[#1f110c] border border-[#e8b9a7] dark:border-[#4d251a] shadow-sm text-left space-y-3 transition-all animate-in fade-in duration-200 ${className}`}
      >
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-xl bg-[#fae2d6] dark:bg-[#3d1e16] text-[#9c391c] dark:text-[#f49b82] border border-[#e5a995] dark:border-[#5a2a1d] flex items-center justify-center shrink-0">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-[#7a2b15] dark:text-[#f7b6a4] tracking-tight">
              {title || "A Momentary Pause on This Route"}
            </h4>
            <p className="text-xs text-[#8c3820] dark:text-[#dba090] mt-0.5 leading-relaxed">
              {message}
            </p>
          </div>
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Dismiss message"
              className="text-[#9c391c]/70 hover:text-[#9c391c] dark:text-[#f49b82]/70 dark:hover:text-[#f49b82] p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {onRetry && (
          <div className="pt-1 flex items-center gap-3">
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#9c391c] text-[#fff8f5] hover:bg-[#852f15] text-xs font-semibold shadow-xs transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Try Again</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // Default inline variant
  return (
    <div
      role="alert"
      aria-live="polite"
      className={`flex items-start gap-3 p-3.5 rounded-xl bg-[#fff2ea] dark:bg-[#2b1812] border border-[#eec5b4] dark:border-[#522b20] text-xs text-[#8a331a] dark:text-[#f5a692] shadow-xs transition-all animate-in fade-in duration-200 ${className}`}
    >
      <AlertCircle className="h-4 w-4 shrink-0 text-[#b34426] dark:text-[#ea7252] mt-0.5" />
      <div className="flex-1 leading-relaxed">
        {title && (
          <strong className="block font-semibold mb-0.5 text-[#732813] dark:text-[#f8bcae]">
            {title}
          </strong>
        )}
        <span>{message}</span>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1 font-semibold text-[#8a331a] dark:text-[#f5a692] hover:underline shrink-0 ml-1 py-0.5"
        >
          <RotateCcw className="h-3 w-3" />
          <span>Try again</span>
        </button>
      )}
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss error"
          className="text-[#b34426]/70 hover:text-[#b34426] dark:text-[#ea7252]/70 dark:hover:text-[#ea7252] shrink-0 p-0.5 rounded"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
