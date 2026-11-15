const REDACT_KEY_PATTERN =
  /token|secret|cookie|authorization|credential|api_?key|email|phone|pnr|password|real_?name|seat|berth|coach|ocr_?text|filename|ticket_?text|raw_?fields/i;

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

function redactValue(key: string, value: unknown): unknown {
  if (REDACT_KEY_PATTERN.test(key)) {
    return "[REDACTED]";
  }

  if (value === null || value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item, index) => redactValue(String(index), item));
  }

  if (typeof value === "object") {
    return redactMetadata(value as Record<string, unknown>);
  }

  return value;
}

function redactMetadata(
  metadata: Record<string, unknown>,
): Record<string, unknown> {
  const redacted: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(metadata)) {
    redacted[key] = redactValue(key, value);
  }

  return redacted;
}

function write(entry: LogEntry): void {
  const payload = {
    ...entry,
    metadata: entry.metadata ? redactMetadata(entry.metadata) : undefined,
  };

  const line = JSON.stringify(payload);

  switch (entry.level) {
    case "error":
      console.error(line);
      break;
    case "warn":
      console.warn(line);
      break;
    case "debug":
      console.debug(line);
      break;
    default:
      console.log(line);
  }
}

function log(
  level: LogLevel,
  message: string,
  metadata?: Record<string, unknown>,
): void {
  write({
    level,
    message,
    timestamp: new Date().toISOString(),
    metadata,
  });
}

export const logger = {
  debug(message: string, metadata?: Record<string, unknown>): void {
    log("debug", message, metadata);
  },
  info(message: string, metadata?: Record<string, unknown>): void {
    log("info", message, metadata);
  },
  warn(message: string, metadata?: Record<string, unknown>): void {
    log("warn", message, metadata);
  },
  error(message: string, metadata?: Record<string, unknown>): void {
    log("error", message, metadata);
  },
};
