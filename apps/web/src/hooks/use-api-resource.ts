"use client";
import { apiFetch } from "@/lib/api";
import { formatErrorMessage } from "@/lib/format-error";
import { useCallback, useEffect, useState } from "react";
/** Request-scoped state with cancellation and explicit retry; no private data in storage. */
export function useApiResource<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null),
    [loading, setLoading] = useState(!!path),
    [error, setError] = useState(""),
    [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision((n) => n + 1), []);
  useEffect(() => {
    if (!path) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError("");
    apiFetch<T>(path, { signal: controller.signal })
      .then((value) => {
        if (!controller.signal.aborted) setData(value);
      })
      .catch((e) => {
        if (!controller.signal.aborted)
          setError(
            formatErrorMessage(
              e,
              "We couldn’t load this right now. Please try again.",
            ),
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [path, revision]);
  return { data, loading, error, refresh };
}
