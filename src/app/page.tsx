import type { GameDependencies } from "@/application/ports/game-dependencies";
import type { GameState } from "@/domain/game/model";
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
  if (fixture !== "pending-result" && fixture !== "saved-result")
    return undefined;

  const state = createInitialGame(createServerDependencies());
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
