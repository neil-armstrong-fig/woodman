import type {NpcActor} from "@src/game/world/NpcActor";
import {PrimitiveFactory} from "@src/game/world/PrimitiveFactory";
import {VillageActors} from "@src/game/world/VillageActors";
import {VillageScenery} from "@src/game/world/VillageScenery";
import * as pc from "playcanvas";

export type {NpcActor} from "@src/game/world/NpcActor";

export interface ScreenPoint {
  readonly x: number;
  readonly y: number;
}

const TAP_RADIUS = 70;

export class Village {
  private readonly camera: pc.Entity;
  private readonly scenery: VillageScenery;
  private readonly actors: VillageActors;

  public constructor(
    private readonly app: pc.Application,
    completedEncounters: readonly string[],
  ) {
    const factory = new PrimitiveFactory(app);
    this.configureScene(factory);
    this.camera = this.addCamera(factory);
    const world = new pc.Entity("Alpendorf");
    this.app.root.addChild(world);
    this.scenery = new VillageScenery(factory, world);
    this.actors = new VillageActors({factory, world, scenery: this.scenery, completedEncounters});
    this.updateCamera(1);
  }

  public getPlayerPosition(): pc.Vec3 {
    return this.actors.getPlayerPosition();
  }

  public resetPlayer(): void {
    this.actors.resetPlayer();
  }

  public movePlayer(x: number, z: number, distance: number): void {
    this.actors.movePlayer(x, z, distance);
  }

  public animatePlayer(riding: boolean, distance: number): void {
    this.actors.animatePlayer(riding, distance);
  }

  public setWheelVisible(visible: boolean): void {
    this.actors.setWheelVisible(visible);
  }

  public setPlayerHeat(heat: number): void {
    this.actors.setPlayerHeat(heat);
  }

  public isPlayerInShade(): boolean {
    return this.scenery.isInShade(this.actors.getPlayerPosition());
  }

  public isPlayerAtCharger(): boolean {
    return this.scenery.isAtCharger(this.actors.getPlayerPosition());
  }

  public nearestNpc(completedEncounters: readonly string[]): NpcActor | undefined {
    return this.actors.nearestNpc(completedEncounters);
  }

  public npcAtScreenPoint(point: ScreenPoint, completedEncounters: readonly string[]): NpcActor | undefined {
    const cameraComponent = this.camera.camera;
    if (!cameraComponent) {
      return undefined;
    }

    let found: NpcActor | undefined;
    let foundDistance = TAP_RADIUS;
    const screen = new pc.Vec3();
    for (const npcActor of this.actors.activeNpcs(completedEncounters)) {
      const position = npcActor.entity.getPosition();
      cameraComponent.worldToScreen(new pc.Vec3(position.x, position.y + 1, position.z), screen);
      const distance = Math.hypot(screen.x - point.x, screen.y - point.y);
      if (distance < foundDistance) {
        found = npcActor;
        foundDistance = distance;
      }
    }
    return found;
  }

  public completeEncounter(encounterId: string): void {
    this.actors.completeEncounter(encounterId);
  }

  public resetEncounterMarkers(): void {
    this.actors.resetEncounterMarkers();
  }

  public update(seconds: number): void {
    this.actors.update(seconds);
    this.updateCamera(seconds);
  }

  private configureScene(factory: PrimitiveFactory): void {
    this.app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
    this.app.setCanvasResolution(pc.RESOLUTION_AUTO);
    this.app.scene.ambientLight = new pc.Color(0.48, 0.52, 0.42);
    this.app.scene.fog.type = pc.FOG_LINEAR;
    this.app.scene.fog.color = factory.colour("#a9cbbd");
    this.app.scene.fog.start = 38;
    this.app.scene.fog.end = 83;
    this.app.scene.exposure = 1.15;

    const sun = new pc.Entity("Alpine sun");
    sun.addComponent("light", {
      type: "directional",
      color: new pc.Color(1, 0.91, 0.68),
      intensity: 1.85,
      castShadows: true,
      shadowBias: 0.22,
      normalOffsetBias: 0.18,
      shadowDistance: 45,
      shadowResolution: 1024,
    });
    sun.setEulerAngles(49, -31, 0);
    this.app.root.addChild(sun);
  }

  private addCamera(factory: PrimitiveFactory): pc.Entity {
    const camera = new pc.Entity("Camera");
    camera.addComponent("camera", {clearColor: factory.colour("#83bfd1"), farClip: 130, fov: 54});
    if (!camera.camera) {
      throw new Error("PlayCanvas did not create the game camera.");
    }
    camera.camera.gammaCorrection = pc.GAMMA_SRGB;
    camera.camera.toneMapping = pc.TONEMAP_ACES;
    camera.setPosition(0, 10, 17);
    this.app.root.addChild(camera);
    return camera;
  }

  private updateCamera(seconds: number): void {
    const playerPosition = this.actors.getPlayerPosition();
    const target = new pc.Vec3(playerPosition.x + 10.5, playerPosition.y + 9.3, playerPosition.z + 13.5);
    const current = this.camera.getPosition();
    current.lerp(current, target, 1 - Math.pow(0.0015, seconds));
    this.camera.setPosition(current);
    this.camera.lookAt(playerPosition.x, playerPosition.y + 1.3, playerPosition.z);
  }
}
