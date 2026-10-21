import { describe, expect, it } from "vitest";
import type { Direction } from "@/domain/game/model";
import { isOppositeDirection, nextCell } from "@/domain/game/movement";
import { transitionGame } from "@/domain/game/state-machine";
import {
  createFakeDependencies,
  createGameFixture,
} from "@tests/helpers/game-fixtures";

const expectations: ReadonlyArray<
  readonly [Direction, { readonly x: number; readonly y: number }]
> = [
  ["up", { x: 10, y: 9 }],
  ["down", { x: 10, y: 11 }],
  ["left", { x: 9, y: 10 }],
  ["right", { x: 11, y: 10 }],
];

describe("HU-002 / RF-006 a RF-010: movimiento por teclado", () => {
  it.each(expectations)(
    "calcula la celda siguiente hacia %s",
    (direction, expected) => {
      expect(nextCell({ x: 10, y: 10 }, direction)).toEqual(expected);
    },
  );

  it("reconoce únicamente pares de direcciones opuestas", () => {
    expect(isOppositeDirection("left", "right")).toBe(true);
    expect(isOppositeDirection("up", "down")).toBe(true);
    expect(isOppositeDirection("up", "right")).toBe(false);
    expect(isOppositeDirection("right", "right")).toBe(false);
  });

  it("acepta solo la primera dirección válida antes del tick", () => {
    const dependencies = createFakeDependencies();
    const running = createGameFixture({ status: "running" });
    const accepted = transitionGame(
      running,
      { type: "QUEUE_DIRECTION", direction: "up" },
      dependencies,
    );
    const ignored = transitionGame(
      accepted,
      { type: "QUEUE_DIRECTION", direction: "left" },
      dependencies,
    );

    expect(accepted.pendingDirection).toBe("up");
    expect(ignored).toBe(accepted);
  });

  it("rechaza la opuesta sin consumir la oportunidad válida", () => {
    const dependencies = createFakeDependencies();
    const running = createGameFixture({ status: "running" });
    const rejected = transitionGame(
      running,
      { type: "QUEUE_DIRECTION", direction: "left" },
      dependencies,
    );
    const accepted = transitionGame(
      rejected,
      { type: "QUEUE_DIRECTION", direction: "up" },
      dependencies,
    );

    expect(rejected).toBe(running);
    expect(accepted.pendingDirection).toBe("up");
  });

  it.each(["prepared", "paused", "finished"] as const)(
    "ignora direcciones cuando el estado es %s",
    (status) => {
      const state = createGameFixture({ status });
      expect(
        transitionGame(
          state,
          { type: "QUEUE_DIRECTION", direction: "up" },
          createFakeDependencies(),
        ),
      ).toBe(state);
    },
  );

  it("mueve exclusivamente en TICK y libera la entrada pendiente", () => {
    const dependencies = createFakeDependencies();
    const running = createGameFixture({ status: "running" });
    const queued = transitionGame(
      running,
      { type: "QUEUE_DIRECTION", direction: "up" },
      dependencies,
    );

    expect(queued.snake).toBe(running.snake);
    const moved = transitionGame(queued, { type: "TICK" }, dependencies);
    expect(moved.snake.segments).toEqual([
      { x: 10, y: 9 },
      { x: 10, y: 10 },
      { x: 9, y: 10 },
    ]);
    expect(moved.effectiveDirection).toBe("up");
    expect(moved.pendingDirection).toBeNull();
  });
});
