import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { loadServerEnvironment } from "@/infrastructure/config/server-env";
import { logServerError } from "@/infrastructure/observability/server-logger";

describe("Fundamentos / T012 y T016: configuración y logging server-only", () => {
  it("rechaza configuración ausente sin incluir valores sensibles", () => {
    const environment: NodeJS.ProcessEnv = {
      NODE_ENV: "test",
      SUPABASE_SERVICE_ROLE_KEY: "valor-ficticio-privado",
    };
    expect(() => loadServerEnvironment(environment)).toThrow(
      "La configuración segura del servidor está incompleta.",
    );
    expect(
      loadServerEnvironment({
        NODE_ENV: "test",
        SUPABASE_URL: " http://127.0.0.1:54321 ",
        SUPABASE_SERVICE_ROLE_KEY: " valor-ficticio ",
      }),
    ).toEqual({
      supabaseUrl: "http://127.0.0.1:54321",
      supabaseServiceRoleKey: "valor-ficticio",
    });
  });

  it("redacta credenciales anidadas y conserva contexto diagnóstico", () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    logServerError("PERSISTENCE_UNAVAILABLE", {
      operation: "save",
      nested: [{ authorization: "valor-ficticio", attempt: 1 }],
      SUPABASE_SERVICE_ROLE_KEY: "valor-ficticio",
    });
    expect(log).toHaveBeenCalledWith("snake-sdd", {
      code: "PERSISTENCE_UNAVAILABLE",
      context: {
        operation: "save",
        nested: [{ authorization: "[REDACTED]", attempt: 1 }],
        SUPABASE_SERVICE_ROLE_KEY: "[REDACTED]",
      },
    });
  });
});
