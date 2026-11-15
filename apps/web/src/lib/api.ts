export type ApiError = { error: { code: string; message: string } };
export class ApiRequestError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly code?: string,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}
let refreshing: Promise<boolean> | null = null;
async function refreshSession(): Promise<boolean> {
  if (refreshing) return refreshing;
  const renew = async () => {
    // A different tab may already have refreshed the shared HttpOnly cookies.
    const current = await fetch("/api/v1/auth/session", {
      credentials: "include",
      cache: "no-store",
    })
      .then((r) => r.json())
      .catch(() => null);
    if (current?.authenticated) return true;
    if (!current?.can_refresh) return false;
    return fetch("/api/v1/auth/refresh", {
      method: "POST",
      credentials: "include",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    })
      .then((r) => r.ok)
      .catch(() => false);
  };
  const locks = typeof navigator !== "undefined" ? navigator.locks : undefined;
  const task = (async () =>
    locks
      ? await locks.request("railbandhan-session-refresh", renew)
      : await renew())();
  refreshing = task.finally(() => {
    refreshing = null;
  });
  return refreshing;
}
export async function apiFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const headers = new Headers(options?.headers);
  if (
    !(options?.body instanceof FormData) &&
    options?.body &&
    !headers.has("Content-Type")
  )
    headers.set("Content-Type", "application/json");
  const init: RequestInit = {
    ...options,
    credentials: "include",
    cache: "no-store",
    headers,
  };
  let res = await fetch(`/api/v1${path}`, init);
  if (
    res.status === 401 &&
    !path.startsWith("/auth/") &&
    (await refreshSession())
  )
    res = await fetch(`/api/v1${path}`, init);
  const text = await res.text();
  let body: any;
  try {
    body = text ? JSON.parse(text) : undefined;
  } catch {
    throw new ApiRequestError(
      res.status,
      "The server returned an unexpected response. Please try again.",
    );
  }
  if (!res.ok)
    throw new ApiRequestError(
      res.status,
      body?.error?.message || res.statusText,
      body?.error?.code,
    );
  // Restore an expired browser session during public-page session checks too.
  if (
    path === "/auth/session" &&
    !body?.authenticated &&
    body?.can_refresh &&
    (await refreshSession())
  )
    return apiFetch<T>(path, options);
  return body as T;
}
export async function apiUpload<T>(
  path: string,
  formData: FormData,
): Promise<T> {
  return apiFetch<T>(path, { method: "POST", body: formData });
}
export const isForbidden = (error: unknown) =>
  error instanceof ApiRequestError && error.status === 403;
