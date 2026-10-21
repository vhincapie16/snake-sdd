import { describe, expect, it } from "vitest";
import { transitionGame } from "@/domain/game/state-machine";
import {
  createFakeDependencies,
  createGameFixture,
  createPendingResult,
  createSavedResult,
} from "@tests/helpers/game-fixtures";

describe("HU-005 / RF-030 y RF-031: Guardar primero y reintento", () => {
  it("conserva fallo y pendiente, admite corregir el alias y reinicia solo al confirmar guardado", () => {
    const dependencies = createFakeDependencies();
    const result = createPendingResult();
    const state = createGameFixture({
      status: "finished",
      resultState: { status: "pending", result },
      restartConfirmation: true,
    });
    const saving = transitionGame(
      state,
      { type: "CONFIRM_SAVE_AND_RESTART" },
      dependencies,
    );
    const failed = transitionGame(
      saving,
      { type: "SAVE_FAILED", errorCode: "VALIDATION_ERROR" },
      dependencies,
    );
    expect(failed).toMatchObject({
      status: "finished",
      resultState: { status: "saveError", result },
    });
    const corrected = transitionGame(
      failed,
      { type: "UPDATE_ALIAS", alias: "Ana" },
      dependencies,
    );
    expect(corrected.resultState).toMatchObject({
      result: { ...result, aliasInput: "Ana" },
    });
    const confirmation = transitionGame(
      corrected,
      { type: "REQUEST_RESTART" },
      dependencies,
    );
    const retry = transitionGame(
      confirmation,
      { type: "CONFIRM_SAVE_AND_RESTART" },
      dependencies,
    );
    expect(retry.status).toBe("finished");
    const prepared = transitionGame(
      retry,
      { type: "SAVE_SUCCEEDED", result: createSavedResult() },
      dependencies,
    );
    expect(prepared).toMatchObject({
      status: "prepared",
      score: 0,
      resultState: { status: "none" },
    });
  });
  it("reinicia un resultado guardado directamente sin confirmación", () => {
    const state = createGameFixture({
      status: "finished",
      resultState: { status: "saved", result: createSavedResult() },
    });
    expect(
      transitionGame(
        state,
        { type: "REQUEST_RESTART" },
        createFakeDependencies(),
      ),
    ).toMatchObject({ status: "prepared", restartConfirmation: false });
  });
});
