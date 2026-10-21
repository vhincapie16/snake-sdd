import type { Cell } from "@/domain/game/model";

export interface Clock {
  now(): Date;
}

export interface UuidGenerator {
  create(): string;
}

export interface PositionGenerator {
  nextAvailable(occupied: readonly Cell[]): Cell;
}

export interface GameDependencies {
  readonly clock: Clock;
  readonly uuid: UuidGenerator;
  readonly positions: PositionGenerator;
}
