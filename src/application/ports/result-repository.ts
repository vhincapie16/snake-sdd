import type { RecordedResult } from "@/domain/results/result";

export type SaveResultOutcome =
  | {
      readonly status: "created" | "alreadyRecorded";
      readonly result: RecordedResult;
    }
  | { readonly status: "conflict" };

export interface ResultRepository {
  save(result: RecordedResult): Promise<SaveResultOutcome>;
  top10(): Promise<readonly RecordedResult[]>;
}

export class PersistenceUnavailableError extends Error {
  constructor() {
    super("El almacenamiento de resultados no está disponible.");
    this.name = "PersistenceUnavailableError";
  }
}
