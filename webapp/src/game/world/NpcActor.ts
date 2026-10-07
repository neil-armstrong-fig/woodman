import type {Encounter} from "@src/game/arguments/ArgumentContent";
import type * as pc from "playcanvas";

export interface NpcActor {
  readonly encounter: Encounter;
  readonly entity: pc.Entity;
  readonly marker: pc.Entity;
}
