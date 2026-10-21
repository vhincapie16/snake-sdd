import { normalizeResult, type RecordedResult } from "@/domain/results/result";
import {
  PersistenceUnavailableError,
  type ResultRepository,
  type SaveResultOutcome,
} from "@/application/ports/result-repository";

export async function saveResult(
  repository: ResultRepository,
  input: RecordedResult,
): Promise<SaveResultOutcome> {
  const result = normalizeResult(input);
  try {
    return await repository.save(result);
  } catch {
    throw new PersistenceUnavailableError();
  }
}
