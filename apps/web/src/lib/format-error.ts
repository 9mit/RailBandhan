import { ApiRequestError } from "./api";

/**
 * Transforms any error, exception, or API failure into a graceful,
 * human-readable message styled in the warm, reassuring tone of RailBandhan.
 * Never leaks raw technical jargon, stack traces, or cold HTTP status strings.
 */
export function formatErrorMessage(
  error: unknown,
  fallback = "Something didn’t load as expected. Please try again shortly.",
): string {
  if (!error) return fallback;

  // Handle ApiRequestError with status codes and application error codes
  if (error instanceof ApiRequestError) {
    if (error.code === "network_error" || error.status === 0) {
      return "Unable to connect right now. Please check your internet connection and try again.";
    }

    if (error.status === 401 || error.code === "unauthorized") {
      return "Your session has ended. Please sign in again to continue your journey.";
    }

    if (error.status === 403 || error.code === "forbidden") {
      return "You do not currently have access to this train compartment or private corridor.";
    }

    if (error.status === 404 || error.code === "not_found") {
      return "We couldn’t find the requested station, train, or record on this route.";
    }

    if (error.status === 409 || error.code === "conflict") {
      // Clean up common duplicate/conflict messages
      const msg = error.message.toLowerCase();
      if (msg.includes("handle") || msg.includes("username")) {
        return "That passenger handle is already in use. Please pick another one.";
      }
      if (msg.includes("email")) {
        return "An account with this email address already exists. Try signing in.";
      }
      if (msg.includes("journey") || msg.includes("already")) {
        return "You have already boarded or joined this train journey.";
      }
      return "This record already exists. Please verify your details.";
    }

    if (error.status === 413 || error.code === "payload_too_large") {
      return "The ticket file is too large. Please choose a file smaller than 8 MB.";
    }

    if (error.status === 429 || error.code === "rate_limited") {
      return "You’re moving a little fast. Please take a brief pause and try again in a moment.";
    }

    if (
      error.status >= 500 ||
      error.code === "internal" ||
      error.code === "unavailable"
    ) {
      return "Our railway servers are experiencing a brief delay. Please try again in a few moments.";
    }

    // If message is clean human text, format and return it
    if (error.message && !isTechnicalNoise(error.message)) {
      return humanizeValidationError(error.message);
    }
  }

  // Handle generic Error instances
  if (error instanceof Error) {
    const raw = error.message.trim();

    if (isNetworkFailure(raw)) {
      return "Unable to connect right now. Please check your network and try again.";
    }

    if (!isTechnicalNoise(raw)) {
      return humanizeValidationError(raw);
    }
  }

  if (typeof error === "string" && !isTechnicalNoise(error)) {
    return humanizeValidationError(error);
  }

  return fallback;
}

/**
 * Detects whether an error message is low-level browser/network/runtime noise.
 */
function isTechnicalNoise(msg: string): boolean {
  const lower = msg.toLowerCase();
  return (
    lower.includes("fetch failed") ||
    lower.includes("failed to fetch") ||
    lower.includes("networkerror") ||
    lower.includes("internal server error") ||
    lower.includes("bad gateway") ||
    lower.includes("service unavailable") ||
    lower.includes("gateway timeout") ||
    lower.includes("unexpected token") ||
    lower.includes("syntaxerror") ||
    lower.includes("typeerror") ||
    lower.includes("econnrefused") ||
    lower.includes("enotfound") ||
    lower.includes("aborted") ||
    lower.includes("object object")
  );
}

/**
 * Checks if a string describes a network/offline drop.
 */
function isNetworkFailure(msg: string): boolean {
  const lower = msg.toLowerCase();
  return (
    lower.includes("fetch failed") ||
    lower.includes("failed to fetch") ||
    lower.includes("networkerror") ||
    lower.includes("network error") ||
    lower.includes("offline") ||
    lower.includes("econnrefused") ||
    lower.includes("load failed")
  );
}

/**
 * Cleans up API validation messages into elegant, supportive railway prose.
 */
function humanizeValidationError(msg: string): string {
  // Normalize punctuation and capitalization
  let cleaned = msg.trim();

  if (cleaned.toLowerCase().includes("ticket could not be read")) {
    return "The ticket could not be read clearly. You can enter your journey details manually or try uploading a clearer PDF or image.";
  }

  if (cleaned.toLowerCase().includes("invalid credentials")) {
    return "The email or password entered does not match our records. Please check and try again.";
  }

  if (cleaned.toLowerCase().includes("password must be")) {
    return "Please choose a password with at least 8 characters (12 or more for new accounts).";
  }

  if (cleaned.toLowerCase().includes("passwords do not match")) {
    return "The passwords entered do not match. Please verify them.";
  }

  if (cleaned.toLowerCase().includes("train number must be")) {
    return "Please enter a valid 5-digit Indian Railways train number.";
  }

  if (cleaned.toLowerCase().includes("journey date")) {
    return "Please select a valid journey date.";
  }

  if (cleaned.toLowerCase().includes("station code")) {
    return "Please provide a valid Indian Railways station code (e.g. NDLS, CSMT, HWH).";
  }

  // Ensure sentence ends with a period
  if (!/[.!?]$/.test(cleaned)) {
    cleaned += ".";
  }

  // Ensure first character is capitalized
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}
