import { describe, expect, it } from "vitest";
import { visit } from "./history";

const walk = (paths: string[]) => paths.reduce(visit, [] as string[]);

describe("visit", () => {
  it("pushes forward visits and ignores repeats", () => {
    expect(walk(["/review/1", "/review/1", "/r/a/dosa"])).toEqual(["/review/1", "/r/a/dosa"]);
  });

  it("pops when going back, so the first page has nothing behind it", () => {
    expect(walk(["/review/1", "/r/a/dosa", "/review/1"])).toEqual(["/review/1"]);
  });
});
