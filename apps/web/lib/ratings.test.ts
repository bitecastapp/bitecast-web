import { describe, expect, it } from "vitest";
import { summarize } from "./ratings";

describe("summarize", () => {
  it("averages and buckets scores 1–10", () => {
    const s = summarize([8, 9, 9, 10, 1]);
    expect(s.count).toBe(5);
    expect(s.average).toBeCloseTo(7.4);
    expect(s.spread).toEqual([1, 0, 0, 0, 0, 0, 0, 1, 2, 1]);
  });

  it("handles no ratings", () => {
    expect(summarize([])).toEqual({ count: 0, average: null, spread: Array(10).fill(0) });
  });
});
