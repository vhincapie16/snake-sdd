import { describe, expect, it } from "vitest";
import { detectCollision } from "@/domain/game/collisions";

const segments = [
  { x: 1, y: 1 },
  { x: 1, y: 2 },
  { x: 0, y: 2 },
  { x: 0, y: 1 },
];

describe("HU-004 / RF-016 y RF-017: límites y ocupación resultante", () => {
  it.each([
    { x: -1, y: 0 },
    { x: 20, y: 0 },
    { x: 0, y: -1 },
    { x: 0, y: 20 },
  ])("detecta pared en %j", (head) => {
    expect(detectCollision(head, segments, false)).toBe("wall");
  });

  it.each([
    { x: 0, y: 0 },
    { x: 19, y: 0 },
    { x: 0, y: 19 },
    { x: 19, y: 19 },
  ])("permite los extremos dentro del tablero: %j", (head) => {
    expect(detectCollision(head, segments, false)).toBeNull();
  });

  it("detecta cuerpo que continúa ocupado con o sin crecimiento", () => {
    expect(detectCollision({ x: 1, y: 2 }, segments, false)).toBe("self");
    expect(detectCollision({ x: 1, y: 2 }, segments, true)).toBe("self");
  });

  it("permite la cola liberada y rechaza la cola retenida sin mutar la serpiente", () => {
    const before = structuredClone(segments);
    expect(detectCollision({ x: 0, y: 1 }, segments, false)).toBeNull();
    expect(detectCollision({ x: 0, y: 1 }, segments, true)).toBe("self");
    expect(segments).toEqual(before);
  });
});
