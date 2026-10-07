import type {PrimitiveFactory} from "@src/game/world/PrimitiveFactory";
import * as pc from "playcanvas";

interface Area {
  readonly x: number;
  readonly z: number;
  readonly radius: number;
}

interface Obstacle {
  readonly x: number;
  readonly z: number;
  readonly width: number;
  readonly depth: number;
}

interface MountainOptions {
  readonly x: number;
  readonly z: number;
  readonly scale: number;
  readonly colour: string;
  readonly snowy?: boolean;
}

interface ChaletOptions {
  readonly name: string;
  readonly x: number;
  readonly z: number;
  readonly bodyColour: string;
  readonly scale: number;
}

interface TreeOptions {
  readonly x: number;
  readonly z: number;
  readonly scale: number;
}

interface WindowOptions {
  readonly x: number;
  readonly scale: number;
  readonly name: string;
}

const TREE_OPTIONS: readonly TreeOptions[] = [
  {x: -7, z: -14, scale: 1.1},
  {x: 7, z: -19, scale: 1.2},
  {x: -7, z: 7, scale: 1},
  {x: 8, z: 7, scale: 1.15},
  {x: -10, z: 20, scale: 1.2},
  {x: 8, z: 21, scale: 1},
  {x: 25, z: 2, scale: 1.2},
  {x: -25, z: 3, scale: 1.1},
];

export class VillageScenery {
  private readonly shadeAreas: Area[] = [];
  private readonly obstacles: Obstacle[] = [];
  private readonly charger = {x: 3.7, z: 8.7};

  public constructor(
    private readonly factory: PrimitiveFactory,
    private readonly world: pc.Entity,
  ) {
    this.build();
  }

  public isInShade(position: pc.Vec3): boolean {
    return this.shadeAreas.some(area => Math.hypot(position.x - area.x, position.z - area.z) < area.radius);
  }

  public isAtCharger(position: pc.Vec3): boolean {
    return Math.hypot(position.x - this.charger.x, position.z - this.charger.z) < 1.7;
  }

  public collides(x: number, z: number): boolean {
    return this.obstacles.some(obstacle => {
      const overlapsX = Math.abs(x - obstacle.x) < obstacle.width + 0.55;
      const overlapsZ = Math.abs(z - obstacle.z) < obstacle.depth + 0.55;
      return overlapsX && overlapsZ;
    });
  }

  private build(): void {
    this.factory.create({
      name: "Meadow",
      type: "box",
      position: [0, -0.25, 0],
      scale: [68, 0.5, 68],
      colour: "#78a856",
      parent: this.world,
      material: {gloss: 2},
    });
    this.addRoads();
    this.addMountains();
    this.addChalets();
    for (const treeOptions of TREE_OPTIONS) {
      this.addTree(treeOptions);
    }
    this.addFlowers();
    this.addSunDisc();
    this.addCharger();
  }

  private addRoads(): void {
    this.factory.create({
      name: "Village road",
      type: "box",
      position: [0, 0.02, -1],
      scale: [6.2, 0.06, 54],
      colour: "#c4ad86",
      parent: this.world,
      material: {gloss: 1, castShadows: false},
    });
    this.factory.create({
      name: "Cross road",
      type: "box",
      position: [0, 0.03, 2],
      scale: [42, 0.06, 5.3],
      colour: "#c4ad86",
      parent: this.world,
      material: {gloss: 1, castShadows: false},
    });
    for (let z = -23; z <= 23; z += 4) {
      this.factory.create({
        name: "Road stone",
        type: "box",
        position: [-2.75, 0.08, z],
        scale: [0.22, 0.12, 1.8],
        colour: "#ead9b5",
        parent: this.world,
        material: {castShadows: false},
      });
    }
  }

  private addMountains(): void {
    const mountains: readonly MountainOptions[] = [
      {x: -30, z: -35, scale: 17, colour: "#54745e"},
      {x: -12, z: -41, scale: 21, colour: "#66816b"},
      {x: 12, z: -43, scale: 24, colour: "#516f5c"},
      {x: 32, z: -34, scale: 18, colour: "#68856c"},
      {x: -38, z: 5, scale: 13, colour: "#54755f", snowy: false},
      {x: 40, z: 4, scale: 15, colour: "#5b7961", snowy: false},
    ];
    for (const mountainOptions of mountains) {
      this.addMountain(mountainOptions);
    }
  }

  private addMountain(options: MountainOptions): void {
    const mountain = this.factory.create({
      name: "Mountain",
      type: "cone",
      position: [options.x, options.scale * 0.38 - 0.2, options.z],
      scale: [options.scale, options.scale * 0.78, options.scale],
      colour: options.colour,
      parent: this.world,
      material: {gloss: 0},
    });
    if (options.snowy === false) {
      return;
    }

    this.factory.create({
      name: "Snow cap",
      type: "cone",
      position: [0, 0.47, 0],
      scale: [0.42, 0.26, 0.42],
      colour: "#eaf0e6",
      parent: mountain,
      material: {gloss: 3},
    });
  }

  private addChalets(): void {
    const chalets: readonly ChaletOptions[] = [
      {name: "Gasthaus", x: -18, z: -6, bodyColour: "#f0c678", scale: 1.08},
      {name: "Farmhouse", x: 18, z: -8, bodyColour: "#d4975e", scale: 1},
      {name: "Clinic", x: -18, z: 13, bodyColour: "#e6dcc0", scale: 1.04},
      {name: "Workshop", x: 18, z: 14, bodyColour: "#c77a58", scale: 0.94},
    ];
    for (const chaletOptions of chalets) {
      this.addChalet(chaletOptions);
    }
  }

  private addChalet(options: ChaletOptions): void {
    const {name, x, z, bodyColour, scale} = options;
    const house = new pc.Entity(name);
    house.setPosition(x, 0, z);
    this.world.addChild(house);
    this.factory.create({
      name: "Walls",
      type: "box",
      position: [0, 1.25 * scale, 0],
      scale: [5.5 * scale, 2.5 * scale, 4.2 * scale],
      colour: bodyColour,
      parent: house,
    });
    this.factory.create({
      name: "Dark base",
      type: "box",
      position: [0, 0.28 * scale, 0],
      scale: [5.7 * scale, 0.45 * scale, 4.4 * scale],
      colour: "#5c3927",
      parent: house,
    });
    this.addRoof(house, scale, -1);
    this.addRoof(house, scale, 1);
    this.factory.create({
      name: "Door",
      type: "box",
      position: [0, 0.9 * scale, 2.14 * scale],
      scale: [1.05 * scale, 1.75 * scale, 0.12],
      colour: "#294f45",
      parent: house,
    });
    this.addWindow(house, {x: -1.7 * scale, scale, name: "Window L"});
    this.addWindow(house, {x: 1.7 * scale, scale, name: "Window R"});
    this.factory.create({
      name: "Balcony",
      type: "box",
      position: [0, 2.15 * scale, 2.38 * scale],
      scale: [4.6 * scale, 0.18 * scale, 0.45 * scale],
      colour: "#8c5a34",
      parent: house,
    });
    this.obstacles.push({x, z, width: 3.3 * scale, depth: 2.7 * scale});
    this.shadeAreas.push({x, z: z + 3.1 * scale, radius: 3.2 * scale});
  }

  private addRoof(house: pc.Entity, scale: number, side: -1 | 1): void {
    let name = "Roof right";
    if (side === -1) {
      name = "Roof left";
    }
    this.factory.create({
      name,
      type: "box",
      position: [side * 1.35 * scale, 3 * scale, 0],
      scale: [3.8 * scale, 0.35 * scale, 5.1 * scale],
      colour: "#71382c",
      parent: house,
      rotation: [0, 0, side * 27],
    });
  }

  private addWindow(house: pc.Entity, options: WindowOptions): void {
    this.factory.create({
      name: options.name,
      type: "box",
      position: [options.x, 1.65 * options.scale, 2.15 * options.scale],
      scale: [0.85 * options.scale, 0.75 * options.scale, 0.12],
      colour: "#9edbe0",
      parent: house,
      material: {emissive: "#2a5960", emissiveIntensity: 0.2},
    });
  }

  private addTree(options: TreeOptions): void {
    const tree = new pc.Entity("Shade tree");
    tree.setPosition(options.x, 0, options.z);
    this.world.addChild(tree);
    const scale = options.scale;
    this.factory.create({
      name: "Trunk",
      type: "cylinder",
      position: [0, 1.25 * scale, 0],
      scale: [0.48 * scale, 2.5 * scale, 0.48 * scale],
      colour: "#77513a",
      parent: tree,
    });
    this.addTreeCrown(tree, scale, false);
    this.addTreeCrown(tree, scale, true);
    this.factory.create({
      name: "Shade marker",
      type: "cylinder",
      position: [0, 0.035, 0],
      scale: [3.35 * scale, 0.025, 3.35 * scale],
      colour: "#3b7772",
      parent: tree,
      material: {opacity: 0.2, castShadows: false, receiveShadows: false},
    });
    this.shadeAreas.push({x: options.x, z: options.z, radius: 3.4 * scale});
  }

  private addTreeCrown(tree: pc.Entity, scale: number, upper: boolean): void {
    let name = "Lower crown";
    let position: readonly [number, number, number] = [0, 3.05 * scale, 0];
    let size: readonly [number, number, number] = [2.5 * scale, 2.9 * scale, 2.5 * scale];
    let colour = "#315f3f";
    if (upper) {
      name = "Upper crown";
      position = [0, 4.45 * scale, 0];
      size = [1.85 * scale, 2.55 * scale, 1.85 * scale];
      colour = "#477a49";
    }
    this.factory.create({
      name,
      type: "cone",
      position,
      scale: size,
      colour,
      parent: tree,
      material: {gloss: 2},
    });
  }

  private addFlowers(): void {
    const colours = ["#f7d75f", "#e96c7a", "#d9eff0", "#9065c7"] as const;
    for (let index = 0; index < 70; index += 1) {
      const angle = index * 2.399;
      const radius = 8 + (index % 17) * 1.45;
      const x = Math.sin(angle) * radius;
      const z = Math.cos(angle) * radius;
      if (Math.abs(x) < 4 || this.collides(x, z)) {
        continue;
      }
      this.factory.create({
        name: "Alpine flower",
        type: "sphere",
        position: [x, 0.18, z],
        scale: [0.12, 0.22, 0.12],
        colour: colours[index % colours.length] ?? colours[0],
        parent: this.world,
        material: {castShadows: false},
      });
    }
  }

  private addSunDisc(): void {
    this.factory.create({
      name: "Sun disc",
      type: "sphere",
      position: [27, 31, -47],
      scale: [4.6, 4.6, 4.6],
      colour: "#ffe28b",
      parent: this.world,
      material: {
        emissive: "#ffc95f",
        emissiveIntensity: 2,
        castShadows: false,
        receiveShadows: false,
      },
    });
  }

  private addCharger(): void {
    const charger = new pc.Entity("Wheel charger");
    charger.setPosition(this.charger.x, 0, this.charger.z);
    this.world.addChild(charger);
    this.factory.create({
      name: "Charger pole",
      type: "cylinder",
      position: [0, 0.7, 0],
      scale: [0.16, 1.4, 0.16],
      colour: "#415950",
      parent: charger,
    });
    this.factory.create({
      name: "Charger light",
      type: "sphere",
      position: [0, 1.48, 0],
      scale: [0.25, 0.25, 0.25],
      colour: "#b9e75f",
      parent: charger,
      material: {emissive: "#7dbd36", emissiveIntensity: 1.4},
    });
    this.factory.create({
      name: "Charger ring",
      type: "cylinder",
      position: [0, 0.03, 0],
      scale: [1.55, 0.035, 1.55],
      colour: "#b9e75f",
      parent: charger,
      material: {opacity: 0.16, castShadows: false},
    });
  }
}
