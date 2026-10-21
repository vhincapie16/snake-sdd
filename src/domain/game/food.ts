import {
  areCellsEqual,
  BOARD_HEIGHT,
  BOARD_WIDTH,
  isCellInsideBoard,
  type Cell,
} from "@/domain/game/model";

export function listFreeCells(occupied: readonly Cell[]): Cell[] {
  const taken = new Set(occupied.map(({ x, y }) => `${x},${y}`));
  const free: Cell[] = [];
  for (let y = 0; y < BOARD_HEIGHT; y++) {
    for (let x = 0; x < BOARD_WIDTH; x++) {
      if (!taken.has(`${x},${y}`)) free.push({ x, y });
    }
  }
  return free;
}

export function generateFood(
  occupied: readonly Cell[],
  positions: { nextAvailable(occupied: readonly Cell[]): Cell },
): Cell | null {
  if (listFreeCells(occupied).length === 0) return null;
  const food = positions.nextAvailable(occupied);
  if (
    !isCellInsideBoard(food) ||
    occupied.some((segment) => areCellsEqual(segment, food))
  ) {
    throw new Error("El generador produjo un alimento inválido.");
  }
  return food;
}
