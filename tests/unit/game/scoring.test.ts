import { describe, expect, it, vi } from "vitest";
import { consumeFood } from "@/domain/game/scoring";
import {
  TICK_INTERVAL_MS,
  type Cell,
  type GameState,
} from "@/domain/game/model";
import { transitionGame } from "@/domain/game/state-machine";
import {
  createFakeDependencies,
  createGameFixture,
  FIXED_ACHIEVED_AT,
} from "@tests/helpers/game-fixtures";

describe("HU-003 / RF-013, RF-014 y RF-029: consumo y puntuación", () => {
  it("crece inmutablemente un segmento y suma exactamente 10", () => {
    const state = createGameFixture();
    const before = structuredClone(state);
    const result = consumeFood(state.snake, { x: 11, y: 10 }, 20);
    expect(result).toEqual({
      snake: { segments: [{ x: 11, y: 10 }, ...state.snake.segments] },
      score: 30,
    });
    expect(state).toEqual(before);
  });

  it("consume, conserva la cola y repone fuera del cuerpo; sin consumo libera la cola", () => {
    const dependencies = createFakeDependencies([
      { x: 12, y: 10 },
      { x: 0, y: 0 },
    ]);
    const initial = createGameFixture({
      status: "running",
      food: { x: 11, y: 10 },
    });
    const before = structuredClone(initial);
    const first = transitionGame(initial, { type: "TICK" }, dependencies);
    expect(first.score).toBe(10);
    expect(first.snake.segments).toEqual([
      { x: 11, y: 10 },
      ...initial.snake.segments,
    ]);
    expect(first.food).toEqual({ x: 12, y: 10 });
    const second = transitionGame(first, { type: "TICK" }, dependencies);
    expect(second.score).toBe(20);
    expect(second.snake.segments).toHaveLength(5);
    expect(second.food).toEqual({ x: 0, y: 0 });
    const third = transitionGame(second, { type: "TICK" }, dependencies);
    expect(third.score).toBe(20);
    expect(third.snake.segments).toHaveLength(5);
    expect(third.snake.segments.at(-1)).toEqual({ x: 9, y: 10 });
    expect(third.food).toBe(second.food);
    expect(initial).toEqual(before);
    expect(TICK_INTERVAL_MS).toBe(150);
  });

  it("la coincidencia exige ambas coordenadas y no solicita alimento sin consumo", () => {
    const dependencies = createFakeDependencies();
    const generator = vi.spyOn(dependencies.positions, "nextAvailable");
    const state = createGameFixture({
      status: "running",
      food: { x: 11, y: 9 },
    });
    const next = transitionGame(state, { type: "TICK" }, dependencies);
    expect(next.score).toBe(0);
    expect(next.snake.segments).toHaveLength(3);
    expect(next.food).toEqual(state.food);
    expect(generator).not.toHaveBeenCalled();
  });

  it("permite entrar en la celda que la cola libera sin consumir", () => {
    const state = createGameFixture({
      status: "running",
      effectiveDirection: "left",
      snake: {
        segments: [
          { x: 1, y: 1 },
          { x: 1, y: 2 },
          { x: 0, y: 2 },
          { x: 0, y: 1 },
        ],
      },
    });
    const next = transitionGame(
      state,
      { type: "TICK" },
      createFakeDependencies(),
    );
    expect(next.snake.segments).toEqual([
      { x: 0, y: 1 },
      ...state.snake.segments.slice(0, -1),
    ]);
    expect(next.score).toBe(0);
  });

  it("conserva la longitud mínima de un segmento cuando no consume", () => {
    const state = createGameFixture({
      status: "running",
      snake: { segments: [{ x: 10, y: 10 }] },
    });
    const next = transitionGame(
      state,
      { type: "TICK" },
      createFakeDependencies(),
    );
    expect(next.snake.segments).toEqual([{ x: 11, y: 10 }]);
    expect(next.score).toBe(0);
  });

  it.each(["prepared", "paused", "finished"] as const)(
    "ignora TICK en %s",
    (status) => {
      const state = createGameFixture({ status, food: { x: 11, y: 10 } });
      expect(
        transitionGame(state, { type: "TICK" }, createFakeDependencies()),
      ).toBe(state);
    },
  );

  it("RN-010: el último consumo completa el tablero una vez y conserva el resultado", () => {
    const path: Cell[] = Array.from({ length: 400 }, (_, i) => {
      const y = Math.floor(i / 20);
      return { x: y % 2 === 0 ? i % 20 : 19 - (i % 20), y };
    });
    const segments = path.slice(0, -1).reverse() as [Cell, ...Cell[]];
    const state: GameState = createGameFixture({
      status: "running",
      snake: { segments },
      effectiveDirection: "left",
      food: path.at(-1)!,
      score: 3960,
    });
    const dependencies = createFakeDependencies();
    const generator = vi.spyOn(dependencies.positions, "nextAvailable");
    const result = transitionGame(state, { type: "TICK" }, dependencies);
    expect(result.snake.segments).toHaveLength(400);
    expect(
      new Set(result.snake.segments.map(({ x, y }) => `${x},${y}`)).size,
    ).toBe(400);
    expect(result).toMatchObject({
      status: "finished",
      finishReason: "boardCompleted",
      food: null,
      score: 3970,
      finishedAt: FIXED_ACHIEVED_AT,
      resultState: {
        status: "pending",
        result: {
          gameId: state.gameId,
          score: 3970,
          achievedAt: FIXED_ACHIEVED_AT,
          aliasInput: "",
        },
      },
    });
    expect(generator).not.toHaveBeenCalled();
    expect(transitionGame(result, { type: "TICK" }, dependencies)).toBe(result);
  });
});
