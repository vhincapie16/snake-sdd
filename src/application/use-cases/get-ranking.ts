import {
  PersistenceUnavailableError,
  type ResultRepository,
} from "@/application/ports/result-repository";
import type { RankingEntry } from "@/domain/results/result";

export async function getRanking(
  repository: ResultRepository,
): Promise<readonly RankingEntry[]> {
  try {
    return (await repository.top10())
      .slice(0, 10)
      .map((result, index) => ({ ...result, position: index + 1 }));
  } catch {
    throw new PersistenceUnavailableError();
  }
}
