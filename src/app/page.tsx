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
    fixture !== "almost-full-board" &&
    fixture !== "wall-collision" &&
    fixture !== "self-collision" &&
    fixture !== "tail-release"
  )
    return undefined;

  const state = createInitialGame(createServerDependencies());
  if (fixture === "wall-collision") {
    return {
      ...state,
      score: 30,
      snake: {
        segments: [
          { x: 19, y: 10 },
          { x: 18, y: 10 },
          { x: 17, y: 10 },
        ],
      },
    };
  }
  if (fixture === "self-collision") {
    return {
      ...state,
      score: 30,
      effectiveDirection: "up",
      snake: {
        segments: [
          { x: 2, y: 2 },
          { x: 2, y: 3 },
          { x: 3, y: 3 },
          { x: 3, y: 2 },
          { x: 3, y: 1 },
          { x: 2, y: 1 },
        ],
      },
    };
  }
  if (fixture === "tail-release") {
    return {
      ...state,
      score: 30,
      effectiveDirection: "left",
      snake: {
        segments: [
          { x: 1, y: 1 },
          { x: 1, y: 2 },
          { x: 0, y: 2 },
          { x: 0, y: 1 },
        ],
      },
    };
  }
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
