import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import {
  postResult,
  rankingResponse,
  methodNotAllowed,
} from "@/infrastructure/http/results-handlers";
import type {
  ResultRepository,
  SaveResultOutcome,
} from "@/application/ports/result-repository";

const result = {
  gameId: "00000000-0000-4000-8000-000000000001",
  alias: "Ana",
  score: 0,
  achievedAt: "2026-10-21T12:00:00.000Z",
};
function boundary(outcome: SaveResultOutcome = { status: "created", result }) {
  const repository: ResultRepository = {
    save: vi.fn(async () => outcome),
    top10: vi.fn(async () => [result]),
  };
  return { repository, factory: vi.fn(() => repository) };
}
function request(body: unknown, type = "application/json") {
  return new Request("http://localhost/api/results", {
    method: "POST",
    headers: { "content-type": type },
    body: JSON.stringify(body),
  });
}

describe("HU-005 / T054: contrato HTTP con puerto de persistencia explícitamente doblado", () => {
  it.each(["created", "alreadyRecorded"] as const)(
    "devuelve %s y el esquema cerrado de resultado",
    async (status) => {
      const { factory } = boundary({ status, result });
      const response = await postResult(
        request({ ...result, alias: "  Ana  " }),
        factory,
      );
      expect(response.status).toBe(status === "created" ? 201 : 200);
      expect(await response.json()).toEqual({ status, result });
    },
  );
  it("devuelve 409 sin sobrescribir", async () => {
    const { factory } = boundary({ status: "conflict" });
    const response = await postResult(request(result), factory);
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      code: "RESULT_CONFLICT",
      retryable: false,
      message: expect.any(String),
    });
  });
  it("acepta exactamente 4096 bytes y rechaza 4097 antes de validar o crear el repositorio", async () => {
    const padding = 4096 - Buffer.byteLength(JSON.stringify(result));
    const { factory, repository } = boundary();
    expect(
      (
        await postResult(
          request({ ...result, alias: `Ana${" ".repeat(padding)}` }),
          factory,
        )
      ).status,
    ).toBe(201);
    expect(repository.save).toHaveBeenCalledWith(result);
    factory.mockClear();
    const response = await postResult(
      request({ ...result, alias: `Ana${" ".repeat(padding + 1)}` }),
      factory,
    );
    expect(response.status).toBe(413);
    expect(await response.json()).toEqual({
      code: "PAYLOAD_TOO_LARGE",
      retryable: false,
      message: expect.any(String),
    });
    expect(factory).not.toHaveBeenCalled();
  });
  it.each([
    { ...result, alias: "" },
    { ...result, score: -10 },
    { ...result, extra: true },
  ])("devuelve 422 corregible y no persiste %j", async (body) => {
    const { factory } = boundary();
    const response = await postResult(request(body), factory);
    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({
      code: "VALIDATION_ERROR",
      retryable: false,
      message: expect.any(String),
      issues: expect.arrayContaining([
        {
          field: expect.stringMatching(/^(alias|score|gameId|achievedAt)$/),
          code: expect.any(String),
        },
      ]),
    });
    expect(factory).not.toHaveBeenCalled();
  });
  it("rechaza JSON inválido y tipos de contenido ajenos al contrato", async () => {
    const { factory } = boundary();
    expect(
      (
        await postResult(
          new Request("http://localhost/api/results", {
            method: "POST",
            body: "{",
          }),
          factory,
        )
      ).status,
    ).toBe(422);
    expect(
      (await postResult(request(result, "text/plain"), factory)).status,
    ).toBe(422);
    expect(factory).not.toHaveBeenCalled();
  });
  it("GET devuelve entries, posiciones derivadas y no cachea el ranking", async () => {
    const { factory } = boundary();
    const response = await rankingResponse(factory);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      entries: [{ ...result, position: 1 }],
    });
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
  it("405 incluye Allow y el esquema contractual", async () => {
    const response = methodNotAllowed("POST");
    expect(response.status).toBe(405);
    expect(response.headers.get("allow")).toBe("POST");
    expect(await response.json()).toEqual({
      code: "METHOD_NOT_ALLOWED",
      retryable: false,
      message: expect.any(String),
    });
  });
  it("503 es reintentable y nunca filtra detalles de la excepción", async () => {
    const factory = () => {
      throw new Error("fictitious-private-detail");
    };
    for (const response of [
      await postResult(request(result), factory),
      await rankingResponse(factory),
    ]) {
      expect(response.status).toBe(503);
      expect(await response.json()).toEqual({
        code: "PERSISTENCE_UNAVAILABLE",
        retryable: true,
        message: expect.any(String),
      });
    }
  });
});
