export const BOARD_WIDTH = 20;
export const BOARD_HEIGHT = 20;
export const TICK_INTERVAL_MS = 150;

export type GameStatus = "prepared" | "running" | "paused" | "finished";
export type Direction = "up" | "down" | "left" | "right";
export type FinishReason = "wall" | "self" | "boardCompleted";

export interface Cell {
  readonly x: number;
  readonly y: number;
}

export interface Snake {
  readonly segments: readonly [Cell, ...Cell[]];
}

export interface PendingResult {
  readonly gameId: string;
  readonly score: number;
  readonly achievedAt: string;
  readonly aliasInput: string;
}

export interface SavedResultRef {
  readonly gameId: string;
  readonly alias: string;
  readonly score: number;
  readonly achievedAt: string;
}

export type ResultState =
  | { readonly status: "none" }
  | { readonly status: "pending"; readonly result: PendingResult }
  | {
      readonly status: "saving";
      readonly result: PendingResult;
      readonly restartAfterSave: boolean;
    }
  | {
      readonly status: "saveError";
      readonly result: PendingResult;
      readonly errorCode: string;
    }
  | { readonly status: "saved"; readonly result: SavedResultRef };

export interface GameState {
  readonly gameId: string;
  readonly status: GameStatus;
  readonly snake: Snake;
  readonly food: Cell | null;
  readonly effectiveDirection: Direction;
  readonly pendingDirection: Direction | null;
  readonly score: number;
  readonly finishedAt: string | null;
  readonly finishReason: FinishReason | null;
  readonly resultState: ResultState;
  readonly restartConfirmation: boolean;
}

export function isCellInsideBoard(cell: Cell): boolean {
  return (
    Number.isInteger(cell.x) &&
    Number.isInteger(cell.y) &&
    cell.x >= 0 &&
    cell.x < BOARD_WIDTH &&
    cell.y >= 0 &&
    cell.y < BOARD_HEIGHT
  );
}

export function areCellsEqual(left: Cell, right: Cell): boolean {
  return left.x === right.x && left.y === right.y;
}
