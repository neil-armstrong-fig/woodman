import {describe, expect, it} from "vitest";

import {movementDirectionForKeys} from "./WoodmanGame";

describe("screen-relative movement", () => {
  it.each([
    ["w", -1, -1],
    ["s", 1, 1],
    ["a", -1, 1],
    ["d", 1, -1],
  ])("maps %s to the matching on-screen direction", (key, xSign, zSign) => {
    const direction = movementDirectionForKeys(new Set([key]));

    expect(Math.sign(direction.x)).toBe(xSign);
    expect(Math.sign(direction.z)).toBe(zSign);
    expect(Math.hypot(direction.x, direction.z)).toBeCloseTo(1);
  });

  it("keeps opposing inputs stationary", () => {
    expect(movementDirectionForKeys(new Set(["w", "s", "a", "d"]))).toEqual({x: 0, z: 0});
  });
});
