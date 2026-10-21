import { expect, test, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { createResultRepository } from "@/infrastructure/supabase/server-client";
import type { RecordedResult } from "@/domain/results/result";

// Fuera de la suite de CI: requiere autorización para escrituras controladas.
test("KAN-5 / T055–T056: persistencia real, reintento, conflicto y Top 10 con once resultados controlados", async () => {
  if (process.env.SNAKE_ALLOW_CONTROLLED_WRITES !== "1")
    throw new Error(
      "Se requiere autorización explícita de escrituras controladas antes de esta suite.",
    );
  const repository = createResultRepository();
  const baseline = await repository.top10();
  const fixtures: RecordedResult[] = Array.from({ length: 11 }, (_, index) => ({
    gameId: `00500000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
    alias: "KAN5_Prueba",
    score: index < 3 ? 100 : Math.max(0, 90 - index * 10),
    achievedAt: new Date(
      Date.UTC(2026, 9, 21, 0, 0, Math.max(0, index - 1)),
    ).toISOString(),
  }));
  // El cero prueba persistencia con menos de diez filas en la primera ejecución.
  const zero = fixtures[10]!;
  const first = await repository.save(zero);
  expect(["created", "alreadyRecorded"]).toContain(first.status);
  const otherSession = createResultRepository();
  expect(await otherSession.save(zero)).toEqual({
    status: "alreadyRecorded",
    result: zero,
  });
  expect(
    await otherSession.save({ ...zero, alias: "No_sobrescribir" }),
  ).toEqual({ status: "conflict" });
  if (baseline.length === 0) expect(await otherSession.top10()).toEqual([zero]);
  for (const fixture of fixtures.slice(0, 10)) {
    const saved = await repository.save(fixture);
    expect(["created", "alreadyRecorded"]).toContain(saved.status);
  }
  const expected = [
    ...new Map(
      [...baseline, ...fixtures].map((entry) => [entry.gameId, entry]),
    ).values(),
  ]
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.achievedAt.localeCompare(right.achievedAt) ||
        left.gameId.localeCompare(right.gameId),
    )
    .slice(0, 10);
  expect(await createResultRepository().top10()).toEqual(expected);
}, 60_000);
