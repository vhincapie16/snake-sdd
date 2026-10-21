import { describe, expect, it } from "vitest";
import { createInitialGame, transitionGame } from "@/domain/game/state-machine";
import {
  createFakeDependencies,
  createGameFixture,
  createPendingResult,
  createSavedResult,
} from "@tests/helpers/game-fixtures";

describe("HU-005 / RF-021: pendiente corregible solo en memoria", () => {
  it("mantiene el mismo pendiente durante saving/saveError y rechaza solicitudes duplicadas", () => {
    const dependencies = createFakeDependencies();
    const pending = { ...createPendingResult(), score: 0, aliasInput: "Ana" };
    const state = createGameFixture({
      status: "finished",
      resultState: { status: "pending", result: pending },
    });
    const saving = transitionGame(state, { type: "SAVE_RESULT" }, dependencies);
    expect(saving.resultState).toEqual({
      status: "saving",
      result: pending,
      restartAfterSave: false,
    });
    expect(transitionGame(saving, { type: "SAVE_RESULT" }, dependencies)).toBe(
      saving,
    );
    expect(
      transitionGame(saving, { type: "REQUEST_RESTART" }, dependencies),
    ).toBe(saving);
    const failed = transitionGame(
      saving,
      { type: "SAVE_FAILED", errorCode: "PERSISTENCE_UNAVAILABLE" },
      dependencies,
    );
    expect(failed.resultState).toMatchObject({
      status: "saveError",
      result: pending,
    });
    const retry = transitionGame(failed, { type: "SAVE_RESULT" }, dependencies);
    const saved = transitionGame(
      retry,
      {
        type: "SAVE_SUCCEEDED",
        result: { ...createSavedResult(), score: 0, alias: "Ana" },
      },
      dependencies,
    );
    expect(saved.resultState).toMatchObject({
      status: "saved",
      result: { score: 0, alias: "Ana" },
    });
    expect(transitionGame(saved, { type: "SAVE_RESULT" }, dependencies)).toBe(
      saved,
    );
  });
  it("modifica solo el alias y conserva inmutable puntuación, identificador y fecha", () => {
    const result = createPendingResult();
    const state = createGameFixture({
      status: "finished",
      resultState: { status: "pending", result },
    });
    const changed = transitionGame(
      state,
      { type: "UPDATE_ALIAS", alias: "Ana R" },
      createFakeDependencies(),
    );
    expect(changed.resultState).toEqual({
      status: "pending",
      result: { ...result, aliasInput: "Ana R" },
    });
    expect(state.resultState).toEqual({ status: "pending", result });
    expect(result.aliasInput).toBe("");
  });
  it("ignora edición durante saving y saved", () => {
    const result = createPendingResult();
    for (const resultState of [
      { status: "saving", result, restartAfterSave: false },
      { status: "saved", result: createSavedResult() },
    ] as const) {
      const state = createGameFixture({ status: "finished", resultState });
      expect(
        transitionGame(
          state,
          { type: "UPDATE_ALIAS", alias: "Nuevo" },
          createFakeDependencies(),
        ),
      ).toBe(state);
    }
  });
  it("una nueva carga no recupera un pendiente y descartar elimina su referencia", () => {
    const dependencies = createFakeDependencies();
    const state = createGameFixture({
      status: "finished",
      resultState: { status: "pending", result: createPendingResult() },
      restartConfirmation: true,
    });
    expect(createInitialGame(dependencies).resultState).toEqual({
      status: "none",
    });
    expect(
      transitionGame(
        state,
        { type: "CONFIRM_DISCARD_AND_RESTART" },
        dependencies,
      ).resultState,
    ).toEqual({ status: "none" });
  });
});
