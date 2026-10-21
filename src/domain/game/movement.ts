import type { Cell, Direction } from "@/domain/game/model";

const DIRECTION_DELTA: Readonly<Record<Direction, Cell>> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const OPPOSITE_DIRECTION: Readonly<Record<Direction, Direction>> = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};

export function isOppositeDirection(
  candidate: Direction,
  effective: Direction,
): boolean {
  return OPPOSITE_DIRECTION[effective] === candidate;
}

export function nextCell(cell: Cell, direction: Direction): Cell {
  const delta = DIRECTION_DELTA[direction];
  return { x: cell.x + delta.x, y: cell.y + delta.y };
}
