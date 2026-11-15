import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { validateRequestBody } from "./validation";
export function jsonOk<T>(
  data: T,
  init?: { status?: number; headers?: HeadersInit },
) {
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", "no-store");
  return NextResponse.json(data, { status: init?.status ?? 200, headers });
}
export function jsonError(error: unknown) {
  let status = 500,
    code = "internal",
    message = "Something went wrong. Please try again.";
  if (error instanceof ZodError) {
    status = 400;
    code = "validation";
    message = error.issues[0]?.message ?? "Invalid request";
  } else if (error instanceof AppError) {
    status = error.status;
    code = error.code;
    message = error.message;
  } else if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    (error.code === "23505" ||
      (error.code === "ERR_SQLITE_ERROR" &&
        error instanceof Error &&
        /UNIQUE constraint failed/.test(error.message)))
  ) {
    status = 409;
    code = "conflict";
    message = "This record already exists. Refresh and try again.";
  } else
    logger.error("unhandled_api_error", {
      errorType: error instanceof Error ? error.name : "unknown",
    });
  const headers: Record<string, string> = { "Cache-Control": "no-store" };
  if (status === 429) headers["Retry-After"] = "60";
  return NextResponse.json({ error: { code, message } }, { status, headers });
}
export async function parseJsonBody<T = unknown>(request: Request): Promise<T> {
  if (
    !request.headers
      .get("content-type")
      ?.toLowerCase()
      .startsWith("application/json")
  )
    throw new AppError("validation", "Content-Type must be application/json");
  const maximum = 32 * 1024;
  if (Number(request.headers.get("content-length")) > maximum)
    throw new AppError("payload_too_large", "Request body is too large");
  const reader = request.body?.getReader();
  if (!reader) throw new AppError("validation", "A JSON body is required");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maximum) {
        await reader.cancel();
        throw new AppError("payload_too_large", "Request body is too large");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  let body: unknown;
  try {
    body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new AppError("validation", "Invalid JSON body");
  }
  if (!body || typeof body !== "object" || Array.isArray(body))
    throw new AppError("validation", "A JSON object is required");
  return validateRequestBody(new URL(request.url).pathname, body) as T;
}

export async function parseTicketForm(request: Request): Promise<FormData> {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().startsWith("multipart/form-data"))
    throw new AppError("validation", "A multipart ticket upload is required");
  const maximum = 9 * 1024 * 1024;
  if (Number(request.headers.get("content-length")) > maximum)
    throw new AppError("payload_too_large", "Upload is too large");
  const reader = request.body?.getReader();
  if (!reader) throw new AppError("validation", "A ticket file is required");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > maximum) {
        await reader.cancel();
        throw new AppError("payload_too_large", "Upload is too large");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  try {
    return await new Response(bytes, {
      headers: { "Content-Type": contentType },
    }).formData();
  } catch {
    throw new AppError("validation", "The uploaded form is invalid");
  }
}
