import { describe, expect, it } from "vitest";
import { applyVote, leadingSide, toggleVote } from "./votes";

describe("applyVote", () => {
  it("adds an agree vote", () => {
    expect(applyVote({ facts: 3, cap: 1 }, "facts")).toEqual({ facts: 4, cap: 1, mine: "facts" });
  });
  it("adds a disagree vote", () => {
    expect(applyVote({ facts: 3, cap: 1 }, "cap")).toEqual({ facts: 3, cap: 2, mine: "cap" });
  });
  it("tapping the same side again clears it", () => {
    expect(applyVote({ facts: 4, cap: 1, mine: "facts" }, "facts")).toEqual({ facts: 3, cap: 1, mine: undefined });
  });
  it("switching sides moves the vote across", () => {
    expect(applyVote({ facts: 4, cap: 1, mine: "facts" }, "cap")).toEqual({ facts: 3, cap: 2, mine: "cap" });
    expect(applyVote({ facts: 3, cap: 2, mine: "cap" }, "facts")).toEqual({ facts: 4, cap: 1, mine: "facts" });
  });
  it("never goes below zero on a clean start", () => {
    expect(applyVote(applyVote({ facts: 0, cap: 0 }, "cap"), "cap")).toEqual({ facts: 0, cap: 0, mine: undefined });
  });
});

describe("toggleVote on comments", () => {
  it("likes, switches to dislike, then clears", () => {
    const liked = toggleVote({ like: 2, dislike: 0 }, undefined, "like");
    expect(liked).toEqual({ counts: { like: 3, dislike: 0 }, mine: "like" });
    const switched = toggleVote(liked.counts, liked.mine, "dislike");
    expect(switched).toEqual({ counts: { like: 2, dislike: 1 }, mine: "dislike" });
    expect(toggleVote(switched.counts, switched.mine, "dislike")).toEqual({ counts: { like: 2, dislike: 0 }, mine: undefined });
  });
});

describe("leadingSide", () => {
  it.each([
    [0, 0, null],
    [1, 0, { side: "agree", percent: 100 }],
    [0, 3, { side: "disagree", percent: 100 }],
    [214, 12, { side: "agree", percent: 95 }],
    [1, 2, { side: "disagree", percent: 67 }],
    [2, 2, { side: "agree", percent: 50 }],
  ])("%i agree / %i disagree → %j", (facts, cap, expected) => {
    expect(leadingSide(facts, cap)).toEqual(expected);
  });
});
