"use client";

import type { GameState } from "@/domain/game/model";
import { GameControls } from "@/presentation/components/game-controls";
import { GameStatus } from "@/presentation/components/game-status";
import { GameBoard } from "@/presentation/components/game-board";
import { GameResult } from "@/presentation/components/game-result";
import { RestartConfirmation } from "@/presentation/components/restart-confirmation";
import { useSnakeGame } from "@/presentation/hooks/use-snake-game";
import { ResultForm } from "@/presentation/components/result-form";
import { Ranking } from "@/presentation/components/ranking";

export function SnakeGame({
  initialState,
}: Readonly<{ initialState: GameState }>) {
  const game = useSnakeGame({ initialState });

  return (
    <main className="app-shell">
      <article className="game-card">
        <p className="eyebrow">Incremento HU-005 · KAN-5</p>
        <h1>Snake SDD</h1>
        <p>
          Consume alimentos para crecer y sumar 10 puntos por alimento, a ritmo
          constante. Chocar con una pared o con el cuerpo termina la partida.
        </p>

        <GameStatus state={game.state} />
        <GameBoard state={game.state} />
        <GameResult state={game.state} />
        {game.state.status === "finished" ? (
          <ResultForm
            resultState={game.state.resultState}
            onAliasChange={game.updateAlias}
            onSave={game.saveResult}
          />
        ) : null}
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

        {game.state.status === "prepared" ||
        game.state.status === "finished" ? (
          <Ranking key={game.state.gameId} />
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
