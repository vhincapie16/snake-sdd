import type { PendingResult, SavedResultRef } from "@/domain/game/model";
import { normalizeAlias, normalizeResult } from "@/domain/results/result";

export class ResultRequestError extends Error {
  constructor(readonly code: string) {
    super("No se pudo guardar el resultado.");
  }
}

export async function savePendingResult(
  pending: PendingResult,
): Promise<SavedResultRef> {
  const input = {
    gameId: pending.gameId,
    alias: normalizeAlias(pending.aliasInput),
    score: pending.score,
    achievedAt: pending.achievedAt,
  };
  const response = await fetch("/api/results", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await response.json();
  if (
    !response.ok ||
    (body.status !== "created" && body.status !== "alreadyRecorded")
  ) {
    throw new ResultRequestError(
      typeof body.code === "string" ? body.code : "PERSISTENCE_UNAVAILABLE",
    );
  }
  return normalizeResult(body.result);
}
