export const MAX_REQUEST_BODY_BYTES = 4096;

export class RequestBodyError extends Error {
  constructor(
    readonly code: "PAYLOAD_TOO_LARGE" | "VALIDATION_ERROR",
    message: string,
  ) {
    super(message);
    this.name = "RequestBodyError";
  }
}

export async function readLimitedJson(
  request: Request,
  maximumBytes = MAX_REQUEST_BODY_BYTES,
): Promise<unknown> {
  if (!request.body) {
    throw new RequestBodyError(
      "VALIDATION_ERROR",
      "El cuerpo JSON es obligatorio.",
    );
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let receivedBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      receivedBytes += value.byteLength;
      if (receivedBytes > maximumBytes) {
        await reader.cancel("PAYLOAD_TOO_LARGE");
        throw new RequestBodyError(
          "PAYLOAD_TOO_LARGE",
          `El cuerpo supera el límite de ${maximumBytes} bytes.`,
        );
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(receivedBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return JSON.parse(new TextDecoder().decode(bytes)) as unknown;
  } catch {
    throw new RequestBodyError(
      "VALIDATION_ERROR",
      "El cuerpo debe contener JSON válido.",
    );
  }
}
