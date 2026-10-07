export interface NeedSnapshot {
  readonly vape: number;
  readonly heat: number;
  readonly battery: number;
  readonly composure: number;
}

export interface PlayerSnapshot {
  readonly x: number;
  readonly z: number;
}

export interface GameSnapshot {
  readonly started: boolean;
  readonly level: number;
  readonly needs: NeedSnapshot;
  readonly riding: boolean;
  readonly inShade: boolean;
  readonly completed: readonly string[];
  readonly unlocked: readonly string[];
  readonly activeEncounter?: string;
  readonly qteActive: boolean;
  readonly player: PlayerSnapshot;
  readonly nearbyNpc?: string;
  readonly gameWon: boolean;
}
