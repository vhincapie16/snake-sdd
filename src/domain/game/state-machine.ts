import {
  areCellsEqual,
  isCellInsideBoard,
  type Cell,
  type GameState,
  type SavedResultRef,
} from "@/domain/game/model";

export interface GameTransitionDependencies {
  readonly clock: { now(): Date };
  readonly uuid: { create(): string };
  readonly positions: { nextAvailable(occupied: readonly Cell[]): Cell };
}

export type GameCommand =
  | { readonly type: "START" }
  | { readonly type: "TOGGLE_PAUSE" }
  | { readonly type: "REQUEST_RESTART" }
  | { readonly type: "SAVE_RESULT" }
  | { readonly type: "CONFIRM_SAVE_AND_RESTART" }
  | { readonly type: "CONFIRM_DISCARD_AND_RESTART" }
  | { readonly type: "CANCEL_RESTART" }
  | { readonly type: "SAVE_SUCCEEDED"; readonly result: SavedResultRef }
  | { readonly type: "SAVE_FAILED"; readonly errorCode: string }
  | { readonly type: "TICK" };

const INITIAL_SEGMENTS = [
  { x: 10, y: 10 },
  { x: 9, y: 10 },
  { x: 8, y: 10 },
] as const;

export function createInitialGame(
  dependencies: GameTransitionDependencies,
): GameState {
  const food = dependencies.positions.nextAvailable(INITIAL_SEGMENTS);
  if (
    !isCellInsideBoard(food) ||
    INITIAL_SEGMENTS.some((segment) => areCellsEqual(segment, food))
  ) {
    throw new Error("El generador produjo una configuración inicial inválida.");
  }

  return {
    gameId: dependencies.uuid.create(),
    status: "prepared",
    snake: { segments: INITIAL_SEGMENTS },
    food,
    effectiveDirection: "right",
    pendingDirection: null,
    score: 0,
    finishedAt: null,
    finishReason: null,
    resultState: { status: "none" },
    restartConfirmation: false,
  };
}

function requestRestart(
  state: GameState,
  dependencies: GameTransitionDependencies,
): GameState {
  if (state.status !== "finished") return createInitialGame(dependencies);
  if (
    state.resultState.status === "saved" ||
    state.resultState.status === "none"
  ) {
    return createInitialGame(dependencies);
  }
  if (
    state.resultState.status === "pending" ||
    state.resultState.status === "saveError"
  ) {
    return { ...state, restartConfirmation: true };
  }
  return state;
}

function beginSaving(state: GameState, restartAfterSave: boolean): GameState {
  if (state.status !== "finished") return state;
  if (
    state.resultState.status !== "pending" &&
    state.resultState.status !== "saveError"
  ) {
    return state;
  }
  return {
    ...state,
    restartConfirmation: false,
    resultState: {
      status: "saving",
      result: state.resultState.result,
      restartAfterSave,
    },
  };
}

export function transitionGame(
  state: GameState,
  command: GameCommand,
  dependencies: GameTransitionDependencies,
): GameState {
  switch (command.type) {
    case "START":
      return state.status === "prepared"
        ? { ...state, status: "running" }
        : state;
    case "TOGGLE_PAUSE":
      if (state.status === "running") return { ...state, status: "paused" };
      if (state.status === "paused") return { ...state, status: "running" };
      return state;
    case "REQUEST_RESTART":
      return requestRestart(state, dependencies);
    case "SAVE_RESULT":
      return beginSaving(state, false);
    case "CONFIRM_SAVE_AND_RESTART":
      return state.restartConfirmation ? beginSaving(state, true) : state;
    case "CONFIRM_DISCARD_AND_RESTART":
      return state.status === "finished" && state.restartConfirmation
        ? createInitialGame(dependencies)
        : state;
    case "CANCEL_RESTART":
      return state.status === "finished" && state.restartConfirmation
        ? { ...state, restartConfirmation: false }
        : state;
    case "SAVE_SUCCEEDED":
      if (state.status !== "finished" || state.resultState.status !== "saving")
        return state;
      if (state.resultState.restartAfterSave)
        return createInitialGame(dependencies);
      return {
        ...state,
        resultState: { status: "saved", result: command.result },
      };
    case "SAVE_FAILED":
      if (state.status !== "finished" || state.resultState.status !== "saving")
        return state;
      return {
        ...state,
        restartConfirmation: false,
        resultState: {
          status: "saveError",
          result: state.resultState.result,
          errorCode: command.errorCode,
        },
      };
    case "TICK":
      // El desplazamiento se incorpora en HU-002; el ciclo mantiene un tick único y estable.
      return state;
  }
}
