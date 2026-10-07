import {ENCOUNTERS} from "@src/game/arguments/ArgumentContent";
import type {NpcActor} from "@src/game/world/NpcActor";
import type {PrimitiveFactory} from "@src/game/world/PrimitiveFactory";
import type {VillageScenery} from "@src/game/world/VillageScenery";
import * as pc from "playcanvas";

interface AnimatedEntity {
  readonly entity: pc.Entity;
  readonly phase: number;
  readonly baseY: number;
}

interface SweatDrop {
  readonly entity: pc.Entity;
  readonly x: number;
  readonly z: number;
  readonly startY: number;
  readonly phase: number;
  readonly speed: number;
}

interface OneWheel {
  readonly group: pc.Entity;
  readonly rotor: pc.Entity;
}

interface PlayerBody {
  readonly group: pc.Entity;
  readonly leftRoot: pc.Entity;
  readonly rightRoot: pc.Entity;
}

interface HumanoidColours {
  readonly coat: string;
  readonly skin: string;
  readonly hair: string;
  readonly trousers: string;
}

interface Humanoid {
  readonly group: pc.Entity;
  readonly leftArm: pc.Entity;
  readonly rightArm: pc.Entity;
}

interface HumanoidOptions {
  readonly name: string;
  readonly colours: HumanoidColours;
  readonly tilt?: number;
}

interface VillageActorsOptions {
  readonly factory: PrimitiveFactory;
  readonly world: pc.Entity;
  readonly scenery: VillageScenery;
  readonly completedEncounters: readonly string[];
}

interface MarkerColours {
  readonly colour: string;
  readonly emissive: string;
}

const DEFAULT_NPC_COLOURS: HumanoidColours = {
  coat: "#8b4f91",
  skin: "#efbd88",
  hair: "#d0c5a8",
  trousers: "#3e3b4d",
};

const NPC_COLOURS: readonly HumanoidColours[] = [
  DEFAULT_NPC_COLOURS,
  {coat: "#39745d", skin: "#d99b6d", hair: "#59372b", trousers: "#364447"},
  {coat: "#d1993f", skin: "#eab687", hair: "#714b32", trousers: "#364463"},
  {coat: "#ecede2", skin: "#bd7f5d", hair: "#2f2725", trousers: "#315466"},
];

export class VillageActors {
  private readonly factory: PrimitiveFactory;
  private readonly world: pc.Entity;
  private readonly scenery: VillageScenery;
  private readonly player: pc.Entity;
  private readonly leftRoot: pc.Entity;
  private readonly rightRoot: pc.Entity;
  private readonly wheel: pc.Entity;
  private readonly wheelRotor: pc.Entity;
  private readonly sweatDrops: readonly SweatDrop[];
  private readonly npcActors: NpcActor[] = [];
  private readonly animatedEntities: AnimatedEntity[] = [];

  public constructor(options: VillageActorsOptions) {
    this.factory = options.factory;
    this.world = options.world;
    this.scenery = options.scenery;
    const player = this.addPlayer();
    this.player = player.group;
    this.leftRoot = player.leftRoot;
    this.rightRoot = player.rightRoot;
    const wheel = this.addWheel();
    this.wheel = wheel.group;
    this.wheelRotor = wheel.rotor;
    this.sweatDrops = this.addSweat();
    this.addNpcs(options.completedEncounters);
  }

  public getPlayerPosition(): pc.Vec3 {
    return this.player.getPosition();
  }

  public resetPlayer(): void {
    this.player.setPosition(0, 0, 8);
  }

  public movePlayer(x: number, z: number, distance: number): void {
    const current = this.player.getPosition();
    const nextX = Math.max(-27, Math.min(27, current.x + x * distance));
    const nextZ = Math.max(-26, Math.min(26, current.z + z * distance));
    if (!this.scenery.collides(nextX, current.z)) {
      this.player.setPosition(nextX, current.y, current.z);
    }

    const afterX = this.player.getPosition();
    if (!this.scenery.collides(afterX.x, nextZ)) {
      this.player.setPosition(afterX.x, afterX.y, nextZ);
    }
    this.player.setEulerAngles(0, (Math.atan2(x, z) * 180) / Math.PI, 0);
  }

  public animatePlayer(riding: boolean, travelledDistance: number): void {
    let frequency = 0.009;
    let bobDistance = 0.07;
    if (riding) {
      frequency = 0.013;
      bobDistance = 0.035;
    }
    const bob = Math.sin(performance.now() * frequency) * bobDistance;
    this.leftRoot.setLocalEulerAngles(72 + bob * 35, 0, -18);
    this.rightRoot.setLocalEulerAngles(72 - bob * 35, 0, 18);
    if (riding) {
      this.wheelRotor.rotateLocal((-travelledDistance / 0.64) * (180 / Math.PI), 0, 0);
    }
  }

  public setWheelVisible(visible: boolean): void {
    this.wheel.enabled = visible;
  }

  public setPlayerHeat(heat: number): void {
    if (heat <= 72) {
      for (const drop of this.sweatDrops) {
        drop.entity.enabled = false;
      }
      return;
    }

    const intensity = Math.min(1, (heat - 72) / 28);
    const visibleDrops = Math.ceil(8 + intensity * (this.sweatDrops.length - 8));
    this.sweatDrops.forEach((drop, index) => {
      drop.entity.enabled = index < visibleDrops;
    });
  }

  public nearestNpc(completedEncounters: readonly string[]): NpcActor | undefined {
    const playerPosition = this.player.getPosition();
    let nearest: NpcActor | undefined;
    let nearestDistance = Number.POSITIVE_INFINITY;

    for (const npcActor of this.npcActors) {
      if (completedEncounters.includes(npcActor.encounter.id)) {
        continue;
      }
      const npcPosition = npcActor.entity.getPosition();
      const distance = Math.hypot(playerPosition.x - npcPosition.x, playerPosition.z - npcPosition.z);
      if (distance < nearestDistance) {
        nearest = npcActor;
        nearestDistance = distance;
      }
    }

    if (nearestDistance < 3.4) {
      return nearest;
    }
    return undefined;
  }

  public completeEncounter(encounterId: string): void {
    const npcActor = this.npcActors.find(item => item.encounter.id === encounterId);
    const render = npcActor?.marker.render;
    if (!render) {
      return;
    }

    render.material = this.factory.material("#79a06f", {emissive: "#37563e", emissiveIntensity: 1.15});
  }

  public resetEncounterMarkers(): void {
    const material = this.factory.material("#f7d75f", {emissive: "#c59622", emissiveIntensity: 1.15});
    for (const npcActor of this.npcActors) {
      const render = npcActor.marker.render;
      if (render) {
        render.material = material;
      }
    }
  }

  public update(seconds: number): void {
    const elapsed = performance.now() * 0.0024;
    for (const animatedEntity of this.animatedEntities) {
      const position = animatedEntity.entity.getLocalPosition();
      const y = animatedEntity.baseY + Math.sin(elapsed + animatedEntity.phase) * 0.15;
      animatedEntity.entity.setLocalPosition(position.x, y, position.z);
      animatedEntity.entity.rotateLocal(0, 55 * seconds, 0);
    }

    this.animateSweat(performance.now() * 0.001);
  }

  private addPlayer(): PlayerBody {
    const group = new pc.Entity("Woodman");
    this.world.addChild(group);
    group.setPosition(0, 0, 8);
    this.factory.create({
      name: "Fresh stump",
      type: "cylinder",
      position: [0, 1.5, 0],
      scale: [0.95, 2.5, 0.95],
      colour: "#8a5635",
      parent: group,
      material: {gloss: 8},
    });
    this.factory.create({
      name: "Fresh cut top",
      type: "cylinder",
      position: [0, 2.79, 0],
      scale: [0.98, 0.1, 0.98],
      colour: "#e2bd78",
      parent: group,
      material: {gloss: 10},
    });
    this.factory.create({
      name: "Growth ring",
      type: "cylinder",
      position: [0, 2.846, 0],
      scale: [0.66, 0.015, 0.66],
      colour: "#a46d40",
      parent: group,
      material: {gloss: 7},
    });
    this.factory.create({
      name: "Heartwood",
      type: "cylinder",
      position: [0, 2.857, 0],
      scale: [0.32, 0.016, 0.32],
      colour: "#e7c98b",
      parent: group,
      material: {gloss: 7},
    });
    for (const x of [-0.35, 0.32]) {
      this.factory.create({
        name: "Bark ridge",
        type: "box",
        position: [x, 1.3, 0.47],
        scale: [0.11, 1.85, 0.055],
        colour: "#654027",
        parent: group,
        material: {gloss: 4},
      });
    }
    const leftRoot = this.factory.create({
      name: "Left root foot",
      type: "cone",
      position: [-0.27, 0.28, 0.34],
      scale: [0.35, 0.85, 0.35],
      colour: "#72472d",
      parent: group,
      rotation: [72, 0, -18],
      material: {gloss: 5},
    });
    const rightRoot = this.factory.create({
      name: "Right root foot",
      type: "cone",
      position: [0.27, 0.28, 0.34],
      scale: [0.35, 0.85, 0.35],
      colour: "#72472d",
      parent: group,
      rotation: [72, 0, 18],
      material: {gloss: 5},
    });
    this.factory.create({
      name: "Branch hair",
      type: "cylinder",
      position: [0.43, 3.08, -0.04],
      scale: [0.16, 0.8, 0.16],
      colour: "#704329",
      parent: group,
      rotation: [0, 0, -52],
      material: {gloss: 5},
    });
    for (const x of [-0.21, 0.21]) {
      this.factory.create({
        name: "Kawaii eye",
        type: "sphere",
        position: [x, 1.92, 0.49],
        scale: [0.17, 0.21, 0.08],
        colour: "#211811",
        parent: group,
        material: {gloss: 42},
      });
      this.factory.create({
        name: "Eye sparkle",
        type: "sphere",
        position: [x - 0.035, 1.99, 0.535],
        scale: [0.045, 0.055, 0.025],
        colour: "#fff9e9",
        parent: group,
        material: {emissive: "#fff9e9", emissiveIntensity: 0.22, castShadows: false},
      });
      this.factory.create({
        name: "Rosy cheek",
        type: "sphere",
        position: [x * 1.75, 1.65, 0.5],
        scale: [0.14, 0.075, 0.045],
        colour: "#e58b78",
        parent: group,
        material: {gloss: 18},
      });
    }
    this.factory.create({
      name: "Kawaii smile",
      type: "box",
      position: [0, 1.67, 0.52],
      scale: [0.2, 0.055, 0.04],
      colour: "#211811",
      parent: group,
      rotation: [0, 0, 5],
      material: {gloss: 28},
    });
    return {group, leftRoot, rightRoot};
  }

  private addWheel(): OneWheel {
    const wheel = new pc.Entity("One wheel");
    this.player.addChild(wheel);
    const rotor = new pc.Entity("Wheel rotor");
    rotor.setLocalPosition(0, 0.55, 0);
    wheel.addChild(rotor);
    for (const side of [-0.28, 0.28]) {
      this.factory.create({
        name: "Definitely separate tyre",
        type: "cylinder",
        position: [side, 0, 0],
        scale: [1.25, 0.2, 1.25],
        colour: "#101719",
        parent: rotor,
        rotation: [0, 0, 90],
        material: {gloss: 18},
      });
      this.factory.create({
        name: "Wheel rim",
        type: "cylinder",
        position: [side * 1.45, 0, 0],
        scale: [0.95, 0.045, 0.95],
        colour: "#a8b8b5",
        parent: rotor,
        rotation: [0, 0, 90],
        material: {gloss: 55, metalness: 0.65},
      });
      for (const angle of [0, 45, 90, 135]) {
        this.factory.create({
          name: "Wheel spoke",
          type: "box",
          position: [side * 1.54, 0, 0],
          scale: [0.065, 0.085, 1.02],
          colour: "#354643",
          parent: rotor,
          rotation: [angle, 0, 0],
          material: {gloss: 42, metalness: 0.5},
        });
      }
    }
    this.factory.create({
      name: "Single axle",
      type: "cylinder",
      position: [0, 0, 0],
      scale: [0.32, 0.75, 0.32],
      colour: "#f06a43",
      parent: rotor,
      rotation: [0, 0, 90],
      material: {gloss: 35, metalness: 0.25},
    });
    this.factory.create({
      name: "Left footplate",
      type: "box",
      position: [-0.55, 0.62, 0],
      scale: [0.45, 0.11, 0.48],
      colour: "#293a38",
      parent: wheel,
    });
    this.factory.create({
      name: "Right footplate",
      type: "box",
      position: [0.55, 0.62, 0],
      scale: [0.45, 0.11, 0.48],
      colour: "#293a38",
      parent: wheel,
    });
    wheel.enabled = false;
    return {group: wheel, rotor};
  }

  private addSweat(): readonly SweatDrop[] {
    const drops: SweatDrop[] = [];
    for (let index = 0; index < 18; index += 1) {
      const angle = index * 2.4;
      const radius = 0.43 + (index % 3) * 0.11;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius + 0.1;
      const startY = 2.72 + (index % 4) * 0.2;
      const entity = this.factory.create({
        name: "Sweat drop",
        type: "sphere",
        position: [x, startY, z],
        scale: [0.07, 0.19, 0.07],
        colour: "#72e8ff",
        parent: this.player,
        material: {
          emissive: "#35bcd8",
          emissiveIntensity: 0.65,
          opacity: 0.9,
          castShadows: false,
          receiveShadows: false,
        },
      });
      entity.enabled = false;
      drops.push({entity, x, z, startY, phase: (index % 7) / 7, speed: 1.35 + (index % 5) * 0.16});
    }
    return drops;
  }

  private animateSweat(elapsed: number): void {
    for (const drop of this.sweatDrops) {
      if (!drop.entity.enabled) {
        continue;
      }
      const progress = (elapsed * drop.speed + drop.phase) % 1;
      const sway = Math.sin(elapsed * 8 + drop.phase * 12) * 0.07;
      drop.entity.setLocalPosition(drop.x + sway, drop.startY - progress * 2.25, drop.z);
    }
  }

  private addNpcs(completedEncounters: readonly string[]): void {
    ENCOUNTERS.forEach((encounter, index) => {
      const colours = NPC_COLOURS[index] ?? DEFAULT_NPC_COLOURS;
      let tilt = 2;
      if (index % 2 === 0) {
        tilt = -2;
      }
      const npc = this.addHumanoid({name: encounter.npc, colours, tilt});
      npc.group.setPosition(...encounter.position);
      npc.group.setEulerAngles(0, index * 72 + 25, 0);
      const marker = this.addNpcMarker(npc.group, completedEncounters.includes(encounter.id));
      this.npcActors.push({encounter, entity: npc.group, marker});
      this.animatedEntities.push({entity: marker, phase: index * 1.4, baseY: 3.75});
    });
  }

  private addNpcMarker(parent: pc.Entity, complete: boolean): pc.Entity {
    const colours = this.markerColours(complete);
    return this.factory.create({
      name: "Argument marker",
      type: "sphere",
      position: [0, 3.75, 0],
      scale: [0.26, 0.26, 0.26],
      colour: colours.colour,
      parent,
      material: {emissive: colours.emissive, emissiveIntensity: 1.15, castShadows: false},
    });
  }

  private markerColours(complete: boolean): MarkerColours {
    if (complete) {
      return {colour: "#79a06f", emissive: "#37563e"};
    }
    return {colour: "#f7d75f", emissive: "#c59622"};
  }

  private addHumanoid(options: HumanoidOptions): Humanoid {
    const group = new pc.Entity(options.name);
    this.world.addChild(group);
    const tilt = options.tilt ?? 0;
    this.factory.create({
      name: "Torso",
      type: "box",
      position: [0, 1.65, 0],
      scale: [0.78, 1.18, 0.46],
      colour: options.colours.coat,
      parent: group,
      rotation: [0, 0, tilt],
    });
    this.factory.create({
      name: "Head",
      type: "sphere",
      position: [0, 2.55, 0],
      scale: [0.58, 0.62, 0.56],
      colour: options.colours.skin,
      parent: group,
    });
    this.factory.create({
      name: "Hair",
      type: "sphere",
      position: [0, 2.85, -0.03],
      scale: [0.61, 0.25, 0.57],
      colour: options.colours.hair,
      parent: group,
    });
    this.factory.create({
      name: "Leg L",
      type: "cylinder",
      position: [-0.22, 0.68, 0],
      scale: [0.2, 0.9, 0.2],
      colour: options.colours.trousers,
      parent: group,
    });
    this.factory.create({
      name: "Leg R",
      type: "cylinder",
      position: [0.22, 0.68, 0],
      scale: [0.2, 0.9, 0.2],
      colour: options.colours.trousers,
      parent: group,
    });
    this.factory.create({
      name: "Boot L",
      type: "box",
      position: [-0.22, 0.2, 0.1],
      scale: [0.34, 0.24, 0.56],
      colour: "#342a27",
      parent: group,
    });
    this.factory.create({
      name: "Boot R",
      type: "box",
      position: [0.22, 0.2, 0.1],
      scale: [0.34, 0.24, 0.56],
      colour: "#342a27",
      parent: group,
    });
    const leftArm = this.factory.create({
      name: "Arm L",
      type: "cylinder",
      position: [-0.56, 1.65, 0],
      scale: [0.15, 0.9, 0.15],
      colour: options.colours.coat,
      parent: group,
      rotation: [0, 0, -8],
    });
    const rightArm = this.factory.create({
      name: "Arm R",
      type: "cylinder",
      position: [0.56, 1.65, 0],
      scale: [0.15, 0.9, 0.15],
      colour: options.colours.coat,
      parent: group,
      rotation: [0, 0, 8],
    });
    return {group, leftArm, rightArm};
  }
}
