import type { Cell, Snake } from "@/domain/game/model";

export function consumeFood(
  snake: Snake,
  nextHead: Cell,
  score: number,
): { readonly snake: Snake; readonly score: number } {
  return {
    snake: { segments: [nextHead, ...snake.segments] },
    score: score + 10,
  };
}
