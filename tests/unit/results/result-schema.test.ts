import { describe, expect, it } from "vitest";
import { parseResultRequest } from "@/infrastructure/validation/result-schema";

export const validResult = {
  gameId: "00000000-0000-4000-8000-000000000001",
  alias: "Ana",
  score: 0,
  achievedAt: "2026-10-21T12:00:00.000Z",
};

describe("HU-005 / RF-026 y RF-027: normalización y esquema cerrado", () => {
  it.each(["Ñandú", "José", "玩家", "A B-2_", "A".repeat(20), "𐐀".repeat(20)])(
    "acepta alias Unicode y cuenta caracteres: %s",
    (alias) => {
      expect(
        parseResultRequest({ ...validResult, alias: `  ${alias}  ` }).alias,
      ).toBe(alias);
    },
  );
  it.each([
    "",
    "  ",
    "A".repeat(21),
    "𐐀".repeat(21),
    "a@b",
    "<script>",
    "😀",
    "a\nb",
  ])("rechaza el alias %j", (alias) => {
    expect(() => parseResultRequest({ ...validResult, alias })).toThrow();
  });
  it("recorta antes de medir y permite alias repetidos", () => {
    const input = {
      ...validResult,
      alias: `${" ".repeat(50)}Ana${" ".repeat(50)}`,
    };
    expect(parseResultRequest(input).alias).toBe("Ana");
    expect(
      parseResultRequest({
        ...input,
        gameId: "00000000-0000-4000-8000-000000000002",
      }).alias,
    ).toBe("Ana");
  });
  it.each([-10, 1, 10.5, Number.NaN, Number.POSITIVE_INFINITY, "10", null])(
    "rechaza puntuación inválida %j",
    (score) => {
      expect(() => parseResultRequest({ ...validResult, score })).toThrow();
    },
  );
  it.each([
    null,
    [],
    {},
    { ...validResult, extra: true },
    { ...validResult, gameId: "invalid" },
    { ...validResult, achievedAt: "2026-02-30T12:00:00Z" },
    { ...validResult, achievedAt: "2026-10-21T12:00:00+03:00" },
  ])("rechaza carga inválida %j", (input) => {
    expect(() => parseResultRequest(input)).toThrow();
  });
  it("normaliza UUID y el mismo instante UTC para comparar reintentos", () => {
    expect(
      parseResultRequest({
        ...validResult,
        gameId: "AAAAAAAA-AAAA-4AAA-8AAA-AAAAAAAAAAAA",
        achievedAt: "2026-10-21T12:00:00+00:00",
      }),
    ).toEqual({
      ...validResult,
      gameId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    });
  });
});
