import { describe, expect, it } from "vitest";
import { isCellInsideBoard } from "@/domain/game/model";
import { createInitialGame, transitionGame } from "@/domain/game/state-machine";
import { createFakeDependencies } from "@tests/helpers/game-fixtures";

describe("HU-001 / RF-001 y RF-002: ciclo inicial", () => {
  it("crea una partida preparada, válida, inmóvil y con puntuación cero", () => {
    const state = createInitialGame(createFakeDependencies());

    expect(state.status).toBe("prepared");
    expect(state.score).toBe(0);
    expect(state.snake.segments).toHaveLength(3);
    expect(state.snake.segments.every(isCellInsideBoard)).toBe(true);
    expect(state.food).not.toBeNull();
    expect(state.food && isCellInsideBoard(state.food)).toBe(true);
    expect(state.resultState.status).toBe("none");
  });

  it("inicia únicamente desde prepared mediante START", () => {
    const dependencies = createFakeDependencies();
    const prepared = createInitialGame(dependencies);
    const running = transitionGame(prepared, { type: "START" }, dependencies);

    expect(running.status).toBe("running");
    expect(running.score).toBe(0);
    expect(transitionGame(running, { type: "START" }, dependencies)).toBe(
      running,
    );
  });
});
