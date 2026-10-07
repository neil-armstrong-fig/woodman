import {ABILITIES, ENCOUNTERS} from "@src/game/arguments/ArgumentContent";
import type {Ability, AbilityId, Encounter} from "@src/game/arguments/ArgumentContent";
import {clamp} from "@src/game/Clamp";

export interface ArgumentState {
  readonly round: number;
  readonly score: number;
  readonly usedAbilities: readonly AbilityId[];
  readonly lastLine: string;
}

export interface QuickTimeEventState {
  readonly active: true;
}

export interface GameState {
  readonly started: boolean;
  readonly level: number;
  readonly xp: number;
  readonly vape: number;
  readonly heat: number;
  readonly battery: number;
  readonly composure: number;
  readonly riding: boolean;
  readonly inShade: boolean;
  readonly completed: readonly string[];
  readonly unlocked: readonly AbilityId[];
  readonly activeEncounter?: string;
  readonly argument?: ArgumentState;
  readonly qte?: QuickTimeEventState;
  readonly gameWon: boolean;
}

export interface NeedContext {
  readonly inShade?: boolean;
  readonly moving?: boolean;
}

export interface IncompleteArgumentResult {
  readonly finished: false;
  readonly delta: number;
}

export interface FinishedArgumentResult {
  readonly finished: true;
  readonly won: boolean;
  readonly score: number;
  readonly unlocked?: AbilityId;
}

export type ArgumentResult = IncompleteArgumentResult | FinishedArgumentResult;

export interface ChooseArgumentOutcome {
  readonly state: GameState;
  readonly result?: ArgumentResult;
}

export function createInitialState(): GameState {
  return {
    started: false,
    level: 1,
    xp: 0,
    vape: 82,
    heat: 8,
    battery: 100,
    composure: 100,
    riding: false,
    inShade: false,
    completed: [],
    unlocked: [],
    gameWon: false,
  };
}

export function updateNeeds(state: GameState, seconds: number, context: NeedContext = {}): GameState {
  const inShade = context.inShade ?? false;
  const moving = context.moving ?? false;
  const battery = updatedBattery(state, seconds, moving);
  let vapeDrain = 0.72;
  if (moving) {
    vapeDrain = 1.15;
  }
  let heatChange = 1.28;
  if (inShade) {
    heatChange = -3.1;
  }
  const vape = clamp(state.vape - seconds * vapeDrain);
  const heat = clamp(state.heat + seconds * heatChange);
  const losingComposure = vape < 16 || heat > 84;
  let composureChange = 0.3;
  if (losingComposure) {
    composureChange = -1.1;
  }
  const composure = clamp(state.composure + seconds * composureChange);

  return {...state, battery, vape, heat, composure, inShade, riding: battery > 0 && state.riding};
}

export function useVape(state: GameState): GameState {
  return {...state, vape: 100, composure: clamp(state.composure + 8)};
}

export function beginArgument(state: GameState, encounterId: string): GameState {
  const encounter = ENCOUNTERS.find(item => item.id === encounterId);
  if (!encounter || state.completed.includes(encounterId)) {
    return state;
  }

  return {
    ...state,
    riding: false,
    activeEncounter: encounterId,
    argument: {round: 0, score: 34, usedAbilities: [], lastLine: encounter.intro},
  };
}

export function useAbility(state: GameState, abilityId: AbilityId): GameState {
  if (!state.argument || !state.unlocked.includes(abilityId) || state.argument.usedAbilities.includes(abilityId)) {
    return state;
  }

  const ability = ABILITIES[abilityId];
  const appliedScore = scoreForAbility(abilityId, ability, state.argument.round);

  return {
    ...state,
    argument: {
      ...state.argument,
      score: clamp(state.argument.score + appliedScore),
      usedAbilities: [...state.argument.usedAbilities, abilityId],
      lastLine: abilityLine(ability, appliedScore),
    },
  };
}

export function chooseArgument(state: GameState, choiceIndex: number): ChooseArgumentOutcome {
  if (!state.argument || !state.activeEncounter) {
    return {state};
  }

  const encounter = ENCOUNTERS.find(item => item.id === state.activeEncounter);
  if (!encounter) {
    return {state};
  }

  const round = encounter.rounds[state.argument.round];
  const choice = round?.choices[choiceIndex];
  if (!choice) {
    return {state};
  }

  const delta = adjustedScore(choice.score, state);
  const score = clamp(state.argument.score + delta);
  const nextRound = state.argument.round + 1;
  if (nextRound < encounter.rounds.length) {
    return continueArgument({state, nextRound, score, delta});
  }

  if (score < 72) {
    return loseArgument(state, score);
  }

  return winArgument(state, encounter, score);
}

interface ContinueArgumentOptions {
  readonly state: GameState;
  readonly nextRound: number;
  readonly score: number;
  readonly delta: number;
}

function continueArgument(options: ContinueArgumentOptions): ChooseArgumentOutcome {
  const {state, nextRound, score, delta} = options;
  const argument = state.argument;
  if (!argument) {
    return {state};
  }

  return {
    result: {finished: false, delta},
    state: {...state, argument: {...argument, round: nextRound, score, lastLine: choiceLine(delta)}},
  };
}

function loseArgument(state: GameState, score: number): ChooseArgumentOutcome {
  return {
    result: {finished: true, won: false, score},
    state: {...state, composure: clamp(state.composure - 22), activeEncounter: undefined, argument: undefined},
  };
}

function winArgument(state: GameState, encounter: Encounter, score: number): ChooseArgumentOutcome {
  const completed = [...state.completed, encounter.id];
  const unlocked = unlockedAbilities(state, encounter);

  return {
    result: {finished: true, won: true, score, unlocked: encounter.unlock},
    state: {
      ...state,
      completed,
      unlocked,
      xp: state.xp + 100,
      level: 1 + completed.length,
      composure: clamp(state.composure + 12),
      activeEncounter: undefined,
      argument: undefined,
      gameWon: completed.length === ENCOUNTERS.length,
    },
  };
}

function updatedBattery(state: GameState, seconds: number, moving: boolean): number {
  if (state.riding && moving) {
    return clamp(state.battery - seconds * 2.45);
  }

  return clamp(state.battery + seconds * 0.32);
}

function scoreForAbility(abilityId: AbilityId, ability: Ability, round: number): number {
  if (abilityId === "ai" && round % 2 === 0) {
    return -8;
  }

  return ability.bonus;
}

function abilityLine(ability: Ability, appliedScore: number): string {
  if (ability.id === "ai" && appliedScore < 0) {
    return "The chatbot confidently cited a study about otters. Your position weakens.";
  }

  return `${ability.name} deployed. The conversational terrain shifts.`;
}

function adjustedScore(score: number, state: GameState): number {
  let adjusted = score;
  if (state.vape < 22) {
    adjusted -= 7;
  }
  if (state.heat > 78) {
    adjusted -= 7;
  }
  if (state.composure < 35) {
    adjusted -= 5;
  }
  return adjusted;
}

function choiceLine(delta: number): string {
  if (delta >= 18) {
    return "A strong rhetorical gust.";
  }
  if (delta >= 5) {
    return "They remain unconvinced, but alert.";
  }
  return "That landed with the grace of a wet boot.";
}

function unlockedAbilities(state: GameState, encounter: Encounter): readonly AbilityId[] {
  if (!encounter.unlock || state.unlocked.includes(encounter.unlock)) {
    return state.unlocked;
  }
  return [...state.unlocked, encounter.unlock];
}
