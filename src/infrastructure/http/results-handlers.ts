import "server-only";
import type { ResultRepository } from "@/application/ports/result-repository";
import { saveResult } from "@/application/use-cases/save-result";
import { getRanking } from "@/application/use-cases/get-ranking";
import { ResultValidationError } from "@/domain/results/result";
import { controlledErrorResponse } from "@/infrastructure/http/error-response";
import {
  readLimitedJson,
  RequestBodyError,
} from "@/infrastructure/http/request-body";
import { parseResultRequest } from "@/infrastructure/validation/result-schema";
import { logServerError } from "@/infrastructure/observability/server-logger";

export function methodNotAllowed(allowed: "GET" | "POST"): Response {
  const response = controlledErrorResponse(
    "METHOD_NOT_ALLOWED",
    "Método no permitido.",
  );
  response.headers.set("Allow", allowed);
  return response;
}

export async function postResult(
  request: Request,
  factory: () => ResultRepository,
): Promise<Response> {
  try {
    const body = await readLimitedJson(request);
    if (
      request.headers
        .get("content-type")
        ?.split(";", 1)[0]
        ?.trim()
        .toLowerCase() !== "application/json"
    ) {
      throw new ResultValidationError([
        { field: "gameId", code: "INVALID_CONTENT_TYPE" },
      ]);
    }
    const input = parseResultRequest(body);
    const outcome = await saveResult(factory(), input);
    if (outcome.status === "conflict")
      return controlledErrorResponse(
        "RESULT_CONFLICT",
        "Esta partida ya tiene un resultado diferente. No se ha sobrescrito.",
      );
    return Response.json(outcome, {
      status: outcome.status === "created" ? 201 : 200,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof ResultValidationError)
      return controlledErrorResponse(
        "VALIDATION_ERROR",
        error.message,
        error.issues,
      );
    if (error instanceof RequestBodyError) {
      return controlledErrorResponse(
        error.code,
        error.message,
        error.code === "VALIDATION_ERROR"
          ? [{ field: "gameId", code: "INVALID_JSON" }]
          : undefined,
      );
    }
    logServerError("PERSISTENCE_UNAVAILABLE", { operation: "save-result" });
    return controlledErrorResponse(
      "PERSISTENCE_UNAVAILABLE",
      "El guardado no está disponible. Conservamos el resultado para que puedas reintentar.",
    );
  }
}

export async function rankingResponse(
  factory: () => ResultRepository,
): Promise<Response> {
  try {
    return Response.json(
      { entries: await getRanking(factory()) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    logServerError("PERSISTENCE_UNAVAILABLE", { operation: "get-ranking" });
    return controlledErrorResponse(
      "PERSISTENCE_UNAVAILABLE",
      "No se pudo consultar la clasificación. Inténtalo de nuevo.",
    );
  }
}
