import type { Instrumentation } from "next";
export const onRequestError: Instrumentation.onRequestError = async (
  error,
  request,
  context,
) => {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { logger } = await import("./lib/logger");
    logger.error("request_failed", {
      requestId: request.headers["x-request-id"],
      errorType: error instanceof Error ? error.name : "unknown",
      route: context.routePath,
      router: context.routerKind,
    });
  }
};
