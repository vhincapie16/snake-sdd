import { describe, expect, it, vi } from "vitest";
import { transitionGame } from "@/domain/game/state-machine";
import type { Direction } from "@/domain/game/model";
import {
  createFakeDependencies,
  createGameFixture,
  FIXED_ACHIEVED_AT,
} from "@tests/helpers/game-fixtures";

describe("HU-004 / RF-018 a RF-020: final único e inmutable", () => {
  it.each([
    {
      direction: "right",
      segments: [
        { x: 19, y: 10 },
        { x: 18, y: 10 },
        { x: 17, y: 10 },
      ],
    },
    {
      direction: "left",
      segments: [
        { x: 0, y: 10 },
        { x: 1, y: 10 },
        { x: 2, y: 10 },
      ],
    },
    {
      direction: "up",
      segments: [
        { x: 10, y: 0 },
        { x: 10, y: 1 },
        { x: 10, y: 2 },
      ],
    },
    {
      direction: "down",
      segments: [
        { x: 10, y: 19 },
        { x: 10, y: 18 },
        { x: 10, y: 17 },
      ],
    },
  ] as const)(
    "finaliza una vez por pared hacia $direction conservando posición y puntos",
    ({ direction, segments }) => {
      const state = createGameFixture({
        status: "running",
        effectiveDirection: direction,
        snake: { segments },
        score: 30,
      });
      const before = structuredClone(state);
      const dependencies = createFakeDependencies();
      const clock = vi.spyOn(dependencies.clock, "now");
      const positions = vi.spyOn(dependencies.positions, "nextAvailable");
      const uuid = vi.spyOn(dependencies.uuid, "create");
      const finished = transitionGame(state, { type: "TICK" }, dependencies);
      expect(finished).toMatchObject({
        status: "finished",
        finishReason: "wall",
        finishedAt: FIXED_ACHIEVED_AT,
        score: 30,
        food: null,
        pendingDirection: null,
        resultState: {
          status: "pending",
          result: {
            gameId: state.gameId,
            score: 30,
            achievedAt: FIXED_ACHIEVED_AT,
            aliasInput: "",
          },
        },
      });
      expect(finished.snake).toBe(state.snake);
      for (let i = 0; i < 67; i++) {
        expect(transitionGame(finished, { type: "TICK" }, dependencies)).toBe(
          finished,
        );
      }
      for (const direction of ["up", "down", "left", "right"] as const) {
        expect(
          transitionGame(
            finished,
            { type: "QUEUE_DIRECTION", direction },
            dependencies,
          ),
        ).toBe(finished);
      }
      for (const type of ["START", "TOGGLE_PAUSE"] as const) {
        expect(transitionGame(finished, { type }, dependencies)).toBe(finished);
      }
      expect(clock).toHaveBeenCalledOnce();
      expect(positions).not.toHaveBeenCalled();
      expect(uuid).not.toHaveBeenCalled();
      expect(state).toEqual(before);
    },
  );

  it("finaliza por cuerpo y conserva el resultado aunque la dirección estuviera pendiente", () => {
    const state = createGameFixture({
      status: "running",
      effectiveDirection: "up",
      pendingDirection: "right",
      score: 20,
      snake: {
        segments: [
          { x: 2, y: 2 },
          { x: 2, y: 3 },
          { x: 3, y: 3 },
          { x: 3, y: 2 },
          { x: 3, y: 1 },
          { x: 2, y: 1 },
        ],
      },
    });
    const finished = transitionGame(
      state,
      { type: "TICK" },
      createFakeDependencies(),
    );
    expect(finished).toMatchObject({
      status: "finished",
      finishReason: "self",
      score: 20,
      resultState: { status: "pending", result: { score: 20 } },
    });
    expect(finished.snake).toBe(state.snake);
  });

  it("resuelve una cola retenida antes de sumar puntos o solicitar alimento", () => {
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
      food: { x: 0, y: 1 },
      score: 10,
    });
    const dependencies = createFakeDependencies();
    const positions = vi.spyOn(dependencies.positions, "nextAvailable");
    const finished = transitionGame(state, { type: "TICK" }, dependencies);
    expect(finished).toMatchObject({
      status: "finished",
      finishReason: "self",
      score: 10,
    });
    expect(finished.snake).toBe(state.snake);
    expect(positions).not.toHaveBeenCalled();
  });

  it("reinicia con confirmación, queda preparada e inicia solo con START", () => {
    const dependencies = {
      ...createFakeDependencies(),
      uuid: { create: () => "00000000-0000-4000-8000-000000000002" },
    };
    const state = createGameFixture({
      status: "running",
      effectiveDirection: "left" as Direction,
      snake: { segments: [{ x: 0, y: 0 }] },
      score: 30,
    });
    const finished = transitionGame(state, { type: "TICK" }, dependencies);
    const requested = transitionGame(
      finished,
      { type: "REQUEST_RESTART" },
      dependencies,
    );
    expect(requested.restartConfirmation).toBe(true);
    expect(requested.resultState).toBe(finished.resultState);
    const cancelled = transitionGame(
      requested,
      { type: "CANCEL_RESTART" },
      dependencies,
    );
    expect(cancelled.resultState).toBe(finished.resultState);
    const prepared = transitionGame(
      requested,
      { type: "CONFIRM_DISCARD_AND_RESTART" },
      dependencies,
    );
    expect(prepared).toMatchObject({
      status: "prepared",
      score: 0,
      finishReason: null,
      finishedAt: null,
      resultState: { status: "none" },
    });
    expect(prepared.gameId).not.toBe(finished.gameId);
    expect(transitionGame(prepared, { type: "TICK" }, dependencies)).toBe(
      prepared,
    );
    expect(
      transitionGame(prepared, { type: "START" }, dependencies).status,
    ).toBe("running");
  });
});
