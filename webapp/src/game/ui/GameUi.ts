import {ABILITIES, ENCOUNTERS} from "@src/game/arguments/ArgumentContent";
import type {AbilityId, Encounter} from "@src/game/arguments/ArgumentContent";
import type {FinishedArgumentResult, GameState} from "@src/game/state/GameState";

interface ControlCallbacks {
  readonly start: () => void;
  readonly closeResult: () => void;
  readonly restart: () => void;
  readonly pressKey: (key: string) => void;
  readonly releaseKey: (key: string) => void;
  readonly joystick: (x: number, y: number) => void;
}

interface ArgumentCallbacks {
  readonly choose: (choiceIndex: number) => void;
  readonly useAbility: (abilityId: AbilityId) => void;
}

interface ResultOptions {
  readonly result: FinishedArgumentResult;
  readonly encounter: Encounter;
}

interface MeterElements {
  readonly fill: HTMLElement;
  readonly value: HTMLElement;
}

interface ElementConstructor<T extends HTMLElement> {
  new (): T;
}

const RANKS = [
  "Local nuisance",
  "Confident amateur",
  "Debate technician",
  "Rhetorical mountaineer",
  "Local legend",
] as const;

export class GameUi {
  private readonly loading = this.element("loading");
  private readonly startScreen = this.element("start-screen");
  private readonly startButton = this.button("start-button");
  private readonly hud = this.element("hud");
  private readonly level = this.element("level-value");
  private readonly rank = this.element("rank-value");
  private readonly vapeMeter = this.meter("vape");
  private readonly heatMeter = this.meter("heat");
  private readonly batteryMeter = this.meter("battery");
  private readonly objective = this.element("objective");
  private readonly encounterPips = this.element("encounter-pips");
  private readonly abilityBar = this.element("ability-bar");
  private readonly interaction = this.element("interaction-prompt");
  private readonly condition = this.element("condition-note");
  private readonly toast = this.element("toast");
  private readonly dialogue = this.element("dialogue");
  private readonly dialogueAvatar = this.element("dialogue-avatar");
  private readonly dialogueName = this.element("dialogue-name");
  private readonly dialogueRole = this.element("dialogue-role");
  private readonly dialogueTopic = this.element("dialogue-topic");
  private readonly dialogueLine = this.element("dialogue-line");
  private readonly dialogueAside = this.element("dialogue-aside");
  private readonly dialogueChoices = this.element("dialogue-choices");
  private readonly dialogueAbilities = this.element("dialogue-abilities");
  private readonly argumentFill = this.element("argument-fill");
  private readonly qte = this.element("qte");
  private readonly qteMarker = this.element("qte-marker");
  private readonly result = this.element("result");
  private readonly resultKicker = this.element("result-kicker");
  private readonly resultTitle = this.element("result-title");
  private readonly resultCopy = this.element("result-copy");
  private readonly resultButton = this.button("result-button");
  private readonly unlockCard = this.element("unlock-card");
  private readonly finale = this.element("finale");
  private readonly restartButton = this.button("restart-button");
  private readonly heatVignette = this.element("heat-vignette");

  public bindControls(callbacks: ControlCallbacks): void {
    this.startButton.addEventListener("click", callbacks.start);
    this.resultButton.addEventListener("click", callbacks.closeResult);
    this.restartButton.addEventListener("click", callbacks.restart);
    this.qte.addEventListener("pointerdown", () => callbacks.pressKey(" "));
    this.bindTouchButtons(callbacks);
    this.bindJoystick(callbacks);
  }

  private bindJoystick(callbacks: ControlCallbacks): void {
    const base = this.element("touch-joystick");
    const knob = this.element("touch-joystick-knob");
    let activePointer: number | undefined;

    const move = (event: PointerEvent): void => {
      if (event.pointerId !== activePointer) {
        return;
      }
      const rect = base.getBoundingClientRect();
      const radius = rect.width / 2;
      let x = (event.clientX - rect.left - radius) / radius;
      let y = (event.clientY - rect.top - radius) / radius;
      const length = Math.hypot(x, y);
      if (length > 1) {
        x /= length;
        y /= length;
      }
      knob.style.transform = `translate(${x * radius * 0.6}px, ${y * radius * 0.6}px)`;
      callbacks.joystick(x, y);
    };
    const end = (event: PointerEvent): void => {
      if (event.pointerId !== activePointer) {
        return;
      }
      activePointer = undefined;
      knob.style.transform = "";
      callbacks.joystick(0, 0);
    };

    base.addEventListener("pointerdown", event => {
      event.preventDefault();
      activePointer = event.pointerId;
      base.setPointerCapture(event.pointerId);
      move(event);
    });
    base.addEventListener("pointermove", move);
    base.addEventListener("pointerup", end);
    base.addEventListener("pointercancel", end);
  }

  private bindTouchButtons(callbacks: ControlCallbacks): void {
    for (const button of document.querySelectorAll<HTMLButtonElement>(".touch-controls button")) {
      const key = button.dataset.key;
      if (!key) {
        continue;
      }
      button.addEventListener("pointerdown", event => {
        event.preventDefault();
        callbacks.pressKey(key);
        if (button.dataset.tap !== undefined) {
          callbacks.releaseKey(key);
        }
      });
      for (const type of ["pointerup", "pointercancel", "pointerleave"]) {
        button.addEventListener(type, () => callbacks.releaseKey(key));
      }
      button.addEventListener("contextmenu", event => event.preventDefault());
    }
  }

  public showReady(): void {
    this.loading.classList.add("hidden");
    this.startScreen.classList.remove("hidden");
  }

  public showStarted(): void {
    this.startScreen.classList.add("hidden");
    this.hud.classList.remove("hidden");
  }

  public showRestarted(): void {
    this.finale.classList.add("hidden");
    this.result.classList.add("hidden");
    this.dialogue.classList.add("hidden");
  }

  public showToast(message: string): void {
    this.toast.textContent = message;
    this.toast.classList.remove("hidden");
  }

  public hideToast(): void {
    this.toast.classList.add("hidden");
  }

  public renderHud(state: GameState): void {
    this.level.textContent = String(state.level);
    this.rank.textContent = RANKS[Math.min(state.level - 1, RANKS.length - 1)] ?? RANKS[0];
    this.updateMeter(this.vapeMeter, state.vape);
    this.updateMeter(this.heatMeter, state.heat);
    this.updateMeter(this.batteryMeter, state.battery);
    if (state.riding) {
      this.batteryMeter.value.textContent = `${Math.round(state.battery)}⚡`;
    }
    this.renderObjective(state);
    this.renderEncounterPips(state);
    this.renderAbilities(state);
    this.condition.textContent = this.conditionText(state);
    this.heatVignette.style.opacity = Math.min(0.88, Math.max(0, (state.heat - 55) / 55)).toFixed(2);
    this.heatVignette.classList.toggle("overheating", state.heat > 72);
  }

  public showInteraction(encounter?: Encounter): void {
    if (!encounter) {
      this.interaction.classList.add("hidden");
      return;
    }

    const key = document.createElement("kbd");
    key.textContent = "E";
    this.interaction.replaceChildren(
      key,
      document.createTextNode(` Argue with ${encounter.npc} about ${encounter.topic.toLowerCase()}`),
    );
    this.interaction.classList.remove("hidden");
  }

  public showArgument(state: GameState, encounter: Encounter, callbacks: ArgumentCallbacks): void {
    const argument = state.argument;
    const round = argument && encounter.rounds[argument.round];
    if (!argument || !round) {
      return;
    }

    this.dialogue.classList.remove("hidden");
    this.interaction.classList.add("hidden");
    this.dialogueAvatar.textContent = encounter.npc.slice(0, 1);
    this.dialogueName.textContent = encounter.npc;
    this.dialogueRole.textContent = encounter.role;
    this.dialogueTopic.textContent = encounter.topic;
    this.dialogueLine.textContent = round.prompt;
    this.dialogueAside.textContent = argument.lastLine;
    if (argument.round === 0) {
      this.dialogueAside.textContent = encounter.intro;
    }
    this.argumentFill.style.width = `${argument.score}%`;

    const choices = round.choices.map((choice, index) => this.choiceButton(choice.label, index, callbacks.choose));
    this.dialogueChoices.replaceChildren(...choices);
    const abilities = state.unlocked.map(abilityId => this.abilityButton(abilityId, argument.usedAbilities, callbacks));
    this.dialogueAbilities.replaceChildren(...abilities);
  }

  public showResult(options: ResultOptions, gameWon: boolean): void {
    const {result, encounter} = options;
    this.dialogue.classList.add("hidden");
    this.result.classList.remove("hidden");
    this.unlockCard.classList.add("hidden");
    if (result.won) {
      this.resultKicker.textContent = "ARGUMENT COMPLETE";
      this.resultTitle.textContent = "Technically undefeated";
      this.resultCopy.textContent = encounter.win;
      this.renderUnlock(result.unlocked);
    } else {
      this.resultKicker.textContent = "TACTICAL RETREAT";
      this.resultTitle.textContent = "Insufficient conviction";
      this.resultCopy.textContent = "You ran out of rhetorical altitude. Vape, cool down, and try again.";
    }
    this.resultButton.textContent = "Return to village";
    if (gameWon) {
      this.resultButton.textContent = "See what you’ve done";
    }
  }

  public closeResult(gameWon: boolean): void {
    this.result.classList.add("hidden");
    if (gameWon) {
      this.finale.classList.remove("hidden");
    }
  }

  public showQte(): void {
    this.qte.classList.remove("hidden");
  }

  public updateQte(position: number): void {
    this.qteMarker.style.left = `${position}%`;
  }

  public hideQte(): void {
    this.qte.classList.add("hidden");
  }

  public isModalOpen(qteActive: boolean): boolean {
    return (
      !this.dialogue.classList.contains("hidden") ||
      !this.result.classList.contains("hidden") ||
      !this.finale.classList.contains("hidden") ||
      qteActive
    );
  }

  public isDialogueOpen(): boolean {
    return !this.dialogue.classList.contains("hidden");
  }

  private renderObjective(state: GameState): void {
    const remaining = ENCOUNTERS.length - state.completed.length;
    if (remaining === 0) {
      this.objective.textContent = "The village has heard enough.";
      return;
    }

    let resident = "residents remain";
    if (remaining === 1) {
      resident = "resident remains";
    }
    this.objective.textContent = `${remaining} ${resident} unconvinced.`;
  }

  private renderEncounterPips(state: GameState): void {
    const pips = ENCOUNTERS.map(encounter => {
      const pip = document.createElement("i");
      pip.title = encounter.topic;
      pip.classList.toggle("done", state.completed.includes(encounter.id));
      return pip;
    });
    this.encounterPips.replaceChildren(...pips);
  }

  private renderAbilities(state: GameState): void {
    if (state.unlocked.length === 0) {
      this.abilityBar.replaceChildren(this.abilityChip("NO TECHNIQUES", "Argue to unlock"));
      return;
    }

    const chips = state.unlocked.map(abilityId => {
      const ability = ABILITIES[abilityId];
      return this.abilityChip(`${ability.icon} · ${ability.name}`, "Ready in arguments");
    });
    this.abilityBar.replaceChildren(...chips);
  }

  private renderUnlock(abilityId?: AbilityId): void {
    if (!abilityId) {
      return;
    }

    const ability = ABILITIES[abilityId];
    this.unlockCard.textContent = `New technique: ${ability.icon} · ${ability.name} — ${ability.description}`;
    this.unlockCard.classList.remove("hidden");
  }

  private conditionText(state: GameState): string {
    if (state.inShade) {
      return "In shade · cooling down slowly";
    }
    if (state.heat > 72) {
      return "Overheating · find shade";
    }
    return "In the sun · heating up";
  }

  private choiceButton(label: string, index: number, choose: ArgumentCallbacks["choose"]): HTMLButtonElement {
    const button = document.createElement("button");
    button.className = "choice-button";
    const number = document.createElement("span");
    number.textContent = String(index + 1);
    button.replaceChildren(number, document.createTextNode(label));
    button.addEventListener("click", () => choose(index));
    return button;
  }

  private abilityButton(
    abilityId: AbilityId,
    usedAbilities: readonly AbilityId[],
    callbacks: ArgumentCallbacks,
  ): HTMLButtonElement {
    const ability = ABILITIES[abilityId];
    const used = usedAbilities.includes(abilityId);
    const button = document.createElement("button");
    button.className = "ability-button";
    button.disabled = used;
    let label = ability.name;
    if (used) {
      label = "Used";
    }
    button.textContent = `${ability.icon} · ${label}`;
    button.addEventListener("click", () => callbacks.useAbility(abilityId));
    return button;
  }

  private abilityChip(title: string, detail: string): HTMLDivElement {
    const chip = document.createElement("div");
    chip.className = "ability-chip";
    const strong = document.createElement("strong");
    strong.textContent = title;
    const span = document.createElement("span");
    span.textContent = detail;
    chip.replaceChildren(strong, span);
    return chip;
  }

  private updateMeter(meter: MeterElements, amount: number): void {
    meter.fill.style.width = `${amount}%`;
    meter.value.textContent = String(Math.round(amount));
  }

  private meter(name: string): MeterElements {
    return {fill: this.element(`${name}-fill`), value: this.element(`${name}-value`)};
  }

  private button(id: string): HTMLButtonElement {
    return this.element(id, HTMLButtonElement);
  }

  private element<T extends HTMLElement>(id: string, constructor?: ElementConstructor<T>): T {
    const element = document.getElementById(id);
    if (!element || (constructor && !(element instanceof constructor))) {
      throw new Error(`Expected #${id} in the Woodman game shell.`);
    }
    return element as T;
  }
}
