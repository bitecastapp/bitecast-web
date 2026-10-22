import { describe, expect, it } from "vitest";
import { canGoBack, visit } from "./history";

const walk = (paths: string[]) => paths.reduce(visit, [] as string[]);

describe("visit", () => {
  it("pushes forward visits and ignores repeats", () => {
    expect(walk(["/review/1", "/review/1", "/r/a/dosa"])).toEqual(["/review/1", "/r/a/dosa"]);
  });

  it("pops when going back, so the first page has nothing behind it", () => {
    expect(walk(["/review/1", "/r/a/dosa", "/review/1"])).toEqual(["/review/1"]);
  });
});

describe("canGoBack", () => {
  it("follows history to a real page", () => {
    expect(canGoBack(walk(["/", "/u/asha"]))).toBe(true);
    expect(canGoBack(walk(["/", "/r/ctr/dosa", "/review/1"]))).toBe(true);
  });

  it("never steps back into a form you just left", () => {
    expect(canGoBack(walk(["/rate", "/review/1"]))).toBe(false);
    expect(canGoBack(walk(["/settings", "/u/asha"]))).toBe(false);
    expect(canGoBack(walk(["/u/asha", "/settings/profile", "/settings/profile/x"]))).toBe(false);
  });

  it("uses the parent when there's no history (opened from a link)", () => {
    expect(canGoBack(walk(["/u/asha"]))).toBe(false);
  });

  it("after saving your profile, Back on it doesn't return to the edit form", () => {
    // profile → edit → saved (redirect back to the profile): the stack collapses to just the profile.
    expect(canGoBack(walk(["/u/asha", "/settings/profile", "/u/asha"]))).toBe(false);
    expect(canGoBack(walk(["/", "/u/asha", "/settings/profile", "/u/asha"]))).toBe(false);
    expect(canGoBack(walk(["/", "/review/1", "/rate", "/review/1"]))).toBe(false);
  });
});
