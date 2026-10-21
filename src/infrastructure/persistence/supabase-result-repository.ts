import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  PersistenceUnavailableError,
  type ResultRepository,
  type SaveResultOutcome,
} from "@/application/ports/result-repository";
import { normalizeResult, type RecordedResult } from "@/domain/results/result";

const COLUMNS = "game_id,alias,score,achieved_at";
interface ResultRow {
  game_id: string;
  alias: string;
  score: number;
  achieved_at: string;
}
function fromRow(row: ResultRow): RecordedResult {
  return normalizeResult({
    gameId: row.game_id,
    alias: row.alias,
    score: row.score,
    achievedAt: row.achieved_at,
  });
}

export class SupabaseResultRepository implements ResultRepository {
  constructor(private readonly client: SupabaseClient) {}

  async save(input: RecordedResult): Promise<SaveResultOutcome> {
    const result = normalizeResult(input);
    const { data, error } = await this.client
      .from("game_results")
      .insert({
        game_id: result.gameId,
        alias: result.alias,
        score: result.score,
        achieved_at: result.achievedAt,
      })
      .select(COLUMNS)
      .single<ResultRow>();
    if (!error && data) return { status: "created", result: fromRow(data) };
    if (error?.code !== "23505") throw new PersistenceUnavailableError();
    const existing = await this.client
      .from("game_results")
      .select(COLUMNS)
      .eq("game_id", result.gameId)
      .single<ResultRow>();
    if (existing.error || !existing.data)
      throw new PersistenceUnavailableError();
    const saved = fromRow(existing.data);
    if (
      saved.alias !== result.alias ||
      saved.score !== result.score ||
      saved.achievedAt !== result.achievedAt
    )
      return { status: "conflict" };
    return { status: "alreadyRecorded", result: saved };
  }

  async top10(): Promise<readonly RecordedResult[]> {
    const { data, error } = await this.client
      .from("game_results")
      .select(COLUMNS)
      .order("score", { ascending: false })
      .order("achieved_at", { ascending: true })
      .order("game_id", { ascending: true })
      .limit(10);
    if (error || !data) throw new PersistenceUnavailableError();
    return (data as ResultRow[]).map(fromRow);
  }
}
