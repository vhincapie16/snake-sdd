import type { FinishReason, GameState } from "@/domain/game/model";

const FINISH_LABEL: Readonly<Record<FinishReason, string>> = {
  wall: "Colisión con pared",
  self: "Colisión con el cuerpo",
  boardCompleted: "Tablero completado",
};

export function GameResult({ state }: Readonly<{ state: GameState }>) {
  if (state.status !== "finished" || state.finishReason === null) return null;
  return (
    <section aria-labelledby="game-result-title" className="notice">
      <h2 id="game-result-title">Partida terminada</h2>
      <p data-testid="finish-reason">{FINISH_LABEL[state.finishReason]}</p>
      <p>
        Puntuación final:{" "}
        <strong data-testid="final-score">{state.score}</strong>
      </p>
      <p>
        Usa Reiniciar o R para preparar otra partida. Si hay un resultado
        pendiente, confirma qué hacer antes de reiniciar. Después pulsa Enter
        para comenzar.
      </p>
    </section>
  );
}
