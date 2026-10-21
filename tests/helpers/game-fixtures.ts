import type { GameDependencies } from "@/application/ports/game-dependencies";
import type {
  Cell,
  GameState,
  PendingResult,
  SavedResultRef,
} from "@/domain/game/model";

export const FIXED_GAME_ID = "00000000-0000-4000-8000-000000000001";
export const FIXED_ACHIEVED_AT = "2026-10-20T12:00:00.000Z";

export function createFakeDependencies(
  positions: readonly Cell[] = [{ x: 15, y: 10 }],
): GameDependencies {
  let positionIndex = 0;
  return {
    clock: { now: () => new Date(FIXED_ACHIEVED_AT) },
    uuid: { create: () => FIXED_GAME_ID },
    positions: {
      nextAvailable: () => {
        const position =
          positions[Math.min(positionIndex, positions.length - 1)];
        positionIndex += 1;
        if (!position)
          throw new Error("La secuencia de posiciones está vacía.");
        return position;
      },
    },
  };
}

export function createPendingResult(): PendingResult {
  return {
    gameId: FIXED_GAME_ID,
    score: 30,
    achievedAt: FIXED_ACHIEVED_AT,
    aliasInput: "",
  };
}

export function createSavedResult(): SavedResultRef {
  return {
    gameId: FIXED_GAME_ID,
    alias: "Jugador",
    score: 30,
    achievedAt: FIXED_ACHIEVED_AT,
  };
}

export function createGameFixture(
  overrides: Partial<GameState> = {},
): GameState {
  return {
    gameId: FIXED_GAME_ID,
    status: "prepared",
    snake: {
      segments: [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 },
      ],
    },
    food: { x: 15, y: 10 },
    effectiveDirection: "right",
    pendingDirection: null,
    score: 0,
    finishedAt: null,
    finishReason: null,
    resultState: { status: "none" },
    restartConfirmation: false,
    ...overrides,
  };
}
