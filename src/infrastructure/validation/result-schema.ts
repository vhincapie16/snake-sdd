import {
  normalizeResult,
  ResultValidationError,
  type RecordedResult,
} from "@/domain/results/result";

const FIELDS = ["gameId", "alias", "score", "achievedAt"] as const;

export function parseResultRequest(input: unknown): RecordedResult {
  if (
    !input ||
    typeof input !== "object" ||
    Array.isArray(input) ||
    Object.keys(input).length !== FIELDS.length ||
    Object.keys(input).some(
      (key) => !FIELDS.includes(key as (typeof FIELDS)[number]),
    )
  ) {
    throw new ResultValidationError([
      { field: "gameId", code: "INVALID_BODY" },
    ]);
  }
  const data = input as Record<string, unknown>;
  const issues = FIELDS.filter(
    (field) => typeof data[field] !== (field === "score" ? "number" : "string"),
  ).map((field) => ({ field, code: "INVALID_TYPE" }));
  if (issues.length) throw new ResultValidationError(issues);
  return normalizeResult(data as unknown as RecordedResult);
}
