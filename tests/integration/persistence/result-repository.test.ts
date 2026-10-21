import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { createClient } from "@supabase/supabase-js";
import { SupabaseResultRepository } from "@/infrastructure/persistence/supabase-result-repository";
import { PersistenceUnavailableError } from "@/application/ports/result-repository";

export const row = {
  game_id: "00500000-0000-4000-8000-000000000001",
  alias: "Ana",
  score: 0,
  achieved_at: "2026-10-21T12:00:00+00:00",
};
export const result = {
  gameId: row.game_id,
  alias: row.alias,
  score: row.score,
  achievedAt: "2026-10-21T12:00:00.000Z",
};
export function repositoryWithTransport(fetcher: typeof fetch) {
  return new SupabaseResultRepository(
    createClient("https://fixture.supabase.co", "fictitious-test-key", {
      global: { fetch: fetcher },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }),
  );
}
export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("KAN-5 / T056: adaptador con SDK real y transporte PostgREST simulado; no acredita persistencia remota", () => {
  it("inserta primero y limita las columnas de retorno", async () => {
    const transport = vi.fn<typeof fetch>(async () => json(row, 201));
    expect(await repositoryWithTransport(transport).save(result)).toEqual({
      status: "created",
      result,
    });
    expect(transport).toHaveBeenCalledTimes(1);
    expect(transport.mock.calls[0]![1]?.method).toBe("POST");
    expect(JSON.parse(transport.mock.calls[0]![1]?.body as string)).toEqual({
      ...row,
      achieved_at: result.achievedAt,
    });
    expect(
      new URL(String(transport.mock.calls[0]![0])).searchParams.get("select"),
    ).toBe("game_id,alias,score,achieved_at");
  });
  it.each([false, true])(
    "tras 23505 compara el resultado, conflicto=%s; nunca actualiza",
    async (conflict) => {
      const transport = vi
        .fn<typeof fetch>()
        .mockResolvedValueOnce(json({ code: "23505" }, 409))
        .mockResolvedValueOnce(
          json({ ...row, alias: conflict ? "Otra" : row.alias }),
        );
      const outcome = await repositoryWithTransport(transport).save(result);
      expect(outcome).toEqual(
        conflict
          ? { status: "conflict" }
          : { status: "alreadyRecorded", result },
      );
      expect(transport.mock.calls.map((call) => call[1]?.method)).toEqual([
        "POST",
        "GET",
      ]);
      expect(
        new URL(String(transport.mock.calls[1]![0])).searchParams.get(
          "game_id",
        ),
      ).toBe(`eq.${result.gameId}`);
    },
  );
  it("conserva microsegundos al comparar el instante normalizado", async () => {
    const transport = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(json({ code: "23505" }, 409))
      .mockResolvedValueOnce(
        json({ ...row, achieved_at: "2026-10-21T12:00:00.123456+00:00" }),
      );
    const input = { ...result, achievedAt: "2026-10-21T12:00:00.123456Z" };
    expect(await repositoryWithTransport(transport).save(input)).toEqual({
      status: "alreadyRecorded",
      result: input,
    });
  });
  it("traduce errores del almacenamiento sin divulgar detalles", async () => {
    const transport = vi.fn<typeof fetch>(async () =>
      json({ code: "42501", message: "private-details" }, 403),
    );
    await expect(
      repositoryWithTransport(transport).save(result),
    ).rejects.toBeInstanceOf(PersistenceUnavailableError);
  });
});
