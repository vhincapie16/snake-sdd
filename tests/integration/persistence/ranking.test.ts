import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { createClient } from "@supabase/supabase-js";
import { SupabaseResultRepository } from "@/infrastructure/persistence/supabase-result-repository";
import { getRanking } from "@/application/use-cases/get-ranking";

describe("KAN-5 / T055: consulta PostgREST mediante SDK real y transporte simulado", () => {
  it.each([0, 3, 10])(
    "devuelve %i filas sin rellenar resultados",
    async (length) => {
      const rows = Array.from({ length }, (_, index) => ({
        game_id: `00500000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
        alias: "Repetido",
        score: 100,
        achieved_at: "2026-10-21T00:00:00Z",
      }));
      const transport = vi.fn<typeof fetch>(
        async () =>
          new Response(JSON.stringify(rows), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
      );
      const client = createClient(
        "https://fixture.supabase.co",
        "fictitious-test-key",
        {
          global: { fetch: transport },
          auth: { persistSession: false, autoRefreshToken: false },
        },
      );
      const entries = await getRanking(new SupabaseResultRepository(client));
      expect(entries).toHaveLength(length);
      expect(entries.map((entry) => entry.position)).toEqual(
        Array.from({ length }, (_, i) => i + 1),
      );
      const query = new URL(String(transport.mock.calls[0]![0])).searchParams;
      expect(query.get("order")).toBe("score.desc,achieved_at.asc,game_id.asc");
      expect(query.get("limit")).toBe("10");
      expect(query.get("select")).toBe("game_id,alias,score,achieved_at");
    },
  );
});
