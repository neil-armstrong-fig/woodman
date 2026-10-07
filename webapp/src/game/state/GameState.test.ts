import {ABILITIES, ENCOUNTERS} from "@src/game/arguments/ArgumentContent";
import {expect, it} from "vitest";

import {beginArgument, chooseArgument, createInitialState, updateNeeds, useAbility, useVape} from "./GameState";

it("updates the Woodman's needs in sun, shade and after vaping", () => {
  let state = createInitialState();
  state = updateNeeds(state, 10, {inShade: false, moving: true});

  expect(state.vape).toBeLessThan(82);
  expect(state.heat).toBeGreaterThan(8);

  const hot = state.heat;
  state = updateNeeds(state, 2, {inShade: true, moving: false});

  expect(state.heat).toBeLessThan(hot);

  state = useVape(state);

  expect(state.vape).toBe(100);
});

it("completes every encounter and unlocks each argument technique", () => {
  let state = createInitialState();
  state = beginArgument(state, "gravy");

  expect(state.argument?.round).toBe(0);

  for (let round = 0; round < 3; round += 1) {
    ({state} = chooseArgument(state, 0));
  }

  expect(state.completed).toEqual(["gravy"]);
  expect(state.unlocked).toEqual(["cat"]);
  expect(state.level).toBe(2);

  state = beginArgument(state, "bavaria");
  state = useAbility(state, "cat");

  expect(state.argument?.usedAbilities).toContain("cat");

  const scoreAfterCat = state.argument?.score;
  state = useAbility(state, "cat");

  expect(state.argument?.score).toBe(scoreAfterCat);
  expect(ABILITIES.cat.bonus).toBe(18);

  for (let round = state.argument?.round ?? 0; round < 3; round += 1) {
    let choiceIndex = 0;
    if (round === 0) {
      choiceIndex = 1;
    }
    ({state} = chooseArgument(state, choiceIndex));
  }

  expect(state.completed).toContain("bavaria");
  expect(state.unlocked).toContain("ai");

  for (const encounterId of ["onewheel", "healthcare"]) {
    state = beginArgument(state, encounterId);
    for (let round = 0; round < 3; round += 1) {
      ({state} = chooseArgument(state, 0));
    }
  }

  expect(state.completed).toHaveLength(ENCOUNTERS.length);
  expect(state.level).toBe(5);
  expect(state.gameWon).toBe(true);
});
