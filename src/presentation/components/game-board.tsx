import { BOARD_HEIGHT, BOARD_WIDTH, type GameState } from "@/domain/game/model";

export function GameBoard({ state }: Readonly<{ state: GameState }>) {
  return (
    <figure>
      <svg
        className="game-board"
        viewBox={`0 0 ${BOARD_WIDTH} ${BOARD_HEIGHT}`}
        role="img"
        aria-label="Tablero de Snake: cabeza triangular, cuerpo circular y alimento en rombo"
      >
        {state.snake.segments.map((cell, index) => (
          <text
            key={`${index}-${cell.x}-${cell.y}`}
            x={cell.x + 0.5}
            y={cell.y + 0.75}
            className="snake-cell"
            data-testid="snake-segment"
            data-cell={`${cell.x},${cell.y}`}
          >
            {index === 0 ? "▲" : "●"}
          </text>
        ))}
        {state.food ? (
          <text
            x={state.food.x + 0.5}
            y={state.food.y + 0.75}
            className="food-cell"
            data-testid="food-cell"
            data-cell={`${state.food.x},${state.food.y}`}
          >
            ◆
          </text>
        ) : null}
      </svg>
      <figcaption>▲ Cabeza · ● Cuerpo · ◆ Alimento</figcaption>
    </figure>
  );
}
