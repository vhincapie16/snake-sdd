"use client";

import type { GameState } from "@/domain/game/model";
import { GameControls } from "@/presentation/components/game-controls";
import { GameStatus } from "@/presentation/components/game-status";
import { RestartConfirmation } from "@/presentation/components/restart-confirmation";
import { useSnakeGame } from "@/presentation/hooks/use-snake-game";

export function SnakeGame({
  initialState,
}: Readonly<{ initialState: GameState }>) {
  const game = useSnakeGame({ initialState });
  const saveUnavailable = game.state.resultState.status === "saveError";

  return (
    <main className="app-shell">
      <article className="game-card">
        <p className="eyebrow">Incremento HU-001 · KAN-2</p>
        <h1>Snake SDD</h1>
        <p>
          Controla el ciclo de la partida con teclado o botones. El movimiento y
          la persistencia se incorporarán en incrementos posteriores aprobados.
        </p>

        <GameStatus state={game.state} />
        <GameControls
          status={game.state.status}
          onStart={game.start}
          onTogglePause={game.togglePause}
          onRestart={game.requestRestart}
        />

        <p className="help">
          Teclas disponibles: <kbd>Enter</kbd> para iniciar, <kbd>Espacio</kbd>{" "}
          para pausar o reanudar y <kbd>R</kbd> para reiniciar.
        </p>

        {saveUnavailable ? (
          <p className="notice" role="alert">
            El guardado todavía no está disponible en este incremento. El
            resultado se conserva mientras esta pantalla permanezca abierta.
          </p>
        ) : null}

        <RestartConfirmation
          open={game.state.restartConfirmation}
          onSaveFirst={game.saveAndRestart}
          onDiscard={game.discardAndRestart}
          onCancel={game.cancelRestart}
        />
      </article>
    </main>
  );
}
