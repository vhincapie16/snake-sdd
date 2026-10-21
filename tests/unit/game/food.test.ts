import { describe, expect, it, vi } from "vitest";
import { generateFood, listFreeCells } from "@/domain/game/food";
import { BOARD_HEIGHT, BOARD_WIDTH, type Cell } from "@/domain/game/model";
import { createInitialGame, transitionGame } from "@/domain/game/state-machine";
import { createFakeDependencies } from "@tests/helpers/game-fixtures";

describe("HU-003 / RF-011, RF-012 y RF-015: alimento válido", () => {
  it("enumera únicamente celdas libres dentro del tablero sin duplicados", () => {
    const occupied = [
      { x: 0, y: 0 },
      { x: 19, y: 19 },
    ];
    const free = listFreeCells(occupied);
    expect(free).toHaveLength(BOARD_WIDTH * BOARD_HEIGHT - 2);
    expect(new Set(free.map(({ x, y }) => `${x},${y}`)).size).toBe(free.length);
    expect(free).not.toContainEqual(occupied[0]);
    expect(free).not.toContainEqual(occupied[1]);
    expect(free.every(({ x, y }) => x >= 0 && x < 20 && y >= 0 && y < 20)).toBe(
      true,
    );
  });

  it("solicita un único alimento al puerto con la ocupación actual", () => {
    const occupied = [{ x: 10, y: 10 }];
    const nextAvailable = vi.fn(() => ({ x: 11, y: 10 }));
    expect(generateFood(occupied, { nextAvailable })).toEqual({ x: 11, y: 10 });
    expect(nextAvailable).toHaveBeenCalledExactlyOnceWith(occupied);
  });

  it.each([
    { x: -1, y: 0 },
    { x: 20, y: 0 },
    { x: 0, y: 20 },
    { x: 0.5, y: 0 },
    { x: 10, y: 10 },
  ])("rechaza una posición inválida del puerto: %j", (cell) => {
    expect(() =>
      generateFood([{ x: 10, y: 10 }], { nextAvailable: () => cell }),
    ).toThrow();
  });

  it("usa la última celda libre y no invoca el puerto cuando el tablero está lleno", () => {
    const cells = listFreeCells([]);
    const last = cells.at(-1)!;
    const nextAvailable = vi.fn(() => last);
    expect(generateFood(cells.slice(0, -1), { nextAvailable })).toEqual(last);
    nextAvailable.mockClear();
    expect(generateFood(cells, { nextAvailable })).toBeNull();
    expect(nextAvailable).not.toHaveBeenCalled();
  });

  it("prepara y reinicia con un solo alimento válido mediante el puerto", () => {
    const positions: Cell[] = [
      { x: 15, y: 10 },
      { x: 3, y: 2 },
    ];
    const dependencies = createFakeDependencies(positions);
    const initial = createInitialGame(dependencies);
    expect(initial.food).toEqual(positions[0]);
    expect(
      transitionGame(initial, { type: "REQUEST_RESTART" }, dependencies).food,
    ).toEqual(positions[1]);
  });
});
