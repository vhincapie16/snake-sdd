import type { GameState, GameStatus } from "@/domain/game/model";

const STATUS_LABEL: Readonly<Record<GameStatus, string>> = {
  prepared: "Preparada",
  running: "En curso",
  paused: "Pausada",
  finished: "Finalizada",
};

export function GameStatus({ state }: Readonly<{ state: GameState }>) {
  return (
    <section aria-label="Estado de la partida" className="status-grid">
      <div className="status-item" role="status" aria-live="polite">
        <span className="status-label">Estado</span>
        <strong>{STATUS_LABEL[state.status]}</strong>
      </div>
      <div className="status-item">
        <span className="status-label">Puntuación</span>
        <strong data-testid="score">{state.score}</strong>
      </div>
      <div className="status-item">
        <span className="status-label">Ritmo</span>
        <strong>150 ms (constante)</strong>
      </div>
    </section>
  );
}
