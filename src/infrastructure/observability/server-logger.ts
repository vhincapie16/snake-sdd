import "server-only";

const SENSITIVE_KEY =
  /(authorization|cookie|credential|key|password|secret|token)/i;

function redact(value: unknown, key = ""): unknown {
  if (SENSITIVE_KEY.test(key)) return "[REDACTED]";
  if (Array.isArray(value)) return value.map((item) => redact(item));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([entryKey, entryValue]) => [
        entryKey,
        redact(entryValue, entryKey),
      ]),
    );
  }
  return value;
}

export function logServerError(
  code:
    | "CONFIGURATION_INVALID"
    | "VALIDATION_ERROR"
    | "PAYLOAD_TOO_LARGE"
    | "PERSISTENCE_UNAVAILABLE",
  context: Record<string, unknown>,
): void {
  console.error("snake-sdd", { code, context: redact(context) });
}
