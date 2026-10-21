import { afterEach, describe, expect, it, vi } from "vitest";
import { createBrowserGameId } from "@/infrastructure/random/browser-game-id";

afterEach(() => vi.unstubAllGlobals());

describe("KAN-3 / integración RF-004: identificador al reiniciar", () => {
  it("conserva randomUUID cuando el navegador lo ofrece", () => {
    const randomUUID = vi.fn(() => "00000000-0000-4000-8000-000000000001");
    const getRandomValues = vi.fn();
    vi.stubGlobal("crypto", { randomUUID, getRandomValues });
    expect(createBrowserGameId()).toBe("00000000-0000-4000-8000-000000000001");
    expect(randomUUID).toHaveBeenCalledOnce();
    expect(getRandomValues).not.toHaveBeenCalled();
  });

  it("usa 16 bytes criptográficos y conserva versión 4 y variante UUID sin randomUUID", () => {
    const getRandomValues = vi.fn((bytes: Uint8Array) => bytes.fill(255));
    vi.stubGlobal("crypto", { getRandomValues });
    expect(createBrowserGameId()).toBe("ffffffff-ffff-4fff-bfff-ffffffffffff");
    expect(getRandomValues).toHaveBeenCalledOnce();
    expect(getRandomValues.mock.calls[0]![0]).toHaveLength(16);
  });
});
