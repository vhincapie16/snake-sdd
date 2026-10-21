import { describe, expect, it } from "vitest";
import { transitionGame } from "@/domain/game/state-machine";
import {
  createFakeDependencies,
  createGameFixture,
  createPendingResult,
  createSavedResult,
} from "@tests/helpers/game-fixtures";

describe("HU-001 / RF-005 y RF-030: reinicio protegido", () => {
  it.each(["prepared", "running", "paused"] as const)(
    "reinicia directamente desde %s",
    (status) => {
      const dependencies = createFakeDependencies();
      const state = createGameFixture({
        status,
        score: status === "prepared" ? 0 : 20,
      });
      const restarted = transitionGame(
        state,
        { type: "REQUEST_RESTART" },
        dependencies,
      );

      expect(restarted).toMatchObject({
        status: "prepared",
        score: 0,
        resultState: { status: "none" },
        restartConfirmation: false,
      });
    },
  );

  it("abre exactamente la confirmación cuando existe un resultado pendiente", () => {
    const dependencies = createFakeDependencies();
    const pending = createPendingResult();
    const finished = createGameFixture({
      status: "finished",
      score: pending.score,
      finishedAt: pending.achievedAt,
      finishReason: "wall",
      resultState: { status: "pending", result: pending },
    });

    const confirmation = transitionGame(
      finished,
      { type: "REQUEST_RESTART" },
      dependencies,
    );
    expect(confirmation.restartConfirmation).toBe(true);
    expect(confirmation.resultState).toEqual({
      status: "pending",
      result: pending,
    });

    const cancelled = transitionGame(
      confirmation,
      { type: "CANCEL_RESTART" },
      dependencies,
    );
    expect(cancelled).toEqual({ ...finished, restartConfirmation: false });

    const discarded = transitionGame(
      confirmation,
      { type: "CONFIRM_DISCARD_AND_RESTART" },
      dependencies,
    );
    expect(discarded).toMatchObject({ status: "prepared", score: 0 });
  });

  it("conserva el pendiente si Guardar primero falla", () => {
    const dependencies = createFakeDependencies();
    const pending = createPendingResult();
    const confirmation = createGameFixture({
      status: "finished",
      score: pending.score,
      finishedAt: pending.achievedAt,
      finishReason: "self",
      resultState: { status: "pending", result: pending },
      restartConfirmation: true,
    });

    const saving = transitionGame(
      confirmation,
      { type: "CONFIRM_SAVE_AND_RESTART" },
      dependencies,
    );
    expect(saving.resultState).toEqual({
      status: "saving",
      result: pending,
      restartAfterSave: true,
    });

    const failed = transitionGame(
      saving,
      { type: "SAVE_FAILED", errorCode: "PERSISTENCE_NOT_AVAILABLE" },
      dependencies,
    );
    expect(failed).toMatchObject({
      status: "finished",
      resultState: { status: "saveError", result: pending },
      restartConfirmation: false,
    });
  });

  it("reinicia tras confirmar el guardado y directamente cuando ya estaba saved", () => {
    const dependencies = createFakeDependencies();
    const pending = createPendingResult();
    const saved = createSavedResult();
    const saving = createGameFixture({
      status: "finished",
      resultState: {
        status: "saving",
        result: pending,
        restartAfterSave: true,
      },
    });
    const restartedAfterSave = transitionGame(
      saving,
      { type: "SAVE_SUCCEEDED", result: saved },
      dependencies,
    );
    expect(restartedAfterSave.status).toBe("prepared");

    const alreadySaved = createGameFixture({
      status: "finished",
      resultState: { status: "saved", result: saved },
    });
    const directRestart = transitionGame(
      alreadySaved,
      { type: "REQUEST_RESTART" },
      dependencies,
    );
    expect(directRestart.status).toBe("prepared");
    expect(directRestart.restartConfirmation).toBe(false);
  });
});
