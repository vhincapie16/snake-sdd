"use client";

import { useCallback, useEffect, useMemo, useReducer } from "react";
import type { GameDependencies } from "@/application/ports/game-dependencies";
import {
  TICK_INTERVAL_MS,
  type Direction,
  type GameState,
  type PendingResult,
  type SavedResultRef,
} from "@/domain/game/model";
import {
  createInitialGame,
  transitionGame,
  type GameCommand,
} from "@/domain/game/state-machine";
import { listFreeCells } from "@/domain/game/food";
import { createBrowserGameId } from "@/infrastructure/random/browser-game-id";

export type SaveResult = (result: PendingResult) => Promise<SavedResultRef>;

export interface UseSnakeGameOptions {
  readonly initialState?: GameState;
  readonly saveResult?: SaveResult;
}

const DIRECTION_BY_KEY: Readonly<Partial<Record<string, Direction>>> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
};

function createBrowserDependencies(): GameDependencies {
  return {
    clock: { now: () => new Date() },
    uuid: { create: createBrowserGameId },
    positions: {
      nextAvailable: (occupied) => {
        const free = listFreeCells(occupied);
        const food = free[Math.floor(Math.random() * free.length)];
        if (!food) throw new Error("No quedan celdas libres para alimento.");
        return food;
      },
    },
  };
}

export function useSnakeGame(options: UseSnakeGameOptions = {}) {
  const saveResult = options.saveResult;
  const dependencies = useMemo(() => createBrowserDependencies(), []);
  const [state, dispatch] = useReducer(
    (current: GameState, command: GameCommand) =>
      transitionGame(current, command, dependencies),
    options.initialState ?? createInitialGame(dependencies),
  );

  useEffect(() => {
    if (state.status !== "running") return;
    const timer = window.setInterval(
      () => dispatch({ type: "TICK" }),
      TICK_INTERVAL_MS,
    );
    return () => window.clearInterval(timer);
  }, [state.status]);

  useEffect(() => {
    if (state.resultState.status !== "saving") return;
    let active = true;
    const pending = state.resultState.result;

    if (!saveResult) {
      dispatch({ type: "SAVE_FAILED", errorCode: "PERSISTENCE_NOT_AVAILABLE" });
      return;
    }

    void saveResult(pending)
      .then((result) => {
        if (active) dispatch({ type: "SAVE_SUCCEEDED", result });
      })
      .catch(() => {
        if (active)
          dispatch({
            type: "SAVE_FAILED",
            errorCode: "PERSISTENCE_UNAVAILABLE",
          });
      });

    return () => {
      active = false;
    };
  }, [saveResult, state.resultState]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.repeat) return;
      const requestedDirection = DIRECTION_BY_KEY[event.key];
      if (requestedDirection && state.status === "running") {
        event.preventDefault();
        dispatch({ type: "QUEUE_DIRECTION", direction: requestedDirection });
        return;
      }
      if (event.key === "Enter" && state.status === "prepared") {
        event.preventDefault();
        dispatch({ type: "START" });
        return;
      }
      if (event.code === "Space") {
        event.preventDefault();
        dispatch({ type: "TOGGLE_PAUSE" });
      }
      if (event.key.toLowerCase() === "r")
        dispatch({ type: "REQUEST_RESTART" });
    },
    [state.status],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return {
    state,
    start: () => dispatch({ type: "START" }),
    togglePause: () => dispatch({ type: "TOGGLE_PAUSE" }),
    requestRestart: () => dispatch({ type: "REQUEST_RESTART" }),
    saveAndRestart: () => dispatch({ type: "CONFIRM_SAVE_AND_RESTART" }),
    discardAndRestart: () => dispatch({ type: "CONFIRM_DISCARD_AND_RESTART" }),
    cancelRestart: () => dispatch({ type: "CANCEL_RESTART" }),
  };
}
