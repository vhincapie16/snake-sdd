import type { Direction, GameState, GameStatus } from "@/domain/game/model";

const STATUS_LABEL: Readonly<Record<GameStatus, string>> = {
  prepared: "Preparada",
  running: "En curso",
  paused: "Pausada",
  finished: "Finalizada",
};

const DIRECTION_LABEL: Readonly<Record<Direction, string>> = {
  up: "Arriba",
  down: "Abajo",
  left: "Izquierda",
  right: "Derecha",
};

export function GameStatus({ state }: Readonly<{ state: GameState }>) {
  return (
    <section aria-label="Estado de la partida" className="status-grid">
      <div className="status-item" role="status" aria-live="polite">
        <span className="status-label">Estado</span>
        <strong>{STATUS_LABEL[state.status]}</strong>
      </div>
      <div className="status-item" aria-live="polite">
        <span className="status-label">Puntuación</span>
        <strong data-testid="score">{state.score}</strong>
      </div>
      <div className="status-item">
        <span className="status-label">Longitud</span>
        <strong data-testid="snake-length">
          {state.snake.segments.length}
        </strong>
      </div>
      {state.finishReason === "boardCompleted" ? (
        <p>Tablero completado</p>
      ) : null}
      <div className="status-item">
        <span className="status-label">Ritmo</span>
        <strong>150 ms (constante)</strong>
      </div>
      <div className="status-item" aria-live="polite">
        <span className="status-label">Dirección aceptada</span>
        <strong data-testid="accepted-direction">
          {DIRECTION_LABEL[state.pendingDirection ?? state.effectiveDirection]}
        </strong>
      </div>
      <div className="status-item">
        <span className="status-label">Cabeza</span>
        <strong data-testid="snake-head">
          {state.snake.segments[0].x},{state.snake.segments[0].y}
        </strong>
      </div>
    </section>
  );
}
