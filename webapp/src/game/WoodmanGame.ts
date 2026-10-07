import {ENCOUNTERS} from "@src/game/arguments/ArgumentContent";
import type {AbilityId, Encounter} from "@src/game/arguments/ArgumentContent";
import {clamp} from "@src/game/Clamp";
import type {GameSnapshot} from "@src/game/GameSnapshot";
import {
  beginArgument,
  chooseArgument,
  createInitialState,
  updateNeeds,
  useAbility,
  useVape,
} from "@src/game/state/GameState";
import type {GameState} from "@src/game/state/GameState";
import {GameUi} from "@src/game/ui/GameUi";
import {Village} from "@src/game/world/Village";
import type {NpcActor} from "@src/game/world/Village";
import * as pc from "playcanvas";

const MOVEMENT_KEYS = ["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"] as const;

interface MovementDirection {
  readonly x: number;
  readonly z: number;
}

const SCREEN_AXIS_COMPONENT = Math.SQRT1_2;

export class WoodmanGame {
  private readonly app: pc.Application;
  private readonly ui = new GameUi();
  private readonly village: Village;
  private readonly heldKeys = new Set<string>();
  private state: GameState;
  private nearestNpc?: NpcActor;
  private toastRemaining = 0;
  private vapeCooldown = 0;
  private wheelTimer = 7;
  private qteElapsed = 0;
  private qtePosition = 0;

  public constructor(canvas: HTMLCanvasElement) {
    this.state = createInitialState();
    this.app = new pc.Application(canvas, {
      mouse: new pc.Mouse(canvas),
      keyboard: new pc.Keyboard(window),
      graphicsDeviceOptions: {antialias: true, alpha: false, powerPreference: "high-performance"},
    });
    this.village = new Village(this.app, this.state.completed);
    this.bindControls();
  }

  public run(): void {
    this.app.on("update", this.update, this);
    this.app.start();
    this.ui.renderHud(this.state);
    this.ui.showReady();
  }

  public start(): void {
    this.state = {...this.state, started: true};
    this.ui.showStarted();
    this.toast("Find a resident. Their confidence is an invitation.");
    this.render();
  }

  public reset(): GameSnapshot {
    this.state = {...createInitialState(), started: true};
    this.nearestNpc = undefined;
    this.village.resetPlayer();
    this.village.resetEncounterMarkers();
    this.ui.showRestarted();
    this.toast("A fresh village. The same enormous confidence.");
    this.render();
    return this.snapshot();
  }

  public openArgument(encounterId: string): void {
    this.state = beginArgument(this.state, encounterId);
    const encounter = this.activeEncounter();
    if (!encounter || !this.state.argument) {
      return;
    }
    this.renderArgument(encounter);
  }

  public snapshot(): GameSnapshot {
    const position = this.village.getPlayerPosition();
    return {
      started: this.state.started,
      level: this.state.level,
      needs: {
        vape: Math.round(this.state.vape),
        heat: Math.round(this.state.heat),
        battery: Math.round(this.state.battery),
        composure: Math.round(this.state.composure),
      },
      riding: this.state.riding,
      inShade: this.state.inShade,
      completed: [...this.state.completed],
      unlocked: [...this.state.unlocked],
      activeEncounter: this.state.activeEncounter,
      qteActive: Boolean(this.state.qte),
      player: {x: Number(position.x.toFixed(2)), z: Number(position.z.toFixed(2))},
      nearbyNpc: this.nearestNpc?.encounter.id,
      gameWon: this.state.gameWon,
    };
  }

  public resize(): void {
    this.app.resizeCanvas();
  }

  private bindControls(): void {
    window.addEventListener("keydown", event => this.handleKeyDown(event));
    window.addEventListener("keyup", event => this.heldKeys.delete(event.key.toLowerCase()));
    window.addEventListener("resize", () => this.resize());
    this.ui.bindControls({
      start: () => this.start(),
      closeResult: () => this.closeResult(),
      restart: () => this.reset(),
    });
  }

  private update(seconds: number): void {
    this.village.update(seconds);
    const moving = this.updateMovement(seconds);
    this.updateNeeds(seconds, moving);
    this.updateQte(seconds, moving);
    this.updateInteraction();
    this.updateToast(seconds);
    this.render();
  }

  private updateMovement(seconds: number): boolean {
    if (!this.state.started || this.isModalOpen()) {
      return false;
    }

    const direction = this.movementDirection();
    if (direction.x === 0 && direction.z === 0) {
      return false;
    }

    const length = Math.hypot(direction.x, direction.z);
    let speed = 4.25;
    if (this.state.riding) {
      speed = 12.5;
    }
    if (this.state.heat > 72) {
      speed *= 0.25;
    } else if (this.state.vape < 18 || this.state.composure < 25) {
      speed *= 0.62;
    }
    const x = direction.x / length;
    const z = direction.z / length;
    const distance = speed * seconds;
    this.village.movePlayer(x, z, distance);
    this.village.animatePlayer(this.state.riding, distance);
    return true;
  }

  private movementDirection(): MovementDirection {
    return movementDirectionForKeys(this.heldKeys);
  }

  private updateNeeds(seconds: number, moving: boolean): void {
    this.state = updateNeeds(this.state, seconds, {inShade: this.village.isPlayerInShade(), moving});
    this.vapeCooldown = Math.max(0, this.vapeCooldown - seconds);
    if (this.village.isPlayerAtCharger()) {
      this.state = {...this.state, battery: clamp(this.state.battery + seconds * 16)};
    }
  }

  private updateQte(seconds: number, moving: boolean): void {
    if (this.state.riding && moving && !this.state.qte) {
      this.wheelTimer -= seconds;
      if (this.wheelTimer <= 0) {
        this.beginQte();
      }
    }
    if (!this.state.qte) {
      return;
    }

    this.qteElapsed += seconds;
    this.qtePosition = (Math.sin(this.qteElapsed * 4.1 - 1.55) * 0.5 + 0.5) * 98;
    this.ui.updateQte(this.qtePosition);
    if (this.qteElapsed > 4.5) {
      this.resolveQte();
    }
  }

  private updateInteraction(): void {
    this.nearestNpc = this.village.nearestNpc(this.state.completed);
    if (this.nearestNpc && !this.isModalOpen() && this.state.started) {
      this.ui.showInteraction(this.nearestNpc.encounter);
      return;
    }
    this.ui.showInteraction();
  }

  private updateToast(seconds: number): void {
    if (this.toastRemaining <= 0) {
      return;
    }
    this.toastRemaining -= seconds;
    if (this.toastRemaining <= 0) {
      this.ui.hideToast();
    }
  }

  private handleKeyDown(event: KeyboardEvent): void {
    const key = event.key.toLowerCase();
    this.heldKeys.add(key);
    if (key === " " || MOVEMENT_KEYS.includes(key as (typeof MOVEMENT_KEYS)[number])) {
      event.preventDefault();
    }
    if (!this.state.started && (key === "enter" || key === " ")) {
      this.start();
      return;
    }
    if (this.state.qte && key === " ") {
      this.resolveQte();
      return;
    }
    if (this.ui.isDialogueOpen() && ["1", "2", "3"].includes(key)) {
      this.selectChoice(Number(key) - 1);
      return;
    }
    if (this.isModalOpen() || !this.state.started || event.repeat) {
      return;
    }
    if (key === "e" && this.nearestNpc) {
      this.openArgument(this.nearestNpc.encounter.id);
    }
    if (key === "r") {
      this.toggleWheel();
    }
    if (key === "v") {
      this.vape();
    }
  }

  private render(): void {
    this.village.setWheelVisible(this.state.riding);
    this.village.setPlayerHeat(this.state.heat);
    this.ui.renderHud(this.state);
  }

  private renderArgument(encounter: Encounter): void {
    this.ui.showArgument(this.state, encounter, {
      choose: choiceIndex => this.selectChoice(choiceIndex),
      useAbility: abilityId => this.applyAbility(abilityId),
    });
  }

  private selectChoice(choiceIndex: number): void {
    const encounter = this.activeEncounter();
    if (!encounter) {
      return;
    }

    const outcome = chooseArgument(this.state, choiceIndex);
    this.state = outcome.state;
    if (!outcome.result?.finished) {
      this.renderArgument(encounter);
      this.render();
      return;
    }

    if (outcome.result.won) {
      this.village.completeEncounter(encounter.id);
    }
    this.ui.showResult({result: outcome.result, encounter}, this.state.gameWon);
    this.render();
  }

  private applyAbility(abilityId: AbilityId): void {
    this.state = useAbility(this.state, abilityId);
    const encounter = this.activeEncounter();
    if (encounter) {
      this.renderArgument(encounter);
    }
  }

  private activeEncounter(): Encounter | undefined {
    return ENCOUNTERS.find(encounter => encounter.id === this.state.activeEncounter);
  }

  private closeResult(): void {
    this.ui.closeResult(this.state.gameWon);
  }

  private toggleWheel(): void {
    if (this.state.riding) {
      this.state = {...this.state, riding: false};
      this.toast("Dismounted with uncommon dignity.");
    } else if (this.state.battery <= 6) {
      this.toast("The wheel emits the silence of an empty battery.");
    } else {
      this.state = {...this.state, riding: true};
      this.wheelTimer = 5 + Math.random() * 5;
      this.toast("One wheel. Infinite confidence. Limited battery.");
    }
    this.render();
  }

  private vape(): void {
    if (this.vapeCooldown > 0) {
      this.toast("Even the Woodman has lungs. Wait a moment.");
      return;
    }
    this.state = useVape(this.state);
    this.vapeCooldown = 4.5;
    this.toast("Concentration restored. Alpine air slightly less pristine.");
    this.render();
  }

  private beginQte(): void {
    this.state = {...this.state, qte: {active: true}};
    this.qteElapsed = 0;
    this.ui.showQte();
  }

  private resolveQte(): void {
    const success = this.qtePosition >= 42 && this.qtePosition <= 60;
    this.ui.hideQte();
    this.state = {...this.state, qte: undefined};
    if (success) {
      this.state = {...this.state, composure: clamp(this.state.composure + 5)};
      this.wheelTimer = 7 + Math.random() * 7;
      this.toast("Balanced. Witnesses remain annoyingly calm.");
    } else {
      this.state = {...this.state, riding: false, composure: clamp(this.state.composure - 24)};
      this.toast("Unscheduled dismount. It was the paving geometry.");
    }
    this.render();
  }

  private toast(message: string, seconds = 2.8): void {
    this.ui.showToast(message);
    this.toastRemaining = seconds;
  }

  private isModalOpen(): boolean {
    return this.ui.isModalOpen(Boolean(this.state.qte));
  }
}

export function movementDirectionForKeys(keys: ReadonlySet<string>): MovementDirection {
  let screenX = 0;
  let screenY = 0;
  if (keys.has("w") || keys.has("arrowup")) {
    screenY -= 1;
  }
  if (keys.has("s") || keys.has("arrowdown")) {
    screenY += 1;
  }
  if (keys.has("a") || keys.has("arrowleft")) {
    screenX -= 1;
  }
  if (keys.has("d") || keys.has("arrowright")) {
    screenX += 1;
  }

  return {
    x: (screenX + screenY) * SCREEN_AXIS_COMPONENT,
    z: (screenY - screenX) * SCREEN_AXIS_COMPONENT,
  };
}
