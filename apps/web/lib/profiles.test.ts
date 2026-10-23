import { describe, expect, it } from "vitest";
import { canSee, palate } from "./profiles";

describe("palate", () => {
  it.each([
    [9.1, 5, "Easy to please"],
    [8, 5, "Easy to please"],
    [7.9, 6, "Fair judge"],
    [6, 10, "Fair judge"],
    [5.9, 5, "Tough critic"],
  ])("avg %s over %i ratings → %s", (avg, rated, label) => {
    expect(palate(avg, rated)).toBe(label);
  });

  it("says nothing until there are 5 ratings", () => {
    expect(palate(9, 4)).toBeNull();
    expect(palate(null, 0)).toBeNull();
  });
});

describe("canSee", () => {
  it.each([
    ["everyone", false, false, true],
    ["followers", false, true, true],
    ["followers", false, false, false],
    ["only_me", false, true, false],
    ["only_me", true, false, true],
  ] as const)("%s list, own %s, follows %s → %s", (visibility, own, follows, expected) => {
    expect(canSee(visibility, { own, follows })).toBe(expected);
  });
});
