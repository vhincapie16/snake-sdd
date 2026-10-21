import {
  areCellsEqual,
  isCellInsideBoard,
  type Cell,
} from "@/domain/game/model";

export function detectCollision(
  nextHead: Cell,
  segments: readonly Cell[],
  grows: boolean,
): "wall" | "self" | null {
  if (!isCellInsideBoard(nextHead)) return "wall";
  const occupied = grows ? segments : segments.slice(0, -1);
  return occupied.some((cell) => areCellsEqual(cell, nextHead)) ? "self" : null;
}
