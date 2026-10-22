import { describe, expect, it } from "vitest";
import { timeAgo } from "./time";

describe("timeAgo", () => {
  const now = Date.parse("2026-10-22T12:00:00Z");
  it.each([
    ["2026-10-22T11:59:40Z", "now"],
    ["2026-10-22T11:55:00Z", "5m"],
    ["2026-10-22T09:00:00Z", "3h"],
    ["2026-10-21T11:00:00Z", "1d"],
    ["2026-10-08T12:00:00Z", "2w"],
    ["2026-08-01T12:00:00Z", "1 Aug"],
    ["2026-10-22T12:05:00Z", "now"], // clock skew: future times don't go negative
  ])("%s → %s", (iso, expected) => {
    expect(timeAgo(iso, now)).toBe(expected);
  });
});
