import { describe, expect, it } from "vitest";
import { dietsFor, allows, filterMenus } from "./diet";

describe("allows", () => {
  it.each([
    ["all", "non_veg", true],
    ["vegan", "vegan", true],
    ["vegan", "veg", false],
    ["vegan", "egg", false],
    ["veg", "veg", true],
    ["veg", "vegan", true],
    ["veg", "egg", false],
    ["veg", "non_veg", false],
    ["egg", "vegan", true],
    ["egg", "egg", true],
    ["egg", "non_veg", false],
  ] as const)("show %s, dish %s → %s", (show, diet, ok) => expect(allows(show, diet)).toBe(ok));
});

describe("filterMenus", () => {
  const places = [{ slug: "ctr", dishes: [{ diet: "veg" as const }, { diet: "vegan" as const }, { diet: "egg" as const }, { diet: "non_veg" as const }] }];

  it("leaves everything when showing all", () => {
    expect(filterMenus(places, "all")).toBe(places);
  });

  it("keeps the place but trims its menu", () => {
    expect(filterMenus(places, "egg")[0].dishes).toEqual([{ diet: "veg" }, { diet: "vegan" }, { diet: "egg" }]);
    expect(filterMenus(places, "veg")[0].dishes).toEqual([{ diet: "veg" }, { diet: "vegan" }]);
    expect(filterMenus(places, "vegan")[0].dishes).toEqual([{ diet: "vegan" }]);
  });
});

describe("dietsFor", () => {
  it("lists what each preference lets through", () => {
    expect(dietsFor("all")).toEqual(["veg", "vegan", "egg", "non_veg"]);
    expect(dietsFor("veg")).toEqual(["veg", "vegan"]);
    expect(dietsFor("egg")).toEqual(["veg", "vegan", "egg"]);
    expect(dietsFor("vegan")).toEqual(["vegan"]);
  });
});
