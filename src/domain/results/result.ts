import type { SavedResultRef } from "@/domain/game/model";

export type RecordedResult = SavedResultRef;
export interface RankingEntry extends RecordedResult {
  readonly position: number;
}
export interface ResultIssue {
  readonly field: keyof RecordedResult;
  readonly code: string;
}

export class ResultValidationError extends Error {
  constructor(readonly issues: readonly ResultIssue[]) {
    super(
      "Revisa los datos del resultado; el alias debe tener entre 1 y 20 letras, números, espacios, guiones o guiones bajos.",
    );
    this.name = "ResultValidationError";
  }
}

export function normalizeAlias(input: string): string {
  const alias = input.trim();
  if (
    Array.from(alias).length < 1 ||
    Array.from(alias).length > 20 ||
    !/^[\p{L}0-9 _-]+$/u.test(alias)
  ) {
    throw new ResultValidationError([
      { field: "alias", code: "INVALID_ALIAS" },
    ]);
  }
  return alias;
}

export function normalizeResult(input: RecordedResult): RecordedResult {
  const issues: ResultIssue[] = [];
  if (
    !/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(
      input.gameId,
    )
  )
    issues.push({ field: "gameId", code: "INVALID_UUID" });
  // Representación del integer PostgreSQL aprobado; no cambia las reglas de puntuación.
  if (
    !Number.isSafeInteger(input.score) ||
    input.score < 0 ||
    input.score > 2147483647 ||
    input.score % 10 !== 0
  )
    issues.push({ field: "score", code: "INVALID_SCORE" });
  const utc =
    /^(\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d)(?:\.(\d{1,6}))?(?:Z|\+00:00)$/.exec(
      input.achievedAt,
    );
  const date = new Date(input.achievedAt);
  if (
    !utc ||
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 19) !== utc[1]
  )
    issues.push({ field: "achievedAt", code: "INVALID_UTC_DATE" });
  let alias = "";
  try {
    alias = normalizeAlias(input.alias);
  } catch (error) {
    if (error instanceof ResultValidationError) issues.push(...error.issues);
    else throw error;
  }
  if (issues.length) throw new ResultValidationError(issues);
  const fraction = (utc![2] ?? "").replace(/0+$/, "").padEnd(3, "0");
  return {
    gameId: input.gameId.toLowerCase(),
    alias,
    score: input.score,
    achievedAt: `${utc![1]}.${fraction}Z`,
  };
}
