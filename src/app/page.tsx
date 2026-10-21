import type { GameDependencies } from "@/application/ports/game-dependencies";
import {
  BOARD_WIDTH,
  BOARD_HEIGHT,
  type Cell,
  type GameState,
} from "@/domain/game/model";
import { createInitialGame } from "@/domain/game/state-machine";
import { SnakeGame } from "@/presentation/components/snake-game";

function createServerDependencies(): GameDependencies {
  return {
    clock: { now: () => new Date() },
    uuid: { create: () => crypto.randomUUID() },
    positions: { nextAvailable: () => ({ x: 15, y: 10 }) },
  };
}

function createE2eFixture(fixture: string | undefined): GameState | undefined {
  if (process.env.E2E_FIXTURES !== "1") return undefined;
  if (
    fixture !== "pending-result" &&
    fixture !== "saved-result" &&
    fixture !== "food-and-score" &&
    fixture !== "almost-full-board"
  )
    return undefined;

  const state = createInitialGame(createServerDependencies());
  if (fixture === "food-and-score") return { ...state, food: { x: 11, y: 10 } };
  if (fixture === "almost-full-board") {
    const path: Cell[] = Array.from(
      { length: BOARD_WIDTH * BOARD_HEIGHT },
      (_, i) => {
        const y = Math.floor(i / BOARD_WIDTH);
        return {
          x:
            y % 2 === 0 ? i % BOARD_WIDTH : BOARD_WIDTH - 1 - (i % BOARD_WIDTH),
          y,
        };
      },
    );
    return {
      ...state,
      snake: { segments: path.slice(0, -1).reverse() as [Cell, ...Cell[]] },
      food: path.at(-1)!,
      effectiveDirection: "left",
      score: (path.length - 1 - state.snake.segments.length) * 10,
    };
  }
  const achievedAt = "2026-10-20T12:00:00.000Z";
  const result = {
    gameId: state.gameId,
    score: 30,
    achievedAt,
    aliasInput: "",
  };
  return {
    ...state,
    status: "finished",
    score: 30,
    finishedAt: achievedAt,
    finishReason: "wall",
    resultState:
      fixture === "saved-result"
        ? {
            status: "saved",
            result: {
              gameId: state.gameId,
              alias: "Fixture",
              score: 30,
              achievedAt,
            },
          }
        : { status: "pending", result },
  };
}

interface HomeProps {
  readonly searchParams: Promise<{ fixture?: string }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const parameters = await searchParams;
  const initialState =
    createE2eFixture(parameters.fixture) ??
    createInitialGame(createServerDependencies());
  return <SnakeGame initialState={initialState} />;
}
