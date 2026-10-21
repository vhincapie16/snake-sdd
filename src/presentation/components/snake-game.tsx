"use client";

import type { GameState } from "@/domain/game/model";
import { GameControls } from "@/presentation/components/game-controls";
import { GameStatus } from "@/presentation/components/game-status";
import { GameBoard } from "@/presentation/components/game-board";
import { GameResult } from "@/presentation/components/game-result";
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
        <p className="eyebrow">Incremento HU-004 · KAN-4</p>
        <h1>Snake SDD</h1>
        <p>
          Consume alimentos para crecer y sumar 10 puntos por alimento, a ritmo
          constante. Chocar con una pared o con el cuerpo termina la partida.
        </p>

        <GameStatus state={game.state} />
        <GameBoard state={game.state} />
        <GameResult state={game.state} />
        <GameControls
          status={game.state.status}
          onStart={game.start}
          onTogglePause={game.togglePause}
          onRestart={game.requestRestart}
        />

        <p className="help">
          Teclas disponibles: <kbd>Enter</kbd> para iniciar, <kbd>Espacio</kbd>{" "}
          para pausar o reanudar, <kbd>R</kbd> para reiniciar y las cuatro
          flechas para dirigir la serpiente durante la partida.
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
