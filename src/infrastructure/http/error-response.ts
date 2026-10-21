export type ControlledErrorCode =
  | "METHOD_NOT_ALLOWED"
  | "RESULT_CONFLICT"
  | "PAYLOAD_TOO_LARGE"
  | "VALIDATION_ERROR"
  | "PERSISTENCE_UNAVAILABLE";

const STATUS_BY_CODE: Readonly<Record<ControlledErrorCode, number>> = {
  METHOD_NOT_ALLOWED: 405,
  RESULT_CONFLICT: 409,
  PAYLOAD_TOO_LARGE: 413,
  VALIDATION_ERROR: 422,
  PERSISTENCE_UNAVAILABLE: 503,
};

const RETRYABLE_BY_CODE: Readonly<Record<ControlledErrorCode, boolean>> = {
  METHOD_NOT_ALLOWED: false,
  RESULT_CONFLICT: false,
  PAYLOAD_TOO_LARGE: false,
  VALIDATION_ERROR: false,
  PERSISTENCE_UNAVAILABLE: true,
};

export interface ValidationIssue {
  readonly field: "gameId" | "alias" | "score" | "achievedAt";
  readonly code: string;
}

export function controlledErrorResponse(
  code: ControlledErrorCode,
  message: string,
  issues?: readonly ValidationIssue[],
): Response {
  if (code === "VALIDATION_ERROR" && !issues?.length) {
    throw new Error(
      "La respuesta de validación requiere al menos una incidencia.",
    );
  }
  return Response.json(
    {
      code,
      message,
      retryable: RETRYABLE_BY_CODE[code],
      ...(code === "VALIDATION_ERROR" ? { issues } : {}),
    },
    { status: STATUS_BY_CODE[code] },
  );
}
