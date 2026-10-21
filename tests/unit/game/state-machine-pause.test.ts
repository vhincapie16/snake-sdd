import { describe, expect, it } from "vitest";
import type { GameState } from "@/domain/game/model";
import { createInitialGame, transitionGame } from "@/domain/game/state-machine";
import { createFakeDependencies } from "@tests/helpers/game-fixtures";

describe("HU-001 / RF-003 y RF-004: pausa y reanudación", () => {
  it("pausa y reanuda conservando íntegramente la partida", () => {
    const dependencies = createFakeDependencies();
    const running = transitionGame(
      createInitialGame(dependencies),
      { type: "START" },
      dependencies,
    );
    const paused = transitionGame(
      running,
      { type: "TOGGLE_PAUSE" },
      dependencies,
    );

    expect(paused).toMatchObject({
      status: "paused",
      gameId: running.gameId,
      snake: running.snake,
      effectiveDirection: running.effectiveDirection,
      score: running.score,
    });

    const resumed = transitionGame(
      paused,
      { type: "TOGGLE_PAUSE" },
      dependencies,
    );
    expect(resumed).toEqual({ ...paused, status: "running" });
  });

  it("permanece inmutable durante al menos 10 segundos equivalentes de ticks", () => {
    const dependencies = createFakeDependencies();
    const running = transitionGame(
      createInitialGame(dependencies),
      { type: "START" },
      dependencies,
    );
    const paused = transitionGame(
      running,
      { type: "TOGGLE_PAUSE" },
      dependencies,
    );

    const afterTenSeconds = Array.from({ length: 67 }).reduce<GameState>(
      (state) => transitionGame(state, { type: "TICK" }, dependencies),
      paused,
    );

    expect(afterTenSeconds).toBe(paused);
  });

  it("ignora acciones incompatibles con el estado", () => {
    const dependencies = createFakeDependencies();
    const prepared = createInitialGame(dependencies);
    expect(
      transitionGame(prepared, { type: "TOGGLE_PAUSE" }, dependencies),
    ).toBe(prepared);
  });
});
