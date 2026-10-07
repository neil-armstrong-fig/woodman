import * as pc from "playcanvas";

type Position = readonly [number, number, number];
type PrimitiveType = "box" | "cone" | "cylinder" | "sphere";

interface MaterialOptions {
  readonly gloss?: number;
  readonly metalness?: number;
  readonly emissive?: string;
  readonly emissiveIntensity?: number;
  readonly opacity?: number;
  readonly castShadows?: boolean;
  readonly receiveShadows?: boolean;
}

interface PrimitiveOptions {
  readonly name: string;
  readonly type: PrimitiveType;
  readonly position: Position;
  readonly scale: Position;
  readonly colour: string;
  readonly parent?: pc.Entity;
  readonly rotation?: Position;
  readonly material?: MaterialOptions;
}

export class PrimitiveFactory {
  private readonly materials = new Map<string, pc.StandardMaterial>();

  public constructor(private readonly app: pc.Application) {}

  public create(options: PrimitiveOptions): pc.Entity {
    const entity = new pc.Entity(options.name);
    entity.addComponent("render", {type: options.type});

    const render = entity.render;
    if (!render) {
      throw new Error(`PlayCanvas did not create a render component for ${options.name}.`);
    }

    const materialOptions = options.material ?? {};
    render.material = this.material(options.colour, materialOptions);
    render.castShadows = materialOptions.castShadows !== false;
    render.receiveShadows = materialOptions.receiveShadows !== false;
    entity.setLocalPosition(...options.position);
    entity.setLocalScale(...options.scale);
    entity.setLocalEulerAngles(...(options.rotation ?? [0, 0, 0]));
    (options.parent ?? this.app.root).addChild(entity);
    return entity;
  }

  public material(colour: string, options: MaterialOptions = {}): pc.StandardMaterial {
    const key = `${colour}-${options.emissive ?? ""}-${options.opacity ?? 1}`;
    const existing = this.materials.get(key);
    if (existing) {
      return existing;
    }

    const material = new pc.StandardMaterial();
    material.diffuse = this.colour(colour);
    material.gloss = options.gloss ?? 18;
    material.metalness = options.metalness ?? 0;
    if (options.emissive) {
      material.emissive = this.colour(options.emissive);
      material.emissiveIntensity = options.emissiveIntensity ?? 1;
    }
    if (options.opacity !== undefined) {
      material.opacity = options.opacity;
      material.blendType = pc.BLEND_NORMAL;
      material.depthWrite = false;
    }
    material.update();
    this.materials.set(key, material);
    return material;
  }

  public colour(hex: string): pc.Color {
    const value = Number.parseInt(hex.replace("#", ""), 16);
    return new pc.Color(((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255);
  }
}
