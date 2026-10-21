import type { GameStatus } from "@/domain/game/model";

interface GameControlsProps {
  readonly status: GameStatus;
  readonly onStart: () => void;
  readonly onTogglePause: () => void;
  readonly onRestart: () => void;
}

export function GameControls({
  status,
  onStart,
  onTogglePause,
  onRestart,
}: GameControlsProps) {
  const canTogglePause = status === "running" || status === "paused";
  return (
    <section aria-labelledby="controls-heading">
      <h2 id="controls-heading">Controles de partida</h2>
      <div className="controls">
        <button
          type="button"
          onClick={onStart}
          disabled={status !== "prepared"}
        >
          Iniciar (Enter)
        </button>
        <button
          type="button"
          onClick={onTogglePause}
          disabled={!canTogglePause}
        >
          {status === "paused" ? "Reanudar" : "Pausar"} (Espacio)
        </button>
        <button type="button" onClick={onRestart}>
          Reiniciar (R)
        </button>
      </div>
    </section>
  );
}
