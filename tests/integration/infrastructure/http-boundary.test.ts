import { describe, expect, it } from "vitest";
import { controlledErrorResponse } from "@/infrastructure/http/error-response";
import {
  MAX_REQUEST_BODY_BYTES,
  readLimitedJson,
} from "@/infrastructure/http/request-body";

describe("Fundamentos / T013: límite HTTP y errores controlados", () => {
  it("lee JSON válido dentro del límite", async () => {
    const request = new Request("http://localhost/api/results", {
      method: "POST",
      body: JSON.stringify({ alias: "Snake" }),
      headers: { "content-type": "application/json" },
    });

    await expect(readLimitedJson(request)).resolves.toEqual({ alias: "Snake" });
  });

  it("rechaza el byte 4097 antes de analizar JSON", async () => {
    const request = new Request("http://localhost/api/results", {
      method: "POST",
      body: "x".repeat(MAX_REQUEST_BODY_BYTES + 1),
    });

    await expect(readLimitedJson(request)).rejects.toMatchObject({
      code: "PAYLOAD_TOO_LARGE",
    });
  });

  it("rechaza JSON inválido con un mensaje controlado", async () => {
    const request = new Request("http://localhost/api/results", {
      method: "POST",
      body: "{",
    });

    await expect(readLimitedJson(request)).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
    });
  });

  it.each([
    ["METHOD_NOT_ALLOWED", 405, false],
    ["RESULT_CONFLICT", 409, false],
    ["PAYLOAD_TOO_LARGE", 413, false],
    ["VALIDATION_ERROR", 422, false],
    ["PERSISTENCE_UNAVAILABLE", 503, true],
  ] as const)("traduce %s a HTTP %i", async (code, status, retryable) => {
    const issues = [{ field: "alias" as const, code: "INVALID_ALIAS" }];
    const response = controlledErrorResponse(
      code,
      "Mensaje controlado",
      issues,
    );
    expect(response.status).toBe(status);
    await expect(response.json()).resolves.toEqual({
      code,
      message: "Mensaje controlado",
      retryable,
      ...(code === "VALIDATION_ERROR" ? { issues } : {}),
    });
  });
});
